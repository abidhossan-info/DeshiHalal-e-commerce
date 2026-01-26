
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  LayoutDashboard, Package, BarChart3, Settings, Save, AlertTriangle, 
  DollarSign, Plus, Image as ImageIcon, FileText, Tag, RefreshCcw, Eye, Camera, Upload, ClipboardList, ChefHat, Phone, Mail, MapPin, Send, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

interface AdminDashboardProps {
  orders: Order[];
  updateStatus: (id: string, s: OrderStatus, note?: string, items?: CartItem[]) => void;
  currentUser: UserType | null;
  products: Product[];
  setProducts: (p: Product[]) => void;
  testimonials: Testimonial[];
  setTestimonials: (t: Testimonial[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, updateStatus, currentUser, products, setProducts, testimonials, setTestimonials }) => {
  // 1. State Management
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'testimonials' | 'metrics'>('batches');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // Testimonial Management States
  const [testimonialModalMode, setTestimonialModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Testimonial | Omit<Testimonial, 'id' | 'createdAt'>>({
    name: '',
    role: 'Patron',
    text: ''
  });

  const [adminNote, setAdminNote] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  
  // Tracking item approvals for the currently selected order in modal
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);

  // Dynamic Category state
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Form initialization constants
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

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>(INITIAL_NEW_PRODUCT);

  // Memoized Computations
  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
  
  // Initialize audit items when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      setAuditItems(selectedOrder.items);
      setAdminNote(selectedOrder.adminNote || '');
    }
  }, [selectedOrder]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PENDING), [orders]);
  const totalRevenue = useMemo(() => orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.DELIVERED).reduce((acc, o) => acc + o.total, 0), [orders]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);

  // Security Gate
  if (!currentUser || currentUser.role !== UserRole.ADMIN) return null;

  // Handlers
  const toggleItemApproval = (itemId: string) => {
    setAuditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isApproved: !item.isApproved } : item
    ));
  };

  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved ? acc + (item.price * item.quantity) : acc, 0);
  }, [auditItems]);

  const handleAction = (status: OrderStatus) => {
    if (!selectedOrderId || !selectedOrder) return;
    
    // If approving, we use the auditItems
    const finalItems = status === OrderStatus.APPROVED ? auditItems : selectedOrder.items;

    if (status === OrderStatus.APPROVED && selectedOrder.userId.startsWith('GUEST')) {
      setIsProcessingApproval(true);
      // Simulate sending payment link
      setTimeout(() => {
        updateStatus(selectedOrderId, status, adminNote, finalItems);
        setIsProcessingApproval(false);
        setSelectedOrderId(null);
        setAdminNote('');
      }, 1500);
    } else {
      updateStatus(selectedOrderId, status, adminNote, finalItems);
      setSelectedOrderId(null);
      setAdminNote('');
    }
  };

  const handleDeny = () => {
    if (!adminNote.trim() || adminNote === 'Rejected: [Please specify why this batch cannot be fulfilled, e.g., missing ingredients or high kitchen load]') {
      setAdminNote('Rejected: [Please specify why this batch cannot be fulfilled, e.g., missing ingredients or high kitchen load]');
    } else {
      handleAction(OrderStatus.REJECTED);
    }
  };

  const saveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
  };

  const createProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `PROD-${Date.now()}`;
    setProducts([{ ...newProduct, id }, ...products]);
    setIsAddingProduct(false);
    resetNewProductForm();
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (testimonialModalMode === 'ADD') {
      const id = `TEST-${Date.now()}`;
      const entry: Testimonial = { 
        ...(testimonialForm as Omit<Testimonial, 'id' | 'createdAt'>), 
        id, 
        createdAt: new Date().toISOString() 
      };
      setTestimonials([entry, ...testimonials]);
    } else if (testimonialModalMode === 'EDIT') {
      const existing = testimonialForm as Testimonial;
      setTestimonials(testimonials.map(t => t.id === existing.id ? existing : t));
    }
    setTestimonialModalMode(null);
    setTestimonialForm({ name: '', role: 'Patron', text: '' });
  };

  const deleteTestimonial = (id: string) => {
    if (window.confirm("Permanently remove this patron accolade?")) {
      setTestimonials(testimonials.filter(t => t.id !== id));
    }
  };

  const startEditTestimonial = (t: Testimonial) => {
    setTestimonialForm({ ...t });
    setTestimonialModalMode('EDIT');
  };

  const resetNewProductForm = () => {
    setNewProduct(INITIAL_NEW_PRODUCT);
    setIsCustomCategory(false);
  };

  /**
   * Robust Price Change Handler
   */
  const handlePriceInput = (val: string, isNewEntry: boolean) => {
    const sanitized = val.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const finalSanitized = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
    
    const parsed = parseFloat(finalSanitized);
    const finalValue = isNaN(parsed) ? 0 : parsed;
    
    if (isNewEntry) {
      setNewProduct(prev => ({ ...prev, price: finalValue }));
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, price: finalValue });
    }
  };

  /**
   * Image Upload Handler
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isNewEntry: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isNewEntry) {
          setNewProduct(prev => ({ ...prev, image: base64 }));
        } else if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomCategory(true);
      setNewProduct({ ...newProduct, category: '' });
    } else {
      setIsCustomCategory(false);
      setNewProduct({ ...newProduct, category: val });
    }
  };

  const isGuestOrder = selectedOrder?.userId.startsWith('GUEST');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-600/20 shrink-0">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Kitchen Command</h1>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Head Chef Portfolio Console
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('batches')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'batches' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Batches</button>
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Inventory</button>
          <button onClick={() => setActiveTab('testimonials')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'testimonials' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Testimonials</button>
          <button onClick={() => setActiveTab('metrics')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'metrics' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Metrics</button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Verified Revenue</h3>
          <p className="text-4xl font-black">${totalRevenue.toFixed(2)}</p>
          <BarChart3 className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Approvals</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{pendingOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hidden sm:block">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kitchen Load</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{orders.length}</p>
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-8">Batch ID</th>
                  <th className="px-10 py-8 hidden md:table-cell">Patron</th>
                  <th className="px-10 py-8">Value</th>
                  <th className="px-10 py-8">Status</th>
                  <th className="px-10 py-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.map(order => (
                  <tr key={order.id} onClick={() => { setSelectedOrderId(order.id); }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">{order.id}</td>
                    <td className="px-10 py-8 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 hidden md:table-cell">{order.customerName}</td>
                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">${order.total.toFixed(2)}</td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                        order.status === OrderStatus.PENDING ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-100' :
                        order.status === OrderStatus.APPROVED ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100' :
                        order.status === OrderStatus.PAID ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 
                        order.status === OrderStatus.PROCESSING ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-100' :
                        order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 border-emerald-200' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {order.status === OrderStatus.PENDING && <Clock className="w-2.5 h-2.5" />}
                        {order.status === OrderStatus.PROCESSING && <Flame className="w-2.5 h-2.5 animate-pulse" />}
                        {order.status === OrderStatus.DELIVERED && <Truck className="w-2.5 h-2.5" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Menu Items</h2>
             <button 
              onClick={() => setIsAddingProduct(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
             >
               <Plus className="w-4 h-4" /> Add New Delicacy
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                  <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{product.name}</h4>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest">{product.category}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${product.stockStatus === StockStatus.SOLD_OUT ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {product.stockStatus === StockStatus.SOLD_OUT ? 'Out of Batch' : 'Active Batch'}
                    </span>
                    <button onClick={() => setEditingProduct(product)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'testimonials' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Patron Accolades</h2>
             <button 
              onClick={() => {
                setTestimonialForm({ name: '', role: 'Patron', text: '' });
                setTestimonialModalMode('ADD');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-900/20"
             >
               <Plus className="w-4 h-4" /> Feature New Story
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm relative group hover:border-rose-200 transition-all">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => startEditTestimonial(t)}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 shadow-sm transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => deleteTestimonial(t.id)}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 shadow-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <MessageCircle className="w-8 h-8 text-rose-100 dark:text-slate-800 mb-6" />
                <p className="text-slate-600 dark:text-slate-400 italic text-sm mb-8 leading-relaxed line-clamp-4">"{t.text}"</p>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-black uppercase">{t.name.charAt(0)}</div>
                   <div>
                     <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t.name}</h4>
                     <p className="text-[9px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest">{t.role}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="py-32 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] animate-in zoom-in-95 duration-500">
          <BarChart3 className="w-20 h-20 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Kitchen Intelligence</h3>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Compiling current kitchen metrics...</p>
        </div>
      )}

      {/* Testimonial Modal (Unified Add/Edit) */}
      {testimonialModalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setTestimonialModalMode(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] p-10 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-900/20">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {testimonialModalMode === 'ADD' ? 'Feature Feedback' : 'Modify Accolade'}
                  </h3>
                </div>
                <button onClick={() => setTestimonialModalMode(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><X /></button>
             </div>

             <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patron Name</label>
                    <input 
                      type="text" 
                      value={testimonialForm.name}
                      onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-600/10 transition-all"
                      placeholder="e.g., Sarah Ahmed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Context / Role</label>
                    <input 
                      type="text" 
                      value={testimonialForm.role}
                      onChange={e => setTestimonialForm({...testimonialForm, role: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-600/10 transition-all"
                      placeholder="e.g., Regular Patron"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patron Story</label>
                  <textarea 
                    value={testimonialForm.text}
                    onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-600/10 h-32 resize-none transition-all"
                    placeholder="Describe their boutique experience..."
                    required
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95 shadow-rose-900/20">
                  {testimonialModalMode === 'ADD' ? 'Authorize Publication' : 'Authorize Metadata Update'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Robust Order Review Modal with Decision Notes and Selective Item Approval */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => !isProcessingApproval && setSelectedOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Audit Batch</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reference: {selectedOrder.id}</p>
                  </div>
                </div>
                <button onClick={() => !isProcessingApproval && setSelectedOrderId(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"><X /></button>
             </div>
             
             <div className="p-8 md:p-12 space-y-8 md:space-y-10 overflow-y-auto flex-grow no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Patron Credentials</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                         <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-black text-sm text-slate-900 dark:text-white uppercase leading-none">{selectedOrder.customerName}</span>
                         </div>
                         {selectedOrder.customerEmail && (
                            <div className="flex items-center gap-3 text-slate-500">
                               <Mail className="w-3.5 h-3.5" />
                               <span className="text-xs font-bold lowercase">{selectedOrder.customerEmail}</span>
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit Summary</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                         <div>
                            <p className="text-[8px] font-black uppercase text-slate-400">Current Value</p>
                            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-500 tabular-nums">${adjustedTotal.toFixed(2)}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-slate-400">Approved Items</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{auditItems.filter(i => i.isApproved).length} / {auditItems.length}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {selectedOrder.address && (
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Destination</p>
                      <div className="bg-amber-50/30 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100/50 dark:border-amber-900/50 flex gap-4">
                         <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{selectedOrder.address}"</p>
                      </div>
                   </div>
                )}

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Composition (Select for Prep)</p>
                   <div className="space-y-3">
                      {auditItems.map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => selectedOrder.status === OrderStatus.PENDING && toggleItemApproval(item.id)}
                          className={`flex justify-between items-center p-5 border rounded-2xl transition-all ${
                            !item.isApproved 
                              ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60 grayscale' 
                              : 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900 shadow-sm'
                          } ${selectedOrder.status === OrderStatus.PENDING ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                                {item.isApproved ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs font-black uppercase ${item.isApproved ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{item.quantity}x {item.name}</span>
                           </div>
                           <div className="text-right">
                              <span className="block text-xs font-black text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.isApproved ? 'Authorized' : 'Unavailable'}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Head Chef Dispatch Note
                  </label>
                  <textarea 
                    value={adminNote} 
                    onChange={e => setAdminNote(e.target.value)} 
                    placeholder="Add specific notes about ingredient availability or substitutions..."
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all h-32 resize-none" 
                  />
                </div>
             </div>

             <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 shrink-0">
               {selectedOrder.status === OrderStatus.PENDING ? (
                 <>
                   <button 
                     onClick={handleDeny} 
                     disabled={isProcessingApproval}
                     className="order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                   >
                     Deny Entire Batch
                   </button>
                   <button 
                     onClick={() => handleAction(OrderStatus.APPROVED)} 
                     disabled={isProcessingApproval || auditItems.every(i => !i.isApproved)}
                     className={`order-1 sm:order-2 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 shadow-emerald-900/20 flex items-center justify-center gap-3 ${isGuestOrder ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-800 hover:bg-emerald-900'} text-white disabled:opacity-50`}
                   >
                     {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : isGuestOrder ? <Send className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                     {isProcessingApproval ? 'Dispatching...' : isGuestOrder ? 'Verify & Send Link' : 'Verify & Approve'}
                   </button>
                 </>
               ) : (
                 <>
                   {selectedOrder.status === OrderStatus.PAID && (
                     <button 
                       onClick={() => handleAction(OrderStatus.PROCESSING)}
                       className="col-span-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                     >
                       <Flame className="w-5 h-5" /> Start Preparation
                     </button>
                   )}
                   {selectedOrder.status === OrderStatus.PROCESSING && (
                     <button 
                       onClick={() => handleAction(OrderStatus.DELIVERED)}
                       className="col-span-2 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                     >
                       <Truck className="w-5 h-5" /> Mark as Delivered
                     </button>
                   )}
                   <button 
                     onClick={() => handleAction(selectedOrder.status)}
                     className="col-span-2 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
                   >
                     <Save className="w-4 h-4" /> Update Dispatch Note
                   </button>
                 </>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Robust Product Entry (Add) Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setIsAddingProduct(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[4rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                    <Plus className="w-7 h-7" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Delicacy</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Expansion of the artisanal menu</p>
                 </div>
               </div>
               <button type="button" onClick={() => setIsAddingProduct(false)} className="p-3 text-slate-400 hover:text-rose-600 transition-colors bg-slate-100 dark:bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                {/* Responsive Form Section */}
                <form id="add-product-form" onSubmit={createProduct} className="lg:col-span-7 p-8 md:p-12 space-y-10 border-r border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" /> Dish Identity
                        </label>
                        <input 
                          type="text" 
                          value={newProduct.name} 
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="Saffron Mutton Roast"
                          className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all" 
                          required
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" /> Collection
                        </label>
                        {!isCustomCategory ? (
                          <div className="relative">
                            <select 
                              value={newProduct.category} 
                              onChange={e => handleCategoryChange(e.target.value)}
                              className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all appearance-none cursor-pointer"
                            >
                              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              <option value="CUSTOM">+ Define New Collection</option>
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 w-5 h-5 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative">
                            <input 
                              type="text" 
                              value={newProduct.category} 
                              onChange={e => setNewProduct({...newProduct, category: e.target.value.toUpperCase()})}
                              placeholder="CATEGORY NAME"
                              className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all uppercase" 
                              required
                            />
                            <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-600"><RefreshCcw className="w-4 h-4" /></button>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Heritage & Narrative
                      </label>
                      <textarea 
                        value={newProduct.description} 
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Detail the artisanal process and premium components..."
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-700/10 h-32 resize-none transition-all" 
                        required
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Boutique Value ($)
                      </label>
                      <div className="relative group">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                        <input 
                          type="text" 
                          value={newProduct.price || ''} 
                          onChange={e => handlePriceInput(e.target.value, true)}
                          placeholder="12.50"
                          className="w-full pl-12 pr-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-700/10 transition-all" 
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> Aesthetic Upload
                      </label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-center gap-4 cursor-pointer hover:border-emerald-700/30 transition-all"
                      >
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          {newProduct.image ? 'Image Selected' : 'Choose Local File'}
                        </span>
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*"
                          onChange={e => handleImageUpload(e, true)}
                          className="hidden" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-5 pt-4">
                    <label className="flex-1 min-w-[200px] flex items-center gap-5 cursor-pointer group bg-slate-50 dark:bg-slate-950 px-8 py-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all">
                      <input type="checkbox" checked={newProduct.isNew} onChange={e => setNewProduct({...newProduct, isNew: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-700" />
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white block">Verified New Addition</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active promotion badge</span>
                      </div>
                    </label>
                    <label className="flex-1 min-w-[200px] flex items-center gap-5 cursor-pointer group bg-slate-50 dark:bg-slate-950 px-8 py-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-amber-300 transition-all">
                      <input type="checkbox" checked={newProduct.isMondaySpecial} onChange={e => setNewProduct({...newProduct, isMondaySpecial: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-amber-600 focus:ring-amber-500" />
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white block">Monday Heritage Dish</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Monday menu exclusivity</span>
                      </div>
                    </label>
                    <label className="flex-1 min-w-[200px] flex items-center gap-5 cursor-pointer group bg-slate-50 dark:bg-slate-950 px-8 py-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-amber-300 transition-all">
                      <input type="checkbox" checked={newProduct.isRamadanSpecial} onChange={e => setNewProduct({...newProduct, isRamadanSpecial: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-amber-600 focus:ring-amber-500" />
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white block">Ramadan Heritage Dish</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Ramadan seasonal menu</span>
                      </div>
                    </label>
                  </div>
                </form>

                {/* Live Preview Display Section */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-12 flex flex-col items-center justify-center text-center">
                   <div className="mb-12">
                      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm border border-emerald-200/50">
                        <Eye className="w-4 h-4" /> Live Boutique Preview
                      </div>
                      <p className="text-[12px] font-medium text-slate-500 max-w-[260px] mx-auto leading-relaxed uppercase tracking-tight opacity-80">Patrons will view this exact configuration upon successful kitchen authorization.</p>
                   </div>
                   
                   <div className="w-full max-w-[320px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-3xl transform hover:scale-105 transition-transform duration-500">
                      <ProductCard 
                        product={{...newProduct, id: 'preview'} as Product} 
                        onAddToCart={() => {}} 
                      />
                   </div>

                   <div className="mt-16 space-y-5 w-full max-w-[320px]">
                      <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 text-left shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner"><Package className="w-5 h-5" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Inventory Sync</p>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Global Boutique Availability</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 text-left opacity-40 grayscale">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl flex items-center justify-center"><RefreshCcw className="w-5 h-5" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Audit Protocol</p>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Pending Head Chef Approval</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-12 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 shrink-0">
              <button 
                type="submit" 
                form="add-product-form"
                className="flex-grow py-6 bg-emerald-800 text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-5 active:scale-[0.98]"
              >
                <Save className="w-6 h-6" /> Authorize & Launch Delicacy
              </button>
              <button 
                type="button" 
                onClick={resetNewProductForm}
                className="py-6 px-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-[1.5rem] md:rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:text-rose-600 transition-all active:scale-[0.98]"
              >
                Clear Fields
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Robust Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setEditingProduct(null)}></div>
          <form 
            onSubmit={saveProductEdit} 
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
          >
            {/* Modal Header */}
            <div className="p-6 md:p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
               <div className="flex items-center gap-4 md:gap-5">
                 <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-900/20">
                    <ChefHat className="w-5 h-5 md:w-7 md:h-7" />
                 </div>
                 <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Refine Delicacy</h3>
               </div>
               <button type="button" onClick={() => setEditingProduct(null)} className="p-2 md:p-3 text-slate-400 hover:text-rose-600 transition-colors bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl shrink-0"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-6 md:p-14 space-y-8 md:space-y-12">
               {/* Adaptive Image/Identity Section */}
               <div className="flex flex-col sm:flex-row gap-6 md:gap-10 items-center sm:items-end">
                  <div 
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-white dark:border-slate-800 shrink-0 shadow-2xl group relative cursor-pointer"
                  >
                    <img src={editingProduct.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={editingProduct.name} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-6 h-6" />
                    </div>
                    <input 
                      ref={editFileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={e => handleImageUpload(e, false)}
                      className="hidden" 
                    />
                  </div>
                  <div className="flex-grow space-y-3 md:space-y-4 w-full">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest block text-center sm:text-left">Boutique Identifier</label>
                    <input 
                      type="text" 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-600/10" 
                      required
                    />
                  </div>
               </div>

               {/* Grid Controls */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-amber-600" /> Marketplace Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                      <input 
                        type="text" 
                        value={editingProduct.price || ''} 
                        onChange={e => handlePriceInput(e.target.value, false)}
                        className="w-full pl-10 md:pl-12 pr-6 md:pr-8 py-4 md:py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[1.5rem] text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-600/10 transition-all" 
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Batch Status
                    </label>
                    <div className="relative">
                      <select 
                        value={editingProduct.stockStatus} 
                        onChange={e => setEditingProduct({...editingProduct, stockStatus: e.target.value as StockStatus})}
                        className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-600/10 appearance-none cursor-pointer"
                      >
                        <option value={StockStatus.IN_STOCK}>Live Batch (In Stock)</option>
                        <option value={StockStatus.LOW_STOCK}>Restricted Batch (Low Stock)</option>
                        <option value={StockStatus.SOLD_OUT}>Archived Batch (Sold Out)</option>
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>
               </div>

               {/* Special Badges Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.isMondaySpecial} 
                      onChange={e => setEditingProduct({...editingProduct, isMondaySpecial: e.target.checked})}
                      className="w-5 h-5 rounded text-amber-600"
                    />
                    <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Monday Special</label>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.isRamadanSpecial} 
                      onChange={e => setEditingProduct({...editingProduct, isRamadanSpecial: e.target.checked})}
                      className="w-5 h-5 rounded text-amber-600"
                    />
                    <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Ramadan Special</label>
                  </div>
               </div>

               {/* Description Field */}
               <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-600" /> Narrative & Heritage
                  </label>
                  <textarea 
                    value={editingProduct.description} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full p-6 md:p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-600/10 h-32 md:h-40 resize-none transition-all" 
                  />
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-14 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 md:gap-6 shrink-0">
              <button 
                type="submit" 
                className="flex-grow py-5 md:py-6 bg-slate-900 dark:bg-amber-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 md:gap-5 active:scale-[0.98]"
              >
                <Save className="w-5 h-5 md:w-6 md:h-6" /> Authorize Update
              </button>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)} 
                className="py-5 md:py-6 px-8 md:px-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-[0.98]"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
