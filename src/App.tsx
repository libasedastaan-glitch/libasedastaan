import { useState, useEffect } from 'react';
import { storeService } from './services/storeService.ts';
import { Product, Category, Order, UserProfile, CartItem, OrderStatus, PaymentStatus } from './types/index.ts';

// Storefront Components
import { Navbar } from './components/storefront/Navbar.tsx';
import { HeroBanner } from './components/storefront/HeroBanner.tsx';
import { ProductCard } from './components/storefront/ProductCard.tsx';
import { ProductDetailModal } from './components/storefront/ProductDetailModal.tsx';
import { CartDrawer } from './components/storefront/CartDrawer.tsx';
import { CheckoutModal } from './components/storefront/CheckoutModal.tsx';
import { OrderSuccessModal } from './components/storefront/OrderSuccessModal.tsx';
import { ProfileModal } from './components/storefront/ProfileModal.tsx';
import { Footer } from './components/storefront/Footer.tsx';

// Admin TailAdmin Components
import { TailAdminSidebar } from './components/admin/TailAdminSidebar.tsx';
import { TailAdminHeader } from './components/admin/TailAdminHeader.tsx';
import { AnalyticsOverview } from './components/admin/AnalyticsOverview.tsx';
import { ProductManagement } from './components/admin/ProductManagement.tsx';
import { OrderManagement } from './components/admin/OrderManagement.tsx';
import { ProductFormModal } from './components/admin/ProductFormModal.tsx';
import { SqlViewerModal } from './components/admin/SqlViewerModal.tsx';
import { NextJsCodeViewer } from './components/admin/NextJsCodeViewer.tsx';
import { TeamManagement } from './components/admin/TeamManagement.tsx';

// UI
import { ToastContainer, ToastMessage } from './components/ui/Toast.tsx';
import { Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useAuth } from './context/AuthContext.tsx';
import { AdminProtectedRoute } from './components/AdminProtectedRoute.tsx';

