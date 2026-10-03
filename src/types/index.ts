export type UserRole = 'admin' | 'manager' | 'editor' | 'support' | 'customer' | 'user';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'stripe' | 'cod';

export type PaymentStatus = 'unpaid' | 'paid';

export interface UserProfile {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  address?: ShippingAddress;
  created_at?: string;
  updated_at?: string;
  password_hash?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number | null;
  stock: number;
  category_id?: string;
  images: string[];
  is_featured: boolean;
  delivery_charges?: number;
  created_at?: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number;
  shipping_address: ShippingAddress;
  stripe_session_id?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
