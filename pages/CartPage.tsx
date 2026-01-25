
import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, ClipboardList, ShieldCheck, Clock, CheckCircle2, AlertTriangle, X, User, MapPin, Mail, Phone, Fingerprint } from 'lucide-react';
import { CartItem, User as UserType } from '../types';
import { Link } from 'react-router-dom';

interface CartPageProps {
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, d: number) => void;
  requestOrder: (asGuest?: boolean, guestData?: any) => void;
  clearCart: () => void;
  currentUser: UserType | null;
}

const CartPage: React.FC<CartPageProps> = ({ cart, removeFromCart, updateQuantity, requestOrder, clearCart, currentUser }) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestOrder(true, guestForm);
    setShowGuestModal(false);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        </div>
        <h2 className="text-3xl font-black text-slate-950 dark:text-slate-100 mb-4 uppercase tracking-tight">Your Bag is Empty</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">Browse our artisanal collection to start your culinary request.</p>
        <Link to="/shop" className="inline-flex items-center px-10 py-4 bg-emerald-800 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-100 dark:shadow-none uppercase active:scale-95">
          Browse Menu <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Sales-Friendly Stepper */}
      <div className="mb-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
          
          {[
            { step: 1, label: 'Batch Request', icon: ShoppingBag, active: true },
            { step: 2, label: 'Chef Approval', icon: Clock, active: false },
            { step: 3, label: 'Secure Payment', icon: ShieldCheck, active: false },
          ].map((s, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${s.active ? 'bg-emerald-800 border-emerald-800 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${s.active ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <h1 className="text-4xl font-black text-slate-950 dark:text-slate-100 uppercase tracking-tighter">Shopping Bag</h1>
        <button 
          onClick={() => setShowConfirmClear(true)}
          className="flex items-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] bg-rose-50 dark:bg-rose-950/30 px-6 py-3 rounded-2xl transition-all hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 group shadow-sm border border-rose-100 dark:border-rose-900/50"
        >
          <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
          Clear Current Batch
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-6">
          {cart.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 group transition-all hover:shadow-xl hover:border-emerald-50 dark:hover:border-emerald-900/30">
              <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-50 dark:border-slate-800 shadow-sm relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{item.name}</h3>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">{item.category}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="text-sm font-black w-8 text-center text-slate-900 dark:text-white tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-600 dark:hover:text-rose-500 transition-colors p-2 active:scale-90" title="Remove item">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 text-white sticky top-28 shadow-2xl border border-slate-900">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400 font-bold text-sm">
                <span>Items Subtotal</span>
                <span className="text-white">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold text-sm">
                <span>Quality Check</span>
                <span className="text-emerald-400 uppercase text-[10px] tracking-widest font-black">Free Guarantee</span>
              </div>
              <div className="h-px bg-slate-800 my-6"></div>
              <div className="flex justify-between text-2xl font-black">
                <span className="uppercase tracking-tighter">Total</span>
                <span className="text-emerald-400">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-300 leading-relaxed font-bold">
                  <span className="text-white font-black block mb-1 uppercase tracking-widest text-xs">Chef Approval Required</span>
                  We only accept payment after the Chef verifies ingredient freshness for your specific batch. 
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full w-fit">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Halal Certified Ingredients</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => requestOrder(false)}
                className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-3 group uppercase active:scale-95"
              >
                {currentUser ? 'Request Order Approval' : 'Sign In & Request'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!currentUser && (
                <button 
                  onClick={() => setShowGuestModal(true)}
                  className="w-full py-5 bg-transparent border-2 border-slate-800 text-slate-300 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 group uppercase active:scale-95"
                >
                  <User className="w-5 h-5" />
                  Guest Request Approval
                </button>
              )}
            </div>

            <p className="text-[8px] text-center text-slate-500 font-black uppercase tracking-[0.2em] mt-6 leading-relaxed">
              No payment required at this step. <br />Approval typically within 30-60 mins.
            </p>
          </div>
        </div>
      </div>

      {/* Guest Request Form Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" 
            onClick={() => setShowGuestModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 md:p-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-10 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none">Guest Protocol</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">One-time boutique access</p>
                  </div>
               </div>
               <button onClick={() => setShowGuestModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-2xl transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-6 overflow-y-auto no-scrollbar pr-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                  <input 
                    type="text" 
                    value={guestForm.name}
                    onChange={e => setGuestForm({...guestForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                  <input 
                    type="tel" 
                    value={guestForm.phone}
                    onChange={e => setGuestForm({...guestForm, phone: e.target.value})}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                  <input 
                    type="email" 
                    value={guestForm.email}
                    onChange={e => setGuestForm({...guestForm, email: e.target.value})}
                    placeholder="yourname@example.com"
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-10 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600" />
                  <textarea 
                    value={guestForm.address}
                    onChange={e => setGuestForm({...guestForm, address: e.target.value})}
                    placeholder="Provide detailed boutique delivery instructions..."
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-700/10 outline-none h-28 resize-none transition-all"
                    required 
                  />
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button 
                  type="submit"
                  className="w-full py-6 bg-emerald-800 text-white rounded-[1.5rem] font-black text-xs tracking-[0.3em] uppercase transition-all shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-4 active:scale-95"
                >
                  <ArrowRight className="w-5 h-5" /> Submit Batch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Clear Cart */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setShowConfirmClear(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 md:p-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowConfirmClear(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-8 border border-rose-100 dark:border-rose-900 shadow-inner">
                <AlertTriangle className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Are you sure?</h3>
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Confirming this action will remove <span className="text-slate-900 dark:text-white font-black underline decoration-rose-500/30">all artisanal items</span> from your current batch request. This curated selection cannot be restored once cleared.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setShowConfirmClear(false)} 
                className="order-2 sm:order-1 py-4.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
              >
                No, Keep My Batch
              </button>
              <button 
                onClick={() => { clearCart(); setShowConfirmClear(false); }} 
                className="order-1 sm:order-2 py-4.5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
