
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem, Review } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  ChefHat, Mail, Loader2, Trash2, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, Box, ShoppingBag,
  Plus, Upload, RefreshCcw, Save, Star, BarChart3, DollarSign, Package, Search, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../supabase';

interface AdminDashboardProps {
  orders: Order[];
  updateStatus: (id: string, s: OrderStatus, note?: string, items?: CartItem[]) => Promise<void>;
  currentUser: UserType | null;
  products: Product[];
  setProducts: (p: Product[]) => void;
  testimonials: Testimonial[];
  setTestimonials: (t: Testimonial[]) => void;
  reviews: Review[];
  setReviews: (r: Review[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders = [], 
  updateStatus, 
  currentUser, 
  products = [], 
  setProducts, 
  testimonials = [], 
  setTestimonials,
  reviews = [], 
  setReviews
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'reviews' | 'testimonials' | 'metrics'>('batches');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  
  const [adminNote, setAdminNote] = useState('');
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING'>('PENDING');

  const liveSelectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  useEffect(() => {
    if (liveSelectedOrder) {
      setAuditItems(Array.isArray(liveSelectedOrder.items) ? liveSelectedOrder.items.map(item => ({
        ...item,
        isApproved: item.isApproved !== false 
      })) : []);
      setAdminNote(liveSelectedOrder.adminNote || '');
    }
  }, [selectedOrderId, liveSelectedOrder]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);

  // --- Unified Mapping Function ---
  const mapDbProduct = (p: any): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price) || 0,
    image: p.image,
    category: p.category,
    isMondaySpecial: p.monday_special ?? false,
    isRamadanSpecial: p.ramadan_special ?? false,
    isNew: p.is_new ?? false,
    stockStatus: (p.stock_status || StockStatus.IN_STOCK) as StockStatus
  });

  const filteredOrders = useMemo(() => {
    const list = orderFilter === 'ALL' ? orders : orders.filter(o => o.status === OrderStatus.PENDING);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, orderFilter]);

  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved !== false ? acc + (Number(item.price) * item.quantity) : acc, 0);
  }, [auditItems]);

  const stats = useMemo(() => {
    const totalRev = orders
      .filter(o => [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.READY_TO_DELIVERY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status))
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
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
    if (!selectedOrderId) return;
    setIsProcessingApproval(true);
    try {
      await updateStatus(selectedOrderId, status, adminNote.trim(), auditItems);
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Batch Action Failed:", error);
      alert("Database failed to update batch.");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessingApproval(true);
    const formData = new FormData(e.currentTarget);
    
    // Schema Alignment with Supabase snake_case columns
    const dbPayload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      stock_status: formData.get('stockStatus') as StockStatus,
      monday_special: formData.get('isMondaySpecial') === 'on',
      ramadan_special: formData.get('isRamadanSpecial') === 'on',
      is_new: formData.get('isNew') === 'on',
      image: imagePreview || editingProduct?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
    };

    try {
      if (editingProduct) {
        const { data, error } = await supabase.from('products').update(dbPayload).eq('id', editingProduct.id).select().single();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? mapDbProduct(data) : p));
      } else {
        const { data, error } = await supabase.from('products').insert([{ ...dbPayload, id: `p-${Date.now()}` }]).select().single();
        if (error) throw error;
        setProducts([mapDbProduct(data), ...products]);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error("Product Sync Error:", err);
      alert(`Persistence failed: ${err.message}`);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remove this artisan delicacy?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => p.id !== id));
  };

  const handleReviewModerate = async (id: string, approved: boolean) => {
    try {
      if (approved) {
        const { error } = await supabase.from('reviews').update({ isApproved: true }).eq('id', id);
        if (error) throw error;
        setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
      } else {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err: any) {
      console.error("Moderation Error:", err);
      alert(err.message);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dbPayload = {
      name: formData.get('name') as string,
      text: formData.get('text') as string,
      role: formData.get('role') as string,
      created_at: editingTestimonial?.createdAt || new Date().toISOString()
    };

    try {
      if (editingTestimonial) {
        const { data, error } = await supabase.from('testimonials').update(dbPayload).eq('id', editingTestimonial.id).select().single();
        if (error) throw error;
        setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? data : t));
      } else {
        const { data, error } = await supabase.from('testimonials').insert([{ ...dbPayload, id: `t-${Date.now()}` }]).select().single();
        if (error) throw error;
        setTestimonials([data, ...testimonials]);
      }
      setIsTestimonialModalOpen(false);
      setEditingTestimonial(null);
    } catch (err: any) {
      console.error("Testimonial Error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-[1.5rem] flex items-center justify-center shadow-2xl shrink-0">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Kitchen Control</h1>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5" /> DB Secure Handshake Active
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
                  : 'text-slate-500 hover:text-slate-900'
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

      <div className="min-h-[60vh]">
        {activeTab === 'batches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={`lg:col-span-4 space-y-4 ${selectedOrderId ? 'hidden lg:block' : 'block'}`}>
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button onClick={() => setOrderFilter('PENDING')} className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${orderFilter === 'PENDING' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Pending</button>
                  <button onClick={() => setOrderFilter('ALL')} className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${orderFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'}`}>All</button>
                </div>
                <button onClick={() => window.location.reload()} className="p-2 hover:bg-slate-100 rounded-lg"><RefreshCcw className="w-4 h-4 text-slate-300" /></button>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                {filteredOrders.map(order => (
                  <button key={order.id} onClick={() => setSelectedOrderId(order.id)} className={`w-full p-6 text-left border rounded-[2rem] transition-all relative ${selectedOrderId === order.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">#{order.id.slice(0, 8)}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500'}`}>{order.status}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">${(order.total || 0).toFixed(2)}</p>
                  </button>
                ))}
                {filteredOrders.length === 0 && (
                  <p className="text-center py-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">No batches found.</p>
                )}
              </div>
            </div>

            <div className={`lg:col-span-8 ${selectedOrderId ? 'block' : 'hidden lg:block'}`}>
              {liveSelectedOrder ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Batch Audit Portal</h2>
                    <button onClick={() => setSelectedOrderId(null)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-8 md:p-12">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Patron Details</p>
                          <p className="text-sm font-bold">{liveSelectedOrder.customerName}</p>
                          <p className="text-xs font-medium text-slate-500">{liveSelectedOrder.customerEmail}</p>
                          <p className="text-xs italic text-slate-400">"{liveSelectedOrder.address}"</p>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Item Audit</p>
                          <div className="space-y-2">
                            {auditItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                  <button onClick={() => toggleItemApproval(item.id)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.isApproved ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>{item.isApproved && <CheckCircle className="w-3 h-3" />}</button>
                                  <span className={`text-[11px] font-black uppercase ${!item.isApproved ? 'text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                                </div>
                                <span className="text-xs font-black tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                             <span className="text-[11px] font-black uppercase text-slate-400">Sync Total</span>
                             <p className="text-2xl font-black text-emerald-600">${adjustedTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Chef's private prep notes..." className="w-full h-44 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-medium outline-none resize-none transition-all shadow-inner" />
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleBatchAction(OrderStatus.APPROVED)} disabled={isProcessingApproval} className="py-6 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                            {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} APPROVE
                          </button>
                          <button onClick={() => handleBatchAction(OrderStatus.REJECTED)} disabled={isProcessingApproval} className="py-6 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">REJECT</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-32 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20">
                   <Box className="w-16 h-16 text-slate-200 mb-6" />
                   <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Awaiting Audit Selection</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center gap-6">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Filter kitchen catalog..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-emerald-700/10" />
              </div>
              <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group relative">
                   <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                        <img src={product.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">{product.category}</p>
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">{product.name}</h4>
                        <p className="text-sm font-black text-emerald-600 mt-1">${(product.price || 0).toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }} className="flex-grow flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase"><Edit2 className="w-3.5 h-3.5" /> Modify</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {reviews.map(review => (
              <div key={review.id} className={`bg-white dark:bg-slate-900 p-8 rounded-[2rem] border ${review.isApproved ? 'border-slate-100 dark:border-slate-800' : 'border-amber-200 bg-amber-50/10'}`}>
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{review.userName}</h4>
                      <div className="flex gap-1 mt-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                      </div>
                   </div>
                   {!review.isApproved && (
                     <div className="flex gap-2">
                        <button onClick={() => handleReviewModerate(review.id, true)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleReviewModerate(review.id, false)} className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200"><X className="w-4 h-4" /></button>
                     </div>
                   )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{review.comment}"</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-center col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest py-12">No reviews recorded.</p>}
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Patron Sentiments</h3>
              <button onClick={() => { setEditingTestimonial(null); setIsTestimonialModalOpen(true); }} className="px-6 py-3 bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase"><Plus className="w-4 h-4" /> Add Sentiment</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between">
                   <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{t.name}</h4>
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-4">{t.role}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{t.text}"</p>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingTestimonial(t); setIsTestimonialModalOpen(true); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async () => { 
                        if(confirm("Delete sentiment?")) {
                          await supabase.from('testimonials').delete().eq('id', t.id);
                          setTestimonials(testimonials.filter(item => item.id !== t.id));
                        }
                      }} className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
            <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white border border-emerald-900 shadow-2xl">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Revenue</span>
               </div>
               <p className="text-4xl font-black tabular-nums">${(stats.totalRev || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Audits</span>
               </div>
               <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pendingOrders}</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsProductModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingProduct ? 'Modify Delicacy' : 'Add Delicacy'}</h2>
                 <button onClick={() => setIsProductModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Delicacy Name</label>
                       <input name="name" defaultValue={editingProduct?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Price ($)</label>
                       <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Asset Sync (Base64 or URL)</label>
                    <div className={`w-full h-56 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden ${imagePreview ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-slate-50'}`}>
                      {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <><Upload className="w-8 h-8 text-emerald-700 mb-2" /><p className="text-[10px] font-black text-slate-400 uppercase">Upload Delicacy Image</p></>}
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                       <select name="category" defaultValue={editingProduct?.category || 'NON VEG'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
                          <option value="NON VEG">NON VEG</option>
                          <option value="VEG">VEG</option>
                          <option value="SWEETS">SWEETS</option>
                          <option value="SNACKS">SNACKS</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stock Status</label>
                       <select name="stockStatus" defaultValue={editingProduct?.stockStatus || StockStatus.IN_STOCK} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
                          <option value={StockStatus.IN_STOCK}>IN STOCK</option>
                          <option value={StockStatus.LOW_STOCK}>LOW STOCK</option>
                          <option value={StockStatus.SOLD_OUT}>SOLD OUT</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                       <input type="checkbox" name="isNew" defaultChecked={editingProduct?.isNew} /> New
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                       <input type="checkbox" name="isMondaySpecial" defaultChecked={editingProduct?.isMondaySpecial} /> Monday
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                       <input type="checkbox" name="isRamadanSpecial" defaultChecked={editingProduct?.isRamadanSpecial} /> Ramadan
                    </label>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Description</label>
                    <textarea name="description" defaultValue={editingProduct?.description} className="w-full h-32 px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none resize-none" required />
                 </div>
                 <button type="submit" disabled={isProcessingApproval} className="w-full py-6 bg-emerald-800 text-white rounded-[2rem] font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 shadow-2xl">
                   {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Sync Database
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsTestimonialModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black uppercase">Edit Sentiment</h2>
                 <button onClick={() => setIsTestimonialModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveTestimonial} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Patron Name</label>
                    <input name="name" defaultValue={editingTestimonial?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Location/Role</label>
                    <input name="role" defaultValue={editingTestimonial?.role} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Sentiment Text</label>
                    <textarea name="text" defaultValue={editingTestimonial?.text} className="w-full h-32 px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold resize-none" required />
                 </div>
                 <button type="submit" className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Save Sentiment</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
