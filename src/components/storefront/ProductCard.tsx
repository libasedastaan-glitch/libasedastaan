import { Plus, Check, Eye } from 'lucide-react';
import { Product } from '../../types/index.ts';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  isAdded?: boolean;
}

export const ProductCard = ({ product, onAddToCart, onViewProduct, isAdded }: ProductCardProps) => {
  const isSale = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;
  const activePrice = isSale ? product.sale_price! : product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group relative flex flex-col bg-[#FAF6F0] hover:bg-[#F2ECE2] border border-[#D8CEC4] transition-all duration-300 rounded-none shadow-luxury hover:shadow-luxury-hover">
      {/* Image container */}
      <div
        onClick={() => onViewProduct(product)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4EFE6] cursor-pointer"
      >
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'}
          alt={product.title}
          className="h-full w-full object-cover object-top filter brightness-[0.98] group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Status Indicators (Understated, Artisanal, Zero Garish Pills) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {isSale && (
            <span className="px-2 py-0.5 text-[10px] font-serif uppercase tracking-[0.18em] bg-[#8F423B] text-[#FAF6F0] shadow-sm">
              Seasonal Archive
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-0.5 text-[10px] font-serif uppercase tracking-[0.18em] bg-[#3B2314] text-[#FAF6F0] shadow-sm">
              Curator’s Choice
            </span>
          )}
        </div>

        {/* Stock note (clean, unboxed text) */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider bg-[#FAF6F0]/90 text-[#8F423B] border border-[#D8CEC4]">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider bg-[#FAF6F0]/90 text-[#9E5A38] border border-[#D8CEC4]">
              {product.stock} Left
            </span>
          ) : null}
        </div>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-0 bg-[#3B2314]/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-[#FAF6F0] text-[#3B2314] px-4 py-2 text-xs font-serif uppercase tracking-[0.2em] flex items-center gap-2 border border-[#D8CEC4] shadow-sm">
            <Eye className="w-3.5 h-3.5 text-[#9E5A38]" /> View Details
          </span>
        </div>
      </div>

      {/* Product Content (All in ACCENT Sepia #3B2314) */}
      <div className="flex flex-1 flex-col p-5 justify-between space-y-4">
        <div>
          {/* Subtle Category or Brand Kicker */}
          <div className="text-[10px] font-serif uppercase tracking-[0.25em] text-[#3B2314]/60 mb-1">
            Libas e Dastaan
          </div>

          <h3
            onClick={() => onViewProduct(product)}
            className="text-base font-serif text-[#3B2314] hover:text-[#9E5A38] cursor-pointer line-clamp-1 transition-colors tracking-wide leading-snug font-medium"
            title={product.title}
          >
            {product.title}
          </h3>

          <p className="mt-1.5 text-xs text-[#3B2314]/70 line-clamp-2 leading-relaxed font-sans font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-[#D8CEC4] flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-serif font-bold text-[#3B2314] tracking-tight">
                ${activePrice.toFixed(2)}
              </span>
              {isSale && (
                <span className="text-xs text-[#3B2314]/50 line-through font-serif">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#3B2314]/60 font-light">
              {product.delivery_charges === 0
                ? 'Free delivery'
                : `+$${(product.delivery_charges ?? 15).toFixed(0)} delivery`}
            </span>
          </div>

          {/* Primary CTA (INTERACTIVE ACCENT Bronze/Terracotta with Cream text) */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`px-3.5 py-2 text-xs font-serif uppercase tracking-widest flex items-center gap-1.5 transition-colors rounded-none ${
              isOutOfStock
                ? 'bg-[#EAE2D6] text-[#3B2314]/40 cursor-not-allowed border border-[#D8CEC4]'
                : isAdded
                ? 'bg-[#526A50] text-[#FAF6F0]'
                : 'bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0]'
            }`}
            title={isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Bagged</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
