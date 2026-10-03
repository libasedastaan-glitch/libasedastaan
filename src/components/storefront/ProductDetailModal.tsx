import { useState } from 'react';
import { X, Check, ShoppingBag, Shield, Truck, RotateCcw, Minus, Plus, Award } from 'lucide-react';
import { Product } from '../../types/index.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailModal = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductDetailModalProps) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isSale = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;
  const activePrice = isSale ? product.sale_price! : product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuy = () => {
    onBuyNow(product, quantity);
  };

  return (
    // Cream & Sepia overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl text-[#3B2314] flex flex-col md:flex-row rounded-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#3B2314]/60 hover:text-[#3B2314] bg-[#F4EFE6] border border-[#D8CEC4] transition-colors rounded-none"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Gallery view */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col gap-4 bg-[#F4EFE6] border-r border-[#D8CEC4]">
          <div className="aspect-[4/5] w-full overflow-hidden bg-[#FAF6F0] border border-[#D8CEC4]">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 border shrink-0 overflow-hidden transition-all rounded-none ${
                    activeImageIndex === idx
                      ? 'border-[#9E5A38] ring-1 ring-[#9E5A38]'
                      : 'border-[#D8CEC4] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase Options */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-serif uppercase tracking-[0.25em] text-[#9E5A38] font-semibold">
                Haute Couture Edition
              </span>
              <span className="text-[#D8CEC4]">•</span>
              <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-[#3B2314]/60">
                Pure Artisanal Craft
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif text-[#3B2314] tracking-tight leading-tight font-medium">
              {product.title}
            </h2>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pb-3 border-b border-[#D8CEC4]">
              <span className="text-2xl font-serif font-bold text-[#3B2314]">
                ${activePrice.toFixed(2)}
              </span>
              {isSale && (
                <span className="text-base text-[#3B2314]/50 line-through font-serif">
                  ${product.price.toFixed(2)}
                </span>
              )}
              {isSale && (
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#8F423B] font-semibold px-2 py-0.5 bg-[#FAF0EF] border border-[#E8C2BF]">
                  Save ${(product.price - activePrice).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#3B2314]/80 leading-relaxed font-light">
              {product.description}
            </p>

            {/* Inventory Status Note */}
            <div className="pt-2 space-y-1.5">
              {isOutOfStock ? (
                <span className="text-xs font-serif uppercase tracking-wider text-[#8F423B] font-semibold">
                  Currently Sold Out — Contact Atelier for Bespoke Pre-Order
                </span>
              ) : (
                <div className="flex items-center gap-2 text-xs font-serif text-[#526A50]">
                  <span className="w-2 h-2 rounded-full bg-[#526A50]" />
                  <span>In Stock &amp; Ready for Express Dispatch ({product.stock} pieces crafted)</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-serif text-[#3B2314]/80">
                <Truck className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>
                  Delivery Charges:{' '}
                  <strong className="text-[#3B2314]">
                    {product.delivery_charges === 0
                      ? 'Complimentary Delivery ($0.00)'
                      : `$${(product.delivery_charges ?? 15).toFixed(2)}`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="pt-2">
                <label className="block text-[11px] font-serif uppercase tracking-wider text-[#3B2314]/70 mb-1.5">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-[#D8CEC4] bg-[#FFFDF9]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-[#3B2314] hover:bg-[#F4EFE6] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-serif text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1.5 text-[#3B2314] hover:bg-[#F4EFE6] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-[#D8CEC4]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-4 font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors rounded-none ${
                  isOutOfStock
                    ? 'bg-[#EAE2D6] text-[#3B2314]/40 cursor-not-allowed border border-[#D8CEC4]'
                    : added
                    ? 'bg-[#526A50] text-[#FAF6F0]'
                    : 'bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Shopping Bag</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuy}
                disabled={isOutOfStock}
                className="w-full py-3.5 px-4 bg-transparent border border-[#3B2314] hover:bg-[#3B2314]/5 text-[#3B2314] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors rounded-none disabled:opacity-40"
              >
                <span>Instant Checkout</span>
              </button>
            </div>

            {/* Reassurance notes */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-[#3B2314]/70 font-light">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Complimentary Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Bespoke Fit Guaranteed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Certified Pure Silk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Stripe &amp; COD Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
