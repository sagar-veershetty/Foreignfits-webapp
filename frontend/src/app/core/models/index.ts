export interface Product {
  id: string;
  name: string;
  category: 'shirts' | 'pants' | 'dresses' | 'jackets' | 'shoes' | 'accessories';
  size: string;
  color: string;
  price: number;
  cost: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  stock: number;
  minStock: number;
  sku: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  barcode?: string;
  imageUrls?: string[];
  locationId: string;
  location?: Location;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  manager?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'other';
  customerName?: string;
  customerEmail?: string;
  soldBy: string;
  soldById: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  type: 'adjustment' | 'sale' | 'return' | 'damage' | 'transfer_out' | 'transfer_in' | 'restock';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  locationId?: string;
  location?: Location;
  createdBy: string;
  createdAt: Date;
}

export interface StockAdjustment {
  productId: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  reference?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  totalRevenue: number;
}