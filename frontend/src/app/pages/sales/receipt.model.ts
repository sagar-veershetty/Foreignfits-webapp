// This is a sample interface for the receipt data structure.
export interface ReceiptItem {
  name: string;
  details?: string;
  qty: number;
  price: number;
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
}
