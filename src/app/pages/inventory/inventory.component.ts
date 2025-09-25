import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models';
import { Router } from '@angular/router';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent {
  appState$: Observable<AppState>;
  searchTerm = '';
  categoryFilter = 'all';
  locationFilter = 'all';
  lowStockOnly = false;
  // simple per-card image index (not persisted)
  private imageIndex: Record<string, number> = {};

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private router: Router
  ) {
    this.appState$ = this.appService.appState$;
  }


  getFilteredProducts(appState: AppState): Product[] {
    return appState.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           (product.barcode && product.barcode.includes(this.searchTerm));
      const matchesCategory = this.categoryFilter === 'all' || product.category === this.categoryFilter;
      const matchesLocation = this.locationFilter === 'all' || product.locationId === this.locationFilter;
      const matchesLowStock = !this.lowStockOnly || product.stock <= product.minStock;
      return matchesSearch && matchesCategory && matchesLocation && matchesLowStock;
    });
  }

  // Summary helpers (computed over the filtered list)
  getFilteredCount(appState: AppState): number {
    return this.getFilteredProducts(appState).length;
  }

  getFilteredTotalStock(appState: AppState): number {
    return this.getFilteredProducts(appState).reduce((sum, p) => sum + (p.stock || 0), 0);
  }

  getFilteredInventoryValueRetail(appState: AppState): number {
    return this.getFilteredProducts(appState).reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);
  }

  getFilteredInventoryValueCost(appState: AppState): number {
    return this.getFilteredProducts(appState).reduce((sum, p) => sum + (p.stock || 0) * (p.cost || 0), 0);
  }

  getFilteredLowStockCount(appState: AppState): number {
    return this.getFilteredProducts(appState).filter(p => p.stock <= p.minStock).length;
  }

  // Barcode/Label printing
  printBarcode(product: Product): void {
    const code = product.barcode || product.sku || product.id;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    try {
      JsBarcode(svg, code, { format: 'CODE128', width: 2, height: 48, displayValue: false, margin: 0 });
    } catch (e) {
      // Fallback to CODE39 if CODE128 fails
      try { JsBarcode(svg, code, { format: 'CODE39', width: 2, height: 48, displayValue: false, margin: 0 }); } catch {}
    }
    const svgMarkup = new XMLSerializer().serializeToString(svg);

    const name = product.name || '';
    const sku = product.sku || '';
    const size = product.size || '';
    const color = product.color || '';
    const price = `₹${(product.price ?? 0).toFixed(2)}`;
    const location = product.location?.name || '';

    const labelHtml = `
      <div class="label">
        <div class="row top">
          <div class="name">${this.escapeHtml(name)}</div>
          <div class="price">${this.escapeHtml(price)}</div>
        </div>
        <div class="meta">SKU: ${this.escapeHtml(sku)} • ${this.escapeHtml(size)} • ${this.escapeHtml(color)}${location ? ' • ' + this.escapeHtml(location) : ''}</div>
        <div class="barcode">${svgMarkup}</div>
      </div>
    `;

    const win = window.open('', '', 'width=600,height=400');
    if (!win) return;
    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page { size: 62mm 30mm; margin: 3mm; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .label { width: 56mm; height: 24mm; display: flex; flex-direction: column; justify-content: space-between; }
            .row.top { display:flex; justify-content: space-between; align-items: baseline; }
            .name { font-size: 10pt; font-weight: 600; max-width: 42mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .price { font-size: 10pt; font-weight: 700; }
            .meta { font-size: 8pt; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .barcode svg { width: 100%; height: 18mm; }
            @media print { .label { page-break-after: always; } }
          </style>
        </head>
        <body>${labelHtml}
          <script>
            window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 200); };
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  private escapeHtml(text: string): string {
    const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  getCategoryColor(category: string): string {
    const colors = {
      shirts: 'px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      pants: 'px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800',
      dresses: 'px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800',
      jackets: 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      shoes: 'px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800',
      accessories: 'px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
    };
    return colors[category as keyof typeof colors] || 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
  }

  getStockStatusClass(product: Product): string {
    return `flex items-center justify-between p-3 rounded-lg ${
      product.stock <= product.minStock 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-green-50 border border-green-200'
    }`;
  }

  getStockTextClass(product: Product): string {
    return `text-lg font-bold ${
      product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
    }`;
  }

  getStockBadgeClass(product: Product): string {
    return `px-2 py-0.5 rounded text-xs font-semibold ${
      product.stock <= product.minStock
        ? 'text-red-700 bg-red-100 border border-red-200'
        : 'text-green-700 bg-green-100 border border-green-200'
    }`;
  }

  formatPrice(value: number): string {
    return `₹${value.toFixed(2)}`;
  }

  canEdit(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'warehouse';
  }

  onEdit(product: Product): void {
    if (!this.canEdit()) return;
    this.router.navigate(['/add-product'], { queryParams: { id: product.id } });
  }

  showLowStock(): void {
    this.lowStockOnly = true;
  }

  clearLowStockFilter(): void {
    this.lowStockOnly = false;
  }

  // Print all filtered products barcodes (first image index not relevant)
  printFilteredBarcodes(): void {
    const state = this.appService.appStateBehaviorSubject.value;
    const products = this.getFilteredProducts(state);
    products.forEach(p => this.printBarcode(p));
  }

  // image helpers for card (optional nav)
  getImage(product: Product): string | undefined {
    const idx = this.imageIndex[product.id] || 0;
    return product.imageUrls && product.imageUrls[idx] ? product.imageUrls[idx] : product.imageUrls?.[0];
  }

  nextImage(product: Product): void {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;
    const current = this.imageIndex[product.id] || 0;
    this.imageIndex[product.id] = (current + 1) % product.imageUrls.length;
  }

  prevImage(product: Product): void {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;
    const current = this.imageIndex[product.id] || 0;
    this.imageIndex[product.id] = (current - 1 + product.imageUrls.length) % product.imageUrls.length;
  }

  // Template guards/helpers for strict mode
  hasAnyImages(product: Product): boolean {
    return !!(product.imageUrls && product.imageUrls.length > 0);
  }

  hasMultipleImages(product: Product): boolean {
    return !!(product.imageUrls && product.imageUrls.length > 1);
  }

  imageCount(product: Product): number {
    return product.imageUrls ? product.imageUrls.length : 0;
  }

  currentImageNo(product: Product): number {
    const count = this.imageCount(product);
    const idx = this.imageIndex[product.id] || 0;
    return Math.min(idx + 1, count || 1);
  }
}
