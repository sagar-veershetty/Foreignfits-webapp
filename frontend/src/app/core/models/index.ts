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
  createdBy?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
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
  customerPhone?: string;
  customerCountryCode?: string;
  soldBy: string;
  soldById: string;
  createdAt: Date;
  pointsEarned?: number;
  pointsRedeemed?: number;
  discountFromPoints?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse';
  locationId?: string;
  locationName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  permissions?: string[]; // Array of permission strings from backend
  crossLocationAccess?: boolean; // True for admin, false for others
}

export interface StockMovement {
  id: string;
  productId: string;
  product: Product;
  type: 'adjustment' | 'sale' | 'return' | 'damage' | 'transfer' | 'restock';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  // locationId and location fields removed - use fromLocation and toLocation from transfer
  createdBy: string;
  createdAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Movement status
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Transfer-specific fields - now ALL movements have these via transfer
  transferId?: string;
  fromLocation?: Location;
  toLocation?: Location;
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

// Loyalty Points System Models
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyCustomer {
  id: string;
  phone: string;
  countryCode: string;
  customerName: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierExpiryDate?: Date;
  joinDate: Date;
  lastPurchaseDate?: Date;
  dateOfBirth?: Date;
  email?: string;
}

export type LoyaltyTransactionType = 
  | 'EARNED_PURCHASE' 
  | 'REDEEMED' 
  | 'EXPIRED' 
  | 'ADJUSTED' 
  | 'BONUS_SIGNUP' 
  | 'BONUS_BIRTHDAY' 
  | 'BONUS_TIER_UPGRADE';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  transactionType: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  description: string;
  saleId?: string;
  expiryDate?: Date;
  createdAt: Date;
}

export interface LoyaltyProgramInfo {
  pointsPerRupee: number;
  pointValue: number;
  minPointsToRedeem: number;
  expirationMonths: number;
  tiers: {
    name: LoyaltyTier;
    minLifetimePoints: number;
    pointsMultiplier: number;
    benefits: string[];
  }[];
}

export interface PointsCalculation {
  amount: number;
  basePoints: number;
  tierMultiplier: number;
  totalPoints: number;
  tier: LoyaltyTier;
}

export interface DiscountCalculation {
  points: number;
  discountAmount: number;
  pointValue: number;
}