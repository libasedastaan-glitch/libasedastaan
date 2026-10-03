import { useState } from 'react';
import { Code, Copy, Check, FileText, Server, CreditCard, ShieldCheck } from 'lucide-react';

interface NextJsCodeViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const NextJsCodeViewer = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}: NextJsCodeViewerProps) => {
  const [activeFile, setActiveFile] = useState<string>('actions/orders.ts');
  const [copied, setCopied] = useState(false);

  const filesMap: Record<string, { label: string; icon: any; code: string }> = {
    'actions/orders.ts': {
      label: 'actions/orders.ts',
      icon: Server,
      code: `'use server';

import { createServerClient, createAdminClient } from '../lib/supabase/server';
import { createStripeCheckoutSession } from '../lib/stripe';

export interface CreateOrderParams {
  userId?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number; title: string }>;
  shippingAddress: any;
  paymentMethod: 'stripe' | 'cod';
}

export async function createOrderAction(params: CreateOrderParams) {
  const { userId, items, shippingAddress, paymentMethod } = params;
  const adminClient = createAdminClient();

  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // 1. Insert order record into Supabase
  const { data: order, error } = await adminClient
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

  if (error || !order) throw new Error(error?.message || 'Order creation failed');

  // 2. Insert order items & deduct inventory stock
  for (const item of items) {
    await adminClient.from('order_items').insert({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    });

    const { data: prod } = await adminClient
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .single();

    if (prod) {
      await adminClient
        .from('products')
        .update({ stock: Math.max(0, prod.stock - item.quantity) })
        .eq('id', item.productId);
    }
  }

  // 3. Dual payment handling: Stripe vs Cash on Delivery (COD)
  if (paymentMethod === 'cod') {
    return {
      success: true,
      orderId: order.id,
      paymentMethod: 'cod',
      redirectUrl: \`/checkout/success?order_id=\${order.id}&method=cod\`,
    };
  }

  // Stripe Checkout Session Creation
  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.title },
      unit_amount: Math.round(item.unitPrice * 100),
    },
    quantity: item.quantity,
  }));

  const session = await createStripeCheckoutSession({
    orderId: order.id,
    userId,
    customerEmail: shippingAddress.email,
    lineItems,
    successUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=\${order.id}\`,
    cancelUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/cart?canceled=true\`,
  });

  await adminClient.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

  return { success: true, orderId: order.id, checkoutUrl: session.url };
}`,
    },
    'api/webhooks/stripe/route.ts': {
      label: 'api/webhooks/stripe/route.ts',
      icon: CreditCard,
      code: `import { createAdminClient } from '@/lib/supabase/server';
import { stripeConfig } from '@/lib/stripe';
import crypto from 'crypto';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature');

  // Verify Stripe webhook HMAC SHA-256 signature
  if (stripeConfig.webhookSecret && signatureHeader) {
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let sig = '';
    for (const part of parts) {
      const [k, v] = part.trim().split('=');
      if (k === 't') timestamp = v;
      if (k === 'v1') sig = v;
    }
    const signedPayload = \`\${timestamp}.\${rawBody}\`;
    const expectedSig = crypto
      .createHmac('sha256', stripeConfig.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    if (expectedSig !== sig) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }
  }

  const event = JSON.parse(rawBody);
  const adminClient = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.order_id || session.client_reference_id;

    if (orderId) {
      // Mark order as paid and processing
      await adminClient
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
        })
        .eq('id', orderId);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}`,
    },
    'middleware.ts': {
      label: 'middleware.ts',
      icon: ShieldCheck,
      code: `import { createServerClient } from '@/lib/supabase/server';

export async function middleware(request: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isAdminRoute = pathname.startsWith('/admin');
  const isProfileRoute = pathname.startsWith('/profile');

  if (!isAdminRoute && !isProfileRoute) return;

  const supabase = createServerClient();
  const token = request.headers?.get('authorization')?.replace('Bearer ', '') ||
                request.cookies?.get('sb-access-token')?.value;

  if (!token) {
    return Response.redirect(new URL(\`/login?callbackUrl=\${pathname}\`, request.url));
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return Response.redirect(new URL(\`/login?callbackUrl=\${pathname}\`, request.url));
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return Response.redirect(new URL('/?unauthorized=admin_required', request.url));
    }
  }
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
};`,
    },
    'actions/admin.ts': {
      label: 'actions/admin.ts',
      icon: FileText,
      code: `'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function uploadProductImage(fileData: string | Blob, fileName: string) {
  const adminClient = createAdminClient();
  const fileExt = fileName.split('.').pop() || 'jpg';
  const cleanPath = \`\${Date.now()}-\${Math.random().toString(36).substring(2, 8)}.\${fileExt}\`;

  const { error } = await adminClient.storage
    .from('product-images')
    .upload(cleanPath, fileData, { upsert: true });

  if (error) throw new Error(error.message);

  const { data } = adminClient.storage.from('product-images').getPublicUrl(cleanPath);
  return { url: data.publicUrl };
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  const adminClient = createAdminClient();
  return adminClient.from('orders').update({ status }).eq('id', orderId).select().single();
}

export async function updatePaymentStatusAction(orderId: string, payment_status: 'unpaid' | 'paid') {
  const adminClient = createAdminClient();
  return adminClient.from('orders').update({ payment_status }).eq('id', orderId).select().single();
}`,
    },
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-4 text-[#3B2314]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-serif font-bold text-[#3B2314] flex items-center gap-2 uppercase tracking-wide">
            <Code className="w-5 h-5 text-[#9E5A38]" />
            Next.js App Router Architecture &amp; Server Actions
          </h3>
          <p className="text-xs text-[#3B2314]/70 mt-0.5 font-light">
            Production-grade Server Actions, Stripe Webhooks with HMAC verification, and RBAC middleware.
          </p>
        </div>

        <button
          onClick={() => copyCode(filesMap[activeFile].code)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] text-xs font-serif uppercase tracking-wider font-semibold shadow-sm transition-all self-start sm:self-auto rounded-none"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied File!' : 'Copy File'}</span>
        </button>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D8CEC4] pb-2">
        {Object.entries(filesMap).map(([key, item]) => {
          const Icon = item.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveFile(key)}
              className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none ${
                activeFile === key
                  ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold shadow-sm'
                  : 'bg-[#FFFDF9] text-[#3B2314] border border-[#D8CEC4] hover:border-[#3B2314]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Area */}
      <div className="relative">
        <pre className="p-4 bg-[#25140A] border border-[#3B2314] font-mono text-[11px] text-[#FAF6F0] overflow-x-auto max-h-[60vh] leading-relaxed select-all rounded-none">
          <code>{filesMap[activeFile].code}</code>
        </pre>
      </div>
    </div>
  );

  if (isEmbedded) {
    return <div className="p-6 sm:p-8 max-w-7xl mx-auto bg-[#FAF6F0]">{content}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl text-[#3B2314] overflow-hidden my-8 p-6 rounded-none">
        <div className="flex justify-end mb-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-serif uppercase tracking-wider bg-[#FFFDF9] border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] rounded-none"
            >
              Close
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};
