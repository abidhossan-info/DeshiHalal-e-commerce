
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Order, OrderStatus, User as UserType, Notification, UserRole } from '../types';
import { 
  Bell, LogOut, 
  Loader2, ShieldCheck, User as UserIcon,
  MapPin, Phone, Edit2, Save, X, Camera, Mail, ChefHat, LayoutDashboard, Send,
  CheckCircle, CreditCard, Sparkles, Box, Truck, CheckCircle2, MapPinned,
  Info, User, Globe, Hash, Upload, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../supabase';

interface AccountProps {
  currentUser: UserType | null;
  orders: Order[];
  notifications: Notification[];
  markRead: (id: string) => void;
  updateStatus: (id: string, s: OrderStatus, note?: string) => void;
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem('dh_user');
      localStorage.removeItem('dh_guest_user');
      setCurrentUser(null);
      navigate('/');
    }
  };

  const handlePayment = async (orderId: string) => {
    setIsPaying(orderId);
    setTimeout(async () => {
      await updateStatus(orderId, OrderStatus.PAID, "Payment verified via guest portal.");
      setIsPaying(null);
    }, 2000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Avatar image is too large. Limit is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
           <div className="relative">
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-2xl md:text-4xl font-black border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 ${isHeadChef ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400' : isGuest ? 'bg-slate-100 dark:bg-slate-900 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400'}`}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser.name} />
                ) : (
                  isHeadChef ? <ChefHat className="w-8 h-8 md:w-12 md:h-12" /> : isGuest ? <UserIcon className="w-8 h-8 md:w-12 md:h-12" /> : currentUser.name.charAt(0)
                )}
              </div>
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
        <button onClick={() => setActiveTab('orders')} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl font-black' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>
          {isGuest ? 'Guest Batch Tracker' : isHeadChef ? 'Operations' : 'My Requests'}
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`relative text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>
          Alerts
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-black animate-pulse shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
        {!isGuest && (
          <button onClick={() => { setActiveTab('profile'); setIsEditing(false); }} className={`text-[10px] font-black uppercase tracking-widest px-6 md:px-8 py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'}`}>
            Boutique Profile
          </button>
        )}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedOrders.length > 0 ? sortedOrders.map(order => (
            <div key={order.id} className={`bg-white dark:bg-slate-900 border p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm transition-all duration-700 ${
              order.status === OrderStatus.APPROVED ? 'border-emerald-500 dark:border-emerald-600 shadow-xl ring-4 ring-emerald-500/10 scale-[1.01]' : 
              order.status === OrderStatus.ON_THE_WAY ? 'border-orange-500 shadow-2xl ring-4 ring-orange-500/10' :
              'border-slate-100 dark:border-slate-800'
            }`}>
              {isGuest && (
                 <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/50 flex items-center gap-4">
                    <Info className="w-6 h-6 text-amber-600" />
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                       <span className="font-black uppercase block text-amber-600 mb-1">Guest Audit in Progress</span>
                       As a one-time patron, you can track this specific batch here. An email update will be sent to <span className="underline">{currentUser.email}</span> once the Head Chef completes the quality audit.
                    </p>
                 </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-6 md:gap-8 mb-8 md:mb-10 border-b border-slate-50 dark:border-slate-800 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch Identifier</p>
                    {order.status === OrderStatus.APPROVED && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[8px] font-black rounded-full animate-bounce">
                        <Sparkles className="w-2.5 h-2.5" /> ACTION REQUIRED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.id}</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                    order.status === OrderStatus.PENDING ? 'bg-slate-50 text-slate-700 border-slate-100' :
                    order.status === OrderStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    order.status === OrderStatus.PAID ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                    order.status === OrderStatus.PROCESSING ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    order.status === OrderStatus.READY_TO_DELIVERY ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    order.status === OrderStatus.ON_THE_WAY ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    order.status === OrderStatus.DELIVERED ? 'bg-slate-900 text-white' :
                    'bg-rose-50 text-rose-500'
                  }`}>
                    {order.status === OrderStatus.APPROVED && <CreditCard className="w-2.5 h-2.5 animate-pulse" />}
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
                      <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className={`w-3.5 h-3.5 ${item.isApproved === false ? 'text-slate-300' : 'text-emerald-500'}`} />
                          <span className={`text-[11px] font-black uppercase ${item.isApproved === false ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{item.quantity}x {item.name}</span>
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.adminNote && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Chef Directive</h4>
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100/50 dark:border-amber-900/50 text-sm font-medium text-slate-700 dark:text-slate-400 italic leading-relaxed">
                      "{order.adminNote}"
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 pt-8 md:pt-10 border-t border-slate-50 dark:border-slate-800">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Verified Value</p>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">${order.total.toFixed(2)}</p>
                </div>

                {order.status === OrderStatus.APPROVED && (
                  <button 
                    onClick={() => handlePayment(order.id)}
                    disabled={isPaying === order.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-4 bg-emerald-800 hover:bg-emerald-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPaying === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    {isPaying === order.id ? 'Processing...' : 'Complete Secure Payment'}
                  </button>
                )}

                {order.status === OrderStatus.PAID && (
                  <div className="flex items-center gap-3 px-8 py-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                    <Sparkles className="w-4 h-4 animate-pulse" /> Verified & Prep Commenced
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20 dark:bg-slate-950/20">
              <UserIcon className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No culinary requests found.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
          {notifications.length > 0 ? notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} className={`p-6 md:p-10 border rounded-[2rem] flex gap-4 md:gap-8 cursor-pointer transition-all relative overflow-hidden group ${n.read ? 'bg-white dark:bg-slate-900 opacity-60 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl ring-4 ring-emerald-500/5'}`}>
              {!n.read && <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${n.read ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900'}`}>
                <Bell className={`w-6 h-6 ${!n.read ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className={`text-sm font-black uppercase tracking-tight ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{n.title}</h4>
                  {!n.read && (
                    <span className="bg-amber-500 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-[0.2em] shadow-sm">
                      New Alert
                    </span>
                  )}
                </div>
                <p className={`text-[12px] font-medium leading-relaxed ${n.read ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {n.message}
                </p>
                <div className="mt-4 flex items-center gap-4">
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   {!n.read && <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Mark as read</span>}
                </div>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20 dark:bg-slate-950/20">
              <Bell className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No boutique alerts.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && !isGuest && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
             <div className="p-8 md:p-12 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Portfolio Settings</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your boutique credentials</p>
                 </div>
                 {!isEditing && (
                   <button 
                     onClick={() => setIsEditing(true)}
                     className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isHeadChef ? 'bg-amber-600 text-white shadow-amber-600/20' : 'bg-emerald-800 text-white shadow-emerald-800/20'} shadow-lg hover:opacity-90 active:scale-95`}
                   >
                     <Edit2 className="w-3.5 h-3.5" /> Edit Portfolio
                   </button>
                 )}
               </div>
             </div>

             <div className="p-8 md:p-12">
               {saveSuccess && (
                 <div className="mb-10 p-6 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-4 animate-in fade-in zoom-in duration-500">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Portfolio synchronized successfully.</p>
                 </div>
               )}

               <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
                 <div className="space-y-12">
                    {/* High Fidelity Avatar Upload UI */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5" /> Boutique Identity (Avatar)
                      </label>
                      <div className="flex items-center gap-8">
                         <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden group ${isHeadChef ? 'bg-amber-100 dark:bg-amber-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
                            {editForm.avatar ? (
                              <img src={editForm.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-4xl font-black text-white">
                                {editForm.name.charAt(0)}
                              </div>
                            )}
                            {isEditing && (
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm"
                              >
                                <Camera className="w-6 h-6 text-white mb-2" />
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Update</span>
                              </button>
                            )}
                         </div>
                         {isEditing && (
                           <div className="flex-grow">
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
                              >
                                <Upload className="w-4 h-4" /> Upload Asset
                              </button>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-3 leading-relaxed">
                                JPG, PNG preferred. <br />Maximum size: 2MB.
                              </p>
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                                className="hidden" 
                              />
                           </div>
                         )}
                      </div>
                    </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <UserIcon className="w-3.5 h-3.5" /> Display Name
                     </label>
                     <input 
                       disabled={!isEditing}
                       value={editForm.name}
                       onChange={e => setEditForm({...editForm, name: e.target.value})}
                       className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl text-sm font-bold transition-all outline-none ${isEditing ? 'border-emerald-200 dark:border-emerald-800 focus:ring-4 focus:ring-emerald-700/10' : 'border-transparent text-slate-500'}`}
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Mail className="w-3.5 h-3.5" /> Authorized Email
                     </label>
                     <div className="relative group">
                       <input 
                         disabled
                         value={editForm.email}
                         className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                       />
                       <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ShieldCheck className="w-4 h-4 text-slate-300" />
                       </div>
                     </div>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account identification key (Immutable)</p>
                   </div>
                 </div>

                 <div className="space-y-8 flex flex-col justify-end">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Phone className="w-3.5 h-3.5" /> Contact Number
                     </label>
                     <input 
                       disabled={!isEditing}
                       value={editForm.phone}
                       onChange={e => setEditForm({...editForm, phone: e.target.value})}
                       placeholder="+1..."
                       className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl text-sm font-bold transition-all outline-none ${isEditing ? 'border-emerald-200 dark:border-emerald-800 focus:ring-4 focus:ring-emerald-700/10' : 'border-transparent text-slate-500'}`}
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <MapPinned className="w-3.5 h-3.5" /> Primary Delivery Coordinates
                     </label>
                     <textarea 
                       disabled={!isEditing}
                       value={editForm.address}
                       onChange={e => setEditForm({...editForm, address: e.target.value})}
                       placeholder="Street name, suite, city, zip..."
                       className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl text-sm font-bold transition-all outline-none h-44 md:h-56 resize-none ${isEditing ? 'border-emerald-200 dark:border-emerald-800 focus:ring-4 focus:ring-emerald-700/10' : 'border-transparent text-slate-500'}`}
                     />
                   </div>
                 </div>

                 {isEditing && (
                   <div className="lg:col-span-2 pt-10 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                     <button 
                       type="submit"
                       disabled={isSaving}
                       className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 ${isHeadChef ? 'bg-amber-600 text-white shadow-amber-600/20' : 'bg-emerald-800 text-white shadow-emerald-800/20'}`}
                     >
                       {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                       {isSaving ? 'Syncing...' : 'Commit Changes'}
                     </button>
                     <button 
                       type="button"
                       onClick={() => setIsEditing(false)}
                       className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-[1.5rem] font-black text-xs tracking-[0.2em] uppercase transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                     >
                       <X className="w-5 h-5" /> Cancel Draft
                     </button>
                   </div>
                 )}
               </form>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Account;
