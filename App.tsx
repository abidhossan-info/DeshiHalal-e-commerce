
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Bell, Sun, Moon, UtensilsCrossed, ChefHat, MoonStar, Menu, X, ChevronRight, Sparkles, ShieldCheck, AlertCircle, Database, ZapOff, Wrench } from 'lucide-react';
import { Product, Order, OrderStatus, UserRole, User as UserType, CartItem, Notification, Review, Testimonial, StockStatus } from './types';
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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
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
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const unreadNotifCount = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.id && !n.read).length, 
  [notifications, currentUser]);

  const isHeadChef = useMemo(() => currentUser?.role === UserRole.ADMIN, [currentUser]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const mapDbOrder = (dbOrder: any): Order => ({
    id: dbOrder.id,
    userId: dbOrder.user_id,
    customerName: dbOrder.customer_name,
    customerEmail: dbOrder.customer_email,
    customerPhone: dbOrder.customer_phone,
    items: Array.isArray(dbOrder.items) ? dbOrder.items : (typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : []),
    total: Number(dbOrder.total) || 0,
    status: dbOrder.status as OrderStatus,
    adminNote: dbOrder.admin_note,
    address: dbOrder.address,
    deliveryCompany: dbOrder.delivery_company,
    paymentLinkSent: dbOrder.payment_link_sent,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at
  });

  const mapDbProduct = (p: any): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price) || 0,
    image: p.image,
    category: p.category,
    isMondaySpecial: p.monday_special ?? false,
    isRamadanSpecial: p.ramadan_special ?? false,
    isNew: p.is_new ?? false,
    stockStatus: (p.stock_status || StockStatus.IN_STOCK) as StockStatus
  });

  const mapDbNotif = (dbNotif: any): Notification => ({
    id: dbNotif.id,
    userId: dbNotif.user_id,
    title: dbNotif.title,
    message: dbNotif.message,
    type: dbNotif.type as Notification['type'],
    read: dbNotif.read,
    createdAt: dbNotif.created_at
  });

  const mapDbReview = (r: any): Review => ({
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    isApproved: r.is_approved,
    createdAt: r.created_at
  });

  const mapDbTestimonial = (t: any): Testimonial => ({
    id: t.id,
    name: t.name,
    role: t.role,
    text: t.text,
    createdAt: t.created_at
  });

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (currentUser.role !== UserRole.ADMIN) {
        if (UUID_REGEX.test(currentUser.id)) {
          query = query.eq('user_id', currentUser.id);
        } else {
          return;
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) setOrders(data.map(mapDbOrder));
    } catch (err) {
      console.warn("Boutique Order Sync Error:", err);
    }
  }, [currentUser]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setReviews(data.map(mapDbReview));
    } catch (err) {
      console.warn("Boutique Reviews Sync Error:", err);
    }
  }, []);

  const handleAddReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'isApproved'>) => {
    try {
      const { data, error } = await supabase.from('reviews').insert([{
        product_id: reviewData.productId,
        user_id: reviewData.userId,
        user_name: reviewData.userName,
        rating: reviewData.rating,
        comment: reviewData.comment,
        is_approved: false
      }]).select().single();

      if (error) throw error;
      if (data) {
        setReviews(prev => [mapDbReview(data), ...prev]);
        await addNotification(MOCK_ADMIN.id, 'New Review Submission', `A new artisan sentiment for product #${reviewData.productId} awaits audit.`, 'SYSTEM');
      }
    } catch (err) {
      console.error("Review persistence error:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (location.pathname === '/admin' && isHeadChef) {
      fetchOrders();
    }
  }, [location.pathname, isHeadChef, fetchOrders]);

  const fetchUserData = useCallback(async (userId: string, role: UserRole) => {
    try {
      const isUuid = UUID_REGEX.test(userId);
      let ordersQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
      let notifsQuery = supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (role !== UserRole.ADMIN) {
        if (isUuid) {
          ordersQuery = ordersQuery.eq('user_id', userId);
        } else {
          setOrders([]);
          setNotifications([]);
          return;
        }
      }

      const [ordersRes, notifsRes] = await Promise.all([ordersQuery, notifsQuery]);
      if (ordersRes.data) setOrders(ordersRes.data.map(mapDbOrder));
      if (notifsRes.data) setNotifications(notifsRes.data.map(mapDbNotif));
    } catch (err) {
      console.warn("Boutique Data Sync disconnected.");
    }
  }, []);

  const ensureProfileExists = async (sessionUser: any) => {
    if (!sessionUser) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
      if (data) return data;

      const isAdminEmail = sessionUser.email === 'admin@deshi.com' || sessionUser.email?.endsWith('@it-genix.com');
      const newProfile = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata?.full_name || 'Artisan Patron',
        role: isAdminEmail ? 'ADMIN' : 'CUSTOMER',
        phone: sessionUser.user_metadata?.phone || null
      };

      const { data: created, error: createError } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (!createError) return created;
    } catch (e) {
      console.warn("Profile synchronization deferred.");
    }
    return null;
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await ensureProfileExists(session.user);
          const userData: UserType = profile ? {
            ...profile,
            role: (profile.role?.toUpperCase() as UserRole) || UserRole.CUSTOMER
          } : {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || 'Artisan Patron',
            role: UserRole.CUSTOMER
          };
          setCurrentUser(userData);
          fetchUserData(session.user.id, userData.role);
        } else {
          const savedGuest = localStorage.getItem('dh_guest_user');
          if (savedGuest) setCurrentUser(JSON.parse(savedGuest));
        }

        const [prods, tests, revs] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('testimonials').select('*'),
          supabase.from('reviews').select('*')
        ]);

        if (prods.data) setProducts(prods.data.map(mapDbProduct));
        if (tests.data) setTestimonials(tests.data.map(mapDbTestimonial));
        if (revs.data) setReviews(revs.data.map(mapDbReview));
      } catch (err) {
        console.warn("Initial sync error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        const profile = await ensureProfileExists(session.user);
        const userData: UserType = profile ? {
          ...profile,
          role: (profile.role?.toUpperCase() as UserRole) || UserRole.CUSTOMER
        } : {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'Artisan Patron',
          role: UserRole.CUSTOMER
        };
        setCurrentUser(userData);
        fetchUserData(session.user.id, userData.role);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setOrders([]);
        setNotifications([]);
        localStorage.removeItem('dh_user');
        localStorage.removeItem('dh_guest_user');
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addNotification = async (userId: string, title: string, message: string, type: Notification['type']) => {
    const isUuid = UUID_REGEX.test(userId);
    const newNotif = { user_id: isUuid ? userId : null, title, message, type, read: false };
    try { await supabase.from('notifications').insert([newNotif]); } catch (e) {}
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string, updatedItems?: CartItem[], deliveryCompany?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const dbUpdate: any = { status, admin_note: note || targetOrder.adminNote, updated_at: new Date().toISOString() };
    if (deliveryCompany) dbUpdate.delivery_company = deliveryCompany;
    if (updatedItems) dbUpdate.items = updatedItems;

    try {
      const { data, error } = await supabase.from('orders').update(dbUpdate).eq('id', orderId).select().single();
      if (error) throw error;
      if (data) {
        const updatedOrder = mapDbOrder(data);
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        if (updatedOrder.userId && UUID_REGEX.test(updatedOrder.userId)) {
          await addNotification(updatedOrder.userId, `Update: ${status}`, `Your boutique batch has been transitioned to ${status}.`, 'ORDER_UPDATE');
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
      throw err;
    }
  };

  const requestOrder = async (asGuest: boolean = false, guestData?: { name: string, email: string, phone: string, address: string }) => {
    if (cart.length === 0) return;
    const { data: { session } } = await supabase.auth.getSession();
    const activeUserId = session?.user?.id || null;
    const isUuid = activeUserId && UUID_REGEX.test(activeUserId);

    const dbPayload = {
      user_id: isUuid ? activeUserId : null,
      customer_name: currentUser?.name || guestData?.name || 'Guest Patron',
      customer_email: currentUser?.email || guestData?.email,
      customer_phone: currentUser?.phone || guestData?.phone,
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, isApproved: true })),
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      address: currentUser?.address || guestData?.address
    };

    try {
      const { data, error } = await supabase.from('orders').insert([dbPayload]).select().single();
      if (error) throw error;

      if (asGuest && !activeUserId) {
        const guestUser: UserType = { id: `guest-${Date.now()}`, name: dbPayload.customer_name, email: dbPayload.customer_email || '', phone: dbPayload.customer_phone || '', address: dbPayload.address || '', role: UserRole.GUEST };
        setCurrentUser(guestUser);
        localStorage.setItem('dh_guest_user', JSON.stringify(guestUser));
      }

      setCart([]);
      await addNotification(MOCK_ADMIN.id, 'New Batch Request', `Patron ${dbPayload.customer_name} initiated a culinary request.`, 'ORDER_REQUEST');
      fetchOrders();
      navigate('/account');
    } catch (err: any) {
      alert(`Submission Denied: ${err.message}`);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateCartQuantity = (productId: string, delta: number) => setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const clearCart = () => setCart([]);

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
                {cartCount > 0 && <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950">{cartCount}</span>}
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
                <Link to="/login" className="hidden sm:block px-5 py-2.5 bg-emerald-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-emerald-900 active:scale-95 transition-all">Patron Login</Link>
              )}
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-700 dark:text-slate-300">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home products={products} addToCart={addToCart} testimonials={testimonials} />} />
          <Route path="/shop" element={<Shop products={products} addToCart={addToCart} />} />
          <Route path="/monday-menu" element={<MondayMenu products={products.filter(p => p.isMondaySpecial)} addToCart={addToCart} />} />
          <Route path="/ramadan-menu" element={<RamadanMenu products={products.filter(p => p.isRamadanSpecial)} addToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateQuantity={updateCartQuantity} requestOrder={requestOrder} clearCart={clearCart} currentUser={currentUser} />} />
          <Route path="/account" element={<Account currentUser={currentUser} orders={orders} notifications={notifications} markRead={(id) => {}} updateStatus={updateOrderStatus} setCurrentUser={setCurrentUser} updateCurrentUser={(u) => {}} />} />
          <Route path="/admin" element={<AdminDashboard orders={orders} updateStatus={updateOrderStatus} currentUser={currentUser} products={products} setProducts={setProducts} testimonials={testimonials} setTestimonials={setTestimonials} reviews={reviews} setReviews={setReviews} refreshOrders={fetchOrders} />} />
          <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
          <Route path="/product/:id" element={<ProductDetails products={products} addToCart={addToCart} reviews={reviews} addReview={handleAddReview} currentUser={currentUser} orders={orders} />} />
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
