import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { OnInit } from '@angular/core';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-print-barcode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './print-barcode.component.html',
  styleUrls: ['./print-barcode.component.scss']
})
export class PrintBarcodeComponent implements OnInit {
  Math = Math;
  stickerSize: string = 'medium';

  getStickerSizeClass(): string {
    switch (this.stickerSize) {
      case 'small':
        return 'sticker-small';
      case 'large':
        return 'sticker-large';
      case 'medium':
      default:
        return 'sticker-medium';
    }
  }

  getStickerSizeLabel(): string {
    switch (this.stickerSize) {
      case 'small': return 'Small (2" × 1")';
      case 'large': return 'Large (4" × 3")';
      case 'medium':
      default: return 'Medium (3" × 2")';
    }
  }

  sanitizer = inject(DomSanitizer);
  renderBarcodeSvg(product: any): SafeHtml {
    const code = product.barcode || product.sku || product.id;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    try {
      JsBarcode(svg, code, { format: 'CODE128', width: 2, height: 48, displayValue: false, margin: 0 });
    } catch (e) {
      try { JsBarcode(svg, code, { format: 'CODE39', width: 2, height: 48, displayValue: false, margin: 0 }); } catch {}
    }
    const raw = new XMLSerializer().serializeToString(svg);
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }
  products: any[] = [];
  appService = inject(AppService);
  ngOnInit() {
    this.appService.appState$.subscribe((state: AppState) => {
      this.products = state.products || [];
      this.filterProducts();
    });
  }

