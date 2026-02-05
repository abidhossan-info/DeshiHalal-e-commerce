
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem, Review } from '../types';
import { 
  X, ShieldCheck, ChefHat, Loader2, Trash2, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, Box,
  Plus, RefreshCcw, Save, Star, DollarSign, Package, Utensils, Send,
  Quote, MessageSquare, UserPlus, MapPin, ThumbsUp, Eye, Users as UsersIcon, TrendingUp, Search, 
  AlertTriangle, Filter, Check, ShoppingBag, MoonStar, Calendar, Sparkles, Image as ImageIcon,
  Upload, FileImage, Info, UserMinus
} from 'lucide-react';
import { supabase } from '../supabase';

const COURIER_PARTNERS = ['Local Dispatch', 'UberEats', 'DoorDash', 'DHL Express', 'Grab Food', 'Personal Pickup'];
const CATEGORIES = ['NON VEG', 'VEG', 'SWEETS', 'SNACKS', 'DRINKS'];

interface AdminDashboardProps {
  orders: Order[];
  updateStatus: (id: string, status: OrderStatus, note?: string, items?: CartItem[], deliveryCompany?: string) => Promise<void>;
  currentUser: UserType | null;
  products: Product[];
  setProducts: (p: Product[]) => void;
  testimonials: Testimonial[];
  setTestimonials: (t: Testimonial[]) => void;
  reviews: Review[];
  setReviews: (r: Review[]) => void;
  refreshOrders: () => Promise<void>;
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
  setReviews,
  refreshOrders
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'staff' | 'testimonials' | 'reviews' | 'metrics'>('batches');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [adminNote, setAdminNote] = useState('');
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'AUDITED'>('PENDING');
  const [deliveryCompany, setDeliveryCompany] = useState('');

