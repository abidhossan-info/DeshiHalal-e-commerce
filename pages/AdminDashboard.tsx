
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem, Review } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  ChefHat, Mail, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar, CreditCard, Box, Zap, ShoppingBag,
  Building2, Plus, Upload, RefreshCcw, Save, Star, BarChart3, TrendingUp, PieChart, Info, User,
  Package, Phone, ExternalLink, Hash, Calendar, DollarSign, MapPinned, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabase';

interface AdminDashboardProps {
  orders: Order[];
  updateStatus: (id: string, s: OrderStatus, note?: string, items?: CartItem[]) => void;
  currentUser: UserType | null;
  products: Product[];
  setProducts: (p: Product[]) => void;
  testimonials: Testimonial[];
  setTestimonials: (t: Testimonial[]) => void;
  reviews: Review[];
  setReviews: (r: Review[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, 
  updateStatus, 
  currentUser, 
  products, 
  setProducts, 
  testimonials, 
  setTestimonials,
  reviews,
  setReviews
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'reviews' | 'testimonials' | 'metrics'>('batches');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrder) {
      setAuditItems(selectedOrder.items.map(item => ({
        ...item,
        isApproved: item.isApproved !== false 
      })));
      setAdminNote(selectedOrder.adminNote || '');
    } else {
      setAuditItems([]);
      setAdminNote('');
    }
  }, [selectedOrderId, selectedOrder]);

  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved !== false ? acc + (item.price * item.quantity) : acc, 0);
  }, [auditItems]);

  const stats = useMemo(() => {
    const totalRev = orders
      .filter(o => [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.READY_TO_DELIVERY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status))
      .reduce((acc, o) => acc + o.total, 0);
    
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const totalProducts = products.length;

    return { totalRev, pendingOrders, completedOrders, totalProducts };
  }, [orders, products]);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-6">
          <Ban className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 mt-2 font-medium">Boutique Kitchen Authority Required.</p>
      </div>
    );
  }

  const toggleItemApproval = (itemId: string) => {
    setAuditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isApproved: !item.isApproved } : item
    ));
  };

  const handleBatchAction = async (status: OrderStatus) => {
    if (!selectedOrderId || !selectedOrder) return;
    setIsProcessingApproval(true);
    try {
      await updateStatus(selectedOrderId, status, adminNote.trim(), auditItems);
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Batch Action Error:", error);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReviewModerate = async (id: string, approve: boolean) => {
    try {
      if (approve) {
        const { error } = await supabase.from('reviews').update({ isApproved: true }).eq('id', id);
        if (error) throw error;
        setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
      } else {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Moderation Error:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-[1.5rem] flex items-center justify-center shadow-2xl shrink-0">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Kitchen Command</h1>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5" /> Operations Control Center
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(['batches', 'inventory', 'reviews', 'testimonials', 'metrics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedOrderId(null); }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xl' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'batches' && <Box className="w-3.5 h-3.5" />}
              {tab === 'inventory' && <Package className="w-3.5 h-3.5" />}
              {tab === 'reviews' && <MessageCircle className="w-3.5 h-3.5" />}
              {tab === 'testimonials' && <Star className="w-3.5 h-3.5" />}
              {tab === 'metrics' && <BarChart3 className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[60vh]">
        {activeTab === 'batches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Order List */}
            <div className={`lg:col-span-4 space-y-4 ${selectedOrderId ? 'hidden lg:block' : 'block'}`}>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Incoming Batches ({orders.length})</h3>
                <RefreshCcw className="w-4 h-4 text-slate-300 cursor-pointer hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                {orders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full p-6 text-left border rounded-[2rem] transition-all group relative overflow-hidden ${
                      selectedOrderId === order.id 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black uppercase text-slate-400">#{order.id.slice(0, 8)}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        order.status === OrderStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>{order.status}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.customerName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] font-bold text-slate-500 tabular-nums">${order.total.toFixed(2)}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <p className="text-[10px] font-bold text-slate-500">{order.items.length} Items</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Detail View */}
            <div className={`lg:col-span-8 ${selectedOrderId ? 'block' : 'hidden lg:block'}`}>
              {selectedOrder ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Detail Header */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Batch Audit</h2>
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase tracking-widest">
                            ID: {selectedOrder.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(selectedOrder.createdAt).toLocaleTimeString()}</div>
                          <div className="flex items-center gap-2 text-emerald-600"><Zap className="w-3.5 h-3.5" /> Status: {selectedOrder.status}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedOrderId(null)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-600 transition-colors shadow-sm"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="p-8 md:p-12">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      {/* Left Side: Items & Patron */}
                      <div className="space-y-10">
                        {/* Patron Info */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Patron Credentials
                          </h4>
                          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Name</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{selectedOrder.customerName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Contact</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{selectedOrder.customerEmail} / {selectedOrder.customerPhone}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                               <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Delivery Coordinates</span>
                               <div className="flex items-start gap-2">
                                  <MapPinned className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{selectedOrder.address}</p>
                               </div>
                            </div>
                          </div>
                        </div>

                        {/* Item List */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Itemized Audit
                          </h4>
                          <div className="space-y-2">
                            {auditItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 group/item transition-colors hover:border-emerald-200">
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => toggleItemApproval(item.id)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.isApproved ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}
                                  >
                                    {item.isApproved && <CheckCircle className="w-4 h-4" />}
                                  </button>
                                  <div className="flex flex-col">
                                    <span className={`text-[11px] font-black uppercase ${!item.isApproved ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-black tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline px-2">
                             <span className="text-[11px] font-black uppercase text-slate-400">Total Batch Value</span>
                             <div className="text-right">
                                {adjustedTotal !== selectedOrder.total && (
                                   <p className="text-[10px] font-black text-slate-400 line-through mb-1">${selectedOrder.total.toFixed(2)}</p>
                                )}
                                <p className="text-3xl font-black text-emerald-600 tabular-nums">${adjustedTotal.toFixed(2)}</p>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Directives & Actions */}
                      <div className="space-y-10">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Edit2 className="w-3.5 h-3.5" /> Chef Directives
                              </label>
                              <textarea 
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="E.g., 'Fresh mutton verified. Preparing for dispatch...' or reasons for item rejection."
                                className="w-full h-44 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-emerald-700/10 outline-none resize-none transition-all shadow-inner"
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => handleBatchAction(OrderStatus.APPROVED)}
                                disabled={isProcessingApproval}
                                className="py-6 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Approve Batch
                              </button>
                              <button 
                                onClick={() => handleBatchAction(OrderStatus.REJECTED)}
                                disabled={isProcessingApproval}
                                className="py-6 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" /> Reject Batch
                              </button>
                           </div>
                        </div>

                        <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-4">
                           <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Post-Audit Workflow</h4>
                           <div className="flex gap-4">
                              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20"><Info className="w-5 h-5 text-emerald-400" /></div>
                              <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                                Approval triggers a <span className="text-white font-black">Payment Request</span> alert to the patron. Preparation only commences once payment is verified in the system.
                              </p>
                           </div>
                           <div className="grid grid-cols-1 gap-2 pt-2">
                              <button 
                                onClick={() => handleBatchAction(OrderStatus.PROCESSING)}
                                className="w-full py-4 border border-slate-800 hover:bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Skip to Processing
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-32 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20 dark:bg-slate-900/10">
                   <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                      <Box className="w-10 h-10 text-slate-200 dark:text-slate-600" />
                   </div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Audit Batch</h3>
                   <p className="text-slate-500 font-medium text-sm mt-2">Choose an incoming request from the list to begin quality verification.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue (Total)</span>
               </div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">${stats.totalRev.toFixed(2)}</p>
               <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-emerald-600 uppercase">
                  <TrendingUp className="w-3 h-3" /> +12% vs last month
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Requests</span>
               </div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pendingOrders}</p>
               <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-amber-600 uppercase">
                  <Zap className="w-3 h-3" /> Requires Head Chef Audit
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Batches</span>
               </div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stats.completedOrders}</p>
               <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-indigo-600 uppercase">
                  <PieChart className="w-3 h-3" /> 98% fulfillment rate
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center"><Package className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catalog Depth</span>
               </div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalProducts}</p>
               <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-slate-400 uppercase">
                  <Plus className="w-3 h-3" /> Across 5 categories
               </div>
            </div>
          </div>
        )}

        {(activeTab === 'inventory' || activeTab === 'reviews' || activeTab === 'testimonials') && (
           <div className="py-32 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[3rem] animate-in zoom-in-95 duration-700">
              <RefreshCcw className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-6 animate-spin-slow" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">{activeTab} Interface</h3>
              <p className="text-slate-500 font-medium text-sm">Synchronizing boutique data modules...</p>
              {activeTab === 'reviews' && (
                 <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 gap-4 text-left px-4">
                    {reviews.filter(r => !r.isApproved).map(review => (
                       <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-200 flex justify-between items-center">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="font-black text-[11px] uppercase">{review.userName}</span>
                                <div className="flex">{[...Array(5)].map((_,i) => <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
                             </div>
                             <p className="text-xs text-slate-600 italic">"{review.comment}"</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleReviewModerate(review.id, true)} className="p-2 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200"><CheckCircle2 className="w-4 h-4" /></button>
                             <button onClick={() => handleReviewModerate(review.id, false)} className="p-2 bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       </div>
                    ))}
                    {reviews.filter(r => !r.isApproved).length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase">No Pending Reviews for Audit</p>}
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
