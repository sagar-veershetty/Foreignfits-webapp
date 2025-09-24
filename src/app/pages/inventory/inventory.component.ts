import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models';

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

  constructor(
    private appService: AppService,
    private authService: AuthService
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
      return matchesSearch && matchesCategory && matchesLocation;
    });
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
}
