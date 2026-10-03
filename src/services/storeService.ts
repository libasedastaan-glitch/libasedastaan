import { Category, Product, Order, UserProfile, CartItem, OrderStatus, PaymentStatus } from '../types/index.ts';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_USER } from '../data/mockData.ts';
import { supabase, isSupabaseLive, getActiveSupabaseUrl } from '../../lib/supabase/client.ts';
import { RealtimeChannel } from '@supabase/supabase-js';

const USER_STORAGE_KEY = 'nexus_user_v1';
const CART_STORAGE_KEY = 'nexus_cart_v1';

export interface DbStatusInfo {
  status: 'connected' | 'syncing' | 'error' | 'offline';
  message: string;
  url: string;
  count: number;
  lastSync?: string;
}

const isValidUUID = (id?: string) =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

class StoreService {
  private products: Product[] = [];
  private categories: Category[] = [];
  private orders: Order[] = [];
  private currentUser: UserProfile = INITIAL_USER;
  private cart: CartItem[] = [];
  private realtimeChannel: RealtimeChannel | null = null;
  private isInitialized = false;

  private dbStatus: DbStatusInfo = {
    status: 'connected',
    message: 'Connecting to database in real-time...',
    url: getActiveSupabaseUrl(),
    count: 0,
  };

  private listeners: Array<() => void> = [];

  constructor() {
    this.initLocalPreferences();
    // Load directly from Supabase and subscribe to Realtime Postgres changes
    this.initDatabase();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private initLocalPreferences() {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      this.currentUser = storedUser ? JSON.parse(storedUser) : INITIAL_USER;

      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      this.cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      this.currentUser = INITIAL_USER;
      this.cart = [];
    }
  }

  /**
   * Initializes Supabase live queries and sets up Realtime WebSocket subscriptions
   */
  public async initDatabase() {
    await this.ensureCategoriesExist();
    await this.fetchFromDatabase();
    this.setupRealtimeSubscription();
  }

  /**
   * Ensures default categories exist in Supabase to prevent foreign key errors
   */
  public async ensureCategoriesExist(): Promise<void> {
    if (!isSupabaseLive()) return;
    try {
      for (const cat of INITIAL_CATEGORIES) {
        await supabase.from('categories').upsert(
          {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image_url: cat.image_url,
          },
          { onConflict: 'slug' }
        );
      }
    } catch (e) {
      console.warn('Could not auto-insert categories in Supabase:', e);
    }
  }

