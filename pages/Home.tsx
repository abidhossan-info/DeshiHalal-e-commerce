
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, UtensilsCrossed, Sparkles, Star, ArrowRight, Truck, Heart, Quote, User, Clock, ChevronLeft, ShieldCheck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Product, Testimonial } from '../types';

interface HomeProps {
  products: Product[];
  addToCart: (p: Product) => void;
  testimonials: Testimonial[];
}

const Home: React.FC<HomeProps> = ({ products, addToCart, testimonials }) => {
  const featured = products.filter(p => p.isNew).slice(0, 4);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerView = useMemo(() => {
    if (windowWidth < 768) return 1;
    if (windowWidth < 1024) return 2;
    return 3;
  }, [windowWidth]);

  const maxIndex = Math.max(0, testimonials.length - itemsPerView);

  const nextSlide = useCallback(() => {
    setCurrentTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentTestimonialIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isHovered]);

  return (
    <div className="pb-24 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/30 py-20 sm:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Handcrafted Batch Cooking
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-950 dark:text-slate-100 tracking-tighter leading-[0.95] mb-8">
                The <span className="text-emerald-800 dark:text-emerald-500 italic font-medium">Boutique</span> <br />Art of <span className="text-amber-600 dark:text-amber-500 italic font-medium">Halal</span> Taste.
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Experience the heritage of artisanal mithai and heirloom meals, prepared only when you ask. Verified fresh, 100% Halal certified.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/shop" 
                  className="inline-flex items-center justify-center px-12 py-5 rounded-full bg-emerald-800 text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-900/20 active:scale-95"
                >
                  Request Your Batch
                </Link>
                <Link 
                  to="/ramadan-menu" 
                  className="inline-flex items-center justify-center px-12 py-5 rounded-full bg-white dark:bg-slate-950 text-amber-600 border border-amber-200 dark:border-amber-900 text-[11px] font-black tracking-[0.2em] uppercase hover:bg-amber-50 dark:hover:bg-slate-900 transition-all active:scale-95"
                >
                  Seasonal Specials
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-8 border-white dark:border-slate-800 scale-105">
                <img 
                  src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=1200" 
                  className="w-full h-[600px] object-cover transition-transform duration-[2s] hover:scale-110" 
                  alt="Authentic Meal" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>
              <div className="absolute top-0 right-0 p-8 z-20">
                 <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-6 rounded-[2rem] shadow-2xl border border-white/20">
                    <p className="text-3xl font-black text-emerald-800 dark:text-emerald-500 leading-none">100%</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Certified Freshness</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-b border-slate-50 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-24 opacity-40">
           {['Ethical Sourcing', 'Zero Preservatives', 'Batch Verification', 'Handmade Craft'].map((badge) => (
             <div key={badge} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                <ShieldCheck className="w-4 h-4" /> {badge}
             </div>
           ))}
        </div>
      </section>

      {/* Featured Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-20">
          <div>
            <h2 className="text-4xl font-black text-slate-950 dark:text-slate-100 mb-3 uppercase tracking-tighter">Chef's Newest Batches</h2>
            <p className="text-slate-500 dark:text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Curation from the heart of our kitchen</p>
          </div>
          <Link to="/shop" className="text-emerald-800 dark:text-emerald-500 text-[10px] font-black flex items-center gap-2 group tracking-widest uppercase">
            EXPLORE CATALOG <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* Boutique Process */}
      <section className="bg-emerald-900 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter mb-8">The Boutique <br /><span className="text-emerald-400 italic">Audit Process.</span></h2>
                <div className="space-y-12">
                   {[
                     { step: '01', title: 'Batch Request', desc: 'Add items to your basket and request a new batch. No payment is required yet.' },
                     { step: '02', title: 'Chef Review', desc: 'Our Master Chef audits ingredient availability and freshness for your request.' },
                     { step: '03', title: 'Secure Dispatch', desc: 'Upon approval, complete payment and we begin preparation immediately.' }
                   ].map((item) => (
                     <div key={item.step} className="flex gap-8 group">
                        <div className="text-5xl font-black text-emerald-800 transition-colors group-hover:text-emerald-400">{item.step}</div>
                        <div>
                          <h4 className="text-lg font-black text-white uppercase mb-2 tracking-tight">{item.title}</h4>
                          <p className="text-emerald-200 text-sm font-medium leading-relaxed max-w-sm">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl rotate-2">
                 <div className="rounded-[3rem] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800" className="w-full h-[500px] object-cover" />
                 </div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Patron Sentiments</h2>
              <div className="w-20 h-1.5 bg-emerald-800 dark:bg-emerald-500 mx-auto rounded-full"></div>
           </div>

           <div className="relative px-12" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              <div className="overflow-hidden">
                <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentTestimonialIndex * (100 / itemsPerView)}%)` }}>
                  {testimonials.map((t) => (
                    <div key={t.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4">
                      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col">
                        <Quote className="w-10 h-10 text-emerald-100 dark:text-slate-800 mb-8" />
                        <p className="text-slate-700 dark:text-slate-300 italic text-[15px] font-medium leading-relaxed mb-10 flex-grow">"{t.text}"</p>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-800">{t.name.charAt(0)}</div>
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-wider">{t.name}</h4>
                              <p className="text-[9px] font-black text-emerald-800 uppercase mt-1">{t.role}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-950 rounded-full shadow-2xl border border-slate-100 dark:border-slate-800"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-950 rounded-full shadow-2xl border border-slate-100 dark:border-slate-800"><ChevronRight className="w-6 h-6" /></button>
           </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="max-w-7xl mx-auto px-4 mt-20">
         <div className="bg-slate-950 rounded-[4rem] p-12 sm:p-24 text-center relative overflow-hidden shadow-2xl border border-slate-900">
            <h2 className="text-4xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-12">Taste the <br /><span className="text-emerald-500 italic">Authenticity.</span></h2>
            <Link to="/shop" className="inline-flex items-center px-12 py-6 bg-white dark:bg-emerald-800 text-slate-950 dark:text-white rounded-full text-[11px] font-black tracking-[0.3em] uppercase transition-all shadow-xl hover:scale-105 active:scale-95">
              BROWSE CATALOG NOW
            </Link>
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-48 -mt-48"></div>
         </div>
      </section>
    </div>
  );
};

export default Home;
