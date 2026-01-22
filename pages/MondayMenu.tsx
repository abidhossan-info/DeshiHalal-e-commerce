
import React, { useMemo, useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { Calendar, ShoppingBag, Clock, ShieldCheck, ArrowRight, Star, Utensils, Timer } from 'lucide-react';

interface MondayMenuProps {
  products: Product[];
  addToCart: (p: Product) => void;
}

const MondayMenu: React.FC<MondayMenuProps> = ({ products, addToCart }) => {
  const isMonday = new Date().getDay() === 1;
  const [timeLeft, setTimeLeft] = useState('');

  // Fake countdown for aesthetic "Urgency"
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59);
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const categorizedSpecials = useMemo(() => {
    return {
      mains: products.filter(p => p.category === 'NON VEG' || p.category === 'VEG'),
      treats: products.filter(p => p.category === 'SWEETS' || p.category === 'SNACKS')
    };
  }, [products]);

  return (
    <div className="pb-20 bg-white">
      {/* Premium Hero Header */}
      <section className="relative bg-slate-950 pt-24 pb-40 overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1541544741938-0af808891cc5?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Culinary background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.4em] mb-10 shadow-2xl">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> Curated Freshness
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              MONDAY <span className="text-emerald-500 italic block mt-2">SPECIALS</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-14 px-4">
              A bespoke collection of rare dishes and artisanal imports, available for request only on the first day of each week.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <div className={`px-8 py-4 rounded-3xl border flex items-center gap-4 transition-all duration-700 ${isMonday ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                <div className={`w-3 h-3 rounded-full ${isMonday ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`}></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isMonday ? 'KITCHEN IS CURRENTLY LIVE' : 'PRE-ORDERING PHASE'}</span>
              </div>
              <div className="px-8 py-4 rounded-3xl bg-white/5 border border-white/10 text-amber-500 flex items-center gap-4">
                <Timer className="w-5 h-5 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">CLOSE IN: {timeLeft}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Abstract Shapes */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px]"></div>
      </section>

      {/* Cycle Timeline */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-16">
          <div className="relative group">
            <div className="w-14 h-14 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-800 font-black mb-8 group-hover:bg-emerald-700 group-hover:text-white transition-all duration-500 text-xl">1</div>
            <h4 className="text-base font-black text-slate-950 uppercase mb-4 tracking-tight">Reserve Early</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">Place your requests throughout the weekend. Stock is allocated based on request time.</p>
          </div>
          <div className="relative group">
            <div className="w-14 h-14 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-800 font-black mb-8 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 text-xl">2</div>
            <h4 className="text-base font-black text-slate-950 uppercase mb-4 tracking-tight">Chef Verification</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">We inspect every ingredient on Monday 4:00 AM. Orders are approved only if quality is 100%.</p>
          </div>
          <div className="relative group">
            <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white font-black mb-8 group-hover:bg-black transition-all duration-500 text-xl">3</div>
            <h4 className="text-base font-black text-slate-950 uppercase mb-4 tracking-tight">Boutique Delivery</h4>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">Once payment is completed, your fresh batch is packaged in premium materials and sent out.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        
        {/* Category: Premium Meals */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-100 pb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <Utensils className="w-8 h-8 text-emerald-800" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">THE MAINSTAYS</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Heirloom Recipes & Premium Cuts</p>
              </div>
            </div>
            <div className="flex gap-2">
               <span className="bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Available Now</span>
            </div>
          </div>

          {categorizedSpecials.mains.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {categorizedSpecials.mains.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/30">
              <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Curation in progress...</p>
            </div>
          )}
        </div>

        {/* Category: Artisanal Treats */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-100 pb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-amber-50 rounded-2xl">
                <Star className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">THE DELICACIES</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Limited Batch Handmade Sweets</p>
              </div>
            </div>
            <div className="flex gap-2">
               <span className="bg-amber-600 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Sweets & Snacks</span>
            </div>
          </div>

          {categorizedSpecials.treats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {categorizedSpecials.treats.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/30">
              <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Rolling the next batch...</p>
            </div>
          )}
        </div>

        {/* Quality Banner */}
        <div className="relative rounded-[4rem] overflow-hidden bg-slate-900 text-white p-12 md:p-20 shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="text-center lg:text-left flex-grow">
              <h3 className="text-3xl font-black uppercase mb-6 tracking-tight">Our Artisan Guarantee</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium mb-10 max-w-3xl">
                We believe that premium food requires patience. Every item on the Monday Menu is subjected to a triple-point quality check before it leaves our boutique. If the ingredients don't meet our standards on Monday morning, we don't cook it—simple as that.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {['Single Source Meats', 'Organic Pure Ghee', 'Hand-picked Saffron', 'No Preservatives'].map(tag => (
                  <span key={tag} className="px-5 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">{tag}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <a href="/#/shop" className="group flex items-center gap-4 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest transition-all shadow-2xl shadow-emerald-900/50">
                DISCOVER MORE <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MondayMenu;
