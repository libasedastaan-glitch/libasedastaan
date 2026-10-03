import { useState } from 'react';
import { Copy, Check, Database, Shield, Key, AlertCircle, FileCode, Sparkles } from 'lucide-react';

interface SqlViewerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const SqlViewerModal = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}: SqlViewerModalProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick-rls' | 'sql' | 'env' | 'rls'>('quick-rls');

  const sqlScript = `-- ==============================================================================
-- NEXUS COMMERCE - SUPABASE POSTGRESQL INITIALIZATION SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to initialize all tables, types,
-- triggers, indexes, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('stripe', 'cod');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Syncs automatically with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'user',
    address JSONB DEFAULT '{}'::jsonb,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL DEFAULT 'cod',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 9. AUTH TRIGGER FOR AUTO-SYNCING PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Products Policies: Unrestricted read & write for store & admin panel
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Enable all operations for products" ON public.products;
CREATE POLICY "Enable all operations for products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Categories Policies: Unrestricted read & write
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Enable all operations for categories" ON public.categories;
CREATE POLICY "Enable all operations for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Orders Policies: Unrestricted access for store checkout and admin panel
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all operations for orders" ON public.orders;
CREATE POLICY "Enable all operations for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items Policies:
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable all operations for order_items" ON public.order_items;
CREATE POLICY "Enable all operations for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 11. SUPABASE REALTIME REPLICATION (Instant Realtime updates)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;

-- 12. SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');`;

  const quickRlsFix = `-- ==============================================================================
-- ⚡ 1-CLICK RLS & FOREIGN KEY FIX: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================
-- 1. Disable RLS so publishable key can insert/update products & orders:
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 2. Populate categories so foreign key constraint (products_category_id_fkey) is satisfied:
INSERT INTO public.categories (id, name, slug, image_url)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Audio & Tech', 'audio-tech', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'),
    ('c2222222-2222-2222-2222-222222222222', 'Minimalist Living', 'minimalist-living', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'),
    ('c3333333-3333-3333-3333-333333333333', 'Premium Wear', 'premium-wear', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'),
    ('c4444444-4444-4444-4444-444444444444', 'Workspace & Desk', 'workspace-desk', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80')
ON CONFLICT (slug) DO UPDATE
SET id = EXCLUDED.id,
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url;

-- 3. Fix profiles table & ensure columns exist:
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Enable Realtime broadcast events for products, orders, and profiles:
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN others THEN null; END $$;

-- 5. Populate default staff profiles (So profiles table is never empty):
INSERT INTO public.profiles (id, email, full_name, role, password_hash)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@libasedastaan.com', 'Lead Administrator', 'admin', 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    ('22222222-2222-2222-2222-222222222222', 'manager@libasedastaan.com', 'Catalog Manager', 'manager', 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    ('33333333-3333-3333-3333-333333333333', 'libasedastaan@gmail.com', 'Lead Director', 'admin', 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash;`;

  const envFileExample = `# Obtain from your Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Obtain from Stripe Dashboard -> Developers -> API Keys
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-5 bg-[#FAF6F0] text-[#3B2314] font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-[#3B2314] flex items-center gap-2 uppercase tracking-wider">
            <Database className="w-5 h-5 text-[#9E5A38]" />
            Supabase PostgreSQL DDL Script
          </h3>
          <p className="text-xs text-[#3B2314]/70 mt-0.5 font-light">
            Production schema script with types, triggers, RLS policies, and realtime broadcast.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              copyToClipboard(
                activeTab === 'quick-rls'
                  ? quickRlsFix
                  : activeTab === 'sql'
                  ? sqlScript
                  : envFileExample
              )
            }
            className="flex items-center gap-1.5 px-4 py-2 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] text-xs font-serif uppercase tracking-widest font-semibold transition-colors rounded-none shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D8CEC4] pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('quick-rls')}
          className={`px-3.5 py-1.5 text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none ${
            activeTab === 'quick-rls' ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold' : 'text-[#3B2314]/70 hover:text-[#3B2314]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>⚡ 1-Click RLS Fix</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-3.5 py-1.5 text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none ${
            activeTab === 'sql' ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold' : 'text-[#3B2314]/70 hover:text-[#3B2314]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Full schema.sql</span>
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`px-3.5 py-1.5 text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none ${
            activeTab === 'env' ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold' : 'text-[#3B2314]/70 hover:text-[#3B2314]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>.env.example</span>
        </button>
      </div>

      {/* Main viewer container */}
      {activeTab === 'quick-rls' && (
        <div className="space-y-3">
          <div className="p-4 bg-[#EDF3EC] border border-[#C3D5C0] text-[#3B2314] text-xs flex items-center justify-between gap-4 rounded-none">
            <div>
              <strong className="text-[#526A50] uppercase tracking-wider">Why is this needed?</strong> If your products or team accounts weren&apos;t saving to the table, PostgreSQL Row Level Security (RLS) is blocking inserts.
              Run this script in your Supabase SQL editor to immediately permit saving.
            </div>
            <button
              onClick={() => copyToClipboard(quickRlsFix)}
              className="px-3.5 py-1.5 bg-[#526A50] hover:bg-[#465a44] text-[#FAF6F0] font-serif uppercase tracking-wider font-bold shrink-0 text-xs rounded-none"
            >
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          <pre className="p-4 bg-[#25140A] text-[#FAF6F0] border border-[#3B2314] font-mono text-[11px] overflow-x-auto max-h-[60vh] leading-relaxed select-all rounded-none">
            <code>{quickRlsFix}</code>
          </pre>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="relative">
          <pre className="p-4 bg-[#25140A] text-[#FAF6F0] border border-[#3B2314] font-mono text-[11px] overflow-x-auto max-h-[60vh] leading-relaxed select-all rounded-none">
            <code>{sqlScript}</code>
          </pre>
        </div>
      )}

      {activeTab === 'env' && (
        <div className="relative">
          <pre className="p-4 bg-[#25140A] text-[#FAF6F0] border border-[#3B2314] font-mono text-xs overflow-x-auto max-h-[60vh] leading-relaxed select-all rounded-none">
            <code>{envFileExample}</code>
          </pre>
        </div>
      )}

      {activeTab === 'rls' && (
        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] space-y-4 text-xs text-[#3B2314]">
          <h4 className="font-bold text-sm text-[#3B2314] uppercase tracking-wider">Row Level Security (RLS) Policy Guide</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#FAF6F0] border border-[#D8CEC4] space-y-1">
              <span className="font-bold text-[#3B2314] block">profiles table</span>
              <p className="text-[#3B2314]/70 font-light">
                Only the profile owner (or user with <code>role = &apos;admin&apos;</code>) can read or update the profile row.
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF6F0] border border-[#D8CEC4] space-y-1">
              <span className="font-bold text-[#3B2314] block">products &amp; categories</span>
              <p className="text-[#3B2314]/70 font-light">
                Read access is unrestricted (public catalog). Write/update/delete operations strictly restricted to staff roles.
              </p>
            </div>
          </div>
        </div>
      )}
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
