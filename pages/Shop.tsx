
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { Filter, Search, Utensils, X } from 'lucide-react';

interface ShopProps {
  products: Product[];
  addToCart: (p: Product) => void;
}

const Shop: React.FC<ShopProps> = ({ products, addToCart }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCat = queryParams.get('cat') || 'ALL';
  
  const [filter, setFilter] = useState(initialCat);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('cat') || 'ALL';
    setFilter(cat);
  }, [location.search]);

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = filter === 'ALL' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20 border-b border-slate-50 dark:border-slate-900 pb-16">
        <div className="max-w-xl">
          <h1 className="text-5xl font-black text-slate-950 dark:text-white mb-6 tracking-tighter uppercase">The Artisanal <br /><span className="text-emerald-800 dark:text-emerald-500">Catalog</span></h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed transition-colors">Every dish is prepared to order. Browse our curated collection of halal meals, sweets, and traditional snacks.</p>
        </div>
        
        <div className="w-full lg:w-auto space-y-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-700 transition-colors" />
            <input 
              type="text" 
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 pr-14 py-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-emerald-700/10 focus:border-emerald-700 w-full lg:min-w-[400px] outline-none transition-all shadow-sm text-sm font-bold text-slate-900 dark:text-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-12 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center gap-2 pr-6 border border-slate-100 dark:border-slate-800 shadow-inner">
           {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap transition-all uppercase ${filter === cat ? 'bg-emerald-800 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
         <Utensils className="w-4 h-4 text-emerald-800" />
         {filteredProducts.length} Artisan Items Found
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {filteredProducts.map(product => (
            <div key={product.id} className="animate-in fade-in zoom-in-95 duration-700">
               <ProductCard product={product} onAddToCart={addToCart} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[4rem] border border-dashed border-slate-200 dark:border-slate-800">
          <Utensils className="w-20 h-20 text-slate-200 dark:text-slate-800 mx-auto mb-8" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Catalog Entry Missing</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">Try adjusting your filters or search terms to find our artisanal treasures.</p>
        </div>
      )}
    </div>
  );
};

export default Shop;
