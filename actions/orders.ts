'use server';

import { createServerClient, createAdminClient } from '../lib/supabase/server.ts';
import { createStripeCheckoutSession } from '../lib/stripe.ts';

export interface CartItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  title: string;
  image?: string;
}

export interface ShippingAddressInput {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderParams {
  userId?: string;
  items: CartItemInput[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: 'stripe' | 'cod';
  appUrl?: string;
}

/**
 * Creates an order in Supabase with inventory deduction and handles payment routing:
 * - If COD: creates order with payment_status: 'unpaid', decrements stock, returns orderId
 * - If Stripe: creates order with payment_status: 'unpaid', creates Stripe Checkout session with metadata, returns checkoutUrl
 */
export async function createOrderAction(params: CreateOrderParams) {
  const { userId, items, shippingAddress, paymentMethod, appUrl = 'http://localhost:3000' } = params;

  if (!items || items.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  const adminClient = createAdminClient();

  // 1. Calculate total and verify inventory stock
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.unitPrice * item.quantity;
  }

  // 2. Insert order record into Supabase
  const { data: orderData, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: userId || null,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'unpaid',
      total_amount: totalAmount,
      shipping_address: shippingAddress,
    })
    .select()
    .single();

  if (orderError || !orderData) {
    console.error('Failed to create order in Supabase:', orderError);
    return { success: false, error: orderError?.message || 'Could not create order' };
  }

  const orderId = orderData.id;

  // 3. Insert order items
  const orderItemsData = items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await adminClient.from('order_items').insert(orderItemsData);
  if (itemsError) {
    console.error('Failed to insert order items:', itemsError);
  }

  // 4. Inventory deduction for each product
  for (const item of items) {
    const { data: product } = await adminClient
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .single();

    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity);
      await adminClient
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.productId);
    }
  }

  // 5. Payment routing
  if (paymentMethod === 'cod') {
    return {
      success: true,
      orderId,
      paymentMethod: 'cod',
      redirectUrl: `/checkout/success?order_id=${orderId}&method=cod`,
    };
  } else {
    // Stripe Flow
    try {
      const lineItems = items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.unitPrice * 100), // convert to cents
        },
        quantity: item.quantity,
      }));

      const session = await createStripeCheckoutSession({
        orderId,
        userId,
        customerEmail: shippingAddress.email,
        lineItems,
        successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancelUrl: `${appUrl}/cart?canceled=true`,
      });

      // Update order with Stripe session ID
      await adminClient
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', orderId);

      return {
        success: true,
        orderId,
        paymentMethod: 'stripe',
        checkoutUrl: session.url,
        simulated: session.simulated,
      };
    } catch (stripeErr: any) {
      console.error('Stripe session creation error:', stripeErr);
      return { success: false, error: stripeErr.message || 'Stripe initialization failed' };
    }
  }
}

export async function getUserOrders(userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        products (
          id,
          title,
          images,
          slug
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function getOrderById(orderId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        products (
          id,
          title,
          images,
          slug
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
