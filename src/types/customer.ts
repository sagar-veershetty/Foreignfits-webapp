export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'paypal' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: CustomerAddress;
  billingAddress?: CustomerAddress;
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface CustomerAuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

import { Product } from './index';