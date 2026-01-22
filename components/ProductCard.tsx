
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, CheckCircle, ShoppingBag, AlertTriangle, Eye } from 'lucide-react';
import { Product, StockStatus } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isSoldOut = product.stockStatus === StockStatus.SOLD_OUT;
  const isLowStock = product.stockStatus === StockStatus.LOW_STOCK;

  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col h-full ${isSoldOut ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800 block">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-emerald-900/10 dark:bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-full shadow-2xl scale-50 group-hover:scale-100 transition-transform">
            <Eye className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
          </div>
        </div>

        {isSoldOut ? (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl">
              Sold Out
            </span>
          </div>
        ) : (
          <>
            {product.isNew && (
              <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                Fresh
              </span>
            )}
            {product.isMondaySpecial && (
              <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Tag className="w-2.5 h-2.5" /> Monday Exclusive
              </span>
            )}
            {isLowStock && (
              <span className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
              </span>
            )}
          </>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block">
          <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mb-1">{product.category}</p>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1.5 leading-snug line-clamp-1 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
            {product.name}
          </h3>
        </Link>
        <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 mb-4 leading-relaxed flex-grow font-medium">
          {product.description}
        </p>
        
        <div className="flex items-center gap-1.5 mb-4">
          <CheckCircle className={`w-3 h-3 ${isSoldOut ? 'text-slate-300 dark:text-slate-700' : 'text-emerald-600 dark:text-emerald-500'}`} />
          <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-tight">
            {isSoldOut ? 'Restocking Soon' : isLowStock ? 'Few Left in Kitchen' : 'Halal Certified'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-wider">Price</span>
            <span className={`text-lg font-black ${isSoldOut ? 'text-slate-400 dark:text-slate-700' : 'text-slate-900 dark:text-slate-100'}`}>${product.price.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => !isSoldOut && onAddToCart(product)}
            disabled={isSoldOut}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all group/btn active:scale-95 shadow-sm ${isSoldOut ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:text-white shadow-emerald-200 dark:shadow-none'}`}
            title={isSoldOut ? "Item Sold Out" : "Add to basket"}
          >
            {isSoldOut ? <ShoppingBag className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
