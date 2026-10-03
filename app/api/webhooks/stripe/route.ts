import { createAdminClient } from '../../../../lib/supabase/server.ts';
import { stripeConfig } from '../../../../lib/stripe.ts';
import crypto from 'crypto';

/**
 * Stripe Webhook Route Handler
 * POST /api/webhooks/stripe
 * Verifies HMAC SHA-256 signature and handles checkout.session.completed
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('stripe-signature');

    // Signature verification (compatible with Node crypto without requiring heavy Stripe library bundle)
    if (stripeConfig.webhookSecret && signatureHeader) {
      const parts = signatureHeader.split(',');
      let timestamp = '';
      let sig = '';

      for (const part of parts) {
        const [key, value] = part.trim().split('=');
        if (key === 't') timestamp = value;
        if (key === 'v1') sig = value;
      }

      if (timestamp && sig) {
        const signedPayload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto
          .createHmac('sha256', stripeConfig.webhookSecret)
          .update(signedPayload)
          .digest('hex');

        if (expectedSignature !== sig) {
          console.error('[Stripe Webhook] Invalid signature verification');
          return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    const event = JSON.parse(rawBody);
    const adminClient = createAdminClient();

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;

      if (orderId) {
        console.log(`[Stripe Webhook] Fulfilling order ${orderId} - marked as paid`);

        const { error } = await adminClient
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
          })
          .eq('id', orderId);

        if (error) {
          console.error('[Stripe Webhook] Error updating order status in Supabase:', error);
          return new Response(JSON.stringify({ error: 'Database update failed' }), { status: 500 });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Stripe Webhook] Handler error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