  // Inventory UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'NON VEG',
    stockStatus: StockStatus.IN_STOCK,
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: true
  });

  // Staff Management States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '' });
  const [staffList, setStaffList] = useState<UserType[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Testimonial Modal State
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', text: '' });

  const liveSelectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  useEffect(() => { 
    refreshOrders();
    if (activeTab === 'staff') fetchStaff();
  }, [refreshOrders, activeTab]);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'ADMIN');
      if (data) setStaffList(data as UserType[]);
    } catch (err) {
      console.error("Staff fetch error:", err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (liveSelectedOrder) {
      setAuditItems(Array.isArray(liveSelectedOrder.items) ? liveSelectedOrder.items.map(item => ({ 
        ...item, 
        isApproved: item.isApproved !== false 
      })) : []);
      setAdminNote(liveSelectedOrder.adminNote || '');
      setDeliveryCompany(liveSelectedOrder.deliveryCompany || '');
    }
  }, [selectedOrderId, liveSelectedOrder]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshOrders();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter === 'PENDING') list = orders.filter(o => o.status === OrderStatus.PENDING);
    else if (orderFilter === 'AUDITED') list = orders.filter(o => o.status !== OrderStatus.PENDING && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.REJECTED);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, orderFilter]);

  const stats = useMemo(() => {
    const totalRev = orders
      .filter(o => [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.READY_TO_DELIVERY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status))
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const activeCount = orders.filter(o => ![OrderStatus.PENDING, OrderStatus.DELIVERED, OrderStatus.REJECTED].includes(o.status)).length;
    const deliveredCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    return { totalRev, pendingCount, activeCount, deliveredCount, totalProducts: products.length };
  }, [orders, products]);

  // Inventory CRUD
  const handleOpenProductModal = (p?: Product) => {
    setStorageError(null);
    if (p) {
      setEditingProduct(p);
      setProductForm({
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        image: p.image,
        category: p.category,
        stockStatus: p.stockStatus,
        isMondaySpecial: p.isMondaySpecial,
        isRamadanSpecial: p.isRamadanSpecial,
        isNew: p.isNew
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        image: '',
        category: 'NON VEG',
        stockStatus: StockStatus.IN_STOCK,
        isMondaySpecial: false,
        isRamadanSpecial: false,
        isNew: true
      });
    }
    setIsProductModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStorageError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`; 

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (error) {
        if ((error as any).status === 404 || error.message.toLowerCase().includes('not found')) {
          setStorageError("Storage bucket 'products' not detected. Defaulting to high-quality Base64 encoding. Your image will still save correctly!");
          setIsUploadingImage(false);
          return;
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      console.warn("Storage sync failed, keeping Base64 payload:", err);
      setStorageError("Network interruption. Your image is stored in the artisan ledger via Base64.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);

    const dbPayload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      image: productForm.image,
      category: productForm.category,
      stock_status: productForm.stockStatus,
      monday_special: productForm.isMondaySpecial,
      ramadan_special: productForm.isRamadanSpecial,
      is_new: productForm.isNew
    };

    try {
      if (editingProduct) {
        const { data, error } = await supabase.from('products').update(dbPayload).eq('id', editingProduct.id).select().single();
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? mapDbProduct(data) : p));
      } else {
        const { data, error } = await supabase.from('products').insert([dbPayload]).select().single();
        if (error) throw error;
        setProducts([mapDbProduct(data), ...products]);
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error("Product sync failed:", err);
      alert("Submission Denied: Database synchronization error.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Permanently retire this culinary creation? This action cannot be undone.")) return;
    setUpdatingProductId(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error("Deletion error:", err);
      alert("Failed to retire product.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Staff Management
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStaff(true);
    
    const fallbackId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    try {
      const { data, error } = await supabase.from('profiles').insert([{
        id: fallbackId(),
        name: staffForm.name.trim(),
        email: staffForm.email.trim().toLowerCase(),
        role: 'ADMIN'
      }]).select().single();

      if (error) throw error;
      setStaffList([...staffList, data as UserType]);
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '' });
    } catch (err) {
      console.error("Staff creation failed:", err);
      alert("Authorization Failed: Check database connectivity or permissions.");
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Protocol Denial: You cannot revoke your own Head Chef authorization.");
      return;
    }
    if (!confirm("Confirm: Permanently revoke Head Chef authorization for this member? Access will be terminated immediately.")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setStaffList(staffList.filter(s => s.id !== id));
    } catch (err) {
      console.error("Staff removal error:", err);
      alert("Revocation failed.");
    }
  };

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

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    setUpdatingProductId(productId);
    const dbUpdates: any = {};
    if (updates.stockStatus !== undefined) dbUpdates.stock_status = updates.stockStatus;
    if (updates.isMondaySpecial !== undefined) dbUpdates.monday_special = updates.isMondaySpecial;
    if (updates.isRamadanSpecial !== undefined) dbUpdates.ramadan_special = updates.isRamadanSpecial;
    if (updates.isNew !== undefined) dbUpdates.is_new = updates.isNew;

    try {
      const { error } = await supabase.from('products').update(dbUpdates).eq('id', productId);
      if (error) throw error;
      setProducts(products.map(p => p.id === productId ? { ...p, ...updates } : p));
    } catch (err) {
      console.error("Inventory sync error:", err);
      alert("Inventory sync error. Check database permissions.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
      if (error) throw error;
      setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } catch (err) { 
      console.error("Review approval error:", err);
      alert("Review approval error."); 
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Permanently remove this feedback?")) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) { 
      console.error("Review deletion error:", err);
      alert("Review deletion error."); 
    }
  };

  const handleOpenTestimonialModal = (t?: Testimonial) => {
    if (t) { 
      setEditingTestimonial(t); 
      setTestimonialForm({ name: t.name, role: t.role, text: t.text }); 
    } else { 
      setEditingTestimonial(null); 
      setTestimonialForm({ name: '', role: '', text: '' }); 
    }
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTestimonial(true);
    try {
      const payload = {
        name: testimonialForm.name,
        role: testimonialForm.role,
        text: testimonialForm.text
      };

      if (editingTestimonial) {
        const { data, error } = await supabase.from('testimonials').update(payload).eq('id', editingTestimonial.id).select().single();
        if (error) throw error;
        const mapped = { ...data, createdAt: data.created_at };
        setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? mapped : t));
      } else {
        const { data, error } = await supabase.from('testimonials').insert([payload]).select().single();
        if (error) throw error;
        const mapped = { ...data, createdAt: data.created_at };
        setTestimonials([mapped, ...testimonials]);
      }
      setIsTestimonialModalOpen(false);
    } catch (err) { 
      console.error("Testimonial sync failed:", err);
      alert("Testimonial sync failed."); 
    } finally { 
      setIsSubmittingTestimonial(false); 
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Permanently remove this sentiment?")) return;
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (err) { 
      console.error("Testimonial deletion error:", err);
      alert("Testimonial deletion error."); 
    }
  };

  const toggleItemAudit = (itemId: string) => {
    setAuditItems(prev => prev.map(item => item.id === itemId ? { ...item, isApproved: !item.isApproved } : item));
  };

  const handleBatchAction = async (status: OrderStatus) => {
    if (!selectedOrderId) return;
    if (status === OrderStatus.READY_TO_DELIVERY && !deliveryCompany.trim()) { 
      alert("Please assign a logistics partner or select 'Personal Pickup' before marking as ready."); 
      return; 
    }
    setIsProcessingApproval(true);
    try {
      await updateStatus(selectedOrderId, status, adminNote.trim(), auditItems, deliveryCompany.trim());
      if (status === OrderStatus.DELIVERED || status === OrderStatus.REJECTED) {
        setSelectedOrderId(null);
      }
    } catch (error) { 
      console.error("Batch transition error:", error);
      alert("Batch transition error."); 
    } finally { 
      setIsProcessingApproval(false);
    }
  };

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-6"><Ban className="w-10 h-10" /></div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-slate-500 mt-2 font-medium">Head Chef authorization required to access the Command Hub.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 animate-in fade-in duration-500 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-[1.5rem] flex items-center justify-center shadow-2xl shrink-0"><ChefHat className="w-8 h-8" /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Command Hub</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Secure Ops</p>
              <button onClick={handleManualRefresh} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isRefreshing ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-600'}`}><RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Requests</button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(['batches', 'inventory', 'staff', 'testimonials', 'reviews', 'metrics'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedOrderId(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[60vh]">
        {activeTab === 'batches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Order Sidebar */}
            <div className={`lg:col-span-4 space-y-4 ${selectedOrderId ? 'hidden lg:block' : 'block'}`}>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <button onClick={() => setOrderFilter('PENDING')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${orderFilter === 'PENDING' ? 'bg-white dark:bg-slate-800 text-emerald-700 shadow-sm' : 'text-slate-400'}`}>Pending</button>
                <button onClick={() => setOrderFilter('AUDITED')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${orderFilter === 'AUDITED' ? 'bg-white dark:bg-slate-800 text-emerald-700 shadow-sm' : 'text-slate-400'}`}>Active</button>
                <button onClick={() => setOrderFilter('ALL')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${orderFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-emerald-700 shadow-sm' : 'text-slate-400'}`}>All</button>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <button key={order.id} onClick={() => setSelectedOrderId(order.id)} className={`w-full p-6 text-left border rounded-[2rem] transition-all relative ${selectedOrderId === order.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200'}`}>
                    <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">#{order.id.slice(0, 8)}</span><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500'}`}>{order.status}</span></div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2">${(order.total || 0).toFixed(2)} — {new Date(order.createdAt).toLocaleDateString()}</p>
                  </button>
                )) : (
                  <div className="py-20 text-center opacity-30 font-black uppercase text-xs">No orders in queue</div>
                )}
              </div>
            </div>

            {/* Order Detail View */}
            <div className={`lg:col-span-8 ${selectedOrderId ? 'block' : 'hidden lg:block'}`}>
              {liveSelectedOrder ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Batch Audit</h2><p className="text-[10px] font-black text-slate-400 uppercase mt-1">Order Ref: {liveSelectedOrder.id}</p></div>
                    <button onClick={() => setSelectedOrderId(null)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:text-rose-600 transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="p-8 md:p-12">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-inner">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patron Identity</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-800">{liveSelectedOrder.customerName.charAt(0)}</div>
                            <div>
                               <p className="text-sm font-black uppercase tracking-tight">{liveSelectedOrder.customerName}</p>
                               <p className="text-[10px] text-slate-400">{liveSelectedOrder.customerEmail || 'No Email'}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Delivery Address</p>
                             <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{liveSelectedOrder.address || 'Pickup Required'}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Checklist</p>
                          <div className="space-y-2">
                            {auditItems.map(item => (
                              <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.isApproved ? 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800' : 'bg-rose-50/30 border-rose-100 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => liveSelectedOrder.status === OrderStatus.PENDING && toggleItemAudit(item.id)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.isApproved ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                    {item.isApproved && <Check className="w-3 h-3" />}
                                  </button>
                                  <span className={`text-[11px] font-black uppercase ${!item.isApproved ? 'line-through text-slate-300' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                                </div>
                                <span className="text-xs font-black tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chef's Audit Note</label>
                          <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Ingredient status, freshness confirmation..." className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-medium outline-none resize-none transition-all shadow-inner" />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Protocol Transition</h4>
                          
                          {liveSelectedOrder.status === OrderStatus.PENDING && (
                            <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => handleBatchAction(OrderStatus.APPROVED)} disabled={isProcessingApproval} className="py-6 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-900">{isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} APPROVE</button>
                              <button onClick={() => handleBatchAction(OrderStatus.REJECTED)} disabled={isProcessingApproval} className="py-6 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100">REJECT</button>
                            </div>
                          )}

                          {liveSelectedOrder.status === OrderStatus.PAID && (
                            <button onClick={() => handleBatchAction(OrderStatus.PROCESSING)} disabled={isProcessingApproval} className="w-full py-6 bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-800"><Utensils className="w-5 h-5" /> START KITCHEN PREP</button>
                          )}

                          {liveSelectedOrder.status === OrderStatus.PROCESSING && (
                            <div className="space-y-5">
                               <div className="space-y-3">
                                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Assign Logistics Partner</label>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {COURIER_PARTNERS.map(partner => (
                                      <button 
                                        key={partner} 
                                        onClick={() => setDeliveryCompany(partner)}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${deliveryCompany === partner ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-emerald-300'}`}
                                      >
                                        {partner}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="relative">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                      value={deliveryCompany} 
                                      onChange={(e) => setDeliveryCompany(e.target.value)} 
                                      placeholder="Or input custom partner name..." 
                                      className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all shadow-inner" 
                                    />
                                  </div>
                               </div>
                               <button onClick={() => handleBatchAction(OrderStatus.READY_TO_DELIVERY)} disabled={isProcessingApproval} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700"><Package className="w-5 h-5" /> MARK AS READY</button>
                            </div>
                          )}

                          {liveSelectedOrder.status === OrderStatus.READY_TO_DELIVERY && (
                            <button onClick={() => handleBatchAction(OrderStatus.ON_THE_WAY)} disabled={isProcessingApproval} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700"><Send className="w-5 h-5" /> DISPATCH BATCH</button>
                          )}

                          {liveSelectedOrder.status === OrderStatus.ON_THE_WAY && (
                            <button onClick={() => handleBatchAction(OrderStatus.DELIVERED)} disabled={isProcessingApproval} className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black"><CheckCircle className="w-5 h-5" /> CONFIRM FULFILLMENT</button>
                          )}

                          {[OrderStatus.DELIVERED, OrderStatus.REJECTED].includes(liveSelectedOrder.status) && (
                            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Finalized: {liveSelectedOrder.status}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-40 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20">
                   <ShoppingBag className="w-16 h-16 text-slate-100 dark:text-slate-800 mb-6" />
                   <p className="text-slate-400 font-black uppercase text-xs tracking-[0.4em]">Audit Selection Required</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Boutique Inventory</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live management of artisanal recipes</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group flex-grow md:flex-grow-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Filter by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold w-full md:min-w-[320px] outline-none shadow-inner" />
                </div>
                <button onClick={() => handleOpenProductModal()} className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shrink-0">
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Creation</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                  <div key={product.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col group hover:border-emerald-200 transition-all relative">
                    {updatingProductId === product.id && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-10 rounded-[2.5rem] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-6 min-w-0">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-50 shadow-inner">
                            <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">{product.category}</p>
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white leading-tight mb-2 truncate">{product.name}</h4>
                            <p className="text-xs font-black text-emerald-700">${product.price.toFixed(2)}</p>
                          </div>
                       </div>
                       <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => handleOpenProductModal(product)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-emerald-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Protocol</p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(StockStatus) as Array<keyof typeof StockStatus>).map(statusKey => {
                            const statusValue = StockStatus[statusKey];
                            const isActive = product.stockStatus === statusValue;
                            return (
                              <button 
                                key={statusValue} 
                                onClick={() => updateProduct(product.id, { stockStatus: statusValue })}
                                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${isActive ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:text-slate-900'}`}
                              >
                                {statusValue.replace('_', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Visibility</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => updateProduct(product.id, { isMondaySpecial: !product.isMondaySpecial })}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${product.isMondaySpecial ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300'}`}
                          >
                            <Calendar className="w-4 h-4 mb-1" />
                            <span className="text-[7px] font-black uppercase tracking-widest">Monday</span>
                          </button>
                          <button 
                            onClick={() => updateProduct(product.id, { isRamadanSpecial: !product.isRamadanSpecial })}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${product.isRamadanSpecial ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300'}`}
                          >
                            <MoonStar className="w-4 h-4 mb-1" />
                            <span className="text-[7px] font-black uppercase tracking-widest">Ramadan</span>
                          </button>
                          <button 
                            onClick={() => updateProduct(product.id, { isNew: !product.isNew })}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${product.isNew ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300'}`}
                          >
                            <Sparkles className="w-4 h-4 mb-1" />
                            <span className="text-[7px] font-black uppercase tracking-widest">New</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-40 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20">
                   <Box className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                   <p className="text-slate-400 font-black uppercase text-xs tracking-[0.4em]">No matching inventory records</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Kitchen Staff</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized boutique personnel</p>
              </div>
              <button onClick={() => setIsStaffModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 w-full sm:w-auto justify-center">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            </div>
            
            {isLoadingStaff ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-800" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {staffList.map(staff => (
                  <div key={staff.id} className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all overflow-hidden">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center font-black text-emerald-800 text-xl md:text-2xl border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm md:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{staff.name}</h4>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-700 uppercase mt-0.5 md:mt-1">Authorized {staff.role}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 md:mt-2 truncate" title={staff.email}>{staff.email}</p>
                      </div>
                    </div>
                    {staff.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleDeleteStaff(staff.id)} 
                        className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition-all shrink-0 md:opacity-0 md:group-hover:opacity-100"
                        title="Revoke Authorization"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {staffList.length === 0 && (
                   <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/20">
                      <UsersIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No additional staff records found</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Patron Sentiments</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Public Narratives</p>
              </div>
              <button onClick={() => handleOpenTestimonialModal()} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Add Testimonial
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {testimonials.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col group hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-6">
                      <Quote className="w-8 h-8 text-emerald-100 dark:text-slate-800" />
                      <div className="flex gap-2">
                         <button onClick={() => handleOpenTestimonialModal(t)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-emerald-700 transition-colors shadow-sm"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => handleDeleteTestimonial(t.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-rose-600 transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                   <p className="text-slate-700 dark:text-slate-300 italic text-sm font-medium leading-relaxed mb-8 flex-grow break-words">"{t.text}"</p>
                   <div className="flex items-center gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-emerald-800 text-xs shrink-0">{t.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase tracking-tight truncate">{t.name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 truncate">{t.role}</p>
                      </div>
                   </div>
                </div>
              ))}
              {testimonials.length === 0 && (
                <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20">
                  <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No Sentiments Recorded Yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-10">
                <div><h2 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Patron Feedbacks</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit and Publish verified insights</p></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {reviews.map(r => (
                 <div key={r.id} className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border transition-all ${r.isApproved ? 'border-emerald-100/50 opacity-80' : 'border-amber-200 shadow-xl ring-4 ring-amber-500/5'}`}>
                   <div className="flex justify-between items-start mb-6">
                      {!r.isApproved ? <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 animate-pulse"><Clock className="w-2.5 h-2.5" /> Pending</span> : <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Published</span>}
                      <div className="flex gap-2">
                         {!r.isApproved && <button onClick={() => handleApproveReview(r.id)} className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl"><ThumbsUp className="w-4 h-4" /></button>}
                         <button onClick={() => handleDeleteReview(r.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                   <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} />)}</div>
                   <p className="text-slate-700 dark:text-slate-300 italic text-sm font-medium leading-relaxed mb-6">"{r.comment}"</p>
                   <p className="text-[8px] font-black text-slate-400 uppercase">Patron: {r.userName} — ID: {r.productId}</p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
             <div className="bg-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <DollarSign className="w-10 h-10 text-emerald-400 mb-6" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-5xl font-black tabular-nums">${stats.totalRev.toFixed(0)}</p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <Clock className="w-10 h-10 text-amber-600 mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Awaiting Audit</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pendingCount}</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <TrendingUp className="w-10 h-10 text-indigo-700 mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Batches</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{stats.activeCount}</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600 mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fulfilled Total</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{stats.deliveredCount}</p>
             </div>
          </div>
        )}
      </div>

      {/* Staff Editor Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setIsStaffModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Authorize Staff</h3>
                <button onClick={() => setIsStaffModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-rose-600 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSaveStaff} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Member Name</label>
                  <input 
                    type="text" 
                    value={staffForm.name} 
                    onChange={e => setStaffForm({...staffForm, name: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all" 
                    required 
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email</label>
                  <input 
                    type="email" 
                    value={staffForm.email} 
                    onChange={e => setStaffForm({...staffForm, email: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all" 
                    required 
                    placeholder="staff@deshi.com"
                  />
                </div>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-4">
                   <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                   <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 leading-relaxed">Adding a member grants full administrative access to the Command Hub. This user will have 'Head Chef' credentials.</p>
                </div>
                <button type="submit" disabled={isSubmittingStaff} className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-900 transition-all active:scale-95 disabled:opacity-50">
                  {isSubmittingStaff ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Create Authorized Entry
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Product Editor Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-8">{editingProduct ? 'Refine Creation' : 'New Culinary Offering'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Product Name</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Price (USD)</label>
                  <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full h-24 px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none resize-none focus:ring-4 focus:ring-emerald-700/5" required />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase">Product Imagery</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="relative group">
                      <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="url" 
                        value={productForm.image} 
                        onChange={e => setProductForm({...productForm, image: e.target.value})} 
                        placeholder="Public Image URL..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all" 
                      />
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden" 
                        accept="image/*"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95"
                      >
                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploadingImage ? 'Retouching Asset...' : 'Upload New Photo'}
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                    {productForm.image ? (
                      <img src={productForm.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center">
                        <FileImage className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No Visual Assigned</p>
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {storageError && (
                  <div className="flex gap-4 p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-[2rem] animate-in fade-in zoom-in duration-300">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                      {storageError}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Category</label>
                    <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Initial Stock Status</label>
                    <select value={productForm.stockStatus} onChange={e => setProductForm({...productForm, stockStatus: e.target.value as StockStatus})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none">
                       {Object.values(StockStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Special Designations</p>
                <div className="flex flex-wrap gap-4">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={productForm.isMondaySpecial} onChange={e => setProductForm({...productForm, isMondaySpecial: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-emerald-800 focus:ring-emerald-500" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Monday Special</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={productForm.isRamadanSpecial} onChange={e => setProductForm({...productForm, isRamadanSpecial: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-amber-600 focus:ring-amber-500" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Ramadan Special</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={productForm.isNew} onChange={e => setProductForm({...productForm, isNew: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Market Debut (New)</span>
                   </label>
                </div>
              </div>

              <button type="submit" disabled={isSubmittingProduct || isUploadingImage} className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-900 transition-all active:scale-95 disabled:opacity-50">
                {isSubmittingProduct ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} {editingProduct ? 'Commit Changes' : 'Initialize Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsTestimonialModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight">{editingTestimonial ? 'Refine Sentiment' : 'Record Sentiment'}</h3>
              <button onClick={() => setIsTestimonialModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-rose-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTestimonial} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patron Name</label>
                <input type="text" value={testimonialForm.name} onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all" required placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity / Locale</label>
                <input type="text" value={testimonialForm.role} onChange={e => setTestimonialForm({...testimonialForm, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-700/5 transition-all" required placeholder="e.g. Seattle, WA" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Boutique Experience</label>
                <textarea value={testimonialForm.text} onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})} className="w-full h-36 px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none resize-none focus:ring-4 focus:ring-emerald-700/5 transition-all" required placeholder="Share the culinary journey..." />
              </div>
              <button type="submit" disabled={isSubmittingTestimonial} className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-900 transition-all active:scale-95 disabled:opacity-50">
                {isSubmittingTestimonial ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} {editingTestimonial ? 'Update Sentiment' : 'Publish Sentiment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
