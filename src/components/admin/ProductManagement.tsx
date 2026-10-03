import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Check, Star, Database, RefreshCw, UploadCloud } from 'lucide-react';
import { Product, Category } from '../../types/index.ts';
import { DbStatusInfo } from '../../services/storeService.ts';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  dbStatus: DbStatusInfo;
  onOpenCreateModal: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleFeatured: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onPushToSupabase: () => void;
  onSyncFromSupabase: () => void;
  onOpenSqlViewer?: () => void;
  canDelete?: boolean;
  userRole?: string;
}

export const ProductManagement = ({
  products,
  categories,
  dbStatus,
  onOpenCreateModal,
  onEditProduct,
  onDeleteProduct,
  onToggleFeatured,
  onUpdateStock,
  onPushToSupabase,
  onSyncFromSupabase,
  canDelete = true,
  userRole = 'admin',
}: ProductManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPushing, setIsPushing] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (catId?: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Uncategorized';
  };

  const handlePushClick = async () => {
    setIsPushing(true);
    await onPushToSupabase();
    setIsPushing(false);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto bg-[#FAF6F0] text-[#3B2314]">
      {/* Live Central Database Connection Banner */}
      <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shrink-0 mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif font-bold text-[#3B2314] text-sm uppercase tracking-wide">
                Atelier Central Catalog Database
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#EDF3EC] text-[#526A50] border border-[#C3D5C0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#526A50]" />
                Cloud Database Active
              </span>
            </div>
            <p className="text-xs text-[#3B2314]/70 mt-1 font-light">
              Connected to cloud database (Realtime synchronization enabled)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={onSyncFromSupabase}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#F4EFE6] text-[#3B2314] text-xs font-serif uppercase tracking-wider border border-[#D8CEC4] hover:border-[#3B2314] transition-colors rounded-none"
            title="Fetch latest rows from cloud database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#9E5A38]" />
            <span>Sync Database</span>
          </button>

          <button
            onClick={handlePushClick}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] text-xs font-serif uppercase tracking-wider font-semibold transition-colors rounded-none disabled:opacity-50"
            title="Publish catalog items to cloud database"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isPushing ? 'Publishing...' : 'Publish to Database'}</span>
          </button>
        </div>
      </div>

      {/* Manager Role Notice if Applicable */}
      {userRole === 'manager' && (
        <div className="p-3.5 bg-[#FFFDF9] border border-[#D8CEC4] text-[#3B2314] text-xs flex items-center justify-between gap-3 rounded-none">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 bg-[#9E5A38] text-[#FAF6F0]">
              Catalog Manager Mode
            </span>
            <span className="text-xs text-[#3B2314]/80 font-light">
              You have permissions to add and edit products. Product deletion is restricted to Administrators.
            </span>
          </div>
        </div>
      )}

      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#3B2314] tracking-wider uppercase">
            Atelier Products Inventory
          </h2>
          <p className="text-xs text-[#3B2314]/70 mt-0.5 font-light">
            Manage your haute couture catalog, prices, live inventory stock, and featured showcase pieces.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold transition-colors shrink-0 rounded-none shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
          <input
            type="text"
            placeholder="Search by title, style code, or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FFFDF9] border border-[#D8CEC4] pl-9 pr-4 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#FFFDF9] border border-[#D8CEC4] px-4 py-2.5 text-xs font-serif uppercase tracking-wider text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none cursor-pointer"
        >
          <option value="all">All Collections ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="border border-[#D8CEC4] bg-[#FFFDF9] shadow-luxury overflow-hidden rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4EFE6] border-b border-[#D8CEC4] text-[#3B2314] font-serif uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Ensemble</th>
                <th className="py-3.5 px-4">Collection</th>
                <th className="py-3.5 px-4">Base Price</th>
                <th className="py-3.5 px-4">Sale Price</th>
                <th className="py-3.5 px-4">Delivery Fee</th>
                <th className="py-3.5 px-4">Live Stock</th>
                <th className="py-3.5 px-4 text-center">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D8CEC4]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#3B2314]/60 font-serif">
                    No products matched your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-[#F2ECE2] transition-colors">
                      {/* Product Media & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                            alt={p.title}
                            className="w-10 h-12 object-cover object-top border border-[#D8CEC4] bg-[#F4EFE6] shrink-0"
                          />
                          <div>
                            <span className="font-serif font-semibold text-[#3B2314] block line-clamp-1">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-[#3B2314]/50 font-mono">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-[#3B2314]/80 font-serif">
                        {getCategoryName(p.category_id)}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-serif font-bold text-[#3B2314]">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 font-serif">
                        {p.sale_price ? (
                          <span className="font-bold text-[#8F423B]">
                            ${p.sale_price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#3B2314]/40 font-mono">—</span>
                        )}
                      </td>

                      {/* Delivery Fee */}
                      <td className="py-3.5 px-4 font-serif">
                        {p.delivery_charges === 0 ? (
                          <span className="text-[#526A50] font-semibold text-[11px]">Free ($0)</span>
                        ) : (
                          <span className="text-[#3B2314] font-medium text-xs">
                            ${(p.delivery_charges ?? 15).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Live Stock Counter */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={p.stock}
                            onChange={(e) => onUpdateStock(p.id, parseInt(e.target.value) || 0)}
                            className="w-16 bg-[#FAF6F0] border border-[#D8CEC4] px-2 py-1 text-center font-mono text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none"
                          />
                          {isOutOfStock ? (
                            <span className="text-[10px] font-serif uppercase tracking-wider text-[#8F423B] font-semibold">
                              Out
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-serif uppercase tracking-wider text-[#9E5A38] font-semibold">
                              Low
                            </span>
                          ) : (
                            <span className="text-[10px] font-serif uppercase tracking-wider text-[#526A50]">
                              Ready
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Featured Star */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleFeatured(p.id)}
                          className={`p-1.5 transition-colors ${
                            p.is_featured ? 'text-[#9E5A38]' : 'text-[#3B2314]/30 hover:text-[#3B2314]'
                          }`}
                          title="Toggle Featured"
                        >
                          <Star className={`w-4 h-4 ${p.is_featured ? 'fill-[#9E5A38]' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-[#3B2314]/70 hover:text-[#3B2314] hover:bg-[#FAF6F0] transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {canDelete ? (
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 text-[#3B2314]/50 hover:text-[#8F423B] hover:bg-[#FAF0EF] transition-colors"
                              title="Delete Product (Administrator privilege)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-[#3B2314]/20 cursor-not-allowed opacity-40"
                              title="Delete Restricted: Managers cannot delete products (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
