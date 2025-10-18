import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Sale } from '../../core/models';

@Component({
  selector: 'app-receipt-printer',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-[520px] max-w-full rounded-xl shadow-lg overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div class="font-semibold text-gray-900">Sale Receipt</div>
          <button class="text-gray-500 hover:text-gray-800" (click)="close.emit()">✕</button>
        </div>
        <div class="p-5 space-y-3">
          <div class="text-sm text-gray-600">{{ sale?.createdAt | date:'short' }}</div>
          <div class="border rounded-md overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-3 py-2">Item</th>
                  <th class="text-right px-3 py-2">Qty</th>
                  <th class="text-right px-3 py-2">Price</th>
                  <th class="text-right px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let it of sale?.items" class="border-t">
                  <td class="px-3 py-2">
                    <div class="font-medium text-gray-900">{{ it.product.name }}</div>
                    <div class="text-xs text-gray-500">{{ it.product.size }} • {{ it.product.color }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ it.quantity }}</td>
                  <td class="px-3 py-2 text-right">₹{{ it.price | number:'1.2-2' }}</td>
                  <td class="px-3 py-2 text-right">₹{{ it.total | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pt-2 space-y-1">
            <div class="flex justify-between text-sm"><span>Subtotal</span><span>₹{{ sale?.subtotal | number:'1.2-2' }}</span></div>
            <div class="flex justify-between text-sm"><span>Tax (18% GST)</span><span>₹{{ sale?.tax | number:'1.2-2' }}</span></div>
            <div class="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span class="text-green-600">₹{{ sale?.total | number:'1.2-2' }}</span></div>
          </div>
        </div>
        <div class="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
          <button class="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50" (click)="close.emit()">Close</button>
          <button class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" (click)="print()">Print</button>
        </div>
      </div>
    </div>
  `
})
export class ReceiptPrinterComponent {
  @Input() sale: Sale | null = null;
  @Output() close = new EventEmitter<void>();

  print() {
    window.print();
  }
}
