
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, StockStatus, Review, User, Order, OrderStatus } from '../types';
import { 
  ChevronRight, Plus, Minus, ShoppingBag, ShieldCheck, 
  Clock, Utensils, Star, Tag, AlertTriangle, ArrowRight, MessageSquare, Send 
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

interface ProductDetailsProps {
  products: Product[];
  addToCart: (p: Product) => void;
  reviews: Review[];
  addReview: (r: Omit<Review, 'id' | 'createdAt'>) => void;
  currentUser: User | null;
  orders: Order[];
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, addToCart, reviews, addReview, currentUser, orders }) => {
  // 1. Hooks (Must always run)
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const product = useMemo(() => products.find(p => p.id === id), [products, id]);
  const productReviews = useMemo(() => reviews.filter(r => r.productId === id), [reviews, id]);
  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0;
    return productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
  }, [productReviews]);

  const canReview = useMemo(() => {
    if (!currentUser) return false;
    return orders.some(o => 
      o.userId === currentUser.id && 
      o.status === OrderStatus.PAID && 
      o.items.some(item => item.id === id)
    );
  }, [currentUser, orders, id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  // 2. Early Return (After all hooks)
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 uppercase">Delicacy Not Found</h2>
        <p className="text-slate-500 mb-10">This specific batch is no longer available in our boutique.</p>
        <Link to="/shop" className="px-10 py-4 bg-emerald-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
          Return to Menu
        </Link>
      </div>
    );
  }

  const isSoldOut = product.stockStatus === StockStatus.SOLD_OUT;
  const isLowStock = product.stockStatus === StockStatus.LOW_STOCK;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmittingReview(true);
    setTimeout(() => {
      addReview({
        productId: product.id,
        userId: currentUser.id,
        userName: currentUser.name,
        rating: newRating,
        comment: newComment.trim()
      });
      setNewComment('');
      setNewRating(5);
      setHoveredRating(0);
      setIsSubmittingReview(false);
      alert('Thank you! Your boutique experience has been recorded.');
    }, 600);
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-emerald-800 dark:text-emerald-400">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl group">
              <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
              {isSoldOut && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-8 py-3 rounded-full font-black uppercase text-xs tracking-[0.3em] shadow-2xl">Sold Out</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((_, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
                  <img src={product.image} className="w-full h-full object-cover" alt="Detail" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900">{product.category}</span>
                {product.isNew && (
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-600 dark:fill-amber-500" /> New Addition
                  </span>
                )}
                {product.isMondaySpecial && (
                  <span className="px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Monday Exclusive
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-slate-100 uppercase tracking-tight leading-none mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(averageRating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{productReviews.length} Patron Reviews</span>
              </div>
              
              <div className="flex items-center gap-6 mb-8">
                <p className="text-3xl font-black text-emerald-800 dark:text-emerald-400">${product.price.toFixed(2)}</p>
                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-slate-300' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSoldOut ? 'text-slate-400' : isLowStock ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-500'}`}>
                    {isSoldOut ? 'Restocking Soon' : isLowStock ? 'Boutique Stock Low' : 'Freshly Available'}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-10 text-lg">{product.description}</p>
            </div>

            <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 mb-10">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={isSoldOut} className="p-3 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center font-black text-slate-900 dark:text-slate-100">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} disabled={isSoldOut} className="p-3 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={handleAddToCart} disabled={isSoldOut} className={`flex-grow flex items-center justify-center gap-4 py-5 px-10 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 ${isSoldOut ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-800 text-white hover:bg-emerald-900'}`}>
                  <ShoppingBag className="w-5 h-5" /> {isSoldOut ? 'Currently Sold Out' : 'Reserve for Batch'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 justify-between pt-6 border-t border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">100% Halal Assured</span></div>
                <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manual Batch Approval</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-800 dark:text-emerald-400"><Utensils className="w-5 h-5" /></div>
                <div className="text-left"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ingredients</p><p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase">Premium Artisan Selection</p></div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-400"><AlertTriangle className="w-5 h-5" /></div>
                <div className="text-left"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Allergens</p><p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase">Contains Dairy/Spices</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32">
          <div className="flex items-center gap-6 mb-16">
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 rounded-[2rem]"><MessageSquare className="w-8 h-8 text-emerald-800 dark:text-emerald-400" /></div>
            <div>
              <h2 className="text-4xl font-black text-slate-950 dark:text-slate-100 uppercase tracking-tighter">Patron Feedback</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Verified Culinary Experiences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-10">
              {productReviews.length > 0 ? productReviews.map((review) => (
                <div key={review.id} className="flex gap-6 animate-in fade-in duration-500">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 font-black text-slate-400 text-lg uppercase">{review.userName.charAt(0)}</div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div><h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{review.userName}</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p></div>
                      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-800'}`} />))}</div>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-50 dark:border-slate-800/50">{review.comment}</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center border-4 border-dashed border-slate-50 dark:border-slate-900 rounded-[3rem]"><p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No reviews for this batch yet.</p></div>
              )}
            </div>

            <div className="lg:col-span-1">
              {canReview ? (
                <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-32">
                  <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Record Your Experience</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Rating</label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setNewRating(s)} onMouseEnter={() => setHoveredRating(s)} onMouseLeave={() => setHoveredRating(0)} className="transition-transform active:scale-90">
                            <Star className={`w-6 h-6 ${(hoveredRating || newRating) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-800'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Commentary</label>
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Describe your culinary journey..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-medium text-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none h-32 resize-none" required />
                    </div>
                    <button type="submit" disabled={isSubmittingReview || !newComment.trim()} className="w-full py-5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl">
                      {isSubmittingReview ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {isSubmittingReview ? 'Recording...' : 'Publish Feedback'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm text-center">
                  <ShieldCheck className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-6" /><h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Feedback Locked</h3><p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8">Only verified patrons who have completed a paid batch for this item can publish a review.</p>
                  {!currentUser ? (<Link to="/login" className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest hover:underline">Sign in to Review</Link>) : (<Link to="/shop" className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest hover:underline">Browse Menu to Order</Link>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 py-24 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div><h2 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter mb-2">Complements</h2><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Curated from the same category</p></div>
              <Link to="/shop" className="group flex items-center gap-2 text-[11px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest">Explore Full Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{relatedProducts.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart} />))}</div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