export default function App() {
  const { profile, signOut, isAdmin, isManager, canAccessAdmin, canDeleteProducts } = useAuth();
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'orders' | 'team' | 'sql' | 'code'>('overview');

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(storeService.getCurrentUser());
  const [cart, setCart] = useState<CartItem[]>([]);

  // Storefront Filtering & Search
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dbStatus, setDbStatus] = useState(storeService.getDbStatus());

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Load & Subscription
  useEffect(() => {
    refreshData();
    const unsubscribe = storeService.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  const refreshData = () => {
    setProducts([...storeService.getProducts()]);
    setCategories([...storeService.getCategories()]);
    setOrders([...storeService.getOrders()]);
    setCurrentUser(storeService.getCurrentUser());
    setCart([...storeService.getCart()]);
    setDbStatus(storeService.getDbStatus());
  };

  const handlePushToSupabase = async () => {
    addToast('info', 'Connecting to Supabase', 'Uploading catalog products to your database...');
    const res = await storeService.pushAllToSupabase();
    if (res.success) {
      addToast(
        'success',
        'Stored in Supabase DB!',
        `${res.count} products successfully saved in public.products table.`
      );
    } else {
      addToast(
        'error',
        'Database Sync Note',
        res.error || 'Ensure tables are initialized in Supabase SQL editor.'
      );
    }
    refreshData();
  };

  const handleSyncFromSupabase = async () => {
    addToast('info', 'Querying Database', 'Fetching latest records from Supabase...');
    const res = await storeService.syncFromSupabase();
    if (res.success) {
      addToast(
        'success',
        'Database Synced',
        res.count > 0
          ? `${res.count} products loaded from your Supabase database.`
          : 'Database connected. Click "Store All Products in DB" to seed initial items.'
      );
    } else {
      addToast(
        'error',
        'Sync Failed',
        res.error || 'Check if public.products table exists in your project.'
      );
    }
    refreshData();
  };

  // --- Cart Actions ---
  const handleAddToCart = (product: Product, quantity = 1) => {
    const updatedCart = storeService.addToCart(product, quantity);
    setCart(updatedCart);
    addToast('success', 'Added to Cart', `${quantity}x ${product.title} has been added.`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const updatedCart = storeService.updateCartQuantity(productId, quantity);
    setCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = storeService.removeFromCart(productId);
    setCart(updatedCart);
    addToast('info', 'Item Removed', 'Product was removed from your cart.');
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    storeService.addToCart(product, quantity);
    setCart([...storeService.getCart()]);
    setSelectedProduct(null);
    setCheckoutOpen(true);
  };

  // --- Order & Checkout Actions ---
  const handleOrderPlaced = async (order: Order, method: 'stripe' | 'cod') => {
    // Save order in storeService directly to Supabase
    const result = await storeService.createOrder({
      shippingAddress: order.shipping_address,
      paymentMethod: method,
      userId: currentUser.id,
    });

    refreshData();
    setCheckoutOpen(false);
    setCartOpen(false);
    setOrderSuccess(result.order);

    if (method === 'cod') {
      addToast(
        'success',
        'COD Order Confirmed!',
        `Order #${result.order.id} is confirmed. Payment will be collected upon delivery.`
      );
    } else {
      addToast(
        'success',
        'Stripe Payment Successful!',
        `Order #${result.order.id} processed via Stripe Checkout.`
      );
    }
  };

  // --- Role Switcher ---
  const handleToggleRole = () => {
    const updated = storeService.toggleRole();
    setCurrentUser({ ...updated });
    addToast(
      'info',
      'Role Switched',
      `Active account simulation changed to: ${updated.role.toUpperCase()}`
    );
  };

  // --- Admin Actions ---
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'created_at'>,
    id?: string
  ) => {
    try {
      if (id) {
        await storeService.updateProduct(id, productData);
        addToast('success', 'Product Updated in DB!', `${productData.title} was updated in Supabase.`);
      } else {
        const created = await storeService.addProduct(productData);
        addToast(
          'success',
          'Product Stored in Supabase DB!',
          `${created.title} was successfully inserted into your database.`
        );
      }
      refreshData();
      setProductToEdit(null);
    } catch (err: any) {
      console.error('Save product error:', err);
      addToast('error', 'Supabase DB Error', err.message || 'Failed to save product in database.');
      throw err; // rethrow so ProductFormModal displays error too
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!canDeleteProducts) {
      addToast(
        'error',
        'Permission Restricted',
        'Managers cannot delete products. Only Administrators have delete privileges.'
      );
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (confirm(`Are you sure you want to remove "${prod?.title || 'this product'}" from database?`)) {
      try {
        await storeService.deleteProduct(productId);
        refreshData();
        addToast('info', 'Product Deleted from DB', 'Item removed from database table.');
      } catch (err: any) {
        addToast('error', 'Delete Failed', err.message);
      }
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      try {
        await storeService.updateProduct(productId, { is_featured: !prod.is_featured });
        refreshData();
        addToast(
          'info',
          'Updated in DB',
          `${prod.title} featured status is now ${!prod.is_featured ? 'Active' : 'Disabled'}.`
        );
      } catch (err: any) {
        addToast('error', 'Update Failed', err.message);
      }
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      await storeService.updateProduct(productId, { stock: newStock });
      refreshData();
      addToast('info', 'Stock Updated in DB', `Inventory stock set to ${newStock} units.`);
    } catch (err: any) {
      addToast('error', 'Stock Update Failed', err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await storeService.updateOrderStatus(orderId, status);
    refreshData();
    addToast('success', 'Order Status Updated in DB', `Order #${orderId} changed to ${status.toUpperCase()}.`);
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: PaymentStatus) => {
    await storeService.updatePaymentStatus(orderId, status);
    refreshData();
    addToast('success', 'Payment Settled in DB', `Order #${orderId} marked as ${status.toUpperCase()}.`);
  };

  // --- Filtered Products for Storefront ---
  const selectedCategory = categories.find((c) => c.slug === activeCategory);
  const filteredStoreProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === 'all' ||
      (!!selectedCategory &&
        (p.category_id === selectedCategory.id || p.category?.slug === selectedCategory.slug));

    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Select a category and bring the product section into view
  const handleSelectCategory = (slug: string) => {
    setActiveCategory(slug);
    requestAnimationFrame(() => {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // Sort products
  const sortedProducts = [...filteredStoreProducts].sort((a, b) => {
    const priceA = a.sale_price || a.price;
    const priceB = b.sale_price || b.price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    // featured
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3B2314] flex flex-col font-sans selection:bg-[#9E5A38]/20 selection:text-[#3B2314]">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* VIEW SWITCHER: STOREFRONT vs TAILADMIN */}
      {currentView === 'store' ? (
        <div className="flex flex-col min-h-screen">
          {/* Storefront Navbar */}
          <Navbar
            categories={categories}
            cartCount={cartCount}
            currentUser={currentUser}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            onGoHome={() => {
              setActiveCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCart={() => setCartOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onNavigateToAdmin={() => setCurrentView('admin')}
            onOpenSqlViewer={() => setSqlModalOpen(true)}
            onOpenCodeViewer={() => setCodeModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Hero Banner */}
          <HeroBanner
            categories={categories}
            products={products}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            onExploreProducts={() => {
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onNavigateToAdmin={() => setCurrentView('admin')}
          />

          {/* Store Catalog Section */}
          <main id="catalog-section" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            {/* Filter and Sort Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#D8CEC4]">
              <div>
                <h2 className="text-2xl font-serif font-bold tracking-wide text-[#3B2314] uppercase">
                  {activeCategory === 'all'
                    ? 'All Haute Couture Ensembles'
                    : categories.find((c) => c.slug === activeCategory)?.name || 'Ensembles'}
                </h2>
                <p className="text-xs text-[#3B2314]/70 mt-1 font-light">
                  Showing {sortedProducts.length} handcrafted pieces with global insured courier and Cash on Delivery
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Quick Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-2 text-xs font-serif uppercase tracking-widest whitespace-nowrap transition-colors rounded-none ${
                      activeCategory === 'all'
                        ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                        : 'bg-[#FFFDF9] text-[#3B2314] border border-[#D8CEC4] hover:border-[#3B2314]'
                    }`}
                  >
                    All Ensembles
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.slug)}
                      className={`px-3.5 py-2 text-xs font-serif uppercase tracking-widest whitespace-nowrap transition-colors rounded-none ${
                        activeCategory === c.slug
                          ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                          : 'bg-[#FFFDF9] text-[#3B2314] border border-[#D8CEC4] hover:border-[#3B2314]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#D8CEC4] px-3 py-2 text-xs font-serif uppercase tracking-wider text-[#3B2314] rounded-none">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#9E5A38]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none text-[#3B2314] focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Curator’s Choice</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Ensemble Title</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-20 space-y-3 bg-[#FFFDF9] border border-[#D8CEC4] mt-8 p-12">
                <p className="text-lg font-serif font-bold text-[#3B2314] uppercase tracking-wide">No Ensembles Found</p>
                <p className="text-xs text-[#3B2314]/70 font-light">
                  Try adjusting your search query or selecting a different collection.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-xs font-serif uppercase tracking-widest font-semibold text-[#FAF6F0] rounded-none transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {sortedProducts.map((product) => {
                  const isInCart = cart.some((i) => i.product.id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onViewProduct={(p) => setSelectedProduct(p)}
                      isAdded={isInCart}
                    />
                  );
                })}
              </div>
            )}
          </main>

          {/* Storefront Footer */}
          <Footer onOpenSqlViewer={() => setSqlModalOpen(true)} />
        </div>
      ) : (
        /* TAILADMIN ADMIN DASHBOARD VIEW (PROTECTED ROUTE) */
        <AdminProtectedRoute onBackToStore={() => setCurrentView('store')}>
          <div className="flex h-screen overflow-hidden bg-[#FAF6F0] text-[#3B2314]">
            {/* TailAdmin Sidebar */}
            <TailAdminSidebar
              currentTab={adminTab}
              onSelectTab={setAdminTab}
              onNavigateToStore={() => setCurrentView('store')}
              pendingOrdersCount={pendingOrdersCount}
              productsCount={products.length}
              currentUser={profile || currentUser}
              onSignOut={async () => {
                await signOut();
                addToast('info', 'Session Terminated', 'You have been signed out from the admin portal.');
                setCurrentView('store');
              }}
            />

            {/* Main TailAdmin Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* TailAdmin Top Bar */}
              <TailAdminHeader
                currentTab={adminTab}
                currentUser={profile || currentUser}
                onNavigateToStore={() => setCurrentView('store')}
                onSignOut={async () => {
                  await signOut();
                  addToast('info', 'Session Terminated', 'You have been signed out from the admin portal.');
                  setCurrentView('store');
                }}
              />

              {/* Admin Dynamic View Area */}
              <div className="flex-1 overflow-y-auto bg-[#FAF6F0]">
                {adminTab === 'overview' && (
                  <AnalyticsOverview
                    orders={orders}
                    products={products}
                    onViewOrders={() => setAdminTab('orders')}
                    onViewProducts={() => setAdminTab('products')}
                  />
                )}

                {adminTab === 'products' && (
                  <ProductManagement
                    products={products}
                    categories={categories}
                    dbStatus={dbStatus}
                    canDelete={canDeleteProducts}
                    userRole={profile?.role || currentUser.role}
                    onOpenCreateModal={() => {
                      setProductToEdit(null);
                      setProductFormOpen(true);
                    }}
                    onEditProduct={(p) => {
                      setProductToEdit(p);
                      setProductFormOpen(true);
                    }}
                    onDeleteProduct={handleDeleteProduct}
                    onToggleFeatured={handleToggleFeatured}
                    onUpdateStock={handleUpdateStock}
                    onPushToSupabase={handlePushToSupabase}
                    onSyncFromSupabase={handleSyncFromSupabase}
                    onOpenSqlViewer={() => setSqlModalOpen(true)}
                  />
                )}

                {adminTab === 'orders' && (
                  <OrderManagement
                    orders={orders}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  />
                )}

                {adminTab === 'team' && (
                  <TeamManagement
                    currentUserRole={profile?.role || currentUser.role}
                    currentUserId={profile?.id || currentUser.id}
                    onToast={addToast}
                  />
                )}

                {adminTab === 'sql' && <SqlViewerModal isEmbedded={true} />}

                {adminTab === 'code' && <NextJsCodeViewer isEmbedded={true} />}
              </div>
            </div>
          </div>
        </AdminProtectedRoute>
      )}

      {/* MODALS */}
      {/* Product Details Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        defaultAddress={currentUser.address}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={orderSuccess}
        onClose={() => setOrderSuccess(null)}
        onNavigateToAdmin={() => {
          setOrderSuccess(null);
          setCurrentView('admin');
          setAdminTab('orders');
        }}
        onNavigateToProfile={() => {
          setOrderSuccess(null);
          setProfileOpen(true);
        }}
      />

      {/* Profile & Order History Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
        orders={orders}
        onToggleRole={handleToggleRole}
        onNavigateToAdmin={() => {
          setProfileOpen(false);
          setCurrentView('admin');
        }}
      />

      {/* Product Form Modal (Admin Create / Edit) */}
      <ProductFormModal
        isOpen={productFormOpen}
        onClose={() => {
          setProductFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        categories={categories}
        onSave={handleSaveProduct}
      />

      {/* Standalone SQL Script Viewer */}
      <SqlViewerModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
        isEmbedded={false}
      />

      {/* Standalone Next.js Architecture Viewer */}
      <NextJsCodeViewer
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        isEmbedded={false}
      />
    </div>
  );
}
