
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, UserRole, User as UserType, Product, StockStatus } from '../types';
import { 
  X, ShieldCheck, ChevronRight, MessageCircle, 
  LayoutDashboard, Package, BarChart3, Settings
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  updateStatus: (id: string, s: OrderStatus, note?: string) => void;
  currentUser: UserType | null;
  products: Product[];
  setProducts: (p: Product[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, updateStatus, currentUser, products, setProducts }) => {
  // 1. Hooks (Must always run)
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'analytics'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PENDING), [orders]);
  const totalRevenue = useMemo(() => orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, o) => acc + o.total, 0), [orders]);

  // 2. Early Return (After all hooks)
  if (!currentUser || currentUser.role !== UserRole.ADMIN) return null;

  // 3. Methods
  const handleAction = (status: OrderStatus) => {
    if (selectedOrderId) {
      updateStatus(selectedOrderId, status, adminNote);
      setSelectedOrderId(null);
      setAdminNote('');
    }
  };

  const toggleStock = (productId: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stockStatus: p.stockStatus === StockStatus.SOLD_OUT ? StockStatus.IN_STOCK : StockStatus.SOLD_OUT
        };
      }
      return p;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Kitchen Command</h1>
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> High-Intensity Boutique Management
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto">
          <button onClick={() => setActiveTab('orders')} className={`flex-1 lg:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Requests</button>
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 lg:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Inventory</button>
          <button onClick={() => setActiveTab('analytics')} className={`flex-1 lg:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400'}`}>Insights</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
        <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Verified Revenue</h3>
          <p className="text-3xl md:text-4xl font-black">${totalRevenue.toFixed(2)}</p>
          <BarChart3 className="absolute -right-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 opacity-10 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Batches</h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{pendingOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hidden sm:block">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kitchen Load</h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{orders.length}</p>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 md:px-10 py-6 md:py-8">Request ID</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 hidden md:table-cell">Patron</th>
                  <th className="px-6 md:px-10 py-6 md:py-8">Value</th>
                  <th className="px-6 md:px-10 py-6 md:py-8">Status</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.map(order => (
                  <tr key={order.id} onClick={() => { setSelectedOrderId(order.id); setAdminNote(order.adminNote || ''); }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
                    <td className="px-6 md:px-10 py-6 md:py-8 font-black text-slate-900 dark:text-white text-sm">{order.id}</td>
                    <td className="px-6 md:px-10 py-6 md:py-8 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 hidden md:table-cell">{order.customerName}</td>
                    <td className="px-6 md:px-10 py-6 md:py-8 font-black text-slate-900 dark:text-white text-sm">${order.total.toFixed(2)}</td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        order.status === OrderStatus.PENDING ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-100' :
                        order.status === OrderStatus.APPROVED ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100' :
                        order.status === OrderStatus.PAID ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-rose-50 text-rose-700'
                      }`}>{order.status}</span>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8 text-right">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {products.map(product => (
            <div key={product.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{product.name}</h4>
                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mb-3 md:mb-4">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full border ${product.stockStatus === StockStatus.SOLD_OUT ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    {product.stockStatus === StockStatus.SOLD_OUT ? 'Out of Batch' : 'Active Batch'}
                  </span>
                  <button onClick={() => toggleStock(product.id)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] md:rounded-[4rem] animate-in zoom-in-95 duration-500">
          <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 px-4">Marketplace Intelligence</h3>
          <p className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest px-4">Compiling current kitchen metrics...</p>
        </div>
      )}

      {selectedOrderId && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setSelectedOrderId(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">Review Batch {selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrderId(null)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"><X /></button>
             </div>
             
             <div className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto flex-grow no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patron</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-black text-sm text-slate-900 dark:text-white">{selectedOrder.customerName}</div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Batch Value</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-black text-lg md:text-xl text-emerald-800 dark:text-emerald-500">${selectedOrder.total.toFixed(2)}</div>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Composition</p>
                   <div className="space-y-2 max-h-40 md:max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                           <span className="text-xs font-black text-slate-900 dark:text-white">{item.quantity}x {item.name}</span>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">{item.category}</span>
                        </div>
                      ))}
                   </div>
                </div>

                {selectedOrder.status === OrderStatus.PENDING && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5" /> Direct Note to Patron
                    </label>
                    <textarea 
                      value={adminNote} 
                      onChange={e => setAdminNote(e.target.value)} 
                      placeholder="e.g. Ingredients verified for 6PM batch. Proceed to secure pay." 
                      className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 h-24 md:h-32 resize-none" 
                    />
                  </div>
                )}
             </div>

             {selectedOrder.status === OrderStatus.PENDING && (
                <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 shrink-0">
                   <button onClick={() => handleAction(OrderStatus.REJECTED)} className="order-2 sm:order-1 py-4 md:py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95">Deny Batch</button>
                   <button onClick={() => handleAction(OrderStatus.APPROVED)} className="order-1 sm:order-2 py-4 md:py-5 bg-emerald-800 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl active:scale-95 shadow-emerald-900/20">Verify & Approve</button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
