
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Bell, Sun, Moon, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Product, Order, OrderStatus, UserRole, User as UserType, CartItem, Notification, Review } from './types';
import { INITIAL_PRODUCTS, MOCK_ADMIN, MOCK_USER } from './constants';

// --- Pages ---
import Home from './pages/Home';
import Shop from './pages/Shop';
import MondayMenu from './pages/MondayMenu';
import CartPage from './pages/CartPage';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ProductDetails from './pages/ProductDetails';

const App: React.FC = () => {
  // 1. Hook Declarations (Must be at the top)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dh_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const navigate = useNavigate();

  // 2. Computed Values (useMemo)
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const unreadNotifCount = useMemo(() => 
    notifications.filter(n => n.userId === currentUser?.id && !n.read).length, 
  [notifications, currentUser]);

  const isHeadChef = useMemo(() => currentUser?.role === UserRole.ADMIN, [currentUser]);

  // 3. Side Effects (useEffect)
  useEffect(() => {
    const loadState = () => {
      const savedProducts = localStorage.getItem('dh_products');
      const savedOrders = localStorage.getItem('dh_orders');
      const savedNotifs = localStorage.getItem('dh_notifications');
      const savedUser = localStorage.getItem('dh_user');
      
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    };

    loadState();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (['dh_orders', 'dh_notifications', 'dh_user', 'dh_products'].includes(e.key || '')) {
        loadState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('dh_products', JSON.stringify(products));
    localStorage.setItem('dh_orders', JSON.stringify(orders));
    localStorage.setItem('dh_notifications', JSON.stringify(notifications));
    if (currentUser) {
      localStorage.setItem('dh_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dh_user');
    }
  }, [products, orders, notifications, currentUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dh_theme', 'light');
    }
  }, [isDarkMode]);

  // 4. Methods
  const addNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: `NT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const requestOrder = () => {
    if (cart.length === 0 || !currentUser) {
      if (!currentUser) navigate('/login');
      return;
    }

    const orderId = `DH-${Math.floor(Math.random() * 900000) + 100000}`;
    const newOrder: Order = {
      id: orderId,
      userId: currentUser.id,
      customerName: currentUser.name,
      items: [...cart],
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    
    addNotification(
      MOCK_ADMIN.id, 
      'New Batch Request', 
      `Patron ${currentUser.name} requested order ${orderId}. Verify ingredients.`, 
      'ORDER_REQUEST'
    );

    navigate('/account');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    setOrders(prevOrders => {
      const targetOrder = prevOrders.find(o => o.id === orderId);
      if (!targetOrder) return prevOrders;

      const updatedOrders = prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status, adminNote: note, updatedAt: new Date().toISOString() } 
          : order
      );

      const noteText = note ? ` Head Chef Note: ${note}` : '';
      if (status === OrderStatus.APPROVED) {
        addNotification(
          targetOrder.userId, 
          'Verified by Head Chef', 
          `Your batch ${orderId} is verified. Payment is now unlocked.${noteText}`, 
          'ORDER_UPDATE'
        );
      } else if (status === OrderStatus.REJECTED) {
        addNotification(
          targetOrder.userId, 
          'Update from Head Chef', 
          `Batch ${orderId} cannot be fulfilled at this time.${noteText}`, 
          'ORDER_UPDATE'
        );
      } else if (status === OrderStatus.PAID) {
        addNotification(
          MOCK_ADMIN.id, 
          'Payment Verified', 
          `Order ${orderId} has been paid. Start preparation immediately.`, 
          'SYSTEM'
        );
      }

      return updatedOrders;
    });
  };

  const updateCurrentUser = (userData: Partial<UserType>) => {
    setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="bg-emerald-900 text-white text-[10px] font-black py-2.5 text-center tracking-[0.3em] uppercase relative z-[60]">
        Deshi Halal Boutique & Artisanal Kitchen
      </div>

      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-900 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="text-xl font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-tighter">
            <UtensilsCrossed className="w-6 h-6 fill-emerald-100 dark:fill-emerald-900" />
            <span>DESHI<span className="text-amber-600">HALAL</span></span>
          </Link>

          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 uppercase font-black text-[9px] xl:text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-800 dark:hover:text-emerald-400">Home</Link>
            <Link to="/monday-menu" className="hover:text-emerald-800 dark:hover:text-emerald-400">Monday Menu</Link>
            <Link to="/shop" className="hover:text-emerald-800 dark:hover:text-emerald-400">Veg & Nonveg</Link>
            <Link to="/shop?cat=SNACKS" className="hover:text-emerald-800 dark:hover:text-emerald-400">Snacks</Link>
            <Link to="/shop?cat=SWEETS" className="hover:text-emerald-800 dark:hover:text-emerald-400">Sweets</Link>
            {isHeadChef && (
              <Link to="/admin" className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5 hover:text-amber-700">
                <ChefHat className="w-3.5 h-3.5" /> Kitchen Command
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-5">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-700 dark:text-slate-300">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isHeadChef && (
              <Link to="/cart" className="relative p-2 text-slate-700 dark:text-slate-300">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cartCount}</span>}
              </Link>
            )}
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/account" className="relative p-2 text-slate-700 dark:text-slate-300">
                  <Bell className={`w-5 h-5 ${unreadNotifCount > 0 ? 'text-amber-500 animate-bounce' : ''}`} />
                  {unreadNotifCount > 0 && <span className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{unreadNotifCount}</span>}
                </Link>
                <Link to="/account" className="w-8 h-8 rounded-full overflow-hidden border border-emerald-200 dark:border-emerald-800 transition-transform active:scale-95">
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
              <Link to="/login" className="px-5 py-2.5 bg-emerald-800 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-emerald-900 transition-all">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home products={products} addToCart={addToCart} />} />
          <Route path="/shop" element={<Shop products={products} addToCart={addToCart} />} />
          <Route path="/monday-menu" element={<MondayMenu products={products.filter(p => p.isMondaySpecial)} addToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateQuantity={updateCartQuantity} requestOrder={requestOrder} clearCart={clearCart} />} />
          <Route path="/account" element={<Account currentUser={currentUser} orders={orders.filter(o => o.userId === currentUser?.id)} notifications={notifications.filter(n => n.userId === currentUser?.id)} markRead={markNotificationRead} updateStatus={updateOrderStatus} setCurrentUser={setCurrentUser} updateCurrentUser={updateCurrentUser} />} />
          <Route path="/admin" element={<AdminDashboard orders={orders} updateStatus={updateOrderStatus} currentUser={currentUser} products={products} setProducts={setProducts} />} />
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
