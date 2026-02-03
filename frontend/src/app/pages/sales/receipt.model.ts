// This is a sample interface for the receipt data structure.
import { GeneratedCouponInfo } from '../../models/coupon.model';

export interface ReceiptItem {
  name: string;
  details?: string;
  qty: number;
  price: number;
  barcode?: string; // Optional barcode for matching specific items
}

export interface ExchangeDetails {
  originalBillNumber: string;
  returnedItems: ReceiptItem[];
  returnedTotal: number;
  newItems: ReceiptItem[];
  newTotal: number;
  priceDifference: number; // Positive = customer pays, Negative = customer receives refund
  exchangeReason?: string;
}

export interface ReceiptData {
  number: string;
  date: string;
  time: string;
  customer: string;
  gstin?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxLabel: string;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  pendingAmount?: number;
  locationName?: string; // Store location name for dynamic address
  locationAddress?: string; // Store location address
  locationPhone?: string; // Store location phone numbers
  exchangeDetails?: ExchangeDetails; // Exchange-specific information
  instantDiscount?: { percent: number; amount: number }; // Instant discount based on purchase amount
  appliedCoupon?: { code: string; discount: number }; // Applied coupon discount
  generatedCoupon?: GeneratedCouponInfo; // Generated coupon for this sale
}
