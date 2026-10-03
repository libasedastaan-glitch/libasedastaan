import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, ChevronLeft, Award, Sparkles, Feather } from 'lucide-react';
import { Category, Product } from '../../types/index.ts';
import { BrandLogo } from '../ui/BrandLogo.tsx';

interface HeroBannerProps {
  categories: Category[];
  products: Product[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  onExploreProducts: () => void;
  onNavigateToAdmin: () => void;
}

const FALLBACK_SLIDE = {
  id: 'fallback',
  title: 'Libas e Dastaan Luxury Silk Couture',
  image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000&auto=format&fit=crop&q=80',
};

const AUTOPLAY_MS = 4000;
const MAX_SLIDES = 8;

export const HeroBanner = ({
  products,
  onExploreProducts,
  onNavigateToAdmin,
}: HeroBannerProps) => {
  // Featured products first, then the rest; only products that have an image
  const slides = useMemo(() => {
    const withImages = products.filter((p) => p.images?.[0]);
    const ordered = [...withImages.filter((p) => p.is_featured), ...withImages.filter((p) => !p.is_featured)];
    const list = ordered.slice(0, MAX_SLIDES).map((p) => ({ id: p.id, title: p.title, image: p.images[0] }));
    return list.length > 0 ? list : [FALLBACK_SLIDE];
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset if the product list shrinks
  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [slides.length, activeIndex]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const goTo = (index: number) => setActiveIndex((index + slides.length) % slides.length);
  const currentSlide = slides[activeIndex] ?? slides[0];

  return (
    <div className="relative overflow-hidden bg-[#FAF6F0] border-b border-[#D8CEC4] text-[#3B2314]">
      {/* Subtle artisanal watermark background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.035] pointer-events-none select-none">
        <BrandLogo variant="monogram" size="xl" className="w-full h-full" color="#3B2314" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Subtle editorial kicker */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-serif uppercase tracking-[0.3em] text-[#9E5A38] font-semibold">
                Haute Couture Edition 2026
              </span>
              <span className="h-[1px] w-12 bg-[#D8CEC4]" />
              <span
                className="text-sm font-serif text-[#3B2314]/70"
                style={{ fontFamily: "'Noto Nastaliq Urdu', 'Amiri', serif" }}
              >
                لباس داستان
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#3B2314] tracking-tight leading-[1.08] font-normal">
              Timeless Elegance, <br />
              <span className="italic font-light">Artisanal Storytelling.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#3B2314]/80 leading-relaxed max-w-xl font-light">
              Each garment at Libas e Dastaan weaves a chapter of heritage. Handcrafted luxury silk pret,
              bespoke embroidered formals, and ethereal bridal ensembles tailored with timeless reverence.
            </p>

            {/* CTAs adhering strictly to button design rules:
                Primary Button: INTERACTIVE ACCENT (Bronze/Terracotta) with BASE (Cream) text. Minimal rounding.
                Secondary Button: Transparent background, ACCENT (Sepia) border and text.
            */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={onExploreProducts}
                className="px-7 py-4 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif text-xs uppercase tracking-[0.2em] font-semibold flex items-center gap-3 transition-colors shadow-sm rounded-none"
              >
                <span>Explore The Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onNavigateToAdmin}
                className="px-6 py-4 bg-transparent border border-[#3B2314] hover:bg-[#3B2314]/5 text-[#3B2314] font-serif text-xs uppercase tracking-[0.2em] transition-colors flex items-center gap-2 rounded-none"
              >
                <span>Staff Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#3B2314]/60" />
              </button>
            </div>

            {/* Artisanal Heritage Proof Notes (Clean Typography, No Pills) */}
            <div className="pt-6 border-t border-[#D8CEC4]/60 flex flex-wrap items-center gap-6 text-xs text-[#3B2314]/75 font-light">
              <div className="flex items-center gap-2">
                <Feather className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Pure Mulberry Silks &amp; Chiffons</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Master Zardozi &amp; Tilla Embroidery</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#9E5A38]" />
                <span>Bespoke Custom Fitting</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase in Artisanal Palette */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative taupe frame */}
              <div className="absolute -inset-2 border border-[#D8CEC4] translate-x-2 translate-y-2 pointer-events-none" />

              {/* Main Visual Card */}
              <div className="relative bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury p-3">
                <div
                  className="aspect-[4/5] w-full overflow-hidden bg-[#FAF6F0] relative group"
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}
                >
                  {/* Crossfading product slides */}
                  {slides.map((slide, i) => (
                    <img
                      key={slide.id}
                      src={slide.image}
                      alt={slide.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className={`absolute inset-0 h-full w-full object-cover object-top filter contrast-[1.03] transition-opacity duration-1000 ease-in-out ${
                        i === activeIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}

                  {/* Prev / Next controls */}
                  {slides.length > 1 && (
                    <>
                      <button
                        onClick={() => goTo(activeIndex - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#FAF6F0]/85 border border-[#D8CEC4] text-[#3B2314] hover:bg-[#FAF6F0] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-none"
                        aria-label="Previous product"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => goTo(activeIndex + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FAF6F0]/85 border border-[#D8CEC4] text-[#3B2314] hover:bg-[#FAF6F0] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-none"
                        aria-label="Next product"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Slide indicators */}
                      <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
                        {slides.map((slide, i) => (
                          <button
                            key={slide.id}
                            onClick={() => goTo(i)}
                            aria-label={`Show ${slide.title}`}
                            className={`h-[3px] transition-all duration-300 ${
                              i === activeIndex ? 'w-6 bg-[#9E5A38]' : 'w-3 bg-[#FAF6F0]/80 hover:bg-[#FAF6F0]'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Corner Brand Seal */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#FAF6F0]/95 backdrop-blur-sm border border-[#D8CEC4] p-3 text-center">
                    <p className="font-serif uppercase tracking-[0.25em] text-xs font-semibold text-[#3B2314]">
                      Libas e Dastaan
                    </p>
                    <p
                      className="text-xs font-serif text-[#3B2314]/80 mt-0.5"
                      style={{ fontFamily: "'Noto Nastaliq Urdu', 'Amiri', serif" }}
                    >
                      خالص ریشم اور دستکاری کا شاہکار
                    </p>
                    {currentSlide.id !== FALLBACK_SLIDE.id && (
                      <p
                        key={currentSlide.id}
                        className="text-[11px] font-serif italic text-[#9E5A38] mt-1 truncate animate-in fade-in duration-700"
                      >
                        {currentSlide.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
