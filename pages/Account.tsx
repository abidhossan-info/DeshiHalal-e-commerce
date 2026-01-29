
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Order, OrderStatus, User as UserType, Notification, UserRole } from '../types';
import { 
  Bell, LogOut, 
  Loader2, ShieldCheck, User as UserIcon,
  MapPin, Phone, Edit2, Save, X, Camera, Mail, ChefHat, LayoutDashboard, Send,
  CheckCircle, CreditCard, Sparkles, Box, Truck, CheckCircle2, MapPinned
} from 'lucide-react';
import { supabase } from '../supabase';

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem('dh_user');
      navigate('/');
    }
  };

  const handlePayment = async (orderId: string) => {
    setIsPaying(orderId);
    setTimeout(async () => {
      await updateStatus(orderId, OrderStatus.PAID, "Payment received via secure boutique portal.");
      setIsPaying(null);
    }, 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentUser({
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        avatar: editForm.avatar
      });
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Failed to update boutique portfolio:", err);
    } finally {
      setIsSaving(false);
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
              order.status === OrderStatus.APPROVED ? 'border-amber-500 dark:border-amber-600 shadow-2xl ring-4 ring-amber-500/10' : 
              order.status === OrderStatus.REJECTED ? 'border-rose-100 dark:border-rose-900/50 opacity-90' :
              order.status === OrderStatus.PAID ? 'border-emerald-500 dark:border-emerald-600 shadow-2xl' :
              order.status === OrderStatus.PROCESSING ? 'border-blue-500 dark:border-blue-600 shadow-xl ring-4 ring-blue-500/10' :
              order.status === OrderStatus.READY_TO_DELIVERY ? 'border-indigo-500 dark:border-indigo-600 shadow-xl' :
              order.status === OrderStatus.ON_THE_WAY ? 'border-orange-500 dark:border-orange-600 shadow-2xl animate-pulse' :
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
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                    order.status === OrderStatus.PENDING ? 'bg-slate-50 text-slate-700 border-slate-100' :
                    order.status === OrderStatus.APPROVED ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                    order.status === OrderStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    order.status === OrderStatus.PROCESSING ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                    order.status === OrderStatus.READY_TO_DELIVERY ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    order.status === OrderStatus.ON_THE_WAY ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    order.status === OrderStatus.DELIVERED ? 'bg-slate-900 text-white' :
                    'bg-rose-50 text-rose-500'
                  }`}>
                    {order.status === OrderStatus.APPROVED && <CreditCard className="w-2.5 h-2.5" />}
                    {order.status === OrderStatus.READY_TO_DELIVERY && <Box className="w-2.5 h-2.5" />}
                    {order.status === OrderStatus.ON_THE_WAY && <Truck className="w-2.5 h-2.5 animate-bounce" />}
                    {order.status === OrderStatus.DELIVERED && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Composition</h4>
                  <div className="space-y-2 md:space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-4 rounded-xl border border-slate-50 dark:border-slate-800`}>
                        <div className="flex items-center gap-3">
                          <CheckCircle className={`w-3.5 h-3.5 ${item.isApproved === false ? 'text-slate-300' : 'text-emerald-500'}`} />
                          <span className={`text-[11px] font-black uppercase ${item.isApproved === false ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.adminNote && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Chef Notes</h4>
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100/50 dark:border-amber-900/50 text-sm font-medium text-slate-700 dark:text-slate-400 italic">
                      "{order.adminNote}"
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 pt-8 md:pt-10 border-t border-slate-50 dark:border-slate-800">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Audit Value</p>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">${order.total.toFixed(2)}</p>
                </div>

                {!isHeadChef && order.status === OrderStatus.APPROVED && (
                  <button 
                    onClick={() => handlePayment(order.id)}
                    disabled={isPaying === order.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-4 bg-amber-600 hover:bg-amber-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPaying === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    {isPaying === order.id ? 'Processing...' : 'Complete Secure Payment'}
                  </button>
                )}

                {!isHeadChef && order.status === OrderStatus.PAID && (
                  <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 dark:border-emerald-900">
                    <Sparkles className="w-4 h-4 animate-pulse" /> Batch in Prep Phase
                  </div>
                )}

                {!isHeadChef && order.status === OrderStatus.ON_THE_WAY && (
                  <div className="flex items-center gap-2 px-6 py-4 bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-orange-100 dark:border-orange-900">
                    <MapPinned className="w-4 h-4 animate-bounce" /> Courier Out for Delivery
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
              <UserIcon className="w-12 h-12 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No culinary operations found.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
          {notifications.length > 0 ? notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} className={`p-6 md:p-10 border rounded-[2rem] flex gap-4 md:gap-8 cursor-pointer transition-all ${n.read ? 'bg-white dark:bg-slate-900 opacity-60 border-slate-50 dark:border-slate-800' : 'bg-emerald-50/20 dark:bg-emerald-900/20 border-emerald-500 shadow-xl'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${n.read ? 'bg-slate-50 dark:bg-slate-800 text-slate-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700'}`}>
                <Bell className={`w-5 h-5 ${!n.read ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{n.title}</h4>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{n.message}</p>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center">
              <Bell className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Your Inbox is Clear.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && !isGuest && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-80 bg-slate-50/50 dark:bg-slate-950/50 p-8 md:p-12 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] flex items-center justify-center text-3xl font-black border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-6 ${isHeadChef ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {editForm.avatar ? (
                      <img src={editForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-1">{currentUser.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentUser.role} Level</p>
                  
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modify Portfolio
                    </button>
                  )}
                  {saveSuccess && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 animate-bounce">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Portfolio Updated</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow p-8 md:p-12">
                   {!isEditing ? (
                     <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon className="w-3 h-3" /> Identity</label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> Contact</label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.email}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Secure Line</label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.phone || 'Not linked'}</p>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Saved Boutique Address</label>
                              <p className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                {currentUser.address || 'Address not yet registered.'}
                              </p>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all" 
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Line</label>
                              <input 
                                type="tel" 
                                value={editForm.phone} 
                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                placeholder="+1..."
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 transition-all" 
                              />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Boutique Delivery Address</label>
                              <textarea 
                                value={editForm.address} 
                                onChange={e => setEditForm({...editForm, address: e.target.value})}
                                placeholder="Enter your full street address, apartment number, and city for fresh boutique delivery..."
                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-700 transition-all h-32 resize-none shadow-inner" 
                              />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> Securely stored for artisanal logistics
                              </p>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                           <button 
                             type="submit" 
                             disabled={isSaving}
                             className="flex-grow sm:flex-none px-10 py-5 bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                           >
                             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                             {isSaving ? 'Synchronizing...' : 'Authorize & Save Changes'}
                           </button>
                           <button 
                             type="button"
                             onClick={() => setIsEditing(false)}
                             className="flex-grow sm:flex-none px-10 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
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
    </div>
  );
};

export default Account;
