
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
  { 
    id: "t1", 
    name: "Faiza Faria", 
    role: "Seattle, WA", 
    text: "Best Bangladeshi food serving in Seattle! Sharmin apu is hands down, one of the best sources of Bangladeshi food in this part of the PNW. Her cooking reminds me of home and she always saves the day for any event big or small. Especially her goat biryani, chicken roast, daal puri are to die for.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t2", 
    name: "Md. Salahuddin Khan", 
    role: "Kent, WA", 
    text: "Subhanallah, it's a heavenly test, catered from heart. May Allah (SWT) bless in your business. The Goat Biryani and Borhani were amazing.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t3", 
    name: "Soumi", 
    role: "10+ Year Patron", 
    text: "I have been a customer for 10+ years. We were delighted to discover Sharmin after we moved to Seattle from the Bay Area. We love the food. On top of that she is extremely professional.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t4", 
    name: "Sudip", 
    role: "Seattle Metro Area", 
    text: "We recently have moved to the Seattle metro area and have become new parents. Desi Halal came to the rescue. Homely Bengali food like Rui macher Jhol, goat biriyani, and different sweet items. Homely touch in all the food.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t5", 
    name: "Joyeeta", 
    role: "Patron", 
    text: "Sharmin, thanks so much for the delicious food. The Rui Kalia was perfect to kick off the Durga pujo celebrations. Everything was amazing. Thank you!", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t6", 
    name: "Rimi Afroze", 
    role: "Corporate Client", 
    text: "Just wanted to acknowledge the amazing food and service Sharmin has been providing. I have ordered several work related catering from her and my team has enjoyed her delicious food every time. Highly recommend Tehari and Rasmalai.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t7", 
    name: "Honey Maria", 
    role: "Event Patron", 
    text: "I ordered biriyani, tuna kabab, and mixed veg for my kids' birthday. The food was awesome and fresh. Everyone loved it. Thank you!", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t8", 
    name: "Farida", 
    role: "Traditional Food Lover", 
    text: "Reminds me my mom’s cooking!!! If you like to try fish, order the Rohu Kalia. It’s delicious and authentic. Reminded me my mom’s cooking!!! I ordered one of the meat dish and it was very good too.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t9", 
    name: "Hasan", 
    role: "Ex-New Yorker", 
    text: "Goat Biriyani - The Best!!! We recently moved from NY. After checking several local restaurants, we can say that the goat biriyani here is the best. It’s full of flavor, rice and meat just cooked perfectly.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t10", 
    name: "Jeni", 
    role: "Family Customer", 
    text: "Biryani is great. We really love the biryani. It is so delicious. Can't find this in any restaurant. My kids also love it. Thanks for your service!", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t11", 
    name: "Sandeepan Sanyal", 
    role: "North America", 
    text: "My favorite dish is mutton biriyani with chicken roast and kabab. Best biriyani I ever ate at North America. My kids simply wait for that.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t12", 
    name: "Sraboni", 
    role: "Regular Customer", 
    text: "We have been order from Sharmin for some time now and have become regular customers. Very reliable service and easy to do business with. Always received homely food with professional service.", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t13", 
    name: "Saina Baha", 
    role: "Boutique Reviewer", 
    text: "We are extremely satisfied for the overall experience. Fantastic super fresh delicious food items, reasonably priced. Goat Biriyani was fabulous & chicken shami kabab was perfectly cooked! Payesh was also a winner!", 
    createdAt: new Date().toISOString() 
  },
  { 
    id: "t14", 
    name: "Sourav", 
    role: "Sunday Party Host", 
    text: "Thank you so much for the delicious food you cooked last Sunday. My friends loved all items, specially 'chom chom'. Both quality and quantity were perfect 10!!", 
    createdAt: new Date().toISOString() 
  }
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
  phone: '+1 206-555-0123',
  address: '123 Emerald Street, Seattle, WA 98101',
  role: UserRole.CUSTOMER
};

export const MOCK_GUEST: User = {
  id: 'guest-session',
  email: 'guest@deshi.com',
  name: 'Guest Visitor',
  role: UserRole.GUEST
};
