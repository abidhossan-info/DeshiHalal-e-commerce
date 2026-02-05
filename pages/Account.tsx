
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Order, OrderStatus, User as UserType, Notification, UserRole } from '../types';
import { 
  Bell, LogOut, Loader2, ShieldCheck, User as UserIcon, ChefHat, LayoutDashboard, Send,
  CheckCircle, CreditCard, Sparkles, Box, Truck, CheckCircle2, MapPinned, Info, Lock, Clock, ShoppingBag, Zap
} from 'lucide-react';
import { supabase } from '../supabase';

interface AccountProps {
  currentUser: UserType | null;
  orders: Order[];
  notifications: Notification[];
  markRead: (id: string) => void;
  updateStatus: (id: string, s: OrderStatus, note?: string) => Promise<void>;
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
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'alerts'>('orders');
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const navigate = useNavigate();

  const isHeadChef = currentUser?.role === UserRole.ADMIN;
  const isGuest = currentUser?.role === UserRole.GUEST;

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  if (!currentUser) return null;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('dh_user');
      localStorage.removeItem('dh_guest_user');
      setCurrentUser(null);
      navigate('/');
    } catch (err) {}
  };

  const handlePayment = async (orderId: string) => {
    setIsPaying(orderId);
    try {
      // Simulate artisanal payment sync
      await new Promise(r => setTimeout(r, 1500));
      await updateStatus(orderId, OrderStatus.PAID, "Artisanal payment confirmed. Chef has been notified.");
    } catch (err) {
      alert("Payment transition error. Please contact boutique support.");
    } finally {
      setIsPaying(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-10 md:mb-16">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-2xl md:text-4xl font-black shadow-xl">
              {currentUser.name.charAt(0)}
           </div>
           <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {currentUser.name}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-800 dark:text-emerald-500">
                {isHeadChef ? 'Boutique Authority' : 'Artisanal Patron'}
              </p>
           </div>
        </div>
        <div className="flex gap-3">
          {isHeadChef && (
            <Link to="/admin" className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-amber-600 px-6 py-3 rounded-2xl shadow-lg">
              <LayoutDashboard className="w-4 h-4" /> Hub
            </Link>
          )}
          <button onClick={handleSignOut} className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-6 py-3 rounded-2xl">
            Exit
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-10 border-b border-slate-100 dark:border-slate-800 pb-4">
        <button onClick={() => setActiveTab('orders')} className={`text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>
          Active Requests
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`relative text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl transition-all ${activeTab === 'alerts' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>
          Alerts {unreadCount > 0 && <span className="ml-2 bg-amber-500 text-white px-2 rounded-full">{unreadCount}</span>}
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-10">
          {sortedOrders.length > 0 ? sortedOrders.map(order => (
            <div key={order.id} className={`bg-white dark:bg-slate-900 border p-10 rounded-[3rem] shadow-sm transition-all duration-700 ${order.status === OrderStatus.APPROVED ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
              
              <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10 border-b border-slate-50 dark:border-slate-800 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Batch ID</p>
                    {order.status === OrderStatus.APPROVED && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-[8px] font-black rounded-full animate-bounce">
                        <Zap className="w-2.5 h-2.5 fill-amber-500" /> READY FOR DISPATCH
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{order.id.slice(0, 12)}...</h3>
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${order.status === OrderStatus.APPROVED ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                    {order.status}
                  </span>
                  {order.deliveryCompany && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                      <Truck className="w-3 h-3" /> 
                      <p className="text-[9px] font-black uppercase tracking-tighter">Logistics: {order.deliveryCompany}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/30">
                        <span className="text-[11px] font-black uppercase">{item.quantity}x {item.name}</span>
                        <span className="font-black text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {order.adminNote && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-amber-600 uppercase">Chef's Audit</h4>
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100 italic text-sm">
                        "{order.adminNote}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-50 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">${order.total.toFixed(2)}</p>
                </div>

                {order.status === OrderStatus.PENDING && (
                  <div className="flex items-center gap-4 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verifying Quality...</span>
                  </div>
                )}

                {order.status === OrderStatus.APPROVED && (
                  <button 
                    onClick={() => handlePayment(order.id)}
                    disabled={isPaying === order.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-4 bg-amber-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-amber-950/20 active:scale-95"
                  >
                    {isPaying === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    Complete Payment
                  </button>
                )}

                {order.status === OrderStatus.PAID && (
                  <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase border border-emerald-100">
                    <Sparkles className="w-4 h-4" /> Paid & Prep Active
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-slate-50/20">
              <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs">No culinary requests initiated.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Account;
