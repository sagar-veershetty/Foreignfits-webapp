// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
  message: string;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  category: 'SHIRTS' | 'PANTS' | 'DRESSES' | 'JACKETS' | 'SHOES' | 'ACCESSORIES';
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
  barcode?: string;
  imageUrls?: string[];
  location: ApiLocation;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLocation {
  id: number;
  name: string;
  type: 'WAREHOUSE' | 'STORE';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  manager?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSale {
  id: number;
  items: ApiSaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'OTHER';
  customerName?: string;
  customerEmail?: string;
  soldBy: ApiUser;
  createdAt: string;
}

export interface ApiSaleItem {
  id: number;
  product: ApiProduct;
  quantity: number;
  price: number;
  total: number;
}

export interface ApiStockMovement {
  id: number;
  product: ApiProduct;
  type: 'ADJUSTMENT' | 'SALE' | 'RETURN' | 'DAMAGE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'RESTOCK';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  location?: ApiLocation;
  createdBy: string;
  createdAt: string;
}

// Request Types
export interface CreateProductRequest {
  name: string;
  category: 'SHIRTS' | 'PANTS' | 'DRESSES' | 'JACKETS' | 'SHOES' | 'ACCESSORIES';
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
  barcode?: string;
  imageUrls?: string[];
  locationId: number;
}

export interface CreateSaleRequest {
  items: SaleItemRequest[];
  paymentMethod: 'CASH' | 'CARD' | 'OTHER';
  customerName?: string;
  customerEmail?: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
}

export interface StockAdjustmentRequest {
  productId: number;
  adjustmentType: 'INCREASE' | 'DECREASE' | 'SET';
  quantity: number;
  reason: string;
  reference?: string;
}