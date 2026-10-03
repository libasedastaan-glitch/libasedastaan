import { ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo.tsx';

export const Footer = ({ onOpenSqlViewer }: { onOpenSqlViewer: () => void }) => {
  return (
    <footer className="bg-[#F4EFE6] border-t border-[#D8CEC4] text-[#3B2314] text-xs">
      {/* Value props banner */}
      <div className="border-b border-[#D8CEC4] bg-[#FAF6F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[#3B2314] text-xs font-serif uppercase tracking-widest font-semibold">
                Worldwide Courier
              </h4>
              <p className="text-[11px] text-[#3B2314]/70 mt-0.5 font-light">Complimentary delivery over $200</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[#3B2314] text-xs font-serif uppercase tracking-widest font-semibold">
                Stripe &amp; COD Gateways
              </h4>
              <p className="text-[11px] text-[#3B2314]/70 mt-0.5 font-light">Encrypted card payments &amp; Cash on Delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[#3B2314] text-xs font-serif uppercase tracking-widest font-semibold">
                Bespoke Artisanship
              </h4>
              <p className="text-[11px] text-[#3B2314]/70 mt-0.5 font-light">Handcrafted by master embroiderers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[#3B2314] text-xs font-serif uppercase tracking-widest font-semibold">
                Conceirge Client Care
              </h4>
              <p className="text-[11px] text-[#3B2314]/70 mt-0.5 font-light">Bespoke sizing &amp; alteration support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <BrandLogo variant="full" size="md" color="#3B2314" showTagline={true} showUrdu={true} />
            <p className="text-xs text-[#3B2314]/70 leading-relaxed font-light text-center max-w-sm mx-auto">
              Timeless Elegance &amp; Artisanal Couture. Celebrating heritage textiles, ethereal pure silks, and intricate Zardozi embroidery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-serif uppercase tracking-[0.2em] font-semibold text-[#3B2314] border-b border-[#D8CEC4] pb-1.5">
              Collections
            </h5>
            <ul className="space-y-2 text-xs font-light text-[#3B2314]/80">
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Silk &amp; Pret Wear</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Artisanal Embroidered</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Luxury Formal Couture</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Minimalist Classics</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Bridal Atelier</li>
            </ul>
          </div>

          {/* Boutique Services */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-serif uppercase tracking-[0.2em] font-semibold text-[#3B2314] border-b border-[#D8CEC4] pb-1.5">
              Boutique
            </h5>
            <ul className="space-y-2 text-xs font-light text-[#3B2314]/80">
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Heritage &amp; Craft</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Bespoke Appointments</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Fabric &amp; Care Guide</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">Shipping &amp; Logistics</li>
              <li className="hover:text-[#9E5A38] transition-colors cursor-pointer">COD Verification</li>
            </ul>
          </div>

          {/* Newsletter / Gazette */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="text-xs font-serif uppercase tracking-[0.2em] font-semibold text-[#3B2314] border-b border-[#D8CEC4] pb-1.5">
              The Gazette
            </h5>
            <p className="text-xs text-[#3B2314]/70 font-light">
              Receive private previews of limited edition seasonal drops and private atelier invitations.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-[#FAF6F0] border border-[#D8CEC4] px-3 py-2 text-xs text-[#3B2314] placeholder-[#3B2314]/50 focus:outline-none focus:border-[#9E5A38] w-full rounded-none font-sans"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif uppercase tracking-wider text-xs font-semibold shrink-0 rounded-none transition-colors"
              >
                Join
              </button>
            </form>
            <div className="pt-2">
              <button
                onClick={onOpenSqlViewer}
                className="text-[11px] text-[#9E5A38] hover:underline font-serif tracking-wider"
              >
                Supabase PostgreSQL Schema &amp; RLS Policies
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-[#D8CEC4] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#3B2314]/60 gap-4">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Libas e Dastaan. All rights reserved.</span>
          </div>
          <div
            className="text-xs font-serif text-[#3B2314]/70"
            style={{ fontFamily: "'Noto Nastaliq Urdu', 'Amiri', serif" }}
          >
            لباس داستان — خوبصورتی، وقار اور روایت کا سنگم
          </div>
        </div>
      </div>
    </footer>
  );
};
