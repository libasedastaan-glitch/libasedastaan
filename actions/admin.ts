'use server';

import { createAdminClient } from '../lib/supabase/server.ts';

export interface ProductInput {
  id?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number | null;
  stock: number;
  category_id?: string;
  images: string[];
  is_featured: boolean;
}

/**
 * Uploads an image buffer or base64 to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(fileData: string | Blob, fileName: string) {
  const adminClient = createAdminClient();
  const fileExt = fileName.split('.').pop() || 'jpg';
  const cleanPath = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  let bodyData: any = fileData;
  if (typeof fileData === 'string' && fileData.startsWith('data:')) {
    // Decode base64 to Buffer/Blob
    const base64Content = fileData.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');
    bodyData = buffer;
  }

  const { data, error } = await adminClient.storage
    .from('product-images')
    .upload(cleanPath, bodyData, {
      contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { url: null, error: error.message };
  }

  const { data: publicUrlData } = adminClient.storage
    .from('product-images')
    .getPublicUrl(cleanPath);

  return { url: publicUrlData.publicUrl, error: null };
}

/**
 * Creates a new product in the catalog
 */
export async function createProductAction(product: ProductInput) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('products')
    .insert({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      sale_price: product.sale_price || null,
      stock: product.stock,
      category_id: product.category_id || null,
      images: product.images,
      is_featured: product.is_featured,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Updates an existing product
 */
export async function updateProductAction(id: string, updates: Partial<ProductInput>) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('products')
    .update({
      ...updates,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Deletes a product from the database
 */
export async function deleteProductAction(id: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('products').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Updates order status (e.g. pending -> processing -> shipped -> delivered -> cancelled)
 */
export async function updateOrderStatusAction(orderId: string, status: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Updates payment status (e.g. unpaid -> paid)
 */
export async function updatePaymentStatusAction(orderId: string, payment_status: 'unpaid' | 'paid') {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('orders')
    .update({ payment_status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Fetches overview metrics for the TailAdmin Dashboard
 */
export async function getAdminAnalyticsAction() {
  const adminClient = createAdminClient();

  const [ordersRes, productsRes] = await Promise.all([
    adminClient.from('orders').select('*').order('created_at', { ascending: false }),
    adminClient.from('products').select('*'),
  ]);

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStockProducts = products.filter((p) => p.stock <= 5).length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: products.length,
    pendingOrders,
    lowStockProducts,
    orders,
    products,
  };
}
