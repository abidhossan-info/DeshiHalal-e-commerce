
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, StockStatus, Review, User, Order, OrderStatus } from '../types';
import { 
  ChevronRight, Plus, Minus, ShoppingBag, ShieldCheck, 
  Clock, Utensils, Star, Tag, AlertTriangle, ArrowRight, MessageSquare, Send,
  CheckCircle2, User as UserIcon, Calendar, Info
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

interface ProductDetailsProps {
  products: Product[];
  addToCart: (p: Product, q?: number) => void;
  reviews: Review[];
  addReview: (r: Omit<Review, 'id' | 'createdAt' | 'isApproved'>) => void;
  currentUser: User | null;
  orders: Order[];
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, addToCart, reviews, addReview, currentUser, orders }) => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const product = useMemo(() => products.find(p => p.id === id), [products, id]);
  
  // Public reviews: Only approved ones
  const publicReviews = useMemo(() => reviews.filter(r => r.productId === id && r.isApproved), [reviews, id]);
  
  // User's own reviews (including pending ones)
  const myReviews = useMemo(() => 
    currentUser ? reviews.filter(r => r.productId === id && r.userId === currentUser.id) : [], 
  [reviews, id, currentUser]);

  const averageRating = publicReviews.length > 0 
    ? publicReviews.reduce((acc, r) => acc + r.rating, 0) / publicReviews.length 
    : 0;

  const canReview = useMemo(() => {
    if (!currentUser) return false;
    // Must have ordered and paid/delivered
    const hasPurchased = orders.some(o => 
      o.userId === currentUser.id && 
      (o.status === OrderStatus.PAID || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.DELIVERED) && 
      o.items.some(item => item.id === id)
    );
    // Also, don't allow multiple reviews for the same product to maintain boutique integrity
    const hasAlreadyReviewed = myReviews.length > 0;
    
    return hasPurchased && !hasAlreadyReviewed;
  }, [currentUser, orders, id, myReviews]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
           <AlertTriangle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-tighter">Delicacy Not Found</h2>
        <p className="text-slate-500 mb-10 font-medium">This specific artisan item is currently unavailable in our catalogue.</p>
        <Link to="/shop" className="px-10 py-4 bg-emerald-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all active:scale-95">
          Return to Menu
        </Link>
      </div>
    );
  }

  const isSoldOut = product.stockStatus === StockStatus.SOLD_OUT;
  const isLowStock = product.stockStatus === StockStatus.LOW_STOCK;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addReview({
        productId: product.id,
        userId: currentUser.id,
        userName: currentUser.name,
        rating: newRating,
        comment: newComment.trim()
      });
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      console.error("Feedback Submission Error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen transition-colors duration-500">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <Link to="/" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link to="/shop" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Artisan Shop</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-emerald-800 dark:text-emerald-400">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-24">
          {/* Visual Asset Container */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[3.5rem] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl group">
              <img src={product.image} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={product.name} />
              
              {isSoldOut && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-950 p-1 rounded-full shadow-2xl scale-125">
                    <span className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-[0.4em] block">Sold Out</span>
                  </div>
                </div>
              )}

              {product.isRamadanSpecial && (
                <div className="absolute top-8 left-8 bg-amber-600 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl ring-4 ring-amber-600/10">
                  <Tag className="w-3 h-3" /> Seasonal Exclusive
                </div>
              )}
            </div>
          </div>

          {/* Narrative & Action Container */}
          <div className="flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">{product.category}</span>
                {product.isNew && (
                  <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/50 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-500" /> Kitchen Newcomer
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-950 dark:text-white uppercase tracking-tighter leading-none mb-6">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(averageRating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-800'}`} />
                  ))}
                  <span className="text-[11px] font-black text-slate-900 dark:text-white ml-2 tabular-nums">{averageRating.toFixed(1)}</span>
                </div>
                <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <button 
                  onClick={() => document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                >
                  {publicReviews.length} Patron Reviews
                </button>
              </div>
              
              <div className="flex items-baseline gap-4 mb-10">
                <p className="text-5xl font-black text-emerald-800 dark:text-emerald-500 tracking-tighter">${product.price.toFixed(2)}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isSoldOut ? 'text-slate-400' : isLowStock ? 'text-rose-600 animate-pulse' : 'text-emerald-700/60 dark:text-emerald-500/60'}`}>
                  {isSoldOut ? 'Waiting for Restock' : isLowStock ? 'Extremely Limited' : 'Available for Request'}
                </span>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-10 text-lg max-w-xl">{product.description}</p>
            </div>

            <div className="space-y-8 bg-slate-50/50 dark:bg-slate-900/30 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 mb-10 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={isSoldOut} className="p-4 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 disabled:opacity-20 transition-colors"><Minus className="w-4 h-4 stroke-[3px]" /></button>
                  <span className="w-12 text-center font-black text-slate-900 dark:text-white text-lg tabular-nums">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} disabled={isSoldOut} className="p-4 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 disabled:opacity-20 transition-colors"><Plus className="w-4 h-4 stroke-[3px]" /></button>
                </div>
                <button 
                  onClick={handleAddToCart} 
                  disabled={isSoldOut} 
                  className={`flex-grow w-full sm:w-auto flex items-center justify-center gap-4 py-6 px-10 rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl active:scale-95 ${isSoldOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200' : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-emerald-900/20'}`}
                >
                  <ShoppingBag className="w-5 h-5" /> {isSoldOut ? 'Out of Kitchen' : 'Add to Batch'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Halal Protocol</div>
                 <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                 <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Boutique Quality Audit</div>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK SECTION */}
        <div id="feedback-section" className="mt-32 pt-32 border-t border-slate-50 dark:border-slate-900">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <div className="flex items-center gap-8">
              <div className="p-6 bg-emerald-900 text-white rounded-[2rem] shadow-2xl shadow-emerald-900/20"><MessageSquare className="w-8 h-8" /></div>
              <div>
                <h2 className="text-4xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Patron Feedback</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Verified Deshi Culinary Insights</p>
              </div>
            </div>
            
            {publicReviews.length > 0 && (
              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 px-8 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                 <div className="text-center">
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{averageRating.toFixed(1)}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Aggregate</p>
                 </div>
                 <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
                 <div>
                    <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'}`} />)}
                    </div>
                    <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-500 uppercase mt-1 tracking-widest">{publicReviews.length} Batches Rated</p>
                 </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-12">
              {/* My Pending Reviews */}
              {myReviews.filter(r => !r.isApproved).map((review) => (
                <div key={review.id} className="relative group p-8 rounded-[2.5rem] bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="absolute -top-3 -right-3 bg-amber-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Audit in Progress
                  </div>
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900 shadow-sm">
                       <UserIcon className="w-6 h-6 text-amber-700" />
                    </div>
                    <div className="flex-grow">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Feedback</h4>
                          <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
                       </div>
                       <p className="text-[13px] text-slate-600 dark:text-slate-400 italic mb-4 leading-relaxed font-medium">"{review.comment}"</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Submitted on {new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}

              {publicReviews.length > 0 ? publicReviews.map((review) => (
                <div key={review.id} className="flex gap-8 group animate-in fade-in duration-1000">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 font-black text-slate-300 dark:text-slate-700 text-xl uppercase shadow-sm group-hover:border-emerald-200 dark:group-hover:border-emerald-800 transition-colors">
                    {review.userName.charAt(0)}
                  </div>
                  <div className="flex-grow border-b border-slate-50 dark:border-slate-900 pb-12">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{review.userName}</h4>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase tracking-widest">
                            <ShieldCheck className="w-2.5 h-2.5" /> Verified Patron
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'}`} />)}</div>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-50 dark:border-slate-800/50 shadow-inner group-hover:shadow-lg transition-all duration-500">
                       <p className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">"{review.comment}"</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center border-4 border-dashed border-slate-50 dark:border-slate-900 rounded-[3.5rem] bg-slate-50/20 dark:bg-slate-900/10">
                   <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Utensils className="w-6 h-6 text-slate-200" />
                   </div>
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No Public Feedback Yet</h3>
                   <p className="text-[11px] text-slate-400 font-medium mt-2">Our patrons are currently savoring this artisan batch.</p>
                </div>
              )}
            </div>

            {/* Feedback Submission Panel */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                {canReview ? (
                  <div className="bg-slate-950 rounded-[3.5rem] p-10 md:p-12 text-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-900 overflow-hidden relative">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black mb-10 uppercase tracking-tighter leading-none">Record Your <br /><span className="text-emerald-500 italic">Boutique Experience</span></h3>
                      
                      <div className="mb-10 p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
                         <p className="text-[11px] font-bold text-emerald-100/70 leading-relaxed">As a verified buyer, your words guide our Chef to culinary perfection.</p>
                      </div>

                      <form onSubmit={handleSubmitReview} className="space-y-8">
                        <div>
                          <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Culinary Rating</label>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button 
                                  key={s} 
                                  type="button" 
                                  onClick={() => setNewRating(s)} 
                                  onMouseEnter={() => setHoveredRating(s)} 
                                  onMouseLeave={() => setHoveredRating(0)}
                                  className="transition-all active:scale-90"
                                >
                                  <Star className={`w-8 h-8 transition-all duration-300 ${(hoveredRating || newRating) >= s ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-800 scale-100'}`} />
                                </button>
                              ))}
                            </div>
                            <span className="text-xl font-black text-white tabular-nums ml-2">{newRating}/5</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest">Narrative</label>
                          <textarea 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            placeholder="Describe the aroma, the flavor profile, and your overall boutique experience..." 
                            className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-sm font-medium text-slate-300 focus:ring-4 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none h-44 resize-none shadow-inner transition-all" 
                            required 
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={isSubmittingReview || !newComment.trim()} 
                          className="w-full py-6 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl shadow-emerald-950/40 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                        >
                          {isSubmittingReview ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          {isSubmittingReview ? 'Recording...' : 'Authorized Dispatch'}
                        </button>
                      </form>

                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 text-center leading-relaxed">
                        All submissions undergo a strict quality audit <br />by the Head Chef before publication.
                      </p>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-900/20 rounded-full blur-[100px]"></div>
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-900/10 rounded-full blur-[100px]"></div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-10 md:p-12 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 text-center">
                       <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-500">
                          <ShieldCheck className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                       </div>
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Feedback Locked</h3>
                       <div className="space-y-6 text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                          <p>To preserve the boutique's narrative integrity, only <span className="text-emerald-800 dark:text-emerald-500 font-black">Verified Patrons</span> who have completed an artisan batch for this specific item may publish insights.</p>
                          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 text-left">
                             <Info className="w-5 h-5 text-slate-400 shrink-0" />
                             <span>If you have recently enjoyed this delicacy, please ensure your batch status is marked as <span className="font-bold">Paid</span> or <span className="font-bold">Delivered</span>.</span>
                          </div>
                       </div>
                       {!currentUser ? (
                         <Link to="/login" className="inline-flex items-center gap-3 text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-500 tracking-widest group/link">
                           Login to Verify <ArrowRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                         </Link>
                       ) : (
                         <Link to="/shop" className="inline-flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest group/link">
                           Continue Browsing <ArrowRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                         </Link>
                       )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
