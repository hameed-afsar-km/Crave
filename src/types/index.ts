export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  closingHours: string;
  weeklyHours?: Record<string, DayHours>;
  preparationTime: number;
  maxOrdersPerSlot: number;
  pickupWindow: number;
  isOpen: boolean;
  status: 'active' | 'inactive';
  latitude?: number;
  longitude?: number;
  bannerImage?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'customer' | 'outlet_staff' | 'outlet_manager' | 'admin';

export interface MenuItemAddon {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  pricing?: Record<string, number>;
  image: string;
  category: string;
  rating: number;
  available: boolean;
  availableOutlets?: string[];
  availability?: Record<string, boolean>;
  addons?: MenuItemAddon[];
  inclusiveOfGst?: boolean;
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
  addons?: MenuItemAddon[];
  inclusiveOfGst?: boolean;
}

export interface Order {
  id: string;
  outletId: string;
  outletName: string;
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
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedOutletId?: string;
  assignedOutletName?: string;
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
