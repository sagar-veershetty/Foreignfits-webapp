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
  location: Location;
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

export interface StockTransfer {
  id: string;
  productId: string;
  product: Product;
  fromLocationId: string;
  fromLocation: Location;
  toLocationId: string;
  toLocation: Location;
  quantity: number;
  reason: string;
  reference?: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string;
  requestedById: string;
  approvedBy?: string;
  approvedById?: string;
  completedBy?: string;
  completedById?: string;
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
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
  soldBy: string; // User who made the sale
  soldById: string; // User ID who made the sale
  createdAt: Date;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  totalRevenue: number;
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
  transferId?: string;
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

export type UserRole = 'admin' | 'sales' | 'warehouse';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}