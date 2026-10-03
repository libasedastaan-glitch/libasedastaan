import { useEffect } from 'react';
import { CheckCircle, Truck, Package, ArrowRight, ExternalLink, Calendar, CreditCard, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../../types/index.ts';
import { BrandLogo } from '../ui/BrandLogo.tsx';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToProfile: () => void;
}

export const OrderSuccessModal = ({
  order,
  onClose,
  onNavigateToAdmin,
  onNavigateToProfile,
}: OrderSuccessModalProps) => {
  useEffect(() => {
    if (order) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3B2314', '#9E5A38', '#526A50', '#D8CEC4'],
        });
      } catch (e) {
        // graceful fallback
      }
    }
  }, [order]);

  if (!order) return null;

  const isCod = order.payment_method === 'cod';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl text-[#3B2314] overflow-hidden my-8 rounded-none">
        {/* Top Celebration Header */}
        <div className="p-8 text-center bg-[#F4EFE6] border-b border-[#D8CEC4]">
          <div className="w-14 h-14 bg-[#EDF3EC] border border-[#C3D5C0] flex items-center justify-center text-[#526A50] mx-auto shadow-sm mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF6F0] border border-[#D8CEC4] text-xs font-mono text-[#3B2314] mb-3">
            Order Ref #{order.id}
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3B2314] tracking-wider uppercase">
            Ensemble Order Confirmed
          </h2>

          <div
            className="text-sm font-serif text-[#3B2314]/80 mt-1"
            style={{ fontFamily: "'Noto Nastaliq Urdu', 'Amiri', serif" }}
          >
            آپ کا آرڈر موصول ہو چکا ہے، شکریہ
          </div>

          <p className="text-xs text-[#3B2314]/70 mt-2 max-w-md mx-auto font-light">
            {isCod ? (
              <span>
                Your <strong>Cash on Delivery</strong> booking has entered the master tailoring queue. Please keep exact cash ready upon delivery handover.
              </span>
            ) : (
              <span>
                Your payment via <strong>Stripe Checkout</strong> was verified. Electronic dispatch notes have been issued to <strong>{order.shipping_address.email}</strong>.
              </span>
            )}
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-5 text-xs font-serif">
          {/* Status highlight banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#FFFDF9] border border-[#D8CEC4]">
            <div>
              <span className="text-[#3B2314]/60 block uppercase tracking-wider text-[10px]">Settlement</span>
              <span className="font-semibold text-[#3B2314] flex items-center gap-1.5 mt-0.5">
                {isCod ? <Banknote className="w-3.5 h-3.5 text-[#9E5A38]" /> : <CreditCard className="w-3.5 h-3.5 text-[#526A50]" />}
                {isCod ? 'Cash on Delivery' : 'Stripe Card'}
              </span>
            </div>

            <div>
              <span className="text-[#3B2314]/60 block uppercase tracking-wider text-[10px]">Payment Status</span>
              <span className={`inline-flex items-center gap-1 font-bold mt-0.5 uppercase tracking-wider text-[11px] ${
                order.payment_status === 'paid' ? 'text-[#526A50]' : 'text-[#9E5A38]'
              }`}>
                ● {order.payment_status}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[#3B2314]/60 block uppercase tracking-wider text-[10px]">Atelier Delivery</span>
              <span className="font-semibold text-[#3B2314] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#9E5A38]" /> 3–5 Business Days
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] flex items-start gap-3">
            <Truck className="w-4 h-4 text-[#9E5A38] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#3B2314] uppercase tracking-wider text-[11px]">
                Courier Coordinates
              </h4>
              <p className="text-[#3B2314]/80 mt-0.5 font-sans font-light">
                {order.shipping_address.fullName} ({order.shipping_address.phone})<br />
                {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}, {order.shipping_address.country}
              </p>
            </div>
          </div>

          {/* Ordered items breakdown */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[#3B2314] mb-2.5 flex items-center gap-1.5 text-xs">
              <Package className="w-4 h-4 text-[#9E5A38]" />
              <span>Tailored Ensembles ({order.items?.length || 0})</span>
            </h4>
            <div className="divide-y divide-[#D8CEC4] border border-[#D8CEC4] bg-[#FFFDF9]">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#3B2314] block">
                      {item.product?.title || 'Luxury Garment'}
                    </span>
                    <span className="text-[10px] text-[#3B2314]/60 font-mono">
                      Qty: {item.quantity} × ${(item.unit_price || 0).toFixed(2)}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-[#3B2314]">
                    ${((item.unit_price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-baseline font-bold text-base border-t border-[#D8CEC4]">
            <span className="uppercase tracking-wider">Grand Total Settled:</span>
            <span className="text-[#9E5A38]">${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 border-t border-[#D8CEC4] bg-[#F4EFE6] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onNavigateToProfile();
            }}
            className="w-full sm:w-auto px-4 py-2.5 border border-[#3B2314] text-[#3B2314] hover:bg-[#3B2314]/5 text-xs font-serif uppercase tracking-wider transition-colors rounded-none"
          >
            Inspect in Client Dossier
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold transition-colors rounded-none shadow-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
