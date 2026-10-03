import { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { CartItem } from '../../types/index.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState('');

  if (!isOpen) return null;

  const rawSubtotal = items.reduce((sum, item) => {
    const price = item.product.sale_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const subtotal = Math.max(0, rawSubtotal - discountAmount);

  // Delivery charges: Calculated directly from the products in the cart as configured by admin
  const deliveryCharge =
    items.length === 0
      ? 0
      : items.reduce((acc, item) => {
          const fee =
            item.product.delivery_charges !== undefined && item.product.delivery_charges !== null
              ? Number(item.product.delivery_charges)
              : 0;
          return acc + fee;
        }, 0);
  const isFreeDelivery = items.length > 0 && deliveryCharge === 0;
  const shippingCost = deliveryCharge;
  const total = subtotal + shippingCost;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'DASTAAN15' || promoCode.trim().toUpperCase() === 'WELCOME15') {
      setDiscountPercent(15);
      setPromoApplied('15% Artisanal Privilege Applied');
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try "DASTAAN15"');
    }
  };

  return (
    // Cream backdrop with subtle blur instead of standard dark-gray backdrops
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F0] border-l border-[#D8CEC4] text-[#3B2314] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[#D8CEC4] flex items-center justify-between bg-[#F4EFE6]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#9E5A38]" />
              <h2 className="text-base font-serif uppercase tracking-[0.18em] font-semibold text-[#3B2314]">
                Your Shopping Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#3B2314]/60 hover:text-[#3B2314] transition-colors"
              aria-label="Close Shopping Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Policy Notice */}
          <div className="p-3.5 bg-[#F2ECE2] border-b border-[#D8CEC4] text-xs">
            <div className="flex justify-between items-center font-serif tracking-wider text-[#3B2314]">
              <span className="font-medium">
                Atelier Delivery Charges:
              </span>
              <span className={`font-bold ${isFreeDelivery ? 'text-[#526A50]' : 'text-[#9E5A38]'}`}>
                {isFreeDelivery ? '✓ Complimentary ($0.00)' : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <p className="text-[11px] text-[#3B2314]/70 mt-0.5 font-light">
              {isFreeDelivery
                ? 'Complimentary delivery set for this item by atelier.'
                : 'Custom shipping fee configured for current pieces in bag.'}
            </p>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#D8CEC4]">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-[#D8CEC4] mx-auto stroke-1" />
                <p className="font-serif text-base text-[#3B2314]">Your bag is currently empty</p>
                <p className="text-xs text-[#3B2314]/60 max-w-xs mx-auto font-light">
                  Discover our silk pret wear, artisanal formals, and luxury couture ensembles.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-widest transition-colors rounded-none"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = item.product.sale_price || item.product.price;
                return (
                  <div key={item.product.id} className="py-4 flex gap-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-20 h-24 object-cover object-top border border-[#D8CEC4] bg-[#F4EFE6] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-serif uppercase tracking-wider font-semibold text-[#3B2314] line-clamp-1">
                            {item.product.title}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-[#3B2314]/40 hover:text-[#8F423B] transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <p className="text-xs font-serif font-bold text-[#3B2314]">
                            ${itemPrice.toFixed(2)}
                          </p>
                          <span className="text-[10px] font-serif text-[#3B2314]/70">
                            Delivery:{' '}
                            {item.product.delivery_charges === 0 ? (
                              <span className="text-[#526A50] font-semibold">Free ($0)</span>
                            ) : (
                              <span className="text-[#9E5A38] font-semibold font-mono">
                                +${(item.product.delivery_charges !== undefined ? item.product.delivery_charges : 0).toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-[#D8CEC4] bg-[#FFFDF9]">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-[#F4EFE6] text-[#3B2314] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-serif font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-[#F4EFE6] text-[#3B2314] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-serif font-semibold text-[#3B2314]">
                          ${(itemPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#D8CEC4] bg-[#F4EFE6] space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                  <input
                    type="text"
                    placeholder="Privilege Code (DASTAAN15)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#D8CEC4] pl-9 pr-3 py-1.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 uppercase focus:outline-none focus:border-[#9E5A38] rounded-none font-serif tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 border border-[#3B2314] text-[#3B2314] hover:bg-[#3B2314]/5 text-xs font-serif uppercase tracking-wider transition-colors rounded-none"
                >
                  Apply
                </button>
              </form>

              {promoApplied && (
                <div className="text-[11px] text-[#526A50] font-serif tracking-wider font-semibold">
                  ✓ {promoApplied}
                </div>
              )}
              {promoError && (
                <div className="text-[11px] text-[#8F423B] font-serif tracking-wider">
                  {promoError}
                </div>
              )}

              {/* Cost Summary */}
              <div className="space-y-1.5 text-xs font-serif">
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Subtotal</span>
                  <span>${rawSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#526A50]">
                    <span>Atelier Privilege (-{discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Delivery Charges</span>
                  <span className={isFreeDelivery ? 'text-[#526A50] font-semibold' : ''}>
                    {isFreeDelivery ? 'Complimentary ($0.00)' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-[#3B2314] pt-2 border-t border-[#D8CEC4]">
                  <span>Total Amount</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Primary Checkout CTA (INTERACTIVE ACCENT Bronze/Terracotta with Cream text) */}
              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-3.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors rounded-none shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#3B2314]/60 font-serif tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#526A50]" />
                <span>Encrypted Checkout with Stripe &amp; COD Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