  filterProducts() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter((p: any) =>
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term))
    );
  }
  searchTerm: string = '';
  onSearchChange() {
    this.filterProducts();
  }

  selectAll() {
    this.selectedProductIds = new Set(this.filteredProducts.map(p => p.id));
    this.selectedProducts = [...this.filteredProducts];
    for (const p of this.filteredProducts) {
      if (!this.productQuantities[p.id]) {
        this.productQuantities[p.id] = 1;
      }
    }
  }

  clearSelection() {
    this.selectedProductIds.clear();
    this.selectedProducts = [];
    this.productQuantities = {};
  }

  isSelected(product: any): boolean {
    return this.selectedProductIds.has(product.id);
  }

  toggleProduct(product: any) {
    if (this.selectedProductIds.has(product.id)) {
      this.selectedProductIds.delete(product.id);
      this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id);
      delete this.productQuantities[product.id];
    } else {
      this.selectedProductIds.add(product.id);
      this.selectedProducts = [...this.selectedProducts, product];
      if (!this.productQuantities[product.id]) {
        this.productQuantities[product.id] = 1;
      }
    }
  }
  selectedProducts: any[] = [];
  selectedProductIds: Set<string> = new Set();
  filteredProducts: any[] = [];
  productQuantities: { [id: string]: number } = {};
  showSKU = true;
  showSize = true;
  showColor = true;
  showCategory = false;
  showLocation = false;
  showPrice = true;
  router = inject(Router);

  print() {
    if (!this.selectedProducts.length) return;
    let allLabels: string[] = [];
    let totalStickers = 0;
    for (const product of this.selectedProducts) {
      const code = product.barcode || product.sku || product.id;
      const name = product.name || '';
      const sku = product.sku || '';
      const size = product.size || '';
      const color = product.color || '';
      const price = '\u20B9' + ((product.price ?? 0).toFixed(2));
      const location = product.location?.name || '';
      // Render barcode SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(svg, code, { format: 'CODE128', width: 2, height: 48, displayValue: false, margin: 0 });
      } catch (e) {
        try { JsBarcode(svg, code, { format: 'CODE39', width: 2, height: 48, displayValue: false, margin: 0 }); } catch {}
      }
      const svgMarkup = new XMLSerializer().serializeToString(svg);
      // Compose label HTML (match preview card)
      let labelHtml = ''
        + '<div class="sticker-card-mock">'
        + '<div class="sticker-title-mock">' + this.escapeHtml(name) + '</div>'
        + '<div class="sticker-meta-mock">'
        + (this.showSize && size ? this.escapeHtml(size) : '')
        + (this.showColor && color ? ' - ' + this.escapeHtml(color) : '')
        + '</div>'
        + (this.showSKU ? '<div class="sticker-sku-mock">' + this.escapeHtml(sku) + '</div>' : '')
        + ((this.showCategory || this.showLocation) ? '<div class="sticker-category-mock">' + (this.showCategory ? this.escapeHtml(product.category) : '') + (this.showLocation && location ? ' - ' + this.escapeHtml(location) : '') + '</div>' : '')
        + (this.showPrice ? '<div class="sticker-price-mock">' + this.escapeHtml(price) + '</div>' : '')
        + '<div class="sticker-barcode-mock">'
        + '<div class="barcode-bg">' + svgMarkup + '</div>'
        + '<div class="barcode-value">' + this.escapeHtml(code) + '</div>'
        + '</div>'
        + '</div>';
      const qty = this.productQuantities[product.id] || 1;
      totalStickers += qty;
      for (let i = 0; i < qty; i++) {
        allLabels.push(labelHtml);
      }
    }
    // Print all labels in a grid with header
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    const win = window.open('', '', 'width=1200,height=900');
    if (!win) return;
    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Foreign Fits - Barcode Stickers</title>
          <style>
            @page { size: auto; margin: 3mm; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #fff; }
            .print-header {
              text-align: center;
              margin-top: 32px;
              margin-bottom: 12px;
            }
            .print-title {
              font-size: 2rem;
              font-weight: 700;
              color: #2563eb;
              margin-bottom: 2px;
            }
            .print-subtitle {
              font-size: 1.1rem;
              color: #222;
              margin-bottom: 2px;
            }
            .print-total {
              font-size: 1rem;
              color: #444;
              margin-bottom: 8px;
            }
            .print-divider {
              border: none;
              border-top: 3px solid #2563eb;
              margin: 16px 0 24px 0;
              width: 98%;
            }
            .sticker-preview-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 40px;
              background: #f8fafc;
              border: 2px dashed #d1d5db;
              padding: 40px 32px;
              border-radius: 20px;
              margin-top: 16px;
              justify-items: center;
            }
            .sticker-card-mock {
              background: #fff;
              border: 1.5px solid #e0e7ef;
              border-radius: 18px;
              padding: 20px 20px 20px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-width: 326px;
              min-height: 220px;
              max-width: 520px;
              box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
              margin-bottom: 0;
              transition: box-shadow 0.2s;
            }
            .sticker-title-mock {
              font-weight: 700;
              font-size: 1.45rem;
              margin-bottom: 6px;
              color: #1a2233;
              text-align: center;
            }
            .sticker-meta-mock {
              font-size: 1.13rem;
              color: #222;
              margin-bottom: 4px;
              font-weight: 400;
              text-align: center;
            }
            .sticker-sku-mock {
              font-size: 1.08rem;
              color: #757575;
              margin-bottom: 4px;
              font-family: 'Menlo', 'Consolas', monospace;
              letter-spacing: 0.04em;
              text-align: center;
            }
            .sticker-category-mock {
              font-size: 1.05rem;
              color: #666;
              margin-bottom: 4px;
              text-align: center;
            }
            .sticker-price-mock {
              font-size: 1.22rem;
              font-weight: 700;
              color: #2563eb;
              margin-bottom: 18px;
              text-align: center;
            }
            .sticker-barcode-mock {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .barcode-bg {
              background: #fff;
              border-radius: 8px;
              box-shadow: 0 1px 4px 0 rgba(0,0,0,0.06);
              padding: 10px 18px 4px 18px;
              display: block;
              margin: 0 auto;
              overflow: hidden;
              text-align: center;
            }
            .sticker-barcode-mock svg {
              width: 300px;
              height: 60px;
              display: block;
              background: #fff;
              border-radius: 6px;
              margin: 0 auto;
              overflow: hidden;
            }
            .barcode-value {
              display: block;
              width: 320px;
              margin: 0 auto;
              text-align: center;
              font-family: 'Menlo', 'Consolas', monospace;
              font-size: 1.18rem;
              color: #222;
              margin-top: 4px;
              letter-spacing: 0.04em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print { .sticker-card-mock { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-title">Foreign Fits - Global Fashion</div>
            <div class="print-subtitle">Barcode Stickers - ${dateStr}</div>
            <div class="print-total">Total Stickers: ${totalStickers}</div>
            <hr class="print-divider" />
          </div>
          <div class="sticker-preview-grid">
            ${allLabels.join('')}
          </div>
          <script>
            window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 200); };
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  escapeHtml(text: string): string {
    const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  close() {
    this.router.navigate(['/inventory']);
  }
}
