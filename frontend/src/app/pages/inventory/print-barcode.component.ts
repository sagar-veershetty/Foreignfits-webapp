// ...existing code...
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
  // ...existing properties and methods...
  // Place these methods after the constructor and before lifecycle hooks
  getStickerPreviewStyle() {
    const dims = this.getStickerDimensions();
    return {
      width: dims.width + 'mm',
      height: dims.height + 'mm',
      minWidth: dims.width + 'mm',
      minHeight: dims.height + 'mm',
      maxWidth: dims.width + 'mm',
      maxHeight: dims.height + 'mm',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      margin: '2px',
      padding: '2px 4px',
      background: '#fff',
      border: '1px solid #e5e7eb',
    };
  }

  getFontStyle(type: string) {
    const dims = this.getStickerDimensions();
    switch (type) {
      case 'brand':
        return {
          fontWeight: 800,
          fontSize: `calc(0.06 * ${dims.height}mm)`,
          letterSpacing: '0.12em',
          marginBottom: '3px',
          color: '#059669',
          textAlign: 'center',
          textTransform: 'uppercase',
          width: '100%',
          lineHeight: 1.3,
        };
      case 'title':
        return {
          fontWeight: 700,
          fontSize: `calc(0.07 * ${dims.height}mm)`,
          marginBottom: '1px',
          color: '#1a2233',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        };
      case 'meta':
        return {
          fontSize: `calc(0.055 * ${dims.height}mm)`,
          color: '#222',
          marginBottom: '1px',
          fontWeight: 400,
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        };
      case 'sku':
        return {
          fontSize: `calc(0.045 * ${dims.height}mm)`,
          color: '#757575',
          marginBottom: '1px',
          fontFamily: 'Menlo, Consolas, monospace',
          letterSpacing: '0.04em',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        };
      case 'category':
        return {
          fontSize: `calc(0.03 * ${dims.height}mm)`,
          color: '#666',
          marginBottom: '1px',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        };
      case 'price':
        return {
          fontSize: `calc(0.055 * ${dims.height}mm)`,
          fontWeight: 700,
          color: '#2563eb',
          marginBottom: '2px',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
        };
      case 'barcode':
        return {
          fontSize: `calc(0.055 * ${dims.height}mm)`,
          color: '#222',
          marginTop: '2px',
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: '98%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        };
      default:
        return {};
    }
  }
  customWidth = 30;
  customHeight = 50;
  Math = Math;
  stickerSize: string = 'tag2x1'; // Default: Clothing Tag (2" × 1")

  getStickerSizeClass(): string {
    switch (this.stickerSize) {
      case 'tag2x1':
        return 'sticker-tag2x1';
      case 'tag1x2':
        return 'sticker-tag1x2';
      case 'tag1_5x2_5':
        return 'sticker-tag1_5x2_5';
      default:
        return 'sticker-tag1x2';
    }
  }

  getStickerSizeLabel(): string {
    switch (this.stickerSize) {
      case 'tag2x1': return 'Clothing Tag (2" × 1")';
      case 'tag1x2': return 'Clothing Tag (1" × 2")';
      case 'tag1_5x2_5': return 'Clothing Tag (1.5" × 2.5")';
      default: return 'Clothing Tag (1" × 2")';
    }
  }

  getStickerDPI(): number {
    return 203; // Use printer DPI for best quality
  }

  getStickerDimensions(): { width: number; height: number } {
    switch (this.stickerSize) {
      case 'tag2x1':
        return { width: 50, height: 25 };
      case 'tag1x2':
        return { width: 25, height: 50 };
      case 'tag1_5x2_5':
        return { width: 38, height: 64 };
      case 'custom':
        return { width: this.customWidth, height: this.customHeight };
      default:
        return { width: 25, height: 50 };
    }
  }

  sanitizer = inject(DomSanitizer);
  renderBarcodeSvg(product: any): SafeHtml {
    const code = product.barcode || product.sku || product.id;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // Responsive barcode size based on label dimensions
    const dims = this.getStickerDimensions();
    // Calculate barcode width as a percentage of label width
    // JsBarcode 'width' is the width of a single bar, not the total barcode width
    // Estimate number of bars: code.length * 11 (CODE128 average)
    const codeLength = (code || '').length || 8;
    const estimatedBars = codeLength * 11;
    // Target barcode to fill 80% of label width
    let targetBarcodeWidth = Math.floor(dims.width * 0.8);
    let barWidth = Math.max(0.7, Math.min(2, targetBarcodeWidth / estimatedBars));
    // Height remains responsive to label height
    let barcodeHeight = Math.max(16, Math.min(32, Math.floor(dims.height * 0.7)));
    if (dims.width > 60) {
      barcodeHeight = Math.min(48, Math.floor(dims.height * 0.8));
      barWidth = Math.max(1.2, Math.min(2.5, targetBarcodeWidth / estimatedBars));
    }
    try {
      JsBarcode(svg, code, { format: 'CODE128', width: barWidth, height: barcodeHeight, displayValue: false, margin: 0 });
    } catch (e) {
      try { JsBarcode(svg, code, { format: 'CODE39', width: barWidth, height: barcodeHeight, displayValue: false, margin: 0 }); } catch {}
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

  printStickers() {
    window.print();
  }

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
        + '<div class="sticker-brand-header">FOREIGN FITS</div>'
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
    // Print all labels in a single-column grid for label printer
    const win = window.open('', '', 'width=1200,height=900');
    if (!win) return;
    win.document.open();
    // Get sticker size class and dimensions
    const stickerClass = this.getStickerSizeClass();
    const dims = this.getStickerDimensions();
    win.document.write(`
      <html>
        <head>
          <title>Foreign Fits - Barcode Stickers</title>
          <style>
            @page { size: auto; margin: 3mm; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #fff; }
            .sticker-preview-grid {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              gap: 0;
              width: 100%;
              min-height: 0;
              margin: 0 auto;
              padding: 0;
            }
            .sticker-card-mock {
              background: #fff;
              border: 1px solid #e5e7eb;
              margin: 2px;
              padding: 2px 4px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              box-sizing: border-box;
              width: ${dims.width}mm;
              height: ${dims.height}mm;
              min-width: ${dims.width}mm;
              min-height: ${dims.height}mm;
              max-width: ${dims.width}mm;
              max-height: ${dims.height}mm;
            }
            .sticker-brand-header {
              font-weight: 800;
              font-size: calc(0.08 * ${dims.height}mm);
              letter-spacing: 0.12em;
              margin-bottom: 3px;
              color: #059669;
              text-align: center;
              text-transform: uppercase;
              width: 100%;
              line-height: 1.3;
            }
            .sticker-title-mock {
              font-weight: 700;
              font-size: calc(0.10 * ${dims.height}mm);
              margin-bottom: 1px;
              color: #1a2233;
              text-align: center;
              line-height: 1.05;
              word-break: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              max-width: 98%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sticker-meta-mock {
              font-size: calc(0.08 * ${dims.height}mm);
              color: #222;
              margin-bottom: 1px;
              font-weight: 400;
              text-align: center;
              line-height: 1.05;
              word-break: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              max-width: 98%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sticker-sku-mock {
              font-size: calc(0.07 * ${dims.height}mm);
              color: #757575;
              margin-bottom: 1px;
              font-family: 'Menlo', 'Consolas', monospace;
              letter-spacing: 0.04em;
              text-align: center;
              line-height: 1.05;
              word-break: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              max-width: 98%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sticker-category-mock {
              font-size: calc(0.06 * ${dims.height}mm);
              color: #666;
              margin-bottom: 1px;
              text-align: center;
              line-height: 1.05;
              word-break: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              max-width: 98%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sticker-price-mock {
              font-size: calc(0.09 * ${dims.height}mm);
              font-weight: 700;
              color: #2563eb;
              margin-bottom: 2px;
              text-align: center;
              line-height: 1.05;
              word-break: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              max-width: 98%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sticker-barcode-mock {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .barcode-bg {
              background: none;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
              display: block;
              margin: 0 auto;
              overflow: hidden;
              text-align: center;
              width: 100%;
              height: calc(0.18 * ${dims.height || 25}mm);
              max-width: 98%;
            }
            .sticker-barcode-mock svg {
              width: calc(0.55 * ${dims.width || 50}mm);
              height: calc(0.15 * ${dims.height || 25}mm);
              min-width: 20px;
              min-height: 8px;
              max-width: 98%;
              max-height: 98%;
              margin: 0 auto;
              display: block;
              background: #fff;
              border-radius: 6px;
              overflow: hidden;
            }
            .barcode-value {
              display: block;
              width: 100%;
              margin: 0 auto;
              text-align: center;
              font-family: 'Menlo', 'Consolas', monospace;
              font-size: calc(0.055 * ${dims.height || 25}mm);
              color: #222;
              margin-top: 2px;
              letter-spacing: 0.04em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print { .sticker-card-mock { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="sticker-preview-grid ${stickerClass}">
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
