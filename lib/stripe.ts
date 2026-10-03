/**
 * Stripe SDK integration utility
 * For Next.js Route Handlers and Server Actions
 */

// If stripe npm package is available or mocked for serverless Next.js
export interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      images?: string[];
      description?: string;
    };
    unit_amount: number; // in cents
  };
  quantity: number;
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  userId?: string;
  customerEmail?: string;
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
}

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

/**
 * Creates a Stripe Checkout Session via Stripe REST API directly.
 * This ensures compatibility across Next.js Edge, Node, and runtime environments
 * without strict dependency on heavyweight node-stripe bindings if not installed.
 */
export async function createStripeCheckoutSession(params: CreateCheckoutSessionParams) {
  if (!stripeConfig.secretKey) {
    // Graceful fallback simulation when keys are not yet configured in local environment
    console.warn('[Stripe] STRIPE_SECRET_KEY not set. Generating mock checkout session for demonstration.');
    return {
      id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
      url: `${params.successUrl}?session_id=cs_mock_${Date.now()}&order_id=${params.orderId}`,
      simulated: true,
    };
  }

  // Construct Stripe Checkout Session using Stripe REST API
  const formData = new URLSearchParams();
  formData.append('mode', 'payment');
  formData.append('success_url', params.successUrl);
  formData.append('cancel_url', params.cancelUrl);
  formData.append('client_reference_id', params.orderId);
  formData.append('metadata[order_id]', params.orderId);
  if (params.userId) formData.append('metadata[user_id]', params.userId);
  if (params.customerEmail) formData.append('customer_email', params.customerEmail);

  params.lineItems.forEach((item, index) => {
    formData.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
    formData.append(`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount.toString());
    formData.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
    if (item.price_data.product_data.description) {
      formData.append(`line_items[${index}][price_data][product_data][description]`, item.price_data.product_data.description);
    }
    if (item.price_data.product_data.images?.[0]) {
      formData.append(`line_items[${index}][price_data][product_data][images][0]`, item.price_data.product_data.images[0]);
    }
    formData.append(`line_items[${index}][quantity]`, item.quantity.toString());
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeConfig.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Stripe API error: ${response.status} - ${errorBody}`);
  }

  const session = await response.json();
  return {
    id: session.id,
    url: session.url,
    simulated: false,
  };
}
