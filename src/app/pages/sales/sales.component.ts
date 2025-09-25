import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, SaleItem } from '../../core/models';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html'
})
export class SalesComponent {
  appState$: Observable<AppState>;
  searchTerm = '';
  customerName = '';
  paymentMethod: 'cash' | 'card' | 'other' = 'cash';

  constructor(
    private appService: AppService,
    private authService: AuthService
  ) {
    this.appState$ = this.appService.appState$;
  }

  getFilteredProducts(appState: AppState): Product[] {
    return appState.products.filter(product =>
      product.stock > 0 && (
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(this.searchTerm))
      )
    );
  }

  addToSale(product: Product): void {
    const quantity = 1;
    const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
    
    const saleItem: SaleItem = {
      productId: product.id,
      product,
      quantity,
      price: unitPrice,
      total: unitPrice,
    };
    
    this.appService.addToSale(saleItem);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.appService.removeFromSale(productId);
    } else {
      const appState = this.appService.appStateBehaviorSubject.value;
      const product = appState.products.find((p: Product) => p.id === productId);
      if (product) {
        const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
        this.appService.updateSaleQuantity(productId, quantity, unitPrice);
      }
    }
  }

  removeFromSale(productId: string): void {
    this.appService.removeFromSale(productId);
  }

  getSubtotal(appState: AppState): number {
    return appState.currentSale.reduce((sum, item) => sum + item.total, 0);
  }

  getTax(appState: AppState): number {
    return this.getSubtotal(appState) * 0.18;
  }

  getTotal(appState: AppState): number {
    return this.getSubtotal(appState) + this.getTax(appState);
  }

  completeSale(appState: AppState): void {
    if (appState.currentSale.length === 0) return;
    // Permission check: only admin or sales can complete a sale
    const user = this.authService.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      alert("You don't have permission to complete sales. Please sign in as Sales or Admin.");
      return;
    }

    const saleData = {
      paymentMethod: this.paymentMethod,
      customerName: this.customerName,
    };

    this.appService.createSale(saleData, appState.currentSale).subscribe({
      next: () => {
        alert('Sale completed successfully!');
        this.customerName = '';
        this.searchTerm = '';
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401) {
          alert('Session expired. Please log in again.');
        } else if (status === 403) {
          alert("You don't have permission to complete sales. Please sign in as Sales or Admin.");
        } else if (status === 400) {
          const message = err?.error?.message || err?.error?.error || 'Request invalid.';
          alert(`Failed to complete sale: ${message}`);
        } else {
          alert('Failed to complete sale. Please try again.');
        }
      }
    });
  }
}
