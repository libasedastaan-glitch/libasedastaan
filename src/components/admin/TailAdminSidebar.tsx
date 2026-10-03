import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ArrowLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { BrandLogo } from '../ui/BrandLogo.tsx';

interface TailAdminSidebarProps {
  currentTab: 'overview' | 'products' | 'orders' | 'team' | 'sql' | 'code';
  onSelectTab: (tab: 'overview' | 'products' | 'orders' | 'team' | 'sql' | 'code') => void;
  onNavigateToStore: () => void;
  pendingOrdersCount: number;
  productsCount: number;
  currentUser?: UserProfile;
  onSignOut?: () => void;
}

export const TailAdminSidebar = ({
  currentTab,
  onSelectTab,
  onNavigateToStore,
  pendingOrdersCount,
  productsCount,
  currentUser,
  onSignOut,
}: TailAdminSidebarProps) => {
  return (
    // NEUTRAL (Taupe) sidebar background with ACCENT (Sepia) text
    <aside className="w-64 bg-[#EFE8DE] border-r border-[#D8CEC4] text-[#3B2314] flex flex-col shrink-0 select-none">
      {/* Brand & Luxury Header using attached Logo */}
      <div className="h-20 px-5 border-b border-[#D8CEC4] flex items-center justify-between bg-[#FAF6F0]">
        <BrandLogo variant="horizontal" size="xs" color="#3B2314" showTagline={false} showUrdu={true} />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-serif font-bold uppercase tracking-[0.2em] text-[#3B2314]/60">
            Store Administration
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-serif tracking-wider uppercase transition-colors rounded-none ${
                currentTab === 'overview'
                  ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                  : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#E4DBD0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-serif tracking-wider uppercase transition-colors rounded-none ${
                currentTab === 'products'
                  ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                  : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#E4DBD0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Products &amp; Stock</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF6F0] text-[#3B2314] border border-[#D8CEC4]">
                {productsCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-serif tracking-wider uppercase transition-colors rounded-none ${
                currentTab === 'orders'
                  ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                  : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#E4DBD0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders &amp; COD</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 bg-[#9E5A38] text-[#FAF6F0]">
                  {pendingOrdersCount} new
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('team')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-serif tracking-wider uppercase transition-colors rounded-none ${
                currentTab === 'team'
                  ? 'bg-[#9E5A38] text-[#FAF6F0] font-semibold shadow-sm'
                  : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#E4DBD0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Team &amp; Roles</span>
              </div>
              <span className="text-[10px] text-[#526A50] font-mono font-semibold">Realtime</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-[#D8CEC4] space-y-2.5 bg-[#FAF6F0]">
        {currentUser && (
          <div className="p-3 bg-[#FFFDF9] border border-[#D8CEC4] text-xs text-[#3B2314]">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-serif font-bold uppercase tracking-widest flex items-center gap-1 ${
                currentUser.role === 'manager' ? 'text-[#9E5A38]' : 'text-[#3B2314]'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-[#526A50]" />
                {currentUser.role === 'manager' ? 'Catalog Manager' : 'Administrator'}
              </span>
            </div>
            <div className="font-mono text-[#3B2314]/80 text-[11px] truncate">
              {currentUser.email || 'libasedastaan@gmail.com'}
            </div>
          </div>
        )}

        <button
          onClick={onNavigateToStore}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FFFDF9] hover:bg-[#FAF6F0] text-[#3B2314] text-xs font-serif uppercase tracking-wider border border-[#D8CEC4] hover:border-[#3B2314] transition-colors rounded-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Boutique</span>
        </button>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FAF0EF] hover:bg-[#F6E5E3] text-[#8F423B] text-xs font-serif uppercase tracking-wider border border-[#E8C2BF] transition-colors rounded-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
