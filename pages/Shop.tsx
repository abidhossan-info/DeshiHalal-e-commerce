
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { Filter, Search, Utensils } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white mb-4 tracking-tight uppercase transition-colors">The Menu</h1>
          <p className="text-slate-700 dark:text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] transition-colors">Authentic. Fresh. Handcrafted.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search for dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 w-full outline-none transition-all shadow-sm text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 appearance-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 outline-none cursor-pointer text-xs font-black tracking-widest uppercase shadow-sm text-slate-900 dark:text-white transition-all min-w-[140px]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap transition-all border ${filter === cat ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase">No items found</h3>
          <p className="text-slate-600 dark:text-slate-500 text-sm font-medium">Try exploring a different category or adjusting your search.</p>
        </div>
      )}
    </div>
  );
};

export default Shop;
