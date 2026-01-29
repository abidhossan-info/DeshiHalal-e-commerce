
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Bell, Sun, Moon, UtensilsCrossed, ChefHat, MoonStar, Menu, X, ChevronRight } from 'lucide-react';
import { Product, Order, OrderStatus, UserRole, User as UserType, CartItem, Notification, Review, Testimonial } from './types';
import { INITIAL_PRODUCTS, INITIAL_TESTIMONIALS, MOCK_ADMIN } from './constants';
import { supabase } from './supabase';

// --- Pages ---
import Home from './pages/Home';
import Shop from './pages/Shop';
import MondayMenu from './pages/MondayMenu';
import RamadanMenu from './pages/RamadanMenu';
import CartPage from './pages/CartPage';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ProductDetails from './pages/ProductDetails';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      return false;
    }
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const unreadNotifCount = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.id && !n.read).length, 
  [notifications, currentUser]);

  const isHeadChef = useMemo(() => currentUser?.role === UserRole.ADMIN, [currentUser]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const fetchUserData = useCallback(async (userId: string, role: UserRole) => {
    const ordersQuery = supabase.from('orders').select('*').order('createdAt', { ascending: false });
    const notifsQuery = supabase.from('notifications').select('*').eq('userId', userId).order('createdAt', { ascending: false });

    if (role !== UserRole.ADMIN) {
      ordersQuery.eq('userId', userId);
    }

    const [ordersRes, notifsRes] = await Promise.all([ordersQuery, notifsQuery]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (notifsRes.data) setNotifications(notifsRes.data);
  }, []);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<UserType | null> => {
    if (userId === MOCK_ADMIN.id) return MOCK_ADMIN;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && retryCount < 3) {
      await new Promise(res => setTimeout(res, 500));
      return fetchProfile(userId, retryCount + 1);
    }
    return data;
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const ordersChannel = supabase
      .channel('orders-global')
      .on('postgres_changes', { event: '*', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          if (currentUser.role === UserRole.ADMIN || newOrder.userId === currentUser.id) {
            setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
          }
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'PATCH') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        }
      })
      .subscribe();

    const notifsChannel = supabase
      .channel(`notifs-${currentUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'notifications',
        filter: `userId=eq.${currentUser.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchUserData(currentUser.id, currentUser.role);
    }, 30000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notifsChannel);
      clearInterval(pollInterval);
    };
  }, [currentUser, fetchUserData]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('dh_user', JSON.stringify(profile));
            fetchUserData(session.user.id, profile.role);
          }
        }

        const [prods, tests, revs] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('testimonials').select('*'),
          supabase.from('reviews').select('*')
        ]);
        setProducts(prods.data && prods.data.length > 0 ? prods.data : INITIAL_PRODUCTS);
        setTestimonials(tests.data && tests.data.length > 0 ? tests.data : INITIAL_TESTIMONIALS);
        setReviews(revs.data || []);

      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('dh_user', JSON.stringify(profile));
          fetchUserData(session.user.id, profile.role);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setOrders([]);
        setNotifications([]);
        localStorage.removeItem('dh_user');
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchUserData, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dh_theme', 'light');
    }
  }, [isDarkMode]);

  const addNotification = async (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Omit<Notification, 'id'> = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    await supabase.from('notifications').insert([newNotif]);
  };

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity, isApproved: true }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const requestOrder = async (asGuest: boolean = false, guestData?: { name: string, email: string, phone: string, address: string }) => {
    if (cart.length === 0) return;
    const userId = currentUser?.id || `guest-${Date.now()}`;
    const customerName = currentUser?.name || guestData?.name || 'Guest';
    const orderPayload = {
      userId,
      customerName,
      customerEmail: currentUser?.email || guestData?.email,
      customerPhone: currentUser?.phone || guestData?.phone,
      items: cart,
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      address: currentUser?.address || guestData?.address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const { error } = await supabase.from('orders').insert([orderPayload]);
    if (error) {
      alert("System could not dispatch batch.");
      return;
    }
    setCart([]);
    addNotification(MOCK_ADMIN.id, 'New Batch Request', `Patron ${customerName} requested a new batch.`, 'ORDER_REQUEST');
    navigate('/account');
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string, updatedItems?: CartItem[]) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const finalItems = updatedItems || targetOrder.items;
    const finalTotal = finalItems.reduce((acc, item) => item.isApproved !== false ? acc + (item.price * item.quantity) : acc, 0);
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status, 
        adminNote: note, 
        items: finalItems,
        total: finalTotal,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', orderId);

    if (!error) {
      let title = `Order Update: ${status}`;
      let message = `Your batch ${orderId} has been updated to ${status}.`;

      if (status === OrderStatus.APPROVED) {
        title = "Chef Approved Your Request! 🎉";
        message = `Good news! Your batch #${orderId} has been approved. Please complete the payment to start preparation of your fresh items.`;
      } else if (status === OrderStatus.READY_TO_DELIVERY) {
        title = "Your Batch is Ready! 📦";
        message = `Artisanal batch #${orderId} is freshly packed and ready for dispatch. Our courier will contact you soon.`;
      } else if (status === OrderStatus.ON_THE_WAY) {
        title = "Artisan Food En Route! 🚚";
        message = `Great news! Your batch #${orderId} is out for delivery. Expect our boutique courier shortly!`;
      } else if (status === OrderStatus.REJECTED) {
        title = "Batch Verification Notice";
        message = `We couldn't approve batch #${orderId} due to ingredient availability. Please check the Chef's notes for alternatives.`;
      } else if (status === OrderStatus.DELIVERED) {
        title = "Fresh Delivery Confirmed! ✨";
        message = `We hope you enjoyed your artisanal experience with batch #${orderId}. We'd love to hear your feedback!`;
      }

      addNotification(targetOrder.userId, title, message, 'ORDER_UPDATE');
    }
  };

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'isApproved'>) => {
    const newReview = { ...reviewData, isApproved: false, createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('reviews').insert([newReview]).select().single();
    if (!error && data) {
      setReviews(prev => [...prev, data]);
      addNotification(MOCK_ADMIN.id, 'New Product Review', `A customer left a review for product ${reviewData.productId}. Needs approval.`, 'SYSTEM');
    }
  };

  const updateCurrentUser = async (userData: Partial<UserType>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update(userData).eq('id', currentUser.id);
    if (!error) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      localStorage.setItem('dh_user', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="bg-emerald-900 text-white text-[10px] font-black py-2.5 text-center tracking-[0.3em] uppercase relative z-[60]">
        Deshi Halal Boutique & Artisanal Kitchen
      </div>

      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-900 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="text-xl font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-tighter shrink-0">
            <UtensilsCrossed className="w-6 h-6 fill-emerald-100 dark:fill-emerald-900" />
            <span>DESHI<span className="text-amber-600">HALAL</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-800 dark:hover:text-emerald-400">Home</Link>
            <Link to="/ramadan-menu" className="flex items-center gap-1.5 text-amber-600">
              <MoonStar className="w-3.5 h-3.5" /> Ramadan Menu
            </Link>
            <Link to="/monday-menu" className="hover:text-emerald-800 dark:hover:text-emerald-400">Monday Menu</Link>
            <Link to="/shop" className="hover:text-emerald-800 dark:hover:text-emerald-400">Shop</Link>
            {isHeadChef && (
              <Link to="/admin" className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" /> Kitchen Command
              </Link>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isHeadChef && (
              <Link to="/cart" className="relative p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cartCount}</span>}
              </Link>
            )}
            
            <div className="hidden sm:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link to="/account" className="relative p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
                    <Bell className={`w-5 h-5 ${unreadNotifCount > 0 ? 'text-amber-500 animate-bounce' : ''}`} />
                    {unreadNotifCount > 0 && <span className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{unreadNotifCount}</span>}
                  </Link>
                  <Link to="/account" className="w-8 h-8 rounded-full overflow-hidden border border-emerald-200 dark:border-emerald-800">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-black text-xs uppercase">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-emerald-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-emerald-900 transition-all">Sign In</Link>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all active:scale-90 relative z-[70]"
            >
              <div className="relative w-6 h-6">
                 <div className={`absolute inset-0 transition-all duration-500 transform ${isMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                    <Menu className="w-6 h-6" />
                 </div>
                 <div className={`absolute inset-0 transition-all duration-500 transform ${isMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
                    <X className="w-6 h-6 text-rose-600" />
                 </div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
         {/* Blur Backdrop */}
         <div className={`absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)}></div>
         
         {/* Slide Container */}
         <div className={`absolute top-0 right-0 h-full w-full max-w-[320px] bg-white dark:bg-slate-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out border-l border-slate-100 dark:border-slate-900 flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-20 flex items-center px-6 border-b border-slate-50 dark:border-slate-900 shrink-0">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Boutique Navigation</span>
            </div>
            
            <div className="flex-grow overflow-y-auto py-10 px-8 flex flex-col gap-8">
               {[
                 { label: 'Home', path: '/' },
                 { label: 'Ramadan Menu', path: '/ramadan-menu', highlight: 'text-amber-600', icon: <MoonStar className="w-4 h-4" /> },
                 { label: 'Monday Menu', path: '/monday-menu' },
                 { label: 'Full Shop', path: '/shop' }
               ].map((item) => (
                 <Link 
                   key={item.path} 
                   to={item.path} 
                   className={`flex items-center justify-between text-2xl font-black uppercase tracking-tighter group ${item.highlight || 'text-slate-900 dark:text-white'}`}
                 >
                   <span className="flex items-center gap-3">{item.icon} {item.label}</span>
                   <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-800 group-hover:text-emerald-500 transition-colors" />
                 </Link>
               ))}
               
               {isHeadChef && (
                 <Link to="/admin" className="flex items-center justify-between text-2xl font-black uppercase tracking-tighter text-amber-600 group mt-4 pt-8 border-t border-slate-50 dark:border-slate-900">
                   <span className="flex items-center gap-3"><ChefHat className="w-5 h-5" /> Command</span>
                   <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                 </Link>
               )}
            </div>

            <div className="p-8 border-t border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
               {currentUser ? (
                  <Link to="/account" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center font-black text-emerald-800 dark:text-emerald-400">
                       {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow">
                       <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{currentUser.name}</h4>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">View Portfolio</p>
                    </div>
                  </Link>
               ) : (
                  <Link to="/login" className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black text-xs tracking-[0.3em] uppercase flex items-center justify-center shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
                    Sign In Portfolio
                  </Link>
               )}
            </div>
         </div>
      </div>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home products={products} addToCart={addToCart} testimonials={testimonials} />} />
          <Route path="/shop" element={<Shop products={products} addToCart={addToCart} />} />
          <Route path="/monday-menu" element={<MondayMenu products={products.filter(p => p.isMondaySpecial)} addToCart={addToCart} />} />
          <Route path="/ramadan-menu" element={<RamadanMenu products={products.filter(p => p.isRamadanSpecial)} addToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateQuantity={updateCartQuantity} requestOrder={requestOrder} clearCart={clearCart} currentUser={currentUser} />} />
          <Route path="/account" element={<Account currentUser={currentUser} orders={orders} notifications={notifications} markRead={markNotificationRead} updateStatus={updateOrderStatus} setCurrentUser={setCurrentUser} updateCurrentUser={updateCurrentUser} />} />
          <Route path="/admin" element={<AdminDashboard orders={orders} updateStatus={updateOrderStatus} currentUser={currentUser} products={products} setProducts={setProducts} testimonials={testimonials} setTestimonials={setTestimonials} reviews={reviews} setReviews={setReviews} />} />
          <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
          <Route path="/product/:id" element={<ProductDetails products={products} addToCart={addToCart} reviews={reviews} addReview={addReview} currentUser={currentUser} orders={orders} />} />
        </Routes>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-slate-300">Deshi Halal & Sweets Boutique</p>
        <p className="text-[9px] font-bold">&copy; 2026 Crafted by <span className="text-emerald-500 underline">IT-GENIX</span></p>
      </footer>
    </div>
  );
};

export default App;
