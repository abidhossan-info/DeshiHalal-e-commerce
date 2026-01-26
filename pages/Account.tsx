
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Order, OrderStatus, User as UserType, Notification, UserRole } from '../types';
import { 
  Clock, CheckCircle, CreditCard, ShoppingBag, Bell, LogOut, 
  Loader2, Lock, ShieldCheck, MessageCircle, User as UserIcon, Settings,
  ChevronRight, MapPin, Phone, AlertCircle, Sparkles, Edit2, Save, X, Camera, Mail, ClipboardList, XCircle,
  Package, ChefHat, UtensilsCrossed, BarChart3, LayoutDashboard, Send, Truck, Flame, Ban, Upload
} from 'lucide-react';

interface AccountProps {
  currentUser: UserType | null;
  orders: Order[];
  notifications: Notification[];
  markRead: (id: string) => void;
  updateStatus: (id: string, s: OrderStatus) => void;
  setCurrentUser: (u: UserType | null) => void;
  updateCurrentUser: (userData: Partial<UserType>) => void;
}

const Account: React.FC<AccountProps> = ({ 
  currentUser, 
  orders, 
  notifications, 
  markRead, 
  updateStatus, 
  setCurrentUser,
  updateCurrentUser
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'alerts' | 'profile'>('orders');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isHeadChef = currentUser?.role === UserRole.ADMIN;
  const isGuest = currentUser?.role === UserRole.GUEST;

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        avatar: currentUser.avatar || ''
      });
    }
  }, [currentUser, isEditing]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  if (!currentUser) return null;

  const handleSignOut = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handlePayment = (orderId: string) => {
    setIsPaying(true);
    setTimeout(() => {
      updateStatus(orderId, OrderStatus.PAID);
      setIsPaying(false);
      setProcessingOrderId(null);
    }, 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        avatar: editForm.avatar
      });
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-10 md:mb-16">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="relative group">
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-2xl md:text-4xl font-black border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden ${isHeadChef ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400' : isGuest ? 'bg-slate-100 dark:bg-slate-900 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400'}`}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser.name} />
                ) : (
                  isHeadChef ? <ChefHat className="w-8 h-8 md:w-12 md:h-12" /> : isGuest ? <UserIcon className="w-8 h-8 md:w-12 md:h-12" /> : currentUser.name.charAt(0)
                )}
              </div>
              {!isGuest && (
                <button 
                  onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
           </div>
           <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {isHeadChef ? 'Master Head Chef' : currentUser.name}
              </h1>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2 ${isHeadChef ? 'text-amber-600' : isGuest ? 'text-slate-500' : 'text-emerald-800 dark:text-emerald-500'}`}>
                {isHeadChef ? <ChefHat className="w-3 h-3" /> : isGuest ? <Send className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                {isHeadChef ? 'Boutique Kitchen Authority' : isGuest ? 'One-Time Guest Patron' : 'Boutique Verified Patron'}
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {isHeadChef && (
            <Link to="/admin" className="flex items-center justify-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-amber-600 px-6 py-3 rounded-2xl transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20">
              <LayoutDashboard className="w-4 h-4" /> Kitchen Command
            </Link>
          )}
          <button onClick={handleSignOut} className="flex items-center justify-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 px-6 py-3 rounded-2xl transition-all hover:bg-rose-100 active:scale-95">
            <LogOut className="w-4 h-4" /> {isGuest ? 'End Guest Session' : 'Terminate Session'}
          </button>
        </div>
      </div>

      {/* Head Chef Specific Quick Stats / Banner */}
      {isHeadChef && (
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Kitchen Status</h4>
              <p className="text-2xl font-black uppercase tracking-tighter">Live & Operational</p>
              <UtensilsCrossed className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
           </div>
           <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] border border-emerald-800 shadow-2xl relative overflow-hidden group">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Batches</h4>
              <p className="text-2xl font-black uppercase tracking-tighter">{orders.length} Handled</p>
              <ClipboardList className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
           </div>
           <Link to="/admin" className="bg-amber-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:bg-amber-700 transition-colors">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Portfolio Management</h4>
              <p className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">Console Access <ChevronRight className="w-6 h-6" /></p>
              <ChefHat className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
           </Link>
        </div>
      )}

      {!isHeadChef && orders.filter(o => o.status === OrderStatus.APPROVED).length > 0 && (
        <div className="mb-10 bg-emerald-800 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 ring-4 ring-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 animate-pulse">
              {isGuest ? <Mail className="w-7 h-7 text-amber-300" /> : <Sparkles className="w-7 h-7 text-emerald-300" />}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">{isGuest ? 'Payment Link Dispatched' : 'Culinary Batch Ready!'}</h3>
              <p className="text-[11px] text-emerald-100 font-bold uppercase tracking-widest opacity-80">
                {isGuest ? `The Head Chef has sent a secure link to ${currentUser.email}.` : 'Our Chef has verified ingredients. Please complete payment to start cooking.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('orders')}
            className="w-full md:w-auto px-8 py-4 bg-white text-emerald-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
          >
            {isGuest ? 'Access Link below' : 'View Approved Batches'}
          </button>
        </div>
      )}

      <div className="flex gap-2 md:gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('orders')} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>{isHeadChef ? 'Recent Operations' : isGuest ? 'Guest Requests' : 'My Requests'}</button>
        <button onClick={() => setActiveTab('alerts')} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'alerts' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>
          Inbox {unreadCount > 0 && <span className="ml-2 bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
        </button>
        {!isGuest && <button onClick={() => { setActiveTab('profile'); setIsEditing(false); }} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>Profile & Settings</button>}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedOrders.length > 0 ? sortedOrders.map(order => (
            <div key={order.id} id={order.id} className={`bg-white dark:bg-slate-900 border p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm transition-all duration-700 ${
              order.status === OrderStatus.APPROVED ? 'border-emerald-500 dark:border-emerald-600 shadow-2xl ring-4 ring-emerald-500/10' : 
              order.status === OrderStatus.REJECTED ? 'border-rose-100 dark:border-rose-900/50 opacity-90' :
              order.status === OrderStatus.PROCESSING ? 'border-blue-500 dark:border-blue-600 shadow-xl ring-4 ring-blue-500/10' :
              order.status === OrderStatus.DELIVERED ? 'border-emerald-600 dark:border-emerald-500 shadow-md' :
              'border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between gap-6 md:gap-8 mb-8 md:mb-10 border-b border-slate-50 dark:border-slate-800 pb-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Identifier</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase">{order.id}</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                  {order.status === OrderStatus.PENDING ? (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                    </div>
                  ) : order.status === OrderStatus.APPROVED ? (
                    <div className={`flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 rounded-2xl border animate-in zoom-in-95 ${order.paymentLinkSent ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}`}>
                      {order.paymentLinkSent ? <Mail className="w-4 h-4" /> : <CheckCircle className="w-5 h-5" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{order.paymentLinkSent ? 'Payment Link Sent to Mail' : 'Chef Verified - Proceed to Pay'}</span>
                    </div>
                  ) : order.status === OrderStatus.PAID ? (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl border border-slate-800 dark:border-slate-100 shadow-lg">
                      <Package className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Queue for Kitchen</span>
                    </div>
                  ) : order.status === OrderStatus.PROCESSING ? (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg animate-pulse">
                      <Flame className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Chef is Cooking</span>
                    </div>
                  ) : order.status === OrderStatus.DELIVERED ? (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900 shadow-md">
                      <Truck className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Batch Delivered</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                      <XCircle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Batch Unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Composition</h4>
                  <div className="space-y-2 md:space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-4 rounded-xl md:rounded-2xl border transition-all ${item.isApproved === false ? 'bg-slate-50 dark:bg-slate-950/50 opacity-60 border-slate-100 dark:border-slate-800 grayscale' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                        <div className="flex items-center gap-3">
                          {item.isApproved === false ? <Ban className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          <span className={`text-[11px] md:text-xs font-black uppercase ${item.isApproved === false ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                          {item.isApproved === false && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Chef: Unavailable</span>}
                        </div>
                        <span className={`font-black text-xs ${item.isApproved === false ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {order.adminNote && (
                  <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border flex gap-4 md:gap-6 relative overflow-hidden h-fit transition-all duration-500 ${
                    order.status === OrderStatus.REJECTED ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                  }`}>
                    <MessageCircle className={`w-6 h-6 shrink-0 mt-1 ${order.status === OrderStatus.REJECTED ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`} />
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${order.status === OrderStatus.REJECTED ? 'text-rose-800 dark:text-rose-400' : 'text-emerald-800 dark:text-emerald-400'}`}>Kitchen Dispatch Note</p>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{order.adminNote}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 pt-8 md:pt-10 border-t border-slate-50 dark:border-slate-800">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Audit Value</p>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">${order.total.toFixed(2)}</p>
                </div>

                {order.status === OrderStatus.APPROVED && !isHeadChef ? (
                  <button 
                    onClick={() => setProcessingOrderId(order.id)} 
                    className={`w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 text-white rounded-xl md:rounded-2xl text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all shadow-2xl animate-pulse ring-4 active:scale-95 flex items-center justify-center ${order.paymentLinkSent ? 'bg-amber-600 hover:bg-amber-700 ring-amber-500/30' : 'bg-emerald-800 hover:bg-emerald-900 ring-emerald-500/30'}`}
                  >
                    {order.paymentLinkSent ? <Mail className="w-5 h-5 mr-3" /> : <CreditCard className="w-5 h-5 mr-3" />}
                    {order.paymentLinkSent ? 'Use Dispatched Payment Link' : 'Authorize Secure Payment'}
                  </button>
                ) : order.status === OrderStatus.PAID ? (
                  <div className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-emerald-900 flex items-center justify-center gap-3">
                    <Package className="w-4 h-4" /> Queue for Artisan Prep
                  </div>
                ) : order.status === OrderStatus.PROCESSING ? (
                  <div className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-3 shadow-lg animate-pulse">
                    <Flame className="w-4 h-4" /> Active Preparation
                  </div>
                ) : order.status === OrderStatus.DELIVERED ? (
                  <div className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900 flex items-center justify-center gap-3">
                    <CheckCircle className="w-4 h-4" /> Artisanal Journey Complete
                  </div>
                ) : (
                  <div className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-3 opacity-60 grayscale">
                    <Lock className="w-4 h-4" /> Locked Status
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 md:py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] md:rounded-[4rem]">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em] px-4">No culinary operations found.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
          {notifications.length > 0 ? notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} className={`p-6 md:p-10 border rounded-[2rem] md:rounded-[3rem] flex gap-4 md:gap-8 cursor-pointer transition-all ${n.read ? 'bg-white dark:bg-slate-900 opacity-60 border-slate-50' : 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500 dark:border-emerald-600 shadow-xl ring-2 ring-emerald-500/20'}`}>
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border ${n.read ? 'bg-slate-50 dark:bg-slate-800 text-slate-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400'}`}>
                <Bell className={`w-5 h-5 md:w-6 md:h-6 ${!n.read ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{n.title}</h4>
                  <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[12px] md:text-[14px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{n.message}</p>
                {!n.read && (
                  <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest rounded-full">New Update</span>
                )}
              </div>
            </div>
          )) : (
            <div className="py-24 text-center">
              <Bell className="w-16 h-16 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em] px-4">Your Inbox is Clear.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && !isGuest && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row border-b border-slate-50 dark:border-slate-800">
                <div className="w-full md:w-80 bg-slate-50/50 dark:bg-slate-950/50 p-8 md:p-12 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-3xl md:text-5xl font-black border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-6 ${isHeadChef ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400'}`}>
                    {editForm.avatar ? (
                      <img src={editForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      isHeadChef ? <ChefHat className="w-10 h-10 md:w-16 md:h-16" /> : currentUser.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-1">{isHeadChef ? 'Head Chef Portfolio' : currentUser.name}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest text-center ${isHeadChef ? 'text-amber-600' : 'text-slate-400'}`}>{isHeadChef ? 'Master Kitchen Authority' : 'Artisanal Patron'}</p>
                  
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modify Details
                    </button>
                  )}
                  
                  {saveSuccess && (
                    <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-bounce">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Portfolio Updated</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow p-8 md:p-12">
                   {!isEditing ? (
                     <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <UserIcon className="w-3 h-3" /> Identity
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Mail className="w-3 h-3" /> Contact
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.email}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Phone className="w-3 h-3" /> Secure Line
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.phone || 'Not linked'}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <MapPin className="w-3 h-3" /> Boutique Address
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">{currentUser.address || 'Not specified'}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Lock className="w-3 h-3" /> Portfolio Access
                              </label>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${isHeadChef ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border-amber-100' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border-emerald-100'}`}>
                                  {currentUser.role} Level
                                </span>
                              </div>
                           </div>
                        </div>
                        
                        {isHeadChef && (
                          <div className="p-8 bg-amber-50/30 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row items-center gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                               <BarChart3 className="w-8 h-8" />
                             </div>
                             <div className="flex-grow text-center md:text-left">
                               <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Kitchen Intelligence</h4>
                               <p className="text-xs text-slate-500 font-medium">Head Chef credentials authorize complete inventory manipulation and batch validation.</p>
                             </div>
                             <Link to="/admin" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Launch Console</Link>
                          </div>
                        )}

                        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                             <ShieldCheck className="w-6 h-6" />
                           </div>
                           <div>
                             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Handshake</h4>
                             <p className="text-xs text-slate-500 font-medium">Your portfolio is protected by boutique-grade encryption. Last login from authorized terminal.</p>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="flex flex-col items-center sm:items-start space-y-4 mb-4">
                             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-3xl md:text-5xl font-black border-4 border-emerald-100 dark:border-slate-800 shadow-xl overflow-hidden transition-all group-hover:scale-105 ${isHeadChef ? 'bg-amber-100 dark:bg-amber-900 text-amber-800' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800'}`}>
                                  {editForm.avatar ? (
                                    <img src={editForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                                  ) : (
                                    isHeadChef ? <ChefHat className="w-10 h-10 md:w-16 md:h-16" /> : currentUser.name.charAt(0)
                                  )}
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white w-6 h-6 mb-1" />
                                    <span className="text-[8px] text-white font-black uppercase tracking-widest">Update</span>
                                  </div>
                                </div>
                                <input 
                                  ref={fileInputRef}
                                  type="file" 
                                  accept="image/*"
                                  className="hidden" 
                                  onChange={handleFileChange}
                                />
                             </div>
                             <button 
                               type="button"
                               onClick={() => fileInputRef.current?.click()}
                               className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                             >
                               Change Photo
                             </button>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                              <input 
                                type="email" 
                                value={editForm.email} 
                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Secure Line</label>
                              <input 
                                type="tel" 
                                value={editForm.phone} 
                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                placeholder="+880 1XXX-XXXXXX"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 transition-all" 
                              />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Boutique Address</label>
                              <textarea 
                                value={editForm.address} 
                                onChange={e => setEditForm({...editForm, address: e.target.value})}
                                placeholder="Enter your full boutique delivery address..."
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all h-24 resize-none" 
                              />
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                           <button 
                             type="submit" 
                             disabled={isSaving}
                             className="flex-grow sm:flex-none px-10 py-5 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                             {isSaving ? 'Synchronizing...' : 'Authorize Sync'}
                           </button>
                           <button 
                             type="button"
                             onClick={() => setIsEditing(false)}
                             className="flex-grow sm:flex-none px-10 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-3"
                           >
                             <X className="w-4 h-4" /> Discard
                           </button>
                        </div>
                     </form>
                   )}
                </div>
              </div>
           </div>
        </div>
      )}

      {processingOrderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => !isPaying && setProcessingOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-lg rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="text-center mb-8 md:mb-10">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 dark:bg-emerald-950/50 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-emerald-800 dark:text-emerald-400 mx-auto mb-6 border border-emerald-100 dark:border-emerald-900">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vault Handshake</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Order Ref: {processingOrderId}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 mb-8 md:mb-10 text-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Authorized Funds</span>
               <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">${orders.find(o => o.id === processingOrderId)?.total.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => handlePayment(processingOrderId)} 
              disabled={isPaying} 
              className="w-full py-5 md:py-6 bg-emerald-800 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-4 md:gap-5 active:scale-95 disabled:opacity-50"
            >
              {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {isPaying ? 'Synchronizing Boutique...' : 'Complete Secure Pay'}
            </button>
            
            {!isPaying && (
              <button onClick={() => setProcessingOrderId(null)} className="w-full mt-4 md:mt-6 py-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors">Return to Dashboard</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
