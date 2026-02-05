
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Bell, Sun, Moon, UtensilsCrossed, ChefHat, MoonStar, Menu, X, ChevronRight, Sparkles } from 'lucide-react';
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
        } else {
          const savedGuest = localStorage.getItem('dh_guest_user');
          if (savedGuest) {
            const guest = JSON.parse(savedGuest);
            setCurrentUser(guest);
            fetchUserData(guest.id, guest.role);
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
        localStorage.removeItem('dh_guest_user');
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
    const orderPayload = {
      userId,
      customerName: currentUser?.name || guestData?.name || 'Guest',
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

    if (asGuest) {
      const guestUser: UserType = {
        id: userId,
        name: orderPayload.customerName,
        email: orderPayload.customerEmail || '',
        phone: orderPayload.customerPhone,
        address: orderPayload.address,
        role: UserRole.GUEST
      };
      setCurrentUser(guestUser);
      localStorage.setItem('dh_guest_user', JSON.stringify(guestUser));
    }

    setCart([]);
    addNotification(MOCK_ADMIN.id, 'New Batch Request', `Patron requested a new batch.`, 'ORDER_REQUEST');
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
      addNotification(targetOrder.userId, `Order Update: ${status}`, `Your batch ${orderId} has been updated.`, 'ORDER_UPDATE');
    }
  };

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'isApproved'>) => {
    const newReview = { ...reviewData, isApproved: false, createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('reviews').insert([newReview]).select().single();
    if (!error && data) {
      setReviews(prev => [...prev, data]);
      addNotification(MOCK_ADMIN.id, 'New Product Review', `Patron left a review for ${reviewData.productId}.`, 'SYSTEM');
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
      <div className="bg-emerald-900 text-white text-[9px] font-black py-2 text-center tracking-[0.4em] uppercase relative z-[60]">
        Deshi Halal Boutique & Artisanal Kitchen — fresh daily
      </div>

      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="text-xl font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-tighter">
            <UtensilsCrossed className="w-6 h-6 fill-emerald-100 dark:fill-emerald-900" />
            <span>DESHI<span className="text-amber-600">HALAL</span></span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-800 transition-colors">Home</Link>
            <Link to="/ramadan-menu" className="flex items-center gap-1.5 text-amber-600 hover:text-amber-500">
              <MoonStar className="w-3.5 h-3.5" /> Ramadan Menu
            </Link>
            <Link to="/monday-menu" className="hover:text-emerald-800 transition-colors">Monday Menu</Link>
            <Link to="/shop" className="hover:text-emerald-800 transition-colors">Full Shop</Link>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isHeadChef && (
              <Link to="/cart" className="relative p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all active:scale-90">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            <div className="flex items-center gap-2">
              {currentUser ? (
                <Link to="/account" className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-black text-xs uppercase overflow-hidden border border-emerald-200 dark:border-emerald-800">
                      {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                    </div>
                    {unreadNotifCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse"></span>}
                  </div>
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:block px-5 py-2.5 bg-emerald-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-emerald-900 active:scale-95 transition-all">
                  Patron Login
                </Link>
              )}
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-700 dark:text-slate-300">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full max-w-[320px] bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Boutique Navigation</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-8">
              {[
                { label: 'Home', path: '/' },
                { label: 'Ramadan Menu', path: '/ramadan-menu', icon: <MoonStar className="w-4 h-4 text-amber-500" /> },
                { label: 'Monday Menu', path: '/monday-menu' },
                { label: 'Artisan Shop', path: '/shop' }
              ].map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className="flex items-center justify-between text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white group"
                >
                  <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
              {isHeadChef && (
                <Link to="/admin" className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter text-amber-600 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <ChefHat className="w-6 h-6" /> Command
                </Link>
              )}
            </div>
            <div className="mt-auto">
               {currentUser ? (
                  <Link to="/account" className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-white font-black text-xl overflow-hidden">
                       {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{currentUser.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">View Portfolio</p>
                    </div>
                  </Link>
               ) : (
                  <Link to="/login" className="w-full py-5 bg-emerald-800 text-white rounded-[1.5rem] font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl">
                    <Sparkles className="w-4 h-4" /> Patron Login
                  </Link>
               )}
            </div>
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

      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/" className="text-xl font-black text-emerald-500 flex items-center gap-2 uppercase tracking-tighter">
              <UtensilsCrossed className="w-6 h-6 fill-emerald-900" />
              <span>DESHI<span className="text-white">HALAL</span></span>
            </Link>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-slate-300">Deshi Halal Boutique & Artisanal Kitchen</p>
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-[9px] font-bold uppercase tracking-widest">
             <Link to="/shop" className="hover:text-emerald-500">Menu</Link>
             <Link to="/account" className="hover:text-emerald-500">Tracking</Link>
             <Link to="/login" className="hover:text-emerald-500">Login</Link>
             <a href="#about" className="hover:text-emerald-500">Our Story</a>
          </div>
          <p className="text-[8px] font-bold opacity-50">&copy; 2026 Crafted by <span className="text-emerald-500 underline">IT-GENIX</span>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
