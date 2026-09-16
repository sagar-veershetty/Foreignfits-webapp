import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-print-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-receipt.component.html',
  styleUrls: ['./print-receipt.component.scss']
})
export class PrintReceiptComponent {
  @Input() receipt: any;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @ViewChild('receiptPaper', { static: false }) receiptPaperRef!: ElementRef;
  router = inject(Router);
  Math = Math; // Expose Math for template

  hasInstantDiscount(): boolean {
    return !!this.receipt?.instantDiscount && Number(this.receipt?.instantDiscount?.amount || 0) > 0;
  }

  getInstantDiscountPercent(): number {
    return Number(this.receipt?.instantDiscount?.percent || 0);
  }

  getItemDiscountPerUnit(item: any): number {
    if (!this.hasInstantDiscount()) return 0;
    const percent = this.getInstantDiscountPercent();
    const unitPrice = Number(item?.price || 0);
    return Number(((unitPrice * percent) / 100).toFixed(2));
  }

  getItemNetAmount(item: any): number {
    const qty = Number(item?.qty || 0);
    const unitPrice = Number(item?.price || 0);
    const discountPerUnit = this.getItemDiscountPerUnit(item);
    return Number((qty * (unitPrice - discountPerUnit)).toFixed(2));
  }

  getTotalItemsCount(): number {
    if (!Array.isArray(this.receipt?.items)) return 0;
    return this.receipt.items.reduce((sum: number, item: any) => sum + Number(item?.qty || 0), 0);
  }

  getTotalSavings(): number {
    const instant = Number(this.receipt?.instantDiscount?.amount || 0);
    const coupon = Number(this.receipt?.appliedCoupon?.discount || 0);
    return Number((instant + coupon).toFixed(2));
  }

  getItemGridTemplateColumns(): string {
    // Keep columns tight for 80mm print and avoid empty discount column gap
    return this.hasInstantDiscount()
      ? '30px 1fr 56px 48px 66px'
      : '30px 1fr 56px 66px';
  }

  print() {
    // Optimize for thermal printer (80mm width)
    const printWindow = window.open('', '_blank', 'width=302,height=600');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print receipts.');
      return;
    }
    printWindow.document.write('<html><head><title>Loading...</title></head><body>Loading receipt...</body></html>');
    printWindow.document.close();

    // After a short delay, replace with the actual receipt and styles
    setTimeout(() => {
      let receiptElement = this.receiptPaperRef?.nativeElement;
      if (!receiptElement) {
        receiptElement = document.querySelector('.receipt-paper');
      }
      if (!receiptElement) {
        alert('Could not find receipt content to print.');
        printWindow.close();
        return;
      }

      const receiptHtml = receiptElement.outerHTML;
      const styleSheets = Array.from(document.styleSheets)
        .map((sheet: any) => {
          try {
            if (sheet.href) {
              return `<link rel="stylesheet" href="${sheet.href}">`;
            } else if (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE') {
              return `<style>${sheet.ownerNode.innerHTML}</style>`;
            }
          } catch (e) { /* ignore CORS issues */ }
          return '';
        })
        .join('\n');

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Receipt - Foreign Fits</title>
            ${styleSheets}
            <style>
              /* Thermal printer optimized styles */
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body { 
                background: #fff; 
                margin: 0; 
                padding: 0;
                width: 80mm;
                font-family: Inter, 'Segoe UI', Roboto, Arial, sans-serif;
              }
              .receipt-paper { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0;
                padding: 8px 12px;
                width: 100%;
                max-width: 80mm;
                color: #000 !important;
              }
              .receipt-paper * {
                color: #000 !important;
              }
              hr {
                border-color: #000 !important;
              }
              .receipt-payment {
                border-top-color: #000 !important;
                border-bottom-color: #000 !important;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${receiptHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }, 150);
    
    // Close the modal after initiating print
    setTimeout(() => {
      this.closeModal();
    }, 200);
  }

  closeModal() {
    this.close.emit();
  }
}
