
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, CheckCircle, ShoppingBag, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { Product, StockStatus } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isSoldOut = product.stockStatus === StockStatus.SOLD_OUT;
  const isLowStock = product.stockStatus === StockStatus.LOW_STOCK;

  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full ${isSoldOut ? 'opacity-80' : ''}`}>
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-50 dark:bg-slate-800 block">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
        />
        
        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
           <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl scale-50 group-hover:scale-100 transition-all duration-500 flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">View Details</span>
           </div>
        </div>

        {/* Dynamic Status Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2">
           {product.isNew && (
             <span className="bg-emerald-800 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl ring-2 ring-white/20">
               New Batch
             </span>
           )}
           {product.isRamadanSpecial && (
             <span className="bg-amber-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2 ring-2 ring-white/20">
               <Tag className="w-3 h-3" /> Ramadan
             </span>
           )}
        </div>

        {isSoldOut ? (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
             <span className="bg-white text-slate-900 text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-[0.3em] shadow-2xl">Sold Out</span>
          </div>
        ) : isLowStock && (
           <div className="absolute bottom-5 right-5">
              <span className="bg-rose-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Limited
              </span>
           </div>
        )}
      </Link>
      
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
           <div>
              <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-[0.2em] mb-2">{product.category}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                {product.name}
              </h3>
           </div>
           <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</p>
           </div>
        </div>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2 font-medium">
          {product.description}
        </p>
        
        <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Halal</span>
          </div>
          <button 
            onClick={() => !isSoldOut && onAddToCart(product)}
            disabled={isSoldOut}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${isSoldOut ? 'bg-slate-100 text-slate-300' : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-emerald-900/20'}`}
          >
            {isSoldOut ? <ShoppingBag className="w-6 h-6" /> : <Plus className="w-8 h-8" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
