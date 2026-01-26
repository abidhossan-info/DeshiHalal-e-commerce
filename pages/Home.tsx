
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, UtensilsCrossed, Sparkles, Star, ArrowRight, Truck, Heart, Quote, User, Clock, ChevronLeft } from 'lucide-react';
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

  // Handle resize for responsive slider items
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
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-50/30 dark:bg-slate-900/30 py-12 sm:py-20 lg:py-28 transition-colors duration-500">
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
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-emerald-800 dark:bg-emerald-700 text-white text-sm font-black tracking-widest hover:bg-emerald-900 dark:hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95"
                >
                  BROWSE MENU
                </Link>
                <Link 
                  to="/monday-menu" 
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-500 text-sm font-black tracking-widest border-2 border-amber-200 dark:border-amber-900 hover:border-amber-600 dark:hover:border-amber-500 transition-all active:scale-95"
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
            <h2 className="text-3xl font-black text-slate-950 dark:text-slate-100 mb-2 uppercase tracking-tight">New Arrivals</h2>
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
      <section id="about" className="bg-slate-50 dark:bg-slate-900/50 py-24 transition-colors duration-500">
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

      {/* Testimonials Slider Section */}
      <section id="testimonials" className="py-24 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-500 text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-100 dark:border-rose-900/50">
              <Heart className="w-3.5 h-3.5 fill-rose-700 dark:fill-rose-500" /> OUR HAPPY PATRONS
            </div>
            <h2 className="text-4xl font-black text-slate-950 dark:text-slate-100 uppercase mb-4 tracking-tight">What People Are Saying</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">Discover the experiences of our valued community members across the PNW region.</p>
          </div>
          
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Slider Controls */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
              <button 
                onClick={prevSlide}
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 hover:bg-emerald-800 hover:text-white transition-all active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
              <button 
                onClick={nextSlide}
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 hover:bg-emerald-800 hover:text-white transition-all active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Testimonial Container */}
            <div className="relative overflow-hidden px-2">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonialIndex * (100 / itemsPerView)}%)` }}
              >
                {testimonials.map((t) => (
                  <div 
                    key={t.id} 
                    className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4"
                  >
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all group text-left h-full flex flex-col">
                      <Quote className="w-12 h-12 text-emerald-100 dark:text-slate-800 mb-8 group-hover:text-emerald-200 dark:group-hover:text-emerald-800 transition-colors" />
                      <p className="text-slate-800 dark:text-slate-300 italic text-sm leading-relaxed mb-8 font-medium flex-grow">"{t.text}"</p>
                      <div className="flex items-center gap-4 mt-auto">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <User className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-black text-slate-950 dark:text-slate-100 uppercase tracking-wider">{t.name}</h4>
                          <p className="text-[10px] text-emerald-800 dark:text-emerald-500 font-black tracking-widest uppercase mt-0.5">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: Math.ceil(testimonials.length - itemsPerView + 1) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonialIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${currentTestimonialIndex === idx ? 'w-8 bg-emerald-800 dark:bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-emerald-900 dark:bg-emerald-950 rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 uppercase leading-tight tracking-tight">Ready for an <br />Authentic Experience?</h2>
            <p className="text-emerald-100 dark:text-emerald-400 mb-12 text-sm sm:text-lg font-medium opacity-90">Request an order today. Pay only after our Chef approves your request based on fresh ingredients availability.</p>
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
