
export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST'
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  SOLD_OUT = 'SOLD_OUT'
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isMondaySpecial: boolean;
  isNew: boolean;
  isSoldOut?: boolean; 
  stockStatus: StockStatus;
}

export interface CartItem extends Product {
  quantity: number;
  isApproved?: boolean; // New flag for selective admin approval
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  adminNote?: string;
  address?: string;
  paymentLinkSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_REQUEST' | 'ORDER_UPDATE' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}
