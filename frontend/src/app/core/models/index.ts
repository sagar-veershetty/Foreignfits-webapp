// Product = Organization-wide master data (no location or pricing)
// For pricing and inventory, fetch LocationInventory data
export interface Product {
  id: string;
  name: string;
  category: 'shirts' | 'pants' | 'dresses' | 'jackets' | 'shoes' | 'accessories';
  size: string;
  color: string;
  sku: string;
  isManualSku?: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrls?: string[];
  createdBy?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  
  // DEPRECATED - Backend returns null, kept for backward compatibility
  price?: number | null;
  cost?: number | null;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  stock?: number | null;
  minStock?: number | null;
  locationId?: string | null;
  location?: Location | null;
}

// LocationInventory = Location-specific pricing and inventory tracking
export interface LocationInventory {
  id: string;
  locationId: string;
  locationName: string;
  productSku: string;
  productName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  
  // Location-specific pricing
  cost: number;
  salePrice: number;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Barcode {
  id: string;
  barcodeNumber: string;
  productSku: string;
  productName: string;
  locationName: string;
  status: 'ACTIVE' | 'DAMAGED' | 'LOST' | 'SOLD';
  remark?: string;
  createdAt: Date;
}

export interface BarcodeHistory {
  id: number;
  barcodeNumber: string;
  barcodeId?: number;
  productSku: string;
  productName: string;
  eventType: 'CREATED' | 'TRANSFERRED' | 'SOLD' | 'RETURNED' | 'DAMAGED' | 'LOST';
  locationId?: number;
  locationName?: string;
  fromLocationId?: number;
  fromLocationName?: string;
  toLocationId?: number;
  toLocationName?: string;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
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

export interface BarcodeInfo {
  id: string;
  barcodeNumber: string;
  status: string;
  remark?: string;
  product: {
    id: string;
    name: string;
    sku: string;
    size?: string;
    color?: string;
  };
  currentLocation: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
  barcodes?: string[]; // Scanned barcode numbers for this item
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
  salesPersonName?: string;
  soldBy: string;
  soldById: string;
  location: Location;
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
  
  // Transfer-specific fields - now ALL movements have these via transfer
  transferId?: string;
  fromLocation?: Location;
  toLocation?: Location;
}

export interface StockAdjustment {
  locationId: string;
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