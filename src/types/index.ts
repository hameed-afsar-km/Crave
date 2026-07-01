export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  available: boolean;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string[];
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: any[];
  amount: number;
  pickupTime: string;
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  pointsEarned?: number;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  loyaltyPoints?: number;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  image?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

export interface StoreSettings {
  storeName: string;
  storeStatus: 'open' | 'closed';
  estimatedWaitTime: number;
  openingTime: string;
  closingTime: string;
}
