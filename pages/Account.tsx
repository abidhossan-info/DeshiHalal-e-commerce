
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, User as UserType, Notification } from '../types';
import { 
  Clock, CheckCircle, CreditCard, ShoppingBag, Bell, LogOut, 
  Loader2, Lock, ShieldCheck, MessageCircle, User as UserIcon, Settings,
  ChevronRight, MapPin, Phone, AlertCircle, Sparkles, Edit2, Save, X, Camera, Mail
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
  
  // Settings / Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const navigate = useNavigate();

  // All hooks must be called at the top level before any returns
  const approvedOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.APPROVED), [orders]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PENDING), [orders]);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
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

  // Conditional return must happen AFTER hook declarations
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
    
    // Simulate API delay for premium feel
    setTimeout(() => {
      updateCurrentUser({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        avatar: editForm.avatar
      });
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
    }, 1200);
  };

  const activeOrders = [...approvedOrders, ...pendingOrders];
  const history = orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.REJECTED);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-10 md:mb-16">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="relative group">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-100 dark:bg-emerald-900 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-2xl md:text-4xl font-black text-emerald-800 dark:text-emerald-400 border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser.name} />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <button 
                onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
           </div>
           <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{currentUser.name}</h1>
              <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Boutique Verified Patron
              </p>
           </div>
        </div>
        <button onClick={handleSignOut} className="w-full md:w-auto flex items-center justify-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 px-6 py-3 rounded-2xl transition-all hover:bg-rose-100 active:scale-95">
          <LogOut className="w-4 h-4" /> Terminate Session
        </button>
      </div>

      {/* Action Banner for Approved Orders */}
      {approvedOrders.length > 0 && (
        <div className="mb-10 bg-emerald-800 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 ring-4 ring-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20 animate-pulse">
              <Sparkles className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Culinary Batch Ready!</h3>
              <p className="text-[11px] text-emerald-100 font-bold uppercase tracking-widest opacity-80">Our Chef has verified ingredients. Please complete payment to start cooking.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveTab('orders');
              const el = document.getElementById(approvedOrders[0].id);
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full md:w-auto px-8 py-4 bg-white text-emerald-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
          >
            Go to Orders
          </button>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="flex gap-2 md:gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('orders')} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>My Requests</button>
        <button onClick={() => setActiveTab('alerts')} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'alerts' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>
          Inbox {unreadCount > 0 && <span className="ml-2 bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
        </button>
        <button onClick={() => { setActiveTab('profile'); setIsEditing(false); }} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>Profile & Settings</button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeOrders.length > 0 ? activeOrders.map(order => (
            <div key={order.id} id={order.id} className={`bg-white dark:bg-slate-900 border p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm transition-all duration-700 ${order.status === OrderStatus.APPROVED ? 'border-emerald-500 dark:border-emerald-600 shadow-2xl ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-6 md:gap-8 mb-8 md:mb-10 border-b border-slate-50 dark:border-slate-800 pb-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Identifier</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase">{order.id}</h3>
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                  {order.status === OrderStatus.PENDING ? (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Chef Verified - Proceed to Pay</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Composition</h4>
                  <div className="space-y-2 md:space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white uppercase">{item.quantity}x {item.name}</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {order.adminNote && (
                  <div className="p-6 md:p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/50 flex gap-4 md:gap-6 relative overflow-hidden">
                    <MessageCircle className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2">Kitchen Dispatch Note</p>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{order.adminNote}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 pt-8 md:pt-10 border-t border-slate-50 dark:border-slate-800">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Value</p>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">${order.total.toFixed(2)}</p>
                </div>

                {order.status === OrderStatus.APPROVED ? (
                  <button 
                    onClick={() => setProcessingOrderId(order.id)} 
                    className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-emerald-800 text-white rounded-xl md:rounded-2xl text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all shadow-2xl animate-pulse ring-4 ring-emerald-500/30 active:scale-95 flex items-center justify-center"
                  >
                    <CreditCard className="w-5 h-5 mr-3" /> 
                    Authorize Secure Payment
                  </button>
                ) : (
                  <div className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-3 opacity-60 grayscale">
                    <Lock className="w-4 h-4" /> Locked Until Verified
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 md:py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] md:rounded-[4rem]">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em] px-4">No Culinary Requests Found.</p>
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

      {activeTab === 'profile' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row border-b border-slate-50 dark:border-slate-800">
                <div className="w-full md:w-80 bg-slate-50/50 dark:bg-slate-950/50 p-8 md:p-12 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-100 dark:bg-emerald-900 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-3xl md:text-5xl font-black text-emerald-800 dark:text-emerald-400 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-6">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-1">{currentUser.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{currentUser.role === 'ADMIN' ? 'Head Chef' : 'Artisanal Patron'}</p>
                  
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modify Portfolio
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
                                <UserIcon className="w-3 h-3" /> Full Identity
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Mail className="w-3 h-3" /> Registered Email
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.email}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Phone className="w-3 h-3" /> Secure Line
                              </label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.phone || 'Not provided'}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Lock className="w-3 h-3" /> Access Role
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-900">
                                  {currentUser.role} Account
                                </span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                             <ShieldCheck className="w-6 h-6" />
                           </div>
                           <div>
                             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Handshake</h4>
                             <p className="text-xs text-slate-500 font-medium">Your portfolio is protected by boutique-grade encryption. Last login from Dhaka, BD.</p>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Patron Identity</label>
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Registered Email</label>
                              <input 
                                type="email" 
                                value={editForm.email} 
                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                              <input 
                                type="tel" 
                                value={editForm.phone} 
                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                placeholder="+880 1XXX-XXXXXX"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Avatar Source URL</label>
                              <input 
                                type="url" 
                                value={editForm.avatar} 
                                onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
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
                             {isSaving ? 'Synchronizing...' : 'Authorize Changes'}
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
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
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
