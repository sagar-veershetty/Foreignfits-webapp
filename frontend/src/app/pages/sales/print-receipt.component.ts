import { Component, Input, ViewChild, ElementRef, inject } from '@angular/core';
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
  @ViewChild('receiptPaper', { static: false }) receiptPaperRef!: ElementRef;
  router = inject(Router);

  print() {
    // Open the print window synchronously and write a minimal HTML immediately
    const printWindow = window.open('', '_blank', 'width=480,height=700');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print receipts.');
      console.error('Print window was blocked by the browser.');
      return;
    }
    printWindow.document.write('<html><head><title>Loading...</title></head><body>Loading receipt...</body></html>');
    printWindow.document.close();

    // After a short delay, replace with the actual receipt and styles
    setTimeout(() => {
      let receiptElement = this.receiptPaperRef?.nativeElement;
      if (!receiptElement) {
        console.warn('ViewChild not found, falling back to querySelector.');
        receiptElement = document.querySelector('.receipt-paper');
      }
      if (!receiptElement) {
        alert('Could not find receipt content to print.');
        console.error('No receipt element found for printing.');
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
            <title>Print Receipt</title>
            ${styleSheets}
            <style>
              body { background: #fff; margin: 0; padding: 0; }
              .receipt-paper { box-shadow: none !important; border: none !important; margin: 0 auto; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${receiptHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      console.log('Print window opened and content written.');
    }, 150);
  }

  close() {
    this.show = false;
    // Optionally, navigate or emit event to parent
    // this.router.navigate(['/sales']);
  }
}
