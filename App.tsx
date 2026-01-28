
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Bell, Sun, Moon, UtensilsCrossed, ChefHat, MoonStar, Menu, X } from 'lucide-react';
import { Product, Order, OrderStatus, UserRole, User as UserType, CartItem, Notification, Review, Testimonial } from './types';
import { INITIAL_PRODUCTS, INITIAL_TESTIMONIALS } from './constants';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const unreadNotifCount = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.id && !n.read).length, 
  [notifications, currentUser]);

  const isHeadChef = useMemo(() => currentUser?.role === UserRole.ADMIN, [currentUser]);

  // Handle Authentication and Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      // Safety timeout to ensure app eventually shows up even if Supabase has issues
      const safetyTimeout = setTimeout(() => {
        if (loading) setLoading(false);
      }, 5000);

      try {
        // 1. Fetch Auth Session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem('dh_user', JSON.stringify(profile));
          }
        } else {
          // 2. Fallback to localStorage ONLY if no auth session (Guest handling)
          const savedUser = localStorage.getItem('dh_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed.role === UserRole.GUEST) {
                setCurrentUser(parsed);
              } else {
                localStorage.removeItem('dh_user');
              }
            } catch {
              localStorage.removeItem('dh_user');
            }
          }
        }

        // 3. Fetch Public Content
        const { data: prods } = await supabase.from('products').select('*');
        setProducts(prods && prods.length > 0 ? prods : INITIAL_PRODUCTS);

        const { data: tests } = await supabase.from('testimonials').select('*');
        setTestimonials(tests && tests.length > 0 ? tests : INITIAL_TESTIMONIALS);

        // 4. Fetch User Specific Data
        if (session?.user) {
          const [ordersRes, notifsRes] = await Promise.all([
            supabase.from('orders').select('*').eq('userId', session.user.id).order('createdAt', { ascending: false }),
            supabase.from('notifications').select('*').eq('userId', session.user.id).order('createdAt', { ascending: false })
          ]);
          if (ordersRes.data) setOrders(ordersRes.data);
          if (notifsRes.data) setNotifications(notifsRes.data);
        }
      } catch (err) {
        console.error("Critical Error during Supabase handshake:", err);
        // Fallback to local defaults if Supabase fails
        setProducts(INITIAL_PRODUCTS);
        setTestimonials(INITIAL_TESTIMONIALS);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    fetchData();

    // Listen for Auth Changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('dh_user', JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setOrders([]);
        setNotifications([]);
        localStorage.removeItem('dh_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dh_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const addNotification = async (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Omit<Notification, 'id'> = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('notifications').insert([newNotif]).select();
    if (!error && data) {
      setNotifications(prev => [data[0], ...prev]);
    }
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

    let userId = currentUser?.id || `guest-${Date.now()}`;
    let customerName = currentUser?.name || guestData?.name || 'Guest';

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

    const { data: newOrder, error } = await supabase.from('orders').insert([orderPayload]).select();
    
    if (error) {
      console.error("Error creating order:", error);
      return;
    }

    if (newOrder) {
      setOrders(prev => [newOrder[0], ...prev]);
      setCart([]);
      
      // Notify Admin
      addNotification(
        'admin-1', 
        'New Batch Request', 
        `Patron ${customerName} requested a new batch. Verify ingredients.`, 
        'ORDER_REQUEST'
      );

      navigate('/account');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string, updatedItems?: CartItem[]) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const finalItems = updatedItems || targetOrder.items;
    const finalTotal = finalItems.reduce((acc, item) => item.isApproved ? acc + (item.price * item.quantity) : acc, 0);

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
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, adminNote: note, items: finalItems, total: finalTotal } : o));
      
      // Notify User
      addNotification(
        targetOrder.userId, 
        `Order Update: ${status}`, 
        `Batch ${orderId} has been updated to ${status}. ${note || ''}`, 
        'ORDER_UPDATE'
      );
    }
  };

  const updateCurrentUser = async (userData: Partial<UserType>) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', currentUser.id);
    
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
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-tighter">
              <UtensilsCrossed className="w-6 h-6 fill-emerald-100 dark:fill-emerald-900" />
              <span>DESHI<span className="text-amber-600">HALAL</span></span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 uppercase font-black text-[9px] xl:text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Home</Link>
            <Link to="/ramadan-menu" className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors">
              <MoonStar className="w-3.5 h-3.5" /> Ramadan Menu
            </Link>
            <Link to="/monday-menu" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Monday Menu</Link>
            <Link to="/shop" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Veg & Nonveg</Link>
            <Link to="/shop?cat=SNACKS" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Snacks</Link>
            <Link to="/shop?cat=SWEETS" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Sweets</Link>
            {isHeadChef && (
              <Link to="/admin" className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                <ChefHat className="w-3.5 h-3.5" /> Kitchen Command
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-700 dark:text-slate-300 transition-transform active:scale-90">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isHeadChef && (
              <Link to="/cart" className="relative p-2 text-slate-700 dark:text-slate-300 transition-transform active:scale-90">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cartCount}</span>}
              </Link>
            )}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link to="/account" className="relative p-2 text-slate-700 dark:text-slate-300 transition-transform active:scale-90">
                  <Bell className={`w-5 h-5 ${unreadNotifCount > 0 ? 'text-amber-500 animate-bounce' : ''}`} />
                  {unreadNotifCount > 0 && <span className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{unreadNotifCount}</span>}
                </Link>
                <Link to="/account" className="w-8 h-8 rounded-full overflow-hidden border border-emerald-200 dark:border-emerald-800 transition-transform active:scale-95 shadow-md">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-black text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </Link>
              </div>
            ) : (
              <Link to="/login" className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-emerald-900 transition-all shadow-md active:scale-95">Sign In</Link>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-800 transition-colors" aria-label="Open menu">
              <Menu className="w-6 h-6" />
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
          <Route path="/account" element={<Account currentUser={currentUser} orders={orders.filter(o => o.userId === currentUser?.id)} notifications={notifications.filter(n => n.userId === currentUser?.id)} markRead={markNotificationRead} updateStatus={updateOrderStatus} setCurrentUser={setCurrentUser} updateCurrentUser={updateCurrentUser} />} />
          <Route path="/admin" element={<AdminDashboard orders={orders} updateStatus={updateOrderStatus} currentUser={currentUser} products={products} setProducts={setProducts} testimonials={testimonials} setTestimonials={setTestimonials} />} />
          <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
          <Route path="/product/:id" element={<ProductDetails products={products} addToCart={addToCart} reviews={reviews} addReview={() => {}} currentUser={currentUser} orders={orders} />} />
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
