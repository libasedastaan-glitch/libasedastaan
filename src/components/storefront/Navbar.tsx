import { useState } from 'react';
import { ShoppingBag, Search, User, Menu, X, ShieldCheck } from 'lucide-react';
import { Category, UserProfile } from '../../types/index.ts';
import { BrandLogo } from '../ui/BrandLogo.tsx';

interface NavbarProps {
  categories: Category[];
  cartCount: number;
  currentUser: UserProfile;
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  onGoHome?: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onNavigateToAdmin: () => void;
  onOpenSqlViewer?: () => void;
  onOpenCodeViewer?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar = ({
  categories,
  cartCount,
  activeCategory,
  onSelectCategory,
  onGoHome,
  onOpenCart,
  onOpenProfile,
  onNavigateToAdmin,
  searchQuery,
  onSearchChange,
}: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0] border-b border-[#D8CEC4] text-[#3B2314] transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#3B2314] hover:text-[#9E5A38] focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo with exact typography from attached logo */}
            <button
              onClick={() => (onGoHome ? onGoHome() : onSelectCategory('all'))}
              className="group text-left transition-opacity hover:opacity-90"
              aria-label="Libas e Dastaan Home"
            >
              <BrandLogo variant="horizontal" size="sm" color="#3B2314" showTagline={true} showUrdu={true} />
            </button>
          </div>

          {/* Desktop Categories Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-serif uppercase tracking-[0.18em]">
            <button
              onClick={() => onSelectCategory('all')}
              className={`py-1.5 transition-all relative ${
                activeCategory === 'all'
                  ? 'font-bold text-[#3B2314] border-b-2 border-[#3B2314]'
                  : 'text-[#3B2314]/75 hover:text-[#9E5A38]'
              }`}
            >
              All Ensembles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`py-1.5 transition-all relative whitespace-nowrap ${
                  activeCategory === cat.slug
                    ? 'font-bold text-[#3B2314] border-b-2 border-[#3B2314]'
                    : 'text-[#3B2314]/75 hover:text-[#9E5A38]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* Search bar & Action Icons (Sepia Palette) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Input (Desktop) */}
            <div className="relative hidden md:block w-48 lg:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B2314]/60" />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#F4EFE6] border border-[#D8CEC4] rounded-none pl-9 pr-7 py-2 text-xs text-[#3B2314] placeholder-[#3B2314]/50 focus:outline-none focus:border-[#9E5A38] focus:bg-[#FFFDF9] transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3B2314]/50 hover:text-[#3B2314]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-[#3B2314] hover:text-[#9E5A38] transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Staff Portal Link */}
            <button
              onClick={onNavigateToAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] hover:text-[#9E5A38] text-[11px] font-serif uppercase tracking-widest transition-colors rounded-none"
              title="TailAdmin Management Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#9E5A38]" />
              <span>Portal</span>
            </button>

            {/* Profile Drawer Button */}
            <button
              onClick={onOpenProfile}
              className="p-2 text-[#3B2314] hover:text-[#9E5A38] transition-colors relative"
              title="My Account & Orders"
              aria-label="User Account"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Cart Trigger with INTERACTIVE ACCENT Badge */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-[#3B2314] hover:text-[#9E5A38] border border-[#D8CEC4] hover:border-[#3B2314] bg-[#FAF6F0] hover:bg-[#F4EFE6] transition-colors rounded-none"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#9E5A38] text-[#FAF6F0] text-[10px] font-bold font-sans flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        {searchOpen && (
          <div className="md:hidden pb-4 pt-1 animate-in fade-in duration-150">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B2314]/60" />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#F4EFE6] border border-[#D8CEC4] rounded-none pl-9 pr-8 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/50 focus:outline-none focus:border-[#9E5A38]"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50 hover:text-[#3B2314]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D8CEC4] bg-[#FAF6F0] px-4 py-5 space-y-4">
          <div className="text-[10px] font-serif uppercase tracking-[0.25em] text-[#3B2314]/60">
            Artisanal Collections
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                onSelectCategory('all');
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 px-3 text-xs font-serif uppercase tracking-widest transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#EAE2D6] text-[#3B2314] font-bold'
                  : 'text-[#3B2314] hover:bg-[#F4EFE6]'
              }`}
            >
              All Ensembles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 text-xs font-serif uppercase tracking-widest transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#EAE2D6] text-[#3B2314] font-bold'
                    : 'text-[#3B2314] hover:bg-[#F4EFE6]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#D8CEC4] flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigateToAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#3B2314] text-[#3B2314] text-xs font-serif uppercase tracking-wider"
            >
              <ShieldCheck className="w-4 h-4 text-[#9E5A38]" />
              <span>Staff Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
