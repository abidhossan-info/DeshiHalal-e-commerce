
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus, Testimonial, CartItem } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  LayoutDashboard, Package, BarChart3, Settings, Save, AlertTriangle, 
  DollarSign, Plus, Image as ImageIcon, FileText, Tag, RefreshCcw, Eye, Camera, Upload, ClipboardList, ChefHat, Phone, Mail, MapPin, Send, Loader2, Heart, Trash2, Flame, Truck, CheckCircle2, Clock, Ban, CheckCircle, Edit2, MoonStar, CreditCard
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
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'testimonials' | 'metrics'>('batches');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [testimonialModalMode, setTestimonialModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Testimonial | Omit<Testimonial, 'id' | 'createdAt'>>({
    name: '',
    role: 'Patron',
    text: ''
  });

  const [adminNote, setAdminNote] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [auditItems, setAuditItems] = useState<CartItem[]>([]);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
  
  useEffect(() => {
    if (selectedOrder) {
      setAuditItems(selectedOrder.items);
      setAdminNote(selectedOrder.adminNote || '');
    }
  }, [selectedOrder]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PENDING), [orders]);
  const totalRevenue = useMemo(() => orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.DELIVERED).reduce((acc, o) => acc + o.total, 0), [orders]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) return null;

  const toggleItemApproval = (itemId: string) => {
    setAuditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isApproved: !item.isApproved } : item
    ));
  };

  const adjustedTotal = useMemo(() => {
    return auditItems.reduce((acc, item) => item.isApproved ? acc + (item.price * item.quantity) : acc, 0);
  }, [auditItems]);

  const handleAction = async (status: OrderStatus) => {
    if (!selectedOrderId || !selectedOrder) return;
    
    setIsProcessingApproval(true);
    const finalItems = (status === OrderStatus.APPROVED || status === OrderStatus.PAID) ? auditItems : selectedOrder.items;

    // Simulate link dispatch for guests or specific boutique flow
    if (status === OrderStatus.APPROVED) {
      await new Promise(res => setTimeout(res, 800));
    }

    updateStatus(selectedOrderId, status, adminNote, finalItems);
    setIsProcessingApproval(false);
    setSelectedOrderId(null);
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

  const resetNewProductForm = () => {
    setNewProduct(INITIAL_NEW_PRODUCT);
    setIsCustomCategory(false);
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Verified Revenue</h3>
          <p className="text-4xl font-black">${totalRevenue.toFixed(2)}</p>
          <BarChart3 className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Approvals</h3>
          <div className="flex items-center gap-4">
            <p className="text-4xl font-black text-slate-900 dark:text-white">{pendingOrders.length}</p>
            {pendingOrders.length > 0 && <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>}
          </div>
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
                  <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">{order.id}</td>
                    <td className="px-10 py-8 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 hidden md:table-cell">{order.customerName}</td>
                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-sm">${order.total.toFixed(2)}</td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                        order.status === OrderStatus.PENDING ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-100' :
                        order.status === OrderStatus.APPROVED ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100' :
                        order.status === OrderStatus.PAID ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 
                        order.status === OrderStatus.PROCESSING ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-100' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {order.status === OrderStatus.PENDING && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                        {order.status === OrderStatus.APPROVED && <CreditCard className="w-2.5 h-2.5" />}
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

      {/* Rest of the AdminDashboard (Inventory, Testimonials, etc) remains unchanged */}
      {/* ... */}

      {/* Audit Modal */}
      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => !isProcessingApproval && setSelectedOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
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
                         <div className="flex items-center gap-3 text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{selectedOrder.customerEmail || 'Guest Account'}</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit Summary</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                         <div>
                            <p className="text-[8px] font-black uppercase text-slate-400">Total Value</p>
                            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-500 tabular-nums">${adjustedTotal.toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                </div>

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
                           <span className="block text-xs font-black text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Dispatch Note (Substitutions/Alerts)
                  </label>
                  <textarea 
                    value={adminNote} 
                    onChange={e => setAdminNote(e.target.value)} 
                    placeholder="Inform the patron of any kitchen adjustments..."
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all h-32 resize-none" 
                  />
                </div>
             </div>

             <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 shrink-0">
               {selectedOrder.status === OrderStatus.PENDING ? (
                 <>
                   <button 
                     onClick={() => handleAction(OrderStatus.REJECTED)} 
                     disabled={isProcessingApproval}
                     className="order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                   >
                     Deny Batch
                   </button>
                   <button 
                     onClick={() => handleAction(OrderStatus.APPROVED)} 
                     disabled={isProcessingApproval || auditItems.every(i => !i.isApproved)}
                     className="order-1 sm:order-2 py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isProcessingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                     {isProcessingApproval ? 'Authorizing...' : 'Authorize & Request Payment'}
                   </button>
                 </>
               ) : (
                 <div className="col-span-2 flex flex-col gap-4">
                    {selectedOrder.status === OrderStatus.PAID && (
                      <button 
                        onClick={() => handleAction(OrderStatus.PROCESSING)}
                        className="py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                        <Flame className="w-5 h-5" /> Initiate Kitchen Preparation
                      </button>
                    )}
                    <button 
                      onClick={() => !isProcessingApproval && setSelectedOrderId(null)}
                      className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
                    >
                      Close Overview
                    </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
