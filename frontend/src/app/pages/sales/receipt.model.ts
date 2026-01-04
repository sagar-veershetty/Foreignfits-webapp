// This is a sample interface for the receipt data structure.
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
  items: ReceiptItem[];
  subtotal: number;
  taxLabel: string;
  tax: number;
  total: number;
  paymentMethod: string;
  locationName?: string; // Store location name for dynamic address
  locationAddress?: string; // Store location address
  locationPhone?: string; // Store location phone numbers
  exchangeDetails?: ExchangeDetails; // Exchange-specific information
}
