/**
 * Coupon Model
 * Represents a discount coupon that can be applied to purchases
 */
export interface Coupon {
  id: number;
  code: string;
  discountAmount: number;
  minPurchaseAmount: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  customerName?: string;
  customerPhone?: string;
  customerCountryCode?: string;
  generatedFromSaleId?: number;
  generatedAt: string;
  validUntil: string;
  redeemedAt?: string;
  redeemedInSaleId?: number;
  redeemedByUsername?: string;
  redeemedAtLocationName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Derived fields (calculated on frontend or backend)
  isExpired?: boolean;
  isValid?: boolean;
  daysUntilExpiry?: number;
  daysSinceGeneration?: number;
}

/**
 * Coupon Validation Result
 * Response from coupon validation API
 */
export interface CouponValidation {
  valid: boolean;
  message: string;
  discountAmount?: number;
  code?: string;
}

/**
 * Coupon Statistics
 * Dashboard statistics for admin
 */
export interface CouponStats {
  totalGenerated: number;
  totalActive: number;
  totalUsed: number;
  totalExpired: number;
  totalCancelled: number;
  totalDiscountGiven: number;
  averageDiscountAmount: number;
  redemptionRate: number;
  expiryRate: number;
  expiringSoon: number;
  potentialRevenue: number;
}

/**
 * Generated Coupon Info
 * Information about a coupon generated from a sale (for receipt display)
 */
export interface GeneratedCouponInfo {
  code: string;
  amount: number;
  validDays: number;
  minPurchase: number;
  validUntil?: Date;
}
