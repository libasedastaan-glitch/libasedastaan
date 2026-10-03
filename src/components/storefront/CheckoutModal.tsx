import { useState } from 'react';
import { X, CreditCard, Banknote, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CartItem, ShippingAddress, Order } from '../../types/index.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  defaultAddress?: ShippingAddress;
  onOrderPlaced: (order: Order, method: 'stripe' | 'cod') => void;
}

export const CheckoutModal = ({
  isOpen,
  onClose,
  items,
  defaultAddress,
  onOrderPlaced,
}: CheckoutModalProps) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Shipping Form State
  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: defaultAddress?.fullName || 'Fatima Zahra',
    email: defaultAddress?.email || 'fatima.zahra@example.com',
    phone: defaultAddress?.phone || '+92 300 1234567',
    street: defaultAddress?.street || 'House 14, Street 8, F-7/2',
    city: defaultAddress?.city || 'Islamabad',
    state: defaultAddress?.state || 'Federal',
    postalCode: defaultAddress?.postalCode || '44000',
    country: defaultAddress?.country || 'Pakistan',
  });

  // Stripe card simulation input states
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.sale_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Delivery charges: Dynamically calculated based on the items in the order
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.fullName || !shipping.email || !shipping.street || !shipping.city || !shipping.phone) {
      setErrorMessage('Please fill in all mandatory contact and shipping fields.');
      return;
    }
    setErrorMessage('');
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const orderId = `ord-${Date.now().toString().slice(-6)}`;
      const order: Order = {
        id: orderId,
        user_id: 'usr-guest-01',
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'stripe' ? 'paid' : 'unpaid',
        total_amount: total,
        shipping_address: shipping,
        created_at: new Date().toISOString(),
        stripe_session_id: paymentMethod === 'stripe' ? `cs_live_${Date.now()}` : undefined,
        items: items.map((item) => ({
          id: `item-${Math.random().toString(36).substring(2, 7)}`,
          order_id: orderId,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.sale_price || item.product.price,
          product: item.product,
        })),
      };

      onOrderPlaced(order, paymentMethod);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl text-[#3B2314] overflow-hidden my-8 rounded-none">
        {/* Top Header */}
        <div className="p-6 border-b border-[#D8CEC4] flex items-center justify-between bg-[#F4EFE6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-serif uppercase tracking-[0.25em] font-bold text-[#9E5A38]">
                Libas e Dastaan Atelier
              </span>
              <span className="text-[#D8CEC4]">•</span>
              <span className="text-xs font-serif uppercase tracking-wider text-[#3B2314]/70">
                {step === 'shipping' ? 'Step 1 of 2: Dispatch Coordinates' : 'Step 2 of 2: Payment Settlement'}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#3B2314] tracking-wider uppercase mt-1">
              {step === 'shipping' ? 'Client & Shipping Information' : 'Select Settlement Method'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#3B2314]/60 hover:text-[#3B2314] border border-[#D8CEC4] bg-[#FAF6F0] transition-colors rounded-none"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="w-full bg-[#E5DDD1] h-1">
          <div
            className="bg-[#9E5A38] h-full transition-all duration-300"
            style={{ width: step === 'shipping' ? '50%' : '100%' }}
          />
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-[#FAF0EF] border border-[#E8C2BF] text-xs text-[#8F423B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'shipping' ? (
            <form id="shipping-form" onSubmit={handleNextStep} className="space-y-4 text-xs font-serif">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                  Street Address &amp; House/Apt *
                </label>
                <input
                  type="text"
                  required
                  value={shipping.street}
                  onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                  className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                  Contact Phone (Courier Verification) *
                </label>
                <input
                  type="tel"
                  required
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2 text-xs text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Option 1: Stripe Card */}
                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 border cursor-pointer transition-all rounded-none ${
                    paymentMethod === 'stripe'
                      ? 'border-[#9E5A38] bg-[#F2ECE2] ring-1 ring-[#9E5A38]'
                      : 'border-[#D8CEC4] bg-[#FFFDF9] hover:bg-[#F8F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#3B2314] flex items-center justify-center text-[#FAF6F0] shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#3B2314] uppercase tracking-wider">
                          Stripe Encrypted Card
                        </h4>
                        <p className="text-xs text-[#3B2314]/70 font-light mt-0.5">
                          Visa, Mastercard, Amex with TLS 1.3 encryption
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'stripe' ? 'border-[#9E5A38] bg-[#9E5A38]' : 'border-[#D8CEC4]'
                    }`}>
                      {paymentMethod === 'stripe' && <CheckCircle2 className="w-3.5 h-3.5 text-[#FAF6F0]" />}
                    </div>
                  </div>

                  {paymentMethod === 'stripe' && (
                    <div className="mt-4 pt-3 border-t border-[#D8CEC4] space-y-2">
                      <div className="grid grid-cols-5 gap-2">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="col-span-3 bg-[#FAF6F0] border border-[#D8CEC4] px-2.5 py-1.5 text-xs text-[#3B2314] font-mono rounded-none"
                        />
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="bg-[#FAF6F0] border border-[#D8CEC4] px-2.5 py-1.5 text-xs text-[#3B2314] font-mono rounded-none"
                        />
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="bg-[#FAF6F0] border border-[#D8CEC4] px-2.5 py-1.5 text-xs text-[#3B2314] font-mono rounded-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 border cursor-pointer transition-all rounded-none ${
                    paymentMethod === 'cod'
                      ? 'border-[#9E5A38] bg-[#F2ECE2] ring-1 ring-[#9E5A38]'
                      : 'border-[#D8CEC4] bg-[#FFFDF9] hover:bg-[#F8F4EE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#9E5A38] flex items-center justify-center text-[#FAF6F0] shrink-0">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#3B2314] uppercase tracking-wider">
                          Cash on Delivery (COD)
                        </h4>
                        <p className="text-xs text-[#3B2314]/70 font-light mt-0.5">
                          Pay in cash upon doorstep delivery inspection.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-[#9E5A38] bg-[#9E5A38]' : 'border-[#D8CEC4]'
                    }`}>
                      {paymentMethod === 'cod' && <CheckCircle2 className="w-3.5 h-3.5 text-[#FAF6F0]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Brief Summary */}
              <div className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] space-y-1.5 text-xs font-serif">
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Shipping Address:</span>
                  <span className="font-semibold text-[#3B2314]">
                    {shipping.fullName} • {shipping.city}, {shipping.country}
                  </span>
                </div>
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Order Items:</span>
                  <span className="font-semibold text-[#3B2314]">{items.length} ensembles</span>
                </div>
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#3B2314]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#3B2314]/75">
                  <span>Delivery Charges:</span>
                  <span className={`font-semibold ${isFreeDelivery ? 'text-[#526A50]' : 'text-[#3B2314]'}`}>
                    {isFreeDelivery ? 'Complimentary ($0.00)' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-[#3B2314] pt-2 border-t border-[#D8CEC4]">
                  <span>Total Due:</span>
                  <span className="text-[#9E5A38]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-6 border-t border-[#D8CEC4] bg-[#F4EFE6] flex items-center justify-between">
          {step === 'shipping' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-serif uppercase tracking-wider text-[#3B2314]/70 hover:text-[#3B2314]"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep('shipping')}
              className="px-4 py-2.5 text-xs font-serif uppercase tracking-wider text-[#3B2314]/70 hover:text-[#3B2314]"
            >
              Back to Coordinates
            </button>
          )}

          {step === 'shipping' ? (
            <button
              type="submit"
              form="shipping-form"
              className="px-6 py-3 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center gap-2 transition-colors rounded-none shadow-sm"
            >
              <span>Continue to Settlement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="px-7 py-3 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center gap-2 transition-colors rounded-none shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : paymentMethod === 'stripe' ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize ${total.toFixed(2)} with Stripe</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>Confirm COD Order (${total.toFixed(2)})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
