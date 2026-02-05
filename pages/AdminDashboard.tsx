
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem, Review } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  ChefHat, Mail, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar, CreditCard, Box, Zap, ShoppingBag,
  Building2, Plus, Upload, RefreshCcw, Save, Star, BarChart3, TrendingUp, PieChart, Info, User,
  Package, Phone, ExternalLink, Hash, Calendar, DollarSign, MapPinned, AlertTriangle, Image as ImageIcon, Search
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

  // Inventory States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Testimonial States
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);

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

  useEffect(() => {
    if (isProductModalOpen) {
      setImagePreview(editingProduct?.image || null);
    } else {
      setImagePreview(null);
    }
  }, [isProductModalOpen, editingProduct]);

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

  // --- Inventory Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Delicacy image is too large. Limit is 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessingApproval(true);
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      stockStatus: formData.get('stockStatus') as StockStatus,
      isMondaySpecial: formData.get('isMondaySpecial') === 'on',
      isRamadanSpecial: formData.get('isRamadanSpecial') === 'on',
      isNew: formData.get('isNew') === 'on',
      image: imagePreview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
    };

    try {
      if (editingProduct) {
        const { data, error } = await supabase.from('products').update(productData).eq('id', editingProduct.id).select().single();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? data : p));
      } else {
        const { data, error } = await supabase.from('products').insert([{ ...productData, id: `p-${Date.now()}` }]).select().single();
        if (error) throw error;
        setProducts([data, ...products]);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Product Save Error:", err);
      alert("Failed to archive delicacy. Ensure all mandatory attributes are present.");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this delicacy from the catalog?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => p.id !== id));
  };

  // --- Review Moderation ---
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

  // --- Testimonial Handlers ---
  const handleSaveTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessingApproval(true);
    const formData = new FormData(e.currentTarget);
    const tData = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      text: formData.get('text') as string,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingTestimonial) {
        const { data, error } = await supabase.from('testimonials').update(tData).eq('id', editingTestimonial.id).select().single();
        if (error) throw error;
        setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? data : t));
      } else {
        const { data, error } = await supabase.from('testimonials').insert([{ ...tData, id: `t-${Date.now()}` }]).select().single();
        if (error) throw error;
        setTestimonials([data, ...testimonials]);
      }
      setIsTestimonialModalOpen(false);
      setEditingTestimonial(null);
    } catch (err) {
      console.error("Testimonial Error:", err);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 animate-in fade-in duration-500">
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
                      <div className="space-y-10">
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

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search catalog..." 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all"
                />
              </div>
              <button 
                onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-900 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Delicacy
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group relative">
                   <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                        <img src={product.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">{product.category}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${product.stockStatus === StockStatus.IN_STOCK ? 'bg-emerald-50 text-emerald-600' : product.stockStatus === StockStatus.LOW_STOCK ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {product.stockStatus}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">{product.name}</h4>
                        <p className="text-sm font-black text-emerald-600 mt-1">${product.price.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                        className="flex-grow flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REVIEWS MODERATION --- */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Review Moderation Queue</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {reviews.filter(r => !r.isApproved).map(review => (
                  <div key={review.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/50 shadow-sm flex flex-col sm:flex-row gap-6">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl border border-amber-100">
                       {review.userName.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{review.userName}</h4>
                            <div className="flex gap-0.5 mt-1">
                               {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                            </div>
                         </div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-6 leading-relaxed">"{review.comment}"</p>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleReviewModerate(review.id, true)}
                           className="flex-grow py-3 bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center justify-center gap-2"
                         >
                           <CheckCircle2 className="w-4 h-4" /> Approve
                         </button>
                         <button 
                           onClick={() => handleReviewModerate(review.id, false)}
                           className="flex-grow py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                         >
                           <Trash2 className="w-4 h-4" /> Reject
                         </button>
                      </div>
                    </div>
                  </div>
               ))}
               {reviews.filter(r => !r.isApproved).length === 0 && (
                 <div className="lg:col-span-2 py-32 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <MessageCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No pending reviews for audit.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* --- TESTIMONIALS TAB --- */}
        {activeTab === 'testimonials' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Artisan Sentiments</h3>
               <button 
                 onClick={() => { setEditingTestimonial(null); setIsTestimonialModalOpen(true); }}
                 className="px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-900 active:scale-95 transition-all"
               >
                 <Plus className="w-4 h-4" /> Add Sentiment
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {testimonials.map(t => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-emerald-800">{t.name.charAt(0)}</div>
                           <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.name}</h4>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.role}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setEditingTestimonial(t); setIsTestimonialModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
                           <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                     <p className="text-[13px] text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">"{t.text}"</p>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* --- METRICS TAB --- */}
        {activeTab === 'metrics' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white border border-emerald-900 shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gross Revenue</span>
                   </div>
                   <p className="text-4xl font-black tabular-nums">${stats.totalRev.toFixed(2)}</p>
                   <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-emerald-400 uppercase">
                      <TrendingUp className="w-3 h-3" /> Growth trend: +14%
                   </div>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Audits</span>
                 </div>
                 <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pendingOrders}</p>
                 <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-amber-600 uppercase">
                    <Zap className="w-3 h-3" /> Attention required
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Batches</span>
                 </div>
                 <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.completedOrders}</p>
                 <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-indigo-600 uppercase">
                    <PieChart className="w-3 h-3" /> 98% quality rate
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center"><Package className="w-5 h-5" /></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Delicacies</span>
                 </div>
                 <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalProducts}</p>
                 <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-slate-400 uppercase">
                    <Plus className="w-3 h-3" /> Across 5 categories
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <Flame className="w-5 h-5 text-rose-500" /> Hot Batches
                  </h3>
                  <div className="space-y-6">
                    {products.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-300 tabular-nums">0{idx+1}</span>
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800"><img src={p.image} className="w-full h-full object-cover" /></div>
                          <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-black text-emerald-600 uppercase">Top Seller</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-slate-950 p-10 rounded-[3rem] text-white relative overflow-hidden">
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" /> Fulfillment Intelligence
                  </h3>
                  <div className="space-y-8">
                     {[
                       { label: 'Halal Compliance', val: 100, color: 'bg-emerald-500' },
                       { label: 'On-time Dispatch', val: 94, color: 'bg-indigo-500' },
                       { label: 'Customer Sentiment', val: 88, color: 'bg-amber-500' }
                     ].map((m, i) => (
                        <div key={i} className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">{m.label}</span>
                              <span className="text-white">{m.val}%</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`${m.color} h-full transition-all duration-1000`} style={{ width: `${m.val}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="absolute bottom-0 right-0 p-8">
                     <PieChart className="w-24 h-24 text-white/5" />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsProductModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingProduct ? 'Edit Delicacy' : 'Add New Delicacy'}</h2>
                 <button onClick={() => setIsProductModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-colors hover:text-rose-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delicacy Name</label>
                       <input name="name" defaultValue={editingProduct?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price ($)</label>
                       <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all" required />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delicacy Image</label>
                    <div className="relative group/upload">
                       <div className={`w-full h-56 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative ${imagePreview ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
                          {imagePreview ? (
                             <div className="relative w-full h-full">
                                <img src={imagePreview} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                   <div className="bg-white/90 dark:bg-slate-950/90 p-4 rounded-2xl shadow-2xl flex items-center gap-2">
                                      <RefreshCcw className="w-4 h-4 text-emerald-800" />
                                      <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Update Asset</p>
                                   </div>
                                </div>
                             </div>
                          ) : (
                             <>
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover/upload:scale-110">
                                   <Upload className="w-6 h-6 text-emerald-700" />
                                </div>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Visual Asset</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                             </>
                          )}
                          <input 
                             type="file" 
                             accept="image/*"
                             onChange={handleFileChange}
                             className="absolute inset-0 opacity-0 cursor-pointer z-10"
                             aria-label="Upload product image"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea name="description" defaultValue={editingProduct?.description} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold h-32 outline-none resize-none focus:ring-4 focus:ring-emerald-700/10 transition-all" required />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                       <select name="category" defaultValue={editingProduct?.category || 'NON VEG'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none appearance-none focus:ring-4 focus:ring-emerald-700/10 transition-all">
                          <option value="NON VEG">NON VEG</option>
                          <option value="VEG">VEG</option>
                          <option value="SWEETS">SWEETS</option>
                          <option value="SNACKS">SNACKS</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Status</label>
                       <select name="stockStatus" defaultValue={editingProduct?.stockStatus || StockStatus.IN_STOCK} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none appearance-none focus:ring-4 focus:ring-emerald-700/10 transition-all">
                          <option value={StockStatus.IN_STOCK}>IN STOCK</option>
                          <option value={StockStatus.LOW_STOCK}>LOW STOCK</option>
                          <option value={StockStatus.SOLD_OUT}>SOLD OUT</option>
                       </select>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-6 p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" name="isNew" defaultChecked={editingProduct?.isNew} className="hidden peer" />
                       <div className="w-6 h-6 rounded-xl border-2 border-slate-300 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center transition-all shadow-sm"><CheckCircle className="w-3.5 h-3.5 text-white" /></div>
                       <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-700 transition-colors">New Delicacy</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" name="isMondaySpecial" defaultChecked={editingProduct?.isMondaySpecial} className="hidden peer" />
                       <div className="w-6 h-6 rounded-xl border-2 border-slate-300 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center transition-all shadow-sm"><CheckCircle className="w-3.5 h-3.5 text-white" /></div>
                       <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-700 transition-colors">Monday Special</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" name="isRamadanSpecial" defaultChecked={editingProduct?.isRamadanSpecial} className="hidden peer" />
                       <div className="w-6 h-6 rounded-xl border-2 border-slate-300 peer-checked:bg-amber-600 peer-checked:border-amber-600 flex items-center justify-center transition-all shadow-sm"><MoonStar className="w-3.5 h-3.5 text-white" /></div>
                       <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-amber-600 transition-colors">Ramadan Special</span>
                    </label>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isProcessingApproval}
                   className="w-full py-6 bg-emerald-800 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   {editingProduct ? 'Commit Changes' : 'Initialize Delicacy'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsTestimonialModalOpen(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingTestimonial ? 'Edit Sentiment' : 'Add Sentiment'}</h2>
                 <button onClick={() => setIsTestimonialModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveTestimonial} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patron Name</label>
                    <input name="name" defaultValue={editingTestimonial?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role/Location</label>
                    <input name="role" defaultValue={editingTestimonial?.role} placeholder="Seattle, WA" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sentiment Text</label>
                    <textarea name="text" defaultValue={editingTestimonial?.text} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold h-32 outline-none resize-none" required />
                 </div>
                 <button 
                   type="submit" 
                   disabled={isProcessingApproval}
                   className="w-full py-6 bg-emerald-800 text-white rounded-3xl font-black text-xs tracking-[0.3em] uppercase transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"
                 >
                   {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {editingTestimonial ? 'Update Sentiment' : 'Post Sentiment'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
