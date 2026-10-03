'use server';

import { createServerClient } from '../lib/supabase/server.ts';

export interface ProductFilterParams {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'featured';
  page?: number;
  limit?: number;
}

export async function getProducts(params: ProductFilterParams = {}) {
  const {
    categorySlug,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy = 'featured',
    page = 1,
    limit = 12,
  } = params;

  const supabase = createServerClient();
  let query = supabase.from('products').select('*, categories!inner(*)', { count: 'exact' });

  if (categorySlug && categorySlug !== 'all') {
    query = query.eq('categories.slug', categorySlug);
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'featured':
    default:
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching products from Supabase:', error.message);
    return { data: [], count: 0, error: error.message };
  }

  return { data, count: count || 0, error: null };
}

export async function getProductBySlug(slug: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