  /**
   * Directly fetches products, categories, and orders from Supabase DB
   */
  public async fetchFromDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseLive()) {
      this.dbStatus = {
        status: 'offline',
        message: 'Supabase credentials not configured.',
        url: getActiveSupabaseUrl(),
        count: 0,
      };
      this.notify();
      return { success: false, count: 0, error: 'Offline' };
    }

    this.dbStatus.status = 'syncing';
    this.dbStatus.message = 'Loading live data from central database...';
    this.notify();

    try {
      // 1. Fetch categories
      const { data: dbCategories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (!catError && dbCategories && dbCategories.length > 0) {
        this.categories = dbCategories;
      } else {
        this.categories = INITIAL_CATEGORIES;
      }

      // 2. Fetch products
      const { data: dbProducts, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodError) {
        console.error('Products query error:', prodError);
        const isRlsError = prodError.message.includes('row-level security') || prodError.code === '42501';
        const isTableMissing = prodError.message.includes('does not exist');

        this.dbStatus = {
          status: 'error',
          message: isTableMissing
            ? 'Table "products" does not exist in database yet.'
            : isRlsError
            ? 'Database security policy is restricting access.'
            : `Database Error: ${prodError.message}`,
          url: getActiveSupabaseUrl(),
          count: this.products.length,
        };

        // Fallback to initial products for display
        if (this.products.length === 0) {
          this.products = INITIAL_PRODUCTS;
        }
        this.notify();
        return { success: false, count: 0, error: prodError.message };
      }

      // 3. Populate products directly from DB
      if (dbProducts && dbProducts.length > 0) {
        this.products = dbProducts.map((p: any) => {
          let savedFee: number | undefined;
          try {
            const raw = localStorage.getItem('libasedastaan_delivery_charges');
            if (raw) {
              const map = JSON.parse(raw);
              if (typeof map[p.id] === 'number') savedFee = map[p.id];
              else if (typeof map[p.slug] === 'number') savedFee = map[p.slug];
            }
          } catch (e) {}

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description || '',
            price: Number(p.price),
            sale_price: p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null,
            stock: Number(p.stock),
            delivery_charges:
              p.delivery_charges !== undefined && p.delivery_charges !== null
                ? Number(p.delivery_charges)
                : savedFee !== undefined
                ? savedFee
                : 0,
            category_id: p.category_id,
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
            is_featured: Boolean(p.is_featured),
            created_at: p.created_at,
          };
        });

        this.dbStatus = {
          status: 'connected',
          message: `Live database active: ${this.products.length} products loaded directly from catalog.`,
          url: getActiveSupabaseUrl(),
          count: this.products.length,
          lastSync: new Date().toLocaleTimeString(),
        };
      } else {
        // Table exists, but is empty (0 rows)
        this.products = INITIAL_PRODUCTS;
        this.dbStatus = {
          status: 'connected',
          message: `Connected to live database (${this.products.length} products loaded).`,
          url: getActiveSupabaseUrl(),
          count: this.products.length,
          lastSync: new Date().toLocaleTimeString(),
        };
      }

      // 4. Fetch orders from Supabase
      const { data: dbOrders, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            product_id
          )
        `)
        .order('created_at', { ascending: false });

      if (!orderErr && dbOrders && dbOrders.length > 0) {
        this.orders = dbOrders.map((o: any) => ({
          id: o.id,
          user_id: o.user_id,
          status: o.status,
          payment_method: o.payment_method,
          payment_status: o.payment_status,
          total_amount: Number(o.total_amount),
          shipping_address: o.shipping_address || {},
          stripe_session_id: o.stripe_session_id,
          created_at: o.created_at,
          items: (o.order_items || []).map((oi: any) => ({
            id: oi.id,
            order_id: o.id,
            product_id: oi.product_id,
            quantity: oi.quantity,
            unit_price: Number(oi.unit_price),
            product: this.products.find((p) => p.id === oi.product_id),
          })),
        }));
      } else {
        this.orders = INITIAL_ORDERS;
      }

      this.isInitialized = true;
      this.notify();
      return { success: true, count: this.products.length };
    } catch (err: any) {
      console.error('Database fetch error:', err);
      this.dbStatus = {
        status: 'error',
        message: err.message || 'Connection failure',
        url: getActiveSupabaseUrl(),
        count: this.products.length,
      };
      this.notify();
      return { success: false, count: 0, error: err.message };
    }
  }

  /**
   * Sets up real-time websocket listener on Supabase tables
   */
  private setupRealtimeSubscription() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = supabase
      .channel('nexus-store-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Realtime Products Update]', payload);
          if (payload.eventType === 'INSERT') {
            const newP: any = payload.new;
            const formatted: Product = {
              id: newP.id,
              title: newP.title,
              slug: newP.slug,
              description: newP.description || '',
              price: Number(newP.price),
              sale_price: newP.sale_price !== null && newP.sale_price !== undefined ? Number(newP.sale_price) : null,
              stock: Number(newP.stock),
              delivery_charges: newP.delivery_charges !== undefined && newP.delivery_charges !== null ? Number(newP.delivery_charges) : 15,
              category_id: newP.category_id,
              images: Array.isArray(newP.images) && newP.images.length > 0 ? newP.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
              is_featured: Boolean(newP.is_featured),
              created_at: newP.created_at,
            };
            this.products = [formatted, ...this.products.filter((p) => p.id !== newP.id && p.slug !== newP.slug)];
            this.notify();
          } else if (payload.eventType === 'UPDATE') {
            const updated: any = payload.new;
            this.products = this.products.map((p) =>
              p.id === updated.id || p.slug === updated.slug
                ? {
                    ...p,
                    id: updated.id,
                    title: updated.title,
                    slug: updated.slug,
                    description: updated.description || '',
                    price: Number(updated.price),
                    sale_price: updated.sale_price !== null && updated.sale_price !== undefined ? Number(updated.sale_price) : null,
                    stock: Number(updated.stock),
                    delivery_charges: updated.delivery_charges !== undefined && updated.delivery_charges !== null ? Number(updated.delivery_charges) : p.delivery_charges,
                    category_id: updated.category_id,
                    images: Array.isArray(updated.images) && updated.images.length > 0 ? updated.images : p.images,
                    is_featured: Boolean(updated.is_featured),
                  }
                : p
            );
            this.notify();
          } else if (payload.eventType === 'DELETE') {
            const oldItem: any = payload.old;
            this.products = this.products.filter((p) => p.id !== oldItem.id);
            this.notify();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-fetch orders when an order changes in DB
          this.fetchFromDatabase();
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime Status]', status);
      });
  }

  // --- Products CRUD (Direct to Supabase Database) ---

  public getProducts(): Product[] {
    return this.products;
  }

  public getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  /**
   * Adds a new product directly to the Supabase database
   */
  public async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    let categoryId = isValidUUID(product.category_id) ? product.category_id : null;

    // Check if category exists in database; if not, auto-upsert or fallback to null
    if (categoryId) {
      try {
        const { data: catExists } = await supabase
          .from('categories')
          .select('id')
          .eq('id', categoryId)
          .maybeSingle();

        if (!catExists) {
          const matchingCat =
            this.categories.find((c) => c.id === categoryId) ||
            INITIAL_CATEGORIES.find((c) => c.id === categoryId);

          if (matchingCat) {
            await supabase.from('categories').upsert(
              {
                id: matchingCat.id,
                name: matchingCat.name,
                slug: matchingCat.slug,
                image_url: matchingCat.image_url,
              },
              { onConflict: 'slug' }
            );
          } else {
            categoryId = null;
          }
        }
      } catch (e) {
        categoryId = null;
      }
    }

    const userDeliveryFee =
      product.delivery_charges !== undefined && product.delivery_charges !== null
        ? Number(product.delivery_charges)
        : 0;

    const payload: any = {
      title: product.title,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || null,
      stock: product.stock,
      delivery_charges: userDeliveryFee,
      category_id: categoryId,
      images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      is_featured: Boolean(product.is_featured),
    };

    console.log('[Database] Inserting new product:', payload);

    let { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    // If delivery_charges column doesn't exist in remote database table, retry without it
    if (error && (error.code === '42703' || error.message.includes('delivery_charges'))) {
      delete payload.delivery_charges;
      const retry = await supabase.from('products').insert(payload).select().single();
      data = retry.data;
      error = retry.error;
    }

    // Foreign Key Constraint Fallback: If category_id caused a foreign key violation, retry with null
    if (error && (error.message.includes('products_category_id_fkey') || error.code === '23503')) {
      console.warn('[Database] Foreign key mismatch on category_id. Retrying insert with category_id = null...');
      payload.category_id = null;
      const retry = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Database Error] Failed to insert product:', error);
      throw new Error(
        error.code === '42501' || error.message.includes('row-level security')
          ? `Database Error: Unable to insert product into database.`
          : error.message
      );
    }

    // Save delivery charges into persistent local cache
    try {
      const raw = localStorage.getItem('libasedastaan_delivery_charges') || '{}';
      const map = JSON.parse(raw);
      if (data.id) map[data.id] = userDeliveryFee;
      if (data.slug) map[data.slug] = userDeliveryFee;
      localStorage.setItem('libasedastaan_delivery_charges', JSON.stringify(map));
    } catch (e) {}

    const createdProduct: Product = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      price: Number(data.price),
      sale_price: data.sale_price !== null && data.sale_price !== undefined ? Number(data.sale_price) : null,
      stock: Number(data.stock),
      delivery_charges:
        data.delivery_charges !== undefined && data.delivery_charges !== null
          ? Number(data.delivery_charges)
          : userDeliveryFee,
      category_id: data.category_id,
      images: data.images,
      is_featured: data.is_featured,
      created_at: data.created_at,
    };

    // Update in-memory state immediately
    this.products = [createdProduct, ...this.products.filter((p) => p.id !== createdProduct.id)];
    this.dbStatus.count = this.products.length;
    this.notify();

    return createdProduct;
  }

  /**
   * Updates an existing product directly in the database
   */
  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const dbPayload: any = {};
    if (updates.title !== undefined) dbPayload.title = updates.title;
    if (updates.slug !== undefined) dbPayload.slug = updates.slug;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.price !== undefined) dbPayload.price = updates.price;
    if (updates.sale_price !== undefined) dbPayload.sale_price = updates.sale_price;
    if (updates.stock !== undefined) dbPayload.stock = updates.stock;
    if (updates.delivery_charges !== undefined) {
      dbPayload.delivery_charges = updates.delivery_charges;
      try {
        const raw = localStorage.getItem('libasedastaan_delivery_charges') || '{}';
        const map = JSON.parse(raw);
        map[id] = updates.delivery_charges;
        if (updates.slug) map[updates.slug] = updates.delivery_charges;
        localStorage.setItem('libasedastaan_delivery_charges', JSON.stringify(map));
      } catch (e) {}
    }
    if (updates.images !== undefined) dbPayload.images = updates.images;
    if (updates.is_featured !== undefined) dbPayload.is_featured = updates.is_featured;
    if (updates.category_id !== undefined) {
      dbPayload.category_id = isValidUUID(updates.category_id) ? updates.category_id : null;
    }

    console.log(`[Database] Updating product ${id}:`, dbPayload);

    let query = supabase.from('products').update(dbPayload);

    if (isValidUUID(id)) {
      query = query.eq('id', id);
    } else {
      // Fallback by slug
      const p = this.products.find((prod) => prod.id === id);
      if (p?.slug) {
        query = query.eq('slug', p.slug);
      } else {
        query = query.eq('id', id);
      }
    }

    let { data, error } = await query.select().single();

    // If column delivery_charges doesn't exist in remote database table, retry update without it
    if (error && (error.code === '42703' || error.message.includes('delivery_charges'))) {
      delete dbPayload.delivery_charges;
      let retryColQuery = supabase.from('products').update(dbPayload);
      if (isValidUUID(id)) {
        retryColQuery = retryColQuery.eq('id', id);
      } else {
        const p = this.products.find((prod) => prod.id === id);
        retryColQuery = retryColQuery.eq('slug', p?.slug || id);
      }
      const retryCol = await retryColQuery.select().single();
      data = retryCol.data;
      error = retryCol.error;
    }

    // Fallback if category_id violated foreign key constraint
    if (error && (error.message.includes('products_category_id_fkey') || error.code === '23503')) {
      console.warn('[Database] Foreign key mismatch on update. Retrying with category_id = null...');
      dbPayload.category_id = null;
      let retryQuery = supabase.from('products').update(dbPayload);
      if (isValidUUID(id)) {
        retryQuery = retryQuery.eq('id', id);
      } else {
        const p = this.products.find((prod) => prod.id === id);
        retryQuery = retryQuery.eq('slug', p?.slug || id);
      }
      const retry = await retryQuery.select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Database Error] Failed to update product:', error);
      throw new Error(error.message);
    }

    const currentFee =
      updates.delivery_charges !== undefined
        ? updates.delivery_charges
        : (data.delivery_charges ?? this.products.find((p) => p.id === id)?.delivery_charges ?? 0);

    const updatedProduct: Product = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      price: Number(data.price),
      sale_price: data.sale_price !== null && data.sale_price !== undefined ? Number(data.sale_price) : null,
      stock: Number(data.stock),
      delivery_charges: currentFee,
      category_id: data.category_id,
      images: data.images,
      is_featured: data.is_featured,
      created_at: data.created_at,
    };

    this.products = this.products.map((p) => (p.id === id || p.slug === updatedProduct.slug ? updatedProduct : p));
    this.notify();

    return updatedProduct;
  }

  /**
   * Deletes a product directly from the database
   */
  public async deleteProduct(id: string): Promise<boolean> {
    console.log(`[Database] Deleting product ${id}`);
    let query = supabase.from('products').delete();

    if (isValidUUID(id)) {
      query = query.eq('id', id);
    } else {
      const p = this.products.find((prod) => prod.id === id);
      if (p?.slug) {
        query = query.eq('slug', p.slug);
      } else {
        query = query.eq('id', id);
      }
    }

    const { error } = await query;
    if (error) {
      console.error('[Database Error] Failed to delete product:', error);
      throw new Error(error.message);
    }

    this.products = this.products.filter((p) => p.id !== id);
    this.notify();
    return true;
  }

  /**
   * Pushes all initial catalog products into the central database
   */
  public async seedDatabaseWithProducts(): Promise<{ success: boolean; count: number; error?: string }> {
    this.dbStatus.status = 'syncing';
    this.dbStatus.message = 'Seeding initial products into database...';
    this.notify();

    try {
      // 1. Insert categories first
      for (const cat of INITIAL_CATEGORIES) {
        await supabase.from('categories').upsert(
          {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image_url: cat.image_url,
          },
          { onConflict: 'slug' }
        );
      }

      // 2. Insert initial products
      let count = 0;
      for (const prod of INITIAL_PRODUCTS) {
        const payload: any = {
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          sale_price: prod.sale_price || null,
          stock: prod.stock,
          category_id: isValidUUID(prod.category_id) ? prod.category_id : null,
          images: prod.images,
          is_featured: prod.is_featured,
        };

        let { error } = await supabase.from('products').upsert(payload, { onConflict: 'slug' });

        if (error && (error.message.includes('products_category_id_fkey') || error.code === '23503')) {
          payload.category_id = null;
          const retry = await supabase.from('products').upsert(payload, { onConflict: 'slug' });
          error = retry.error;
        }

        if (error) {
          console.error(`Error inserting ${prod.title}:`, error);
          throw new Error(
            error.code === '42501' || error.message.includes('row-level security')
              ? `Database Error: Table security policy blocked insert.`
              : error.message
          );
        }
        count++;
      }

      await this.fetchFromDatabase();
      return { success: true, count };
    } catch (e: any) {
      console.error('Seeding error:', e);
      this.dbStatus = {
        status: 'error',
        message: e.message || 'Seeding failed',
        url: getActiveSupabaseUrl(),
        count: this.products.length,
      };
      this.notify();
      return { success: false, count: 0, error: e.message };
    }
  }

  public async pushAllToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    return this.seedDatabaseWithProducts();
  }

  public async syncFromSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    return this.fetchFromDatabase();
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return this.categories;
  }

  // --- Cart ---
  public getCart(): CartItem[] {
    return this.cart;
  }

  public addToCart(product: Product, quantity = 1): CartItem[] {
    const existingIndex = this.cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }
    this.saveCart();
    return [...this.cart];
  }

  public updateCartQuantity(productId: string, quantity: number): CartItem[] {
    if (quantity <= 0) {
      this.cart = this.cart.filter((item) => item.product.id !== productId);
    } else {
      const item = this.cart.find((i) => i.product.id === productId);
      if (item) {
        item.quantity = quantity;
      }
    }
    this.saveCart();
    return [...this.cart];
  }

  public removeFromCart(productId: string): CartItem[] {
    this.cart = this.cart.filter((item) => item.product.id !== productId);
    this.saveCart();
    return [...this.cart];
  }

  public clearCart(): void {
    this.cart = [];
    this.saveCart();
  }

  private saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
    } catch (e) {
      // Ignore
    }
  }

  // --- Orders CRUD (Direct to Supabase Database) ---

  public getOrders(): Order[] {
    return this.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  public async createOrder(params: {
    shippingAddress: Order['shipping_address'];
    paymentMethod: 'stripe' | 'cod';
    userId?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const totalAmount = this.cart.reduce((sum, item) => {
      const price = item.product.sale_price || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const stripeSessionId = params.paymentMethod === 'stripe' ? `cs_live_${Date.now()}` : undefined;

    // 1. Insert order record into Supabase orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        payment_method: params.paymentMethod,
        payment_status: params.paymentMethod === 'stripe' ? 'paid' : 'unpaid',
        total_amount: totalAmount,
        shipping_address: params.shippingAddress,
        stripe_session_id: stripeSessionId,
      })
      .select()
      .single();

    const orderId = orderData?.id || `ord-${Date.now().toString().slice(-5)}`;

    // 2. Insert order items into Supabase order_items table
    if (orderData?.id) {
      const itemsPayload = this.cart.map((item) => ({
        order_id: orderData.id,
        product_id: isValidUUID(item.product.id) ? item.product.id : null,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.price,
      }));

      await supabase.from('order_items').insert(itemsPayload);
    }

    // 3. Deduct inventory stock directly in Supabase
    for (const item of this.cart) {
      const newStock = Math.max(0, item.product.stock - item.quantity);
      await this.updateProduct(item.product.id, { stock: newStock });
    }

    const newOrder: Order = {
      id: orderId,
      user_id: params.userId,
      status: 'pending',
      payment_method: params.paymentMethod,
      payment_status: params.paymentMethod === 'stripe' ? 'paid' : 'unpaid',
      total_amount: totalAmount,
      shipping_address: params.shippingAddress,
      created_at: new Date().toISOString(),
      stripe_session_id: stripeSessionId,
      items: this.cart.map((item) => ({
        id: `item-${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.price,
        product: item.product,
      })),
    };

    this.orders = [newOrder, ...this.orders];
    this.clearCart();
    this.notify();

    return { success: true, order: newOrder };
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.warn('Could not update order in Supabase:', error.message);
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      this.notify();
    }
    return order || null;
  }

  public async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<Order | null> {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId);

    if (error) {
      console.warn('Could not update payment in Supabase:', error.message);
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.payment_status = status;
      this.notify();
    }
    return order || null;
  }

  // --- User / Role Preferences ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      // Ignore
    }
    this.notify();
  }

  public toggleRole(): UserProfile {
    this.currentUser.role = this.currentUser.role === 'admin' ? 'user' : 'admin';
    this.setCurrentUser(this.currentUser);
    return this.currentUser;
  }

  public getDbStatus(): DbStatusInfo {
    return {
      ...this.dbStatus,
      url: getActiveSupabaseUrl(),
      count: this.products.length,
    };
  }
}

export const storeService = new StoreService();
