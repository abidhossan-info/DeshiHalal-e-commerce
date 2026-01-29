import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  Package, BarChart3, Save, AlertTriangle, 
  Plus, RefreshCcw, Upload, ClipboardList, ChefHat, Mail, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar, CreditCard, Box, PieChart, TrendingUp, Users, Zap, ShoppingBag,
  Star // Added missing Star import
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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, 
  updateStatus, 
  currentUser, 
  products, 
  setProducts, 
  testimonials, 
  setTestimonials 
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'testimonials' | 'metrics'>('batches');
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
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);

  // Fix: Added adjustedTotal calculation based on item approval status in audit view
  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved !== false ? acc + (item.price * item.quantity) : acc, 0);
  }, [auditItems]);

  // Fix: Added toggleItemApproval function to handle batch auditing
  const toggleItemApproval = (itemId: string) => {
    setAuditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isApproved: !item.isApproved } : item
    ));
  };

  // Product Form State
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

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
  
  useEffect(() => {
    if (selectedOrder) {
      setAuditItems(selectedOrder.items);
      setAdminNote(selectedOrder.adminNote || '');
    }
  }, [selectedOrder]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PENDING), [orders]);
  const totalRevenue = useMemo(() => orders.filter(o => [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.READY_TO_DELIVERY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status)).reduce((acc, o) => acc + o.total, 0), [orders]);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) return null;

  // --- Image Upload Logic ---
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-catalog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      console.error("Image Upload Error:", err);
      // Fallback preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Inventory Actions ---
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
      setProductForm(INITIAL_NEW_PRODUCT);
    } catch (err) {
      console.error("Product Save Error:", err);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleProductDelete = async (id: string) => {
    if (!window.confirm("Permanently remove this artisan item?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  // --- Testimonial Actions ---
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

  const handleTestimonialDelete = async (id: string) => {
    if (!window.confirm("Discard this sentiment?")) return;
    try {
      await supabase.from('testimonials').delete().eq('id', id);
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleBatchAction = async (status: OrderStatus) => {
    if (!selectedOrderId || !selectedOrder) return;
    setIsProcessingApproval(true);
    const finalItems = (status === OrderStatus.APPROVED) ? auditItems : selectedOrder.items;
    updateStatus(selectedOrderId, status, adminNote, finalItems);
    setIsProcessingApproval(false);
    setSelectedOrderId(null);
  };

  // --- Metrics Aggregation ---
  const metrics = useMemo(() => {
    const catMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    products.forEach(p => catMap[p.category] = (catMap[p.category] || 0) + 1);
    orders.forEach(o => statusMap[o.status] = (statusMap[o.status] || 0) + 1);
    
    const activeProducts = products.filter(p => p.stockStatus === StockStatus.IN_STOCK).length;
    return { catMap, statusMap, activeProducts };
  }, [products, orders]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-900/20 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Boutique Control Panel</h1>
            <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Zap className="w-3 h-3 fill-emerald-800" /> Operational Authority: Head Chef
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
          {(['batches', 'inventory', 'testimonials', 'metrics'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 lg:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 'batches' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-10 py-8">Batch Ref</th>
                    <th className="px-10 py-8 hidden md:table-cell">Patron Identity</th>
                    <th className="px-10 py-8">Boutique Value</th>
                    <th className="px-10 py-8">Current Phase</th>
                    <th className="px-10 py-8 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {orders.length > 0 ? orders.map(order => (
                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
                      <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">{order.id}</td>
                      <td className="px-10 py-8 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 hidden md:table-cell">{order.customerName}</td>
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
                      <td className="px-10 py-8 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-800 transition-colors inline" />
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No batches found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Artisanal Gallery</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage culinary assets and pricing</p>
              </div>
              <button 
                onClick={() => { setEditingProduct(null); setProductForm(INITIAL_NEW_PRODUCT); setIsAddingProduct(true); }}
                className="px-6 py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all flex items-center gap-3 shadow-xl shadow-emerald-900/10 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Artisan Item
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 border border-slate-50 dark:border-slate-800">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {p.isRamadanSpecial && <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg"><MoonStar className="w-4 h-4" /></div>}
                      {p.isMondaySpecial && <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg"><Clock className="w-4 h-4" /></div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate mb-1">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-slate-900 dark:text-white">${p.price.toFixed(2)}</p>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.stockStatus === StockStatus.IN_STOCK ? 'bg-emerald-50 text-emerald-700' : p.stockStatus === StockStatus.LOW_STOCK ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {p.stockStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingProduct(p); setProductForm(p); setIsAddingProduct(true); }}
                      className="p-3 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleProductDelete(p.id)}
                      className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Patron Sentiments</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Customer stories and curated feedback</p>
              </div>
              <button 
                onClick={() => { setTestimonialModalMode('ADD'); setTestimonialForm({ name: '', role: '', text: '' }); }}
                className="px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all flex items-center gap-3 shadow-xl shadow-rose-900/10 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Record Sentiment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-sm relative group hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center text-rose-600 font-black text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{t.name}</h4>
                      <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm italic font-medium leading-relaxed">"{t.text}"</p>
                  <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTestimonialId(t.id); setTestimonialForm(t); setTestimonialModalMode('EDIT'); }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleTestimonialDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* High-Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Revenue', val: `$${totalRevenue.toFixed(2)}`, icon: CreditCard, color: 'text-emerald-600' },
                { label: 'Batches', val: orders.length, icon: ShoppingBag, color: 'text-blue-600' },
                { label: 'Artisans', val: products.length, icon: Package, color: 'text-amber-600' },
                { label: 'Growth', val: '+12.4%', icon: TrendingUp, color: 'text-rose-600' }
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:scale-[1.02] transition-transform">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{kpi.val}</p>
                </div>
              ))}
            </div>

            {/* Detailed Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-800 dark:text-emerald-400"><BarChart3 className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Category Saturation</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory distribution across culinary types</p>
                  </div>
                </div>
                <div className="space-y-8">
                  {Object.entries(metrics.catMap).map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                        <span className="text-slate-500">{cat}</span>
                        <span className="text-slate-900 dark:text-white">{count} ARTISANS</span>
                      </div>
                      <div className="h-3 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div 
                          className="h-full bg-emerald-700 dark:bg-emerald-500 rounded-full transition-all duration-1000" 
                          // Fix: Cast count to number to resolve arithmetic type error
                          style={{ width: `${((count as number) / Math.max(1, products.length)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-white/10 rounded-2xl text-amber-500"><PieChart className="w-6 h-6" /></div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Phase Summary</h3>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(metrics.statusMap).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{status}</span>
                        <span className="text-lg font-black tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
              </div>
            </div>

            {/* Operational Insights */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-700 dark:text-amber-500"><Zap className="w-6 h-6" /></div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Chef's Operational Insight</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { title: 'Peak Activity', detail: 'Monday mornings see 40% more artisanal requests.', icon: Clock },
                   { title: 'Best Seller', detail: 'Mutton Kacchi continues to lead the Non-Veg gallery.', icon: Star },
                   { title: 'Stock Health', detail: `${metrics.activeProducts}/${products.length} items are currently at full availability.`, icon: Package }
                 ].map((insight, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <insight.icon className="w-5 h-5 text-emerald-800 dark:text-emerald-500 mb-4" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">{insight.title}</h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">{insight.detail}</p>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Modal (Shared UI) */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => !isProcessingApproval && setSelectedOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-lg"><ChefHat className="w-6 h-6" /></div>
                  <div><h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Audit Protocol</h3><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Batch: {selectedOrder.id}</p></div>
                </div>
                <button onClick={() => !isProcessingApproval && setSelectedOrderId(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"><X /></button>
             </div>
             
             <div className="p-8 space-y-8 overflow-y-auto flex-grow no-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Patron</p>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="font-black text-sm text-slate-900 dark:text-white uppercase">{selectedOrder.customerName}</span></div>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit Total</p>
                      {/* Fix: Use the defined adjustedTotal variable */}
                      <span className="text-2xl font-black text-emerald-800 dark:text-emerald-500 tabular-nums">${adjustedTotal.toFixed(2)}</span>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Selection (Verify Quality)</p>
                   <div className="space-y-3">
                      {auditItems.map((item, i) => (
                        <div key={i} onClick={() => selectedOrder.status === OrderStatus.PENDING && toggleItemApproval(item.id)} className={`flex justify-between items-center p-5 border rounded-2xl transition-all ${!item.isApproved ? 'bg-slate-50 dark:bg-slate-950 opacity-60' : 'bg-white dark:bg-slate-800 border-emerald-100 shadow-sm'} ${selectedOrder.status === OrderStatus.PENDING ? 'cursor-pointer' : 'cursor-default'}`}>
                           <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{item.isApproved ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</div><span className={`text-xs font-black uppercase ${item.isApproved ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{item.quantity}x {item.name}</span></div>
                           <span className="text-xs font-black text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Dispatch Directive</label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Inform patron of batch status..." className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all h-28 resize-none" />
                </div>
             </div>

             <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                {selectedOrder.status === OrderStatus.PENDING ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleBatchAction(OrderStatus.REJECTED)} disabled={isProcessingApproval} className="py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50">Deny Batch</button>
                    <button onClick={() => handleBatchAction(OrderStatus.APPROVED)} disabled={isProcessingApproval || auditItems.every(i => !i.isApproved)} className="py-5 bg-emerald-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">{isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Authorize Batch</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Progress States */}
                    {(selectedOrder.status === OrderStatus.APPROVED || selectedOrder.status === OrderStatus.PAID) && (
                      <button onClick={() => handleBatchAction(OrderStatus.PROCESSING)} className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3"><Flame className="w-5 h-5" /> Initiate Processing</button>
                    )}
                    {selectedOrder.status === OrderStatus.PROCESSING && (
                      <button onClick={() => handleBatchAction(OrderStatus.READY_TO_DELIVERY)} className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3"><Box className="w-5 h-5" /> Mark Ready</button>
                    )}
                    {selectedOrder.status === OrderStatus.READY_TO_DELIVERY && (
                      <button onClick={() => handleBatchAction(OrderStatus.ON_THE_WAY)} className="py-5 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center gap-3"><Truck className="w-5 h-5" /> Dispatch Batch</button>
                    )}
                    {selectedOrder.status === OrderStatus.ON_THE_WAY && (
                      <button onClick={() => handleBatchAction(OrderStatus.DELIVERED)} className="py-5 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl flex items-center justify-center gap-3"><CheckCircle2 className="w-5 h-5" /> Confirm Fulfillment</button>
                    )}
                    <button onClick={() => setSelectedOrderId(null)} className="py-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Close Audit</button>
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
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black uppercase mb-8">{editingProduct ? 'Modify Artisan Item' : 'Register New Artisan'}</h3>
            <form onSubmit={handleProductSave} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Identity</label><input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" /></div>
                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Price</label><input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" /></div>
               </div>
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Category</label><select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black uppercase outline-none"><option value="NON VEG">NON VEG</option><option value="VEG">VEG</option><option value="SWEETS">SWEETS</option><option value="SNACKS">SNACKS</option></select></div>
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Stock Status</label><select value={productForm.stockStatus} onChange={e => setProductForm({...productForm, stockStatus: e.target.value as StockStatus})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black uppercase outline-none"><option value={StockStatus.IN_STOCK}>IN STOCK</option><option value={StockStatus.LOW_STOCK}>LOW STOCK</option><option value={StockStatus.SOLD_OUT}>SOLD OUT</option></select></div>
               
               <div className="space-y-2">
                <input type="file" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />
                <div onClick={triggerFileInput} className={`relative w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${productForm.image ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
                  {isUploadingImage ? <Loader2 className="w-8 h-8 animate-spin text-emerald-700" /> : productForm.image ? <img src={productForm.image} className="w-full h-full object-cover" /> : <><Upload className="w-8 h-8 text-slate-300 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Visual Asset</span></>}
                </div>
               </div>

               <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Describe the culinary artisanal details..." className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium h-24 outline-none" />
               
               <div className="grid grid-cols-2 gap-4">
                 <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800"><input type="checkbox" checked={productForm.isMondaySpecial} onChange={e => setProductForm({...productForm, isMondaySpecial: e.target.checked})} /><span className="text-[10px] font-black uppercase tracking-widest">Monday Menu</span></label>
                 <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800"><input type="checkbox" checked={productForm.isRamadanSpecial} onChange={e => setProductForm({...productForm, isRamadanSpecial: e.target.checked})} /><span className="text-[10px] font-black uppercase tracking-widest">Ramadan Season</span></label>
               </div>
               
               <button type="submit" disabled={isProcessingApproval || isUploadingImage} className="w-full py-5 bg-emerald-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">{isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save to Catalog</button>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Creation Modal */}
      {testimonialModalMode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isProcessingApproval && setTestimonialModalMode(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black uppercase mb-8">{testimonialModalMode === 'EDIT' ? 'Modify Sentiment' : 'Record Sentiment'}</h3>
            <form onSubmit={handleTestimonialSave} className="space-y-6">
              <input value={testimonialForm.name} onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})} placeholder="Patron Name" required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" />
              <input value={testimonialForm.role} onChange={e => setTestimonialForm({...testimonialForm, role: e.target.value})} placeholder="Locale / Identity (e.g. Seattle, WA)" required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none" />
              <textarea value={testimonialForm.text} onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})} placeholder="Patron's words..." required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium h-32 outline-none resize-none" />
              <button type="submit" disabled={isProcessingApproval} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">{isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />} Publish Sentiment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;