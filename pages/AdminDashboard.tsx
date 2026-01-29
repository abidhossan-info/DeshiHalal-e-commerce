
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem, Review } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  ChefHat, Mail, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar, CreditCard, Box, Zap, ShoppingBag,
  Building2, Plus, Upload, RefreshCcw, Save, Star, BarChart3, TrendingUp, PieChart, Info, User,
  Package, Phone, ExternalLink
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [testimonialModalMode, setTestimonialModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: '',
    text: ''
  });

  const [adminNote, setAdminNote] = useState('');
  const [deliveryCompany, setDeliveryCompany] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved !== false ? acc + (item.price * item.quantity) : acc, 0);
  }, [auditItems]);

  useEffect(() => {
    if (selectedOrder) {
      setAuditItems(selectedOrder.items.map(item => ({
        ...item,
        isApproved: item.isApproved !== false 
      })));
      
      const noteParts = selectedOrder.adminNote?.split('Delivery Company:');
      const cleanNote = noteParts?.[0]?.trim() || '';
      const extractedCompany = noteParts?.[1]?.split('\n')?.[0]?.trim() || '';
      
      setAdminNote(cleanNote);
      setDeliveryCompany(extractedCompany);
    }
  }, [selectedOrderId, selectedOrder?.id, selectedOrder]);

  const metrics = useMemo(() => {
    const totalRev = orders
      .filter(o => [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.READY_TO_DELIVERY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status))
      .reduce((acc, o) => acc + o.total, 0);
    
    const catMap: Record<string, number> = {};
    products.forEach(p => catMap[p.category] = (catMap[p.category] || 0) + 1);
    
    const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const completedCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

    return { totalRev, catMap, pendingCount, completedCount };
  }, [orders, products]);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) return null;

  const toggleItemApproval = (itemId: string) => {
    setAuditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isApproved: !item.isApproved } : item
    ));
  };

  const handleBatchAction = async (status: OrderStatus) => {
    if (!selectedOrderId || !selectedOrder) return;
    setIsProcessingApproval(true);
    let finalNote = adminNote;
    if (deliveryCompany.trim()) {
      finalNote = `${adminNote}\n\nDelivery Company: ${deliveryCompany.trim()}`;
    }
    try {
      await updateStatus(selectedOrderId, status, finalNote.trim(), auditItems);
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Batch Action Error:", error);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingApproval(true);
    try {
      if (editingProduct) {
        const { data, error } = await supabase.from('products').update(productForm).eq('id', editingProduct.id).select().single();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? data : p));
      } else {
        const { data, error } = await supabase.from('products').insert([productForm]).select().single();
        if (error) throw error;
        setProducts([data, ...products]);
      }
      setIsAddingProduct(false);
    } catch (err) { console.error(err); }
    finally { setIsProcessingApproval(false); }
  };

  const handleReviewModerate = async (id: string, approve: boolean) => {
    if (approve) {
      const { error } = await supabase.from('reviews').update({ isApproved: true }).eq('id', id);
      if (!error) setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } else {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (!error) setReviews(reviews.filter(r => r.id !== id));
    }
  };

  const handleTestimonialSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingApproval(true);
    try {
      if (testimonialModalMode === 'EDIT' && editingTestimonialId) {
        const { data, error } = await supabase.from('testimonials').update(testimonialForm).eq('id', editingTestimonialId).select().single();
        if (error) throw error;
        setTestimonials(testimonials.map(t => t.id === editingTestimonialId ? data : t));
      } else {
        const { data, error } = await supabase.from('testimonials').insert([{ ...testimonialForm, createdAt: new Date().toISOString() }]).select().single();
        if (error) throw error;
        setTestimonials([data, ...testimonials]);
      }
      setTestimonialModalMode(null);
    } catch (err) { console.error(err); }
    finally { setIsProcessingApproval(false); }
  };

  const INITIAL_NEW_PRODUCT: Omit<Product, 'id'> = {
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'NON VEG',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  };
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(INITIAL_NEW_PRODUCT);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-catalog/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setProductForm(prev => ({ ...prev, image: publicUrl }));
    } catch (err) { console.error(err); }
    finally { setIsUploadingImage(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Kitchen Command</h1>
            <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Zap className="w-3 h-3 fill-emerald-800" /> Administrative Authority
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(['batches', 'inventory', 'reviews', 'testimonials', 'metrics'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 lg:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'batches' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-10 py-8">Batch ID</th>
                    <th className="px-10 py-8">Patron</th>
                    <th className="px-10 py-8">Value</th>
                    <th className="px-10 py-8">Status</th>
                    <th className="px-10 py-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {orders.map(order => (
                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
                      <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">{order.id}</td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400">{order.customerName}</span>
                          {order.userId.startsWith('guest-') && (
                            <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest mt-0.5">One-Time Guest</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">${order.total.toFixed(2)}</td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                          order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          order.status === OrderStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          order.status === OrderStatus.PAID ? 'bg-slate-900 text-white border-slate-950' : 
                          order.status === OrderStatus.PROCESSING ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          order.status === OrderStatus.READY_TO_DELIVERY ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          order.status === OrderStatus.ON_THE_WAY ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Artisan Inventory</h2>
              <button onClick={() => { setEditingProduct(null); setProductForm(INITIAL_NEW_PRODUCT); setIsAddingProduct(true); }} className="px-6 py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm group relative">
                  <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 border border-slate-50 dark:border-slate-800"><img src={p.image} className="w-full h-full object-cover" alt={p.name} /></div>
                  <h3 className="text-sm font-black uppercase mb-1">{p.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-black text-emerald-800 dark:text-emerald-500">${p.price.toFixed(2)}</p>
                    <button onClick={() => { setEditingProduct(p); setProductForm(p); setIsAddingProduct(true); }} className="p-2 text-slate-400 hover:text-emerald-600"><Edit2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Review Moderation</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Approve or discard patron feedback</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.filter(r => !r.isApproved).map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4"><div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest">Awaiting Audit</div></div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase">{r.userName.charAt(0)}</div>
                    <div>
                      <h4 className="text-xs font-black uppercase">{r.userName}</h4>
                      <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
                    </div>
                  </div>
                  <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 italic mb-8">"{r.comment}"</p>
                  <div className="flex gap-4">
                    <button onClick={() => handleReviewModerate(r.id, true)} className="flex-1 py-4 bg-emerald-800 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Approve & Publish</button>
                    <button onClick={() => handleReviewModerate(r.id, false)} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Discard</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Home Sentiments</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Curated stories for the landing page</p>
              </div>
              <button onClick={() => { setTestimonialModalMode('ADD'); setTestimonialForm({ name: '', role: '', text: '' }); }} className="px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <Plus className="w-4 h-4" /> Record Sentiment
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 font-black">{t.name.charAt(0)}</div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase">{t.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-8">"{t.text}"</p>
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTestimonialId(t.id); setTestimonialForm(t); setTestimonialModalMode('EDIT'); }} className="p-2 text-slate-400 hover:text-rose-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(window.confirm('Delete?')){ await supabase.from('testimonials').delete().eq('id', t.id); setTestimonials(testimonials.filter(x => x.id !== t.id)); } }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Cumulative Revenue', val: `$${metrics.totalRev.toFixed(2)}`, icon: CreditCard, color: 'text-emerald-600' },
                { label: 'Pending Batches', val: metrics.pendingCount, icon: Clock, color: 'text-amber-600' },
                { label: 'Fullfills', val: metrics.completedCount, icon: CheckCircle2, color: 'text-blue-600' },
                { label: 'Artisans', val: products.length, icon: Package, color: 'text-indigo-600' }
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{kpi.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => !isProcessingApproval && setSelectedOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-lg"><ChefHat className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Audit Protocol</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedOrder.id}</p>
                  </div>
                </div>
                <button onClick={() => !isProcessingApproval && setSelectedOrderId(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"><X /></button>
             </div>
             
             <div className="p-8 space-y-8 overflow-y-auto flex-grow no-scrollbar">
                {/* Patron Contact Section (Especially for Guests) */}
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Patron Credentials</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                         <User className="w-4 h-4 text-emerald-800" />
                         <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Phone className="w-4 h-4 text-emerald-800" />
                         <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedOrder.customerPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Mail className="w-4 h-4 text-emerald-800" />
                         <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedOrder.customerEmail || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Building2 className="w-4 h-4 text-emerald-800" />
                         <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedOrder.address || 'Pickup Selected'}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Audit Value</p>
                   <span className="text-2xl font-black text-emerald-800 dark:text-emerald-500 tabular-nums">${adjustedTotal.toFixed(2)}</span>
                </div>

                {deliveryCompany && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4 animate-in fade-in">
                    <Building2 className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
                    <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Delivery Partner</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{deliveryCompany}</p>
                    </div>
                  </div>
                )}

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Composition</p>
                   <div className="space-y-3">
                      {auditItems.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectedOrder.status === OrderStatus.PENDING && toggleItemApproval(item.id)} 
                          className={`flex justify-between items-center p-5 border rounded-2xl transition-all ${!item.isApproved ? 'bg-slate-50 dark:bg-slate-950 opacity-60' : 'bg-white dark:bg-slate-800 border-emerald-100 shadow-sm'} ${selectedOrder.status === OrderStatus.PENDING ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                           <div className="flex items-center gap-4">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                               {item.isApproved ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                             </div>
                             <span className={`text-xs font-black uppercase ${item.isApproved ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{item.quantity}x {item.name}</span>
                           </div>
                           <span className="text-xs font-black text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {selectedOrder.status === OrderStatus.PROCESSING && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Delivery Company Name
                    </label>
                    <input type="text" value={deliveryCompany} onChange={e => setDeliveryCompany(e.target.value)} placeholder="e.g. DoorDash, Boutique Courier..." className="w-full p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Chef Directive
                  </label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Instructions will be sent to patron..." className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none h-28 resize-none" />
                </div>
             </div>

             <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 shrink-0">
                {selectedOrder.status === OrderStatus.PENDING ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleBatchAction(OrderStatus.REJECTED)} disabled={isProcessingApproval} className="py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50">Reject Batch</button>
                    <button onClick={() => handleBatchAction(OrderStatus.APPROVED)} disabled={isProcessingApproval || auditItems.every(i => !i.isApproved)} className="py-5 bg-emerald-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">{isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Approve Batch</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(selectedOrder.status === OrderStatus.APPROVED || selectedOrder.status === OrderStatus.PAID) && (
                      <button onClick={() => handleBatchAction(OrderStatus.PROCESSING)} disabled={isProcessingApproval} className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                        {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />} Start Processing
                      </button>
                    )}
                    {selectedOrder.status === OrderStatus.PROCESSING && (
                      <button 
                        onClick={() => handleBatchAction(OrderStatus.READY_TO_DELIVERY)} 
                        disabled={isProcessingApproval || !deliveryCompany.trim()}
                        className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Box className="w-5 h-5" />} 
                        {deliveryCompany.trim() ? 'Mark READY TO DELIVERY' : 'Provide Delivery Company'}
                      </button>
                    )}
                    {selectedOrder.status === OrderStatus.READY_TO_DELIVERY && (
                      <button onClick={() => handleBatchAction(OrderStatus.ON_THE_WAY)} disabled={isProcessingApproval} className="py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                        {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />} Mark ON THE WAY
                      </button>
                    )}
                    {selectedOrder.status === OrderStatus.ON_THE_WAY && (
                      <button onClick={() => handleBatchAction(OrderStatus.DELIVERED)} disabled={isProcessingApproval} className="py-5 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                        {isProcessingApproval ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Mark DELIVERED
                      </button>
                    )}
                    <button onClick={() => !isProcessingApproval && setSelectedOrderId(null)} className="py-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Close Audit</button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Artisan Creation Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isProcessingApproval && setIsAddingProduct(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black uppercase mb-8">{editingProduct ? 'Modify Artisan Item' : 'Artisan Item Registration'}</h3>
            <form onSubmit={handleProductSave} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="Item Identity" required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" />
                 <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} placeholder="Price" required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" />
               </div>
               <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black uppercase outline-none"><option value="NON VEG">NON VEG</option><option value="VEG">VEG</option><option value="SWEETS">SWEETS</option><option value="SNACKS">SNACKS</option></select>
               <div onClick={() => fileInputRef.current?.click()} className="relative w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-50 dark:bg-slate-950">
                 {isUploadingImage ? <Loader2 className="animate-spin text-emerald-800" /> : productForm.image ? <img src={productForm.image} className="w-full h-full object-cover" /> : <><Upload className="w-8 h-8 text-slate-300" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Asset</span></>}
                 <input type="file" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" />
               </div>
               <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Culinary narrative..." className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium h-24 outline-none resize-none" />
               <button type="submit" disabled={isProcessingApproval || isUploadingImage} className="w-full py-5 bg-emerald-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                 {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Commit to Catalog
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
