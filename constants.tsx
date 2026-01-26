
import { Product, UserRole, User, StockStatus, Testimonial } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // RAMADAN SPECIALS
  {
    id: 'r1',
    name: 'Shahi Mutton Haleem',
    description: 'A slow-cooked, nutritious blend of wheat, barley, meat, and lentils. Topped with ginger, fried onions, and lemon.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=600',
    category: 'NON VEG',
    isMondaySpecial: false,
    isRamadanSpecial: true,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  },
  {
    id: 'r2',
    name: 'Premium Iftar Box',
    description: 'A curated selection of Beguni, Alur Chop, Piaju, Dates, and Jilapi. Perfect for breaking the fast.',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1616683935288-75c165315573?auto=format&fit=crop&q=80&w=600',
    category: 'SNACKS',
    isMondaySpecial: false,
    isRamadanSpecial: true,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  },
  {
    id: 'r3',
    name: 'Royal Borhani',
    description: 'Traditional spiced yogurt drink flavored with mint, black salt, and roasted cumin. Best paired with Biryani.',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=600',
    category: 'SWEETS',
    isMondaySpecial: false,
    isRamadanSpecial: true,
    isNew: false,
    stockStatus: StockStatus.IN_STOCK
  },
  // SWEETS
  {
    id: 's1',
    name: 'Premium Sponge Rasgulla',
    description: 'Soft, melt-in-your-mouth cheese dumplings soaked in a light, fragrant sugar syrup.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&q=80&w=600',
    category: 'SWEETS',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  },
  {
    id: 's2',
    name: 'Royal Gulab Jamun',
    description: 'Deep-fried milk solids dumplings, infused with cardamom and saffron syrup.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1622315758111-66597288677c?auto=format&fit=crop&q=80&w=600',
    category: 'SWEETS',
    isMondaySpecial: true,
    isRamadanSpecial: false,
    isNew: false,
    stockStatus: StockStatus.LOW_STOCK
  },
  // NON VEG
  {
    id: 'nv1',
    name: 'Mutton Kacchi Biryani',
    description: 'Premium goat meat layered with aromatic basmati rice and traditional spices.',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
    category: 'NON VEG',
    isMondaySpecial: true,
    isRamadanSpecial: false,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  },
  {
    id: 'nv2',
    name: 'Chicken Roast (Special)',
    description: 'Slow-cooked chicken in a rich, nutty, and mildly spicy gravy.',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=600',
    category: 'NON VEG',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: false,
    stockStatus: StockStatus.IN_STOCK
  },
  // VEG
  {
    id: 'v1',
    name: 'Paneer Butter Masala',
    description: 'Fresh cottage cheese cubes in a creamy, velvety tomato-based gravy.',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
    category: 'VEG',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  },
  {
    id: 'v2',
    name: 'Aloo Bhaji & Paratha',
    description: 'Smashed spiced potatoes served with handmade flaky parathas.',
    price: 9.00,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600',
    category: 'VEG',
    isMondaySpecial: true,
    isRamadanSpecial: false,
    isNew: false,
    stockStatus: StockStatus.IN_STOCK
  },
  // SNACKS
  {
    id: 'sn1',
    name: 'Handmade Vegetable Singara',
    description: 'Crispy pastry filled with spiced peas and potatoes. A tea-time favorite.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1601050633722-3f8d446bfd0f?auto=format&fit=crop&q=80&w=600',
    category: 'SNACKS',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: false,
    stockStatus: StockStatus.SOLD_OUT
  },
  {
    id: 'sn2',
    name: 'Chicken Tikka Skewers',
    description: 'Juicy chicken chunks marinated in yogurt and tandoori spices, grilled to perfection.',
    price: 11.50,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600',
    category: 'SNACKS',
    isMondaySpecial: false,
    isRamadanSpecial: false,
    isNew: true,
    stockStatus: StockStatus.IN_STOCK
  }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  { id: "t1", name: "Rafiqul Islam", role: "Regular Customer", text: "The Mutton Kacchi here is better than what I've had in Dhaka. The approval system is great because I know it's always fresh.", createdAt: new Date().toISOString() },
  { id: "t2", name: "Sarah Ahmed", role: "Sweet Lover", text: "Their Rasgulla is simply out of this world. Soft, spongy, and perfectly sweet. I order for every family gathering!", createdAt: new Date().toISOString() },
  { id: "t3", name: "Imran Chowdhury", role: "Snack Enthusiast", text: "Best snacks for our office tea parties. The Tikka skewers are incredibly juicy. Highly recommend the Monday Special!", createdAt: new Date().toISOString() }
];

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  email: 'user',
  name: 'Head Chef',
  role: UserRole.ADMIN
};

export const MOCK_USER: User = {
  id: 'user-1',
  email: 'customer@test.com',
  name: 'Sameer Khan',
  role: UserRole.CUSTOMER
};

export const MOCK_GUEST: User = {
  id: 'guest-session',
  email: 'guest@deshi.com',
  name: 'Guest Visitor',
  role: UserRole.GUEST
};
