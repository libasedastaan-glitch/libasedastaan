import { createAdminClient } from '../../../../lib/supabase/server.ts';
import { createStripeCheckoutSession } from '../../../../lib/stripe.ts';

/**
 * Next.js Route Handler for Stripe Checkout Session Creation
 * POST /api/checkout/stripe
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, userId, cancelUrl } = body;

    if (!items || !items.length) {
      return new Response(JSON.stringify({ error: 'No items provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createAdminClient();

    // 1. Validate pricing and stock on backend
    const productIds = items.map((i: any) => i.productId);
    const { data: dbProducts, error: dbError } = await adminClient
      .from('products')
      .select('id, title, price, sale_price, stock, images')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve products' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let totalAmount = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.productId}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (dbProduct.stock < item.quantity) {
        return new Response(JSON.stringify({ error: `Insufficient stock for ${dbProduct.title}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const activePrice = dbProduct.sale_price !== null && dbProduct.sale_price !== undefined
        ? Number(dbProduct.sale_price)
        : Number(dbProduct.price);

      totalAmount += activePrice * item.quantity;

      validatedItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: dbProduct.title,
            images: dbProduct.images?.[0] ? [dbProduct.images[0]] : [],
          },
          unit_amount: Math.round(activePrice * 100),
        },
        quantity: item.quantity,
        productId: item.productId,
        unitPrice: activePrice,
      });
    }

    // 2. Create Order in Supabase
    const { data: order, error: orderErr } = await adminClient
      .from('orders')
      .insert({
        user_id: userId || null,
        status: 'pending',
        payment_method: 'stripe',
        payment_status: 'unpaid',
        total_amount: totalAmount,
        shipping_address: shippingAddress || {},
      })
      .select()
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order creation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Create Order Items
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));
    await adminClient.from('order_items').insert(orderItems);

    // 4. Create Stripe Session
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createStripeCheckoutSession({
      orderId: order.id,
      userId: userId || undefined,
      customerEmail: shippingAddress?.email,
      lineItems: validatedItems,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancelUrl: cancelUrl || `${origin}/cart`,
    });

    // Update order with session id
    await adminClient
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        orderId: order.id,
        simulated: session.simulated,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
