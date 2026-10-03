import { useState } from 'react';
import { X, Package, User, MapPin, Phone, Mail, Clock, CreditCard, Banknote } from 'lucide-react';
import { UserProfile, Order } from '../../types/index.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  orders: Order[];
  onToggleRole?: () => void;
  onNavigateToAdmin: () => void;
}

export const ProfileModal = ({
  isOpen,
  onClose,
  currentUser,
  orders,
  onNavigateToAdmin,
}: ProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl text-[#3B2314] overflow-hidden my-8 rounded-none">
        {/* Header */}
        <div className="p-6 border-b border-[#D8CEC4] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3B2314] text-[#FAF6F0] flex items-center justify-center font-serif font-bold text-lg">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-[#3B2314] uppercase tracking-wider">
                  {currentUser.full_name}
                </h3>
                <span className="text-[10px] uppercase font-serif tracking-widest px-2 py-0.5 bg-[#FFFDF9] border border-[#D8CEC4] text-[#3B2314]">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-[#3B2314]/70 font-mono mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#3B2314]/60 hover:text-[#3B2314] border border-[#D8CEC4] bg-[#FAF6F0] transition-colors rounded-none"
            aria-label="Close client dossier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D8CEC4] bg-[#F2ECE2] text-xs font-serif uppercase tracking-widest font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-[#9E5A38] text-[#9E5A38] bg-[#FAF6F0]'
                : 'border-transparent text-[#3B2314]/60 hover:text-[#3B2314]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Atelier Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3.5 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-[#9E5A38] text-[#9E5A38] bg-[#FAF6F0]'
                : 'border-transparent text-[#3B2314]/60 hover:text-[#3B2314]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Client Dossier &amp; Address</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 space-y-3 font-serif">
                  <Package className="w-10 h-10 text-[#D8CEC4] mx-auto stroke-1" />
                  <p className="text-base text-[#3B2314]">No order records found</p>
                  <p className="text-xs text-[#3B2314]/60 max-w-sm mx-auto font-light">
                    Your bespoke couture and pret ensembles will be tracked here upon checkout.
                  </p>
                </div>
              ) : (
                orders.map((order) => {
                  const isCod = order.payment_method === 'cod';
                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] space-y-3 rounded-none font-serif"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D8CEC4] gap-2">
                        <div>
                          <span className="font-mono font-bold text-[#3B2314] text-xs">
                            #{order.id}
                          </span>
                          <span className="text-[11px] text-[#3B2314]/60 block font-light">
                            Booked on{' '}
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#FAF6F0] border border-[#D8CEC4] text-[#3B2314] font-semibold">
                            {order.status}
                          </span>
                          <span className="font-bold text-sm text-[#9E5A38]">
                            ${Number(order.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {(order.items || []).map((i, idx) => (
                          <div key={idx} className="flex justify-between text-[#3B2314]/80">
                            <span>
                              {i.quantity} × {i.product?.title || 'Luxury Garment'}
                            </span>
                            <span className="font-mono">${((i.unit_price || 0) * i.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-[#3B2314]/70 border-t border-[#D8CEC4]/60">
                        <span className="flex items-center gap-1.5">
                          {isCod ? <Banknote className="w-3.5 h-3.5 text-[#9E5A38]" /> : <CreditCard className="w-3.5 h-3.5 text-[#526A50]" />}
                          {isCod ? 'Cash on Delivery' : 'Stripe Verified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#9E5A38]" /> Estimated 3-5 days
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-6 font-serif">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#3B2314] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#9E5A38]" />
                    <span>Personal Profile</span>
                  </h4>
                  <div className="text-xs text-[#3B2314]/80 space-y-1 font-light">
                    <p>Name: <strong className="font-normal text-[#3B2314]">{currentUser.full_name}</strong></p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#3B2314]/50" /> {currentUser.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#3B2314]/50" /> {currentUser.phone || '+92 300 1234567'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#3B2314] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9E5A38]" />
                    <span>Saved Delivery Address</span>
                  </h4>
                  <div className="text-xs text-[#3B2314]/80 space-y-1 font-light">
                    <p>{currentUser.address?.street || 'House 14, Street 8, F-7/2'}</p>
                    <p>
                      {currentUser.address?.city || 'Islamabad'}, {currentUser.address?.state || 'Federal'} {currentUser.address?.postalCode || '44000'}
                    </p>
                    <p className="font-semibold text-[#3B2314]">{currentUser.address?.country || 'Pakistan'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#D8CEC4] bg-[#F4EFE6] flex items-center justify-between">
          <button
            onClick={onNavigateToAdmin}
            className="px-4 py-2 bg-[#FFFDF9] border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] text-xs font-serif uppercase tracking-widest transition-colors rounded-none"
          >
            Staff Dashboard
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] text-xs font-serif uppercase tracking-[0.2em] font-semibold transition-colors rounded-none shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
