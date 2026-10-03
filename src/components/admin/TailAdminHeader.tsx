import { ExternalLink, ChevronRight, LogOut } from 'lucide-react';
import { UserProfile } from '../../types/index.ts';

interface TailAdminHeaderProps {
  currentTab: string;
  currentUser: UserProfile;
  onNavigateToStore: () => void;
  onSignOut?: () => void;
}

export const TailAdminHeader = ({
  currentTab,
  currentUser,
  onNavigateToStore,
  onSignOut,
}: TailAdminHeaderProps) => {
  const tabTitles: Record<string, string> = {
    overview: 'Analytics & Sales Overview',
    products: 'Product Inventory & Catalog',
    orders: 'Order Processing & COD Logistics',
    team: 'Team & Realtime Role Management',
    sql: 'Supabase PostgreSQL & RLS Policies',
    code: 'Next.js App Router Architecture',
  };

  return (
    // Solid BASE (Cream) with NEUTRAL (Taupe) border and ACCENT (Sepia) text
    <header className="h-16 bg-[#FAF6F0] border-b border-[#D8CEC4] px-6 flex items-center justify-between z-10 shrink-0 select-none">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs font-serif text-[#3B2314]/70">
          <span className="tracking-widest uppercase font-semibold text-[#3B2314]">Libas e Dastaan</span>
          <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#3B2314]/40" />
          <span className="capitalize text-[#9E5A38] font-bold">{currentTab}</span>
        </div>
        <span className="hidden sm:inline text-[#D8CEC4]">|</span>
        <h2 className="hidden sm:inline text-sm font-serif font-bold text-[#3B2314] tracking-wider uppercase">
          {tabTitles[currentTab] || 'Dashboard'}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateToStore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider bg-[#FFFDF9] hover:bg-[#F4EFE6] border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] transition-colors rounded-none"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#9E5A38]" />
          <span>Boutique</span>
        </button>

        <div className="h-5 w-[1px] bg-[#D8CEC4] hidden sm:block" />

        {/* Admin profile pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 bg-[#EFE8DE] border border-[#D8CEC4] flex items-center justify-center text-[#3B2314] text-xs font-serif font-bold shadow-sm">
            {currentUser.full_name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-serif font-bold text-[#3B2314] flex items-center gap-1.5">
              <span>{currentUser.full_name || (currentUser.role === 'manager' ? 'Catalog Manager' : 'Administrator')}</span>
              <span className={`text-[9px] uppercase font-serif tracking-wider px-1.5 py-0.5 rounded-none ${
                currentUser.role === 'manager'
                  ? 'bg-[#9E5A38] text-[#FAF6F0]'
                  : 'bg-[#3B2314] text-[#FAF6F0]'
              }`}>
                {currentUser.role === 'manager' ? 'Manager' : 'Admin'}
              </span>
            </div>
            <div className="text-[10px] text-[#3B2314]/60 font-mono truncate max-w-[140px]">
              {currentUser.email || 'admin@libasedastaan.com'}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Terminate Staff Session"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider bg-[#FAF0EF] hover:bg-[#F6E5E3] text-[#8F423B] border border-[#E8C2BF] transition-colors rounded-none ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
