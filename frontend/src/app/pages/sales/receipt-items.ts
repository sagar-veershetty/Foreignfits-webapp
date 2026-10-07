import { SaleItem } from '../../core/models';
import { ReceiptItem } from './receipt.model';

export function buildReceiptItems(items: SaleItem[]): ReceiptItem[] {
  return items.flatMap(item => {
    const details = [item.product.size, item.product.color].filter(Boolean).join(' - ');
    const base = { name: item.product.name, details };
    const barcodes = [...new Set(item.barcodes?.length ? item.barcodes : Object.keys(item.barcodePrices || {}))];
    const rows: ReceiptItem[] = barcodes.map(barcode => ({
      ...base, qty: 1, price: item.barcodePrices?.[barcode] ?? item.price, barcode
    }));
    // Legacy/manual sales may include units without recorded barcodes.
    const remaining = item.quantity - rows.length;
    if (remaining > 0) rows.push({ ...base, qty: remaining, price: item.price });
    return rows;
  });
}
