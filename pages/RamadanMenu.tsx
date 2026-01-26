
import React, { useMemo, useState, useEffect } from 'react';
// Import Link from react-router-dom
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { MoonStar, ShoppingBag, Clock, ShieldCheck, ArrowRight, Star, Utensils, Timer, Sparkles } from 'lucide-react';

interface RamadanMenuProps {
  products: Product[];
  addToCart: (p: Product) => void;
}

const RamadanMenu: React.FC<RamadanMenuProps> = ({ products, addToCart }) => {
  const [timeLeft, setTimeLeft] = useState('');

  // Fake countdown for Iftar (aesthetic)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(18, 15, 0); // Mock Iftar time
      if (now > target) target.setDate(target.getDate() + 1);
      
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
      iftar: products.filter(p => p.category === 'NON VEG' || p.category === 'SNACKS'),
      suhoor: products.filter(p => p.category === 'VEG' || p.category === 'SWEETS')
    };
  }, [products]);

  return (
    <div className="pb-20 bg-white dark:bg-slate-950 transition-colors">
      {/* Premium Hero Header */}
      <section className="relative bg-indigo-950 pt-24 pb-40 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Ramadan background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-indigo-950/90 to-indigo-950"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.4em] mb-10 shadow-2xl">
              <MoonStar className="w-3.5 h-3.5 fill-amber-500" /> Mubarak Season
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              RAMADAN <span className="text-amber-500 italic block mt-2">SPECIALS</span>
            </h1>
            <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-14 px-4">
              Handcrafted Iftar & Suhoor delicacies prepared with devotion. Authenticity in every bite during this holy month.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <div className="px-8 py-4 rounded-3xl bg-amber-500/10 border border-amber-500/50 text-amber-400 flex items-center gap-4 transition-all duration-700">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">SEASONAL KITCHEN IS LIVE</span>
              </div>
              <div className="px-8 py-4 rounded-3xl bg-white/5 border border-white/10 text-white flex items-center gap-4">
                <Timer className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">IFTAR COUNTDOWN: {timeLeft}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Abstract Shapes */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </section>

      {/* Ramadan Timeline */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-50 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-16">
          <div className="relative group text-center md:text-left">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center text-amber-800 dark:text-amber-400 font-black mb-8 mx-auto md:mx-0 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 text-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-950 dark:text-white uppercase mb-4 tracking-tight">Iftar Pre-Order</h4>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Book your Haleem and Iftar boxes by 2:00 PM to ensure delivery before the Azan.</p>
          </div>
          <div className="relative group text-center md:text-left">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center text-indigo-800 dark:text-indigo-400 font-black mb-8 mx-auto md:mx-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 text-xl">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-950 dark:text-white uppercase mb-4 tracking-tight">Fresh Preparation</h4>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Our Haleem is slow-cooked for 12 hours. We only approve batches we can cook fresh.</p>
          </div>
          <div className="relative group text-center md:text-left">
            <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-white font-black mb-8 mx-auto md:mx-0 group-hover:bg-black transition-all duration-500 text-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-950 dark:text-white uppercase mb-4 tracking-tight">Halal Purity</h4>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">100% Halal certified meats and traditional spices. Cleanliness is our top priority.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        
        {/* Category: Iftar Menu */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                <Utensils className="w-8 h-8 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">IFTAR DELIGHTS</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Traditional Treats to Break the Fast</p>
              </div>
            </div>
            <div className="flex gap-2">
               <span className="bg-amber-600 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Active Season</span>
            </div>
          </div>

          {categorizedSpecials.iftar.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {categorizedSpecials.iftar.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-[3rem] bg-slate-50/30 dark:bg-slate-900/30">
              <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Curation in progress...</p>
            </div>
          )}
        </div>

        {/* Category: Suhoor Specials */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                <Star className="w-8 h-8 text-indigo-700 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">SUHOOR ESSENTIALS</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Nutritious Meals for a Productive Day</p>
              </div>
            </div>
            <div className="flex gap-2">
               <span className="bg-indigo-600 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Limited Availability</span>
            </div>
          </div>

          {categorizedSpecials.suhoor.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {categorizedSpecials.suhoor.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-50 dark:border-slate-800 rounded-[3rem] bg-slate-50/30 dark:bg-slate-900/30">
              <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Suhoor menu coming soon...</p>
            </div>
          )}
        </div>

        {/* Ramadan Guarantee */}
        <div className="relative rounded-[4rem] overflow-hidden bg-indigo-950 text-white p-12 md:p-20 shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img src="https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shrink-0 border border-white/20">
              <MoonStar className="w-16 h-16 text-amber-400" />
            </div>
            <div className="text-center lg:text-left flex-grow">
              <h3 className="text-3xl font-black uppercase mb-6 tracking-tight">Ramadan Kareem</h3>
              <p className="text-indigo-200 text-lg leading-relaxed font-medium mb-10 max-w-3xl">
                During this spiritual journey, let us take care of your kitchen. Our Ramadan specials are prepared following strict hygiene protocols to ensure you stay healthy and energized.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {['Daily Fresh Haleem', 'Hygiene Assured', 'Iftar Delivery', 'Sunnah Inspired'].map(tag => (
                  <span key={tag} className="px-5 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">{tag}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Link to="/shop" className="group flex items-center gap-4 bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest transition-all shadow-2xl shadow-amber-900/50">
                EXPLORE FULL MENU <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RamadanMenu;
