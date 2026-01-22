
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, UtensilsCrossed, Sparkles, Star, ArrowRight, Truck, Heart, Quote, User, Clock } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

interface HomeProps {
  products: Product[];
  addToCart: (p: Product) => void;
}

const Home: React.FC<HomeProps> = ({ products, addToCart }) => {
  const featured = products.filter(p => p.isNew).slice(0, 4);

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-50/30 dark:bg-slate-900/30 py-12 sm:py-20 lg:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Authentic Deshi Flavors
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 dark:text-slate-100 tracking-tight leading-[1.05] mb-6 sm:mb-8">
                The Finest <span className="text-emerald-800 dark:text-emerald-500 italic">Halal</span> & <span className="text-amber-600 dark:text-amber-500 italic">Sweet</span> Boutique.
              </h1>
              <p className="text-lg sm:text-xl text-slate-800 dark:text-slate-400 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium transition-colors">
                Handcrafted meals, artisanal sweets, and traditional snacks prepared fresh every morning. 100% Halal certified and quality guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/shop" 
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-emerald-800 dark:bg-emerald-700 text-white text-sm font-black tracking-widest hover:bg-emerald-900 dark:hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none"
                >
                  BROWSE MENU
                </Link>
                <Link 
                  to="/monday-menu" 
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-500 text-sm font-black tracking-widest border-2 border-amber-200 dark:border-amber-900 hover:border-amber-600 dark:hover:border-amber-500 transition-all"
                >
                  MONDAY SPECIAL
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl rotate-1 border-4 border-white dark:border-slate-800">
                <img 
                  src="https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=800" 
                  className="w-full h-[550px] object-cover" 
                  alt="Traditional Meal" 
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400 dark:bg-emerald-600 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400 dark:bg-amber-600 rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-slate-100 mb-2 uppercase">New Arrivals</h2>
            <p className="text-slate-600 dark:text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">Fresh from the kitchen</p>
          </div>
          <Link to="/shop" className="text-emerald-800 dark:text-emerald-500 text-xs font-black flex items-center gap-1 hover:gap-2 transition-all tracking-widest uppercase">
            VIEW FULL MENU <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-slate-50 dark:bg-slate-900/50 py-24 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800" alt="About Chef" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-xs hidden sm:block border border-emerald-50 dark:border-slate-800">
                <Clock className="w-8 h-8 text-emerald-800 dark:text-emerald-500 mb-4" />
                <h4 className="font-black text-slate-900 dark:text-slate-100 mb-2 uppercase text-sm">Always Fresh</h4>
                <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed font-medium">Prepared only after order confirmation to ensure maximum taste and health.</p>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-950 dark:text-slate-100 mb-8 leading-tight uppercase">Crafting Authenticity <br /><span className="text-emerald-800 dark:text-emerald-500 italic">Since 2018.</span></h2>
              <div className="space-y-6 text-slate-800 dark:text-slate-400 leading-relaxed text-sm font-medium">
                <p>
                  At Deshi Halal, we believe that food is not just nourishment—it is a connection to culture, family, and tradition. Our journey started in a small home kitchen with a single goal: to bring the authentic flavors of artisanal mithai and traditional meals to your table.
                </p>
                <p>
                  Every piece of Rasgulla, every pot of Biryani, and every Snack is prepared with the finest ingredients, pure ghee, and 100% Halal-certified meat. We maintain a unique <strong>Manual Approval System</strong> to ensure that every order we accept can be executed with 100% quality.
                </p>
                <p>
                  Our chef reviews your request, checks the fresh ingredients available, and only then approves the payment—guaranteeing that what you eat is nothing short of perfect.
                </p>
              </div>
              <div className="mt-10 flex gap-12">
                <div>
                  <p className="text-3xl font-black text-emerald-800 dark:text-emerald-500">100%</p>
                  <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 tracking-widest mt-1">HALAL CERTIFIED</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-500">24/7</p>
                  <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 tracking-widest mt-1">QUALITY CHECK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-500 text-[10px] font-black uppercase tracking-widest mb-6">
            <Heart className="w-3.5 h-3.5 fill-rose-700 dark:fill-rose-500" /> OUR HAPPY PATRONS
          </div>
          <h2 className="text-4xl font-black text-slate-950 dark:text-slate-100 mb-16 uppercase">What People Are Saying</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Rafiqul Islam", role: "Regular Customer", text: "The Mutton Kacchi here is better than what I've had in Dhaka. The approval system is great because I know it's always fresh." },
              { name: "Sarah Ahmed", role: "Sweet Lover", text: "Their Rasgulla is simply out of this world. Soft, spongy, and perfectly sweet. I order for every family gathering!" },
              { name: "Imran Chowdhury", role: "Snack Enthusiast", text: "Best snacks for our office tea parties. The Tikka skewers are incredibly juicy. Highly recommend the Monday Special!" }
            ].map((t, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-950/20 transition-all group">
                <Quote className="w-10 h-10 text-emerald-100 dark:text-slate-800 mb-8 group-hover:text-emerald-200 dark:group-hover:text-emerald-800 transition-colors" />
                <p className="text-slate-800 dark:text-slate-300 italic text-sm leading-relaxed mb-8 font-medium">"{t.text}"</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-slate-950 dark:text-slate-100 uppercase tracking-wider">{t.name}</h4>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-500 font-black tracking-widest uppercase">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900 dark:bg-emerald-950 rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 uppercase leading-tight">Ready for an <br />Authentic Experience?</h2>
            <p className="text-emerald-100 dark:text-emerald-400 mb-12 text-sm sm:text-lg font-medium">Request an order today. Pay only after our Chef approves your request based on fresh ingredients availability.</p>
            <Link to="/shop" className="inline-flex items-center justify-center px-10 py-5 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-400 rounded-full text-sm font-black tracking-widest hover:bg-amber-400 dark:hover:bg-emerald-700 dark:hover:text-white transition-all shadow-xl active:scale-95">
              START ORDERING NOW
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>
      </section>
    </div>
  );
};

export default Home;
