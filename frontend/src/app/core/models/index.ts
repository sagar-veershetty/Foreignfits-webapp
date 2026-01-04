// Product = Organization-wide master data (no location or pricing)
// For pricing and inventory, fetch LocationInventory data
export interface Product {
  id: string;
  name: string;
  category: 'shirts' | 'pants' | 'dresses' | 'jackets' | 'shoes' | 'accessories';
  subcategory?: 'mens' | 'womens' | 'kids' | 'unisex' | 'boys' | 'girls' | 'infant' | 'toddler';
  productCode?: string; // e.g., JN-KD-001 (Jeans-Kids-001)
  productType?: string; // e.g., "Jeans", "T-Shirt", "Jacket"
  size: string;
  color: string;
  sku: string;
  isManualSku?: boolean;
  bagNumber?: string;
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
  locationType?: string;
  productSku: string;
  productId?: string;
  productName: string;
  product?: Product; // Full product details including bagNumber
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  
  // Location-specific pricing
  cost: number;
  salePrice: number;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  
  lastRestockDate?: Date;
  lastSaleDate?: Date;
  lastMovementId?: number;
  isLowStock?: boolean;
  isOverStock?: boolean;
  shouldReorder?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Barcode {
  id: string;
  barcodeNumber: string;
  productSku: string;
  productName: string;
  locationName: string;
  status: 'ACTIVE' | 'DAMAGED' | 'LOST' | 'SOLD' | 'PENDING_TRANSFER' | 'INACTIVE';
  remark?: string;
  createdAt: Date;
  purchasePrice?: number;  // Individual barcode purchase price
  salePrice?: number;       // Individual barcode sale price
  originalPrice?: number;   // Original price before discount (for showing strikethrough)
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
  purchasePrice?: number;  // Individual barcode purchase price
  salePrice?: number;       // Individual barcode sale price
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
  price: number; // Average or first barcode price (for display compatibility)
  total: number;
  barcodes?: string[]; // Scanned barcode numbers for this item
  barcodePrices?: { [barcodeNumber: string]: number }; // Individual barcode prices
}

export interface SalePayment {
  id?: string;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER';
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  payments?: SalePayment[]; // Split payment support
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
  isExchangeSale?: boolean;
  exchangeId?: number;
  exchangePriceDifference?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse' | 'sales_manager' | 'shipping_agent_china' | 'shipping_agent_india';
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
// Expense Management Models
export type ExpenseType = 
  | 'DAILY_MAINTENANCE'      // Daily store maintenance
  | 'SALARY'                 // Staff salaries
  | 'RENT'                   // Store rent
  | 'ELECTRICITY'            // Electricity bills
  | 'WATER'                  // Water bills
  | 'INTERNET'               // Internet/Phone bills
  | 'INVENTORY_PURCHASE'     // Purchasing inventory
  | 'MARKETING'              // Marketing and advertising
  | 'TRANSPORTATION'         // Transportation costs
  | 'EQUIPMENT'              // Equipment purchase/maintenance
  | 'CLEANING'               // Cleaning services
  | 'SECURITY'               // Security services
  | 'OFFICE_SUPPLIES'        // Office supplies
  | 'MISCELLANEOUS';         // Other expenses

export type PaymentMethod = 
  | 'CASH' 
  | 'CARD' 
  | 'UPI' 
  | 'BANK_TRANSFER' 
  | 'CHEQUE';

export type ExpenseStatus = 
  | 'PENDING'    // Waiting for approval
  | 'APPROVED'   // Approved by manager
  | 'REJECTED'   // Rejected
  | 'PAID';      // Payment completed

export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  description: string;
  expenseDate: Date;
  locationId: string;
  locationName: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseRequest {
  type: ExpenseType;
  amount: number;
  description: string;
  expenseDate: Date;
  locationId: string | number;  // Can be string from form or number for API
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  notes?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  expensesByType: { [key: string]: number };
  expensesByLocation: { [key: string]: number };
  startDate: Date;
  endDate: Date;
}

// Logistics/Shipping Management Models
export type ShipmentStatus = 
  | 'CREATED'                  // Shipment created by China agent
  | 'IN_TRANSIT'               // In transit from China
  | 'ARRIVED_MUMBAI'           // Arrived at Indian port
  | 'IN_CUSTOM_CLEARANCE'      // In custom clearance
  | 'DELIVERED_TO_WAREHOUSE'   // Delivered to domestic warehouse
  | 'RECEIVED'                 // Received by India agent
  | 'OUT_FOR_DELIVERY'         // Out for local delivery
  | 'DELIVERED'                // Delivered to final destination
  | 'COMPLETED';               // Completed by admin

export type PaymentStatus = 
  | 'UNPAID'            // No payment received
  | 'PARTIALLY_PAID'    // Partial payment received
  | 'PAID';             // Fully paid

export interface Shipment {
  id: string;
  shippingId: string;                // Unique tracking number
  totalCost: number;
  totalPackages: number;
  totalCbm: number;                   // Cubic meters
  isBranded: boolean;
  perCbmRate: number;
  etd: Date;                          // Estimated Time of Departure
  eta: Date;                          // Estimated Time of Arrival
  trackingUrl?: string;
  status: ShipmentStatus;
  remarks?: string;
  originLocation: string;             // e.g., "China"
  destinationLocation: string;        // e.g., "Mumbai, India"
  createdByAgent: string;             // China agent email
  receivedByAgent?: string;           // Mumbai agent email
  completedByAdmin?: string;          // Admin email
  createdAt: Date;
  receivedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  localLogisticProvider?: string;     // Local delivery company
  localTrackingNumber?: string;       // Local tracking number
  indiaWarehouseAddress?: string;     // India warehouse address
  indiaContactPhone?: string;         // India contact phone
  indiaContactEmail?: string;         // India contact email
}

export interface ShipmentRequest {
  shippingId: string;
  totalCost: number;
  totalPackages: number;
  totalCbm: number;
  isBranded: boolean;
  perCbmRate: number;
  etd: Date;
  eta: Date;
  trackingUrl?: string;
  status?: ShipmentStatus;
  remarks?: string;
  originLocation?: string;
  destinationLocation?: string;
  localLogisticProvider?: string;
  localTrackingNumber?: string;
  indiaWarehouseAddress?: string;
  indiaContactPhone?: string;
  indiaContactEmail?: string;
}

export interface ShipmentResponse extends Shipment {
  // Same as Shipment but returned from API
}

export interface PaymentRequest {
  amount: number;
  remarks?: string;
}

export interface SalesPerson {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  locationId?: number;
  locationName?: string;
  isActive: boolean;
  incentiveRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
}
