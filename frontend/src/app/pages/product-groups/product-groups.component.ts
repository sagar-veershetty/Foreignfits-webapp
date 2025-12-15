import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../../core/services/app.service';
import { Product } from '../../core/models';

interface ProductGroup {
  productCode: string;
  productType: string;
  subcategory: string;
  category: string;
  totalBags: number;
  totalQuantity: number;
  bagNumbers: string[];
  sizes: string[];
  colors: string[];
  products: Product[];
}

@Component({
  selector: 'app-product-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">Product Groups</h1>
            <p class="text-purple-100">Foreign Fits – Grouped Inventory Overview</p>
            <p class="text-purple-200 text-sm mt-1">View products grouped by product code</p>
          </div>
          <div class="p-3 bg-blue-500 rounded-full">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Subcategory</label>
            <select [(ngModel)]="filterSubcategory" (change)="applyFilters()" 
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">All Subcategories</option>
              <option value="mens">Men's</option>
              <option value="womens">Women's</option>
              <option value="kids">Kids</option>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="infant">Infant</option>
              <option value="toddler">Toddler</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
            <select [(ngModel)]="filterCategory" (change)="applyFilters()" 
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="shirts">Shirts</option>
              <option value="pants">Pants</option>
              <option value="dresses">Dresses</option>
              <option value="jackets">Jackets</option>
              <option value="shoes">Shoes</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Product Type</label>
            <input type="text" [(ngModel)]="searchProductType" (input)="applyFilters()" 
                   placeholder="e.g., Jeans, T-Shirt"
                   class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="ml-auto">
            <label class="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button (click)="clearFilters()" 
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="text-sm text-gray-600">Total Product Groups</div>
          <div class="text-3xl font-bold text-purple-600">{{ filteredGroups.length }}</div>
          <div class="text-xs text-gray-500 mt-1">Unique product codes</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="text-sm text-gray-600">Total Bags</div>
          <div class="text-3xl font-bold text-blue-600">{{ getTotalBags() }}</div>
          <div class="text-xs text-gray-500 mt-1">Across all groups</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="text-sm text-gray-600">Total Inventory</div>
          <div class="text-3xl font-bold text-green-600">{{ getTotalInventory() }}</div>
          <div class="text-xs text-gray-500 mt-1">Total units</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="text-sm text-gray-600">Ungrouped Products</div>
          <div class="text-3xl font-bold text-amber-600">{{ ungroupedCount }}</div>
          <div class="text-xs text-gray-500 mt-1">Without product code</div>
        </div>
      </div>

      <!-- Product Groups Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Code
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategory
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bags
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Units
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <ng-container *ngFor="let group of filteredGroups">
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ group.productCode }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ group.productType || '-' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
                      {{ group.subcategory || 'N/A' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {{ group.category }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-semibold text-gray-900">{{ group.totalBags }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-semibold text-green-600">{{ group.totalQuantity }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-xs text-gray-600">
                      <div><strong>Sizes:</strong> {{ group.sizes.join(', ') || '-' }}</div>
                      <div class="mt-1"><strong>Colors:</strong> {{ group.colors.join(', ') || '-' }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button (click)="toggleDetails(group.productCode)" 
                            class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      {{ expandedGroups.has(group.productCode) ? 'Hide' : 'Show' }} Details
                    </button>
                  </td>
                </tr>
                <!-- Expanded Details Row -->
                <tr *ngIf="expandedGroups.has(group.productCode)" class="bg-gray-50">
                  <td colspan="8" class="px-6 py-4">
                    <div class="space-y-2">
                      <h4 class="font-semibold text-gray-900 mb-3">Individual Bags ({{ group.totalBags }})</h4>
                      <div class="grid grid-cols-1 gap-2">
                        <div *ngFor="let product of group.products" 
                             class="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                          <div class="flex-1">
                            <div class="font-medium text-gray-900">{{ product.name }}</div>
                            <div class="text-xs text-gray-500 mt-1">
                              SKU: {{ product.sku }} | Bag: {{ product.bagNumber || 'N/A' }} | 
                              Size: {{ product.size }} | Color: {{ product.color }}
                            </div>
                          </div>
                          <div class="text-right ml-4">
                            <div class="text-sm font-semibold text-green-600">
                              {{ getProductQuantity(product) }} units
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredGroups.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No product groups found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ allGroups.length === 0 ? 'No products have product codes assigned yet.' : 'Try adjusting your filters.' }}
          </p>
        </div>
      </div>
    </div>
  `
})
export class ProductGroupsComponent implements OnInit {
  allGroups: ProductGroup[] = [];
  filteredGroups: ProductGroup[] = [];
  ungroupedCount = 0;
  expandedGroups = new Set<string>();

  // Filters
  filterSubcategory = '';
  filterCategory = '';
  searchProductType = '';

  constructor(
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appService.appState$.subscribe(state => {
      if (state.dataLoaded) {
        this.buildProductGroups(state.products);
      }
    });
  }

  buildProductGroups(products: Product[]): void {
    // Group products by product code
    const groupsMap = new Map<string, Product[]>();
    let ungrouped = 0;

    products.forEach(product => {
      if (product.productCode) {
        if (!groupsMap.has(product.productCode)) {
          groupsMap.set(product.productCode, []);
        }
        groupsMap.get(product.productCode)!.push(product);
      } else {
        ungrouped++;
      }
    });

    this.ungroupedCount = ungrouped;

    // Convert to ProductGroup array
    this.allGroups = Array.from(groupsMap.entries()).map(([code, prods]) => {
      const firstProduct = prods[0];
      
      return {
        productCode: code,
        productType: firstProduct.productType || '',
        subcategory: firstProduct.subcategory || '',
        category: firstProduct.category,
        totalBags: prods.length,
        totalQuantity: prods.reduce((sum, p) => sum + (p.stock || 0), 0),
        bagNumbers: prods.map(p => p.bagNumber || '').filter(b => b),
        sizes: [...new Set(prods.map(p => p.size))],
        colors: [...new Set(prods.map(p => p.color))],
        products: prods
      };
    });

    // Sort by product code
    this.allGroups.sort((a, b) => a.productCode.localeCompare(b.productCode));

    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredGroups = this.allGroups.filter(group => {
      if (this.filterSubcategory && group.subcategory !== this.filterSubcategory) {
        return false;
      }
      if (this.filterCategory && group.category !== this.filterCategory) {
        return false;
      }
      if (this.searchProductType) {
        const search = this.searchProductType.toLowerCase();
        if (!group.productType.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  clearFilters(): void {
    this.filterSubcategory = '';
    this.filterCategory = '';
    this.searchProductType = '';
    this.applyFilters();
  }

  toggleDetails(productCode: string): void {
    if (this.expandedGroups.has(productCode)) {
      this.expandedGroups.delete(productCode);
    } else {
      this.expandedGroups.add(productCode);
    }
  }

  getProductQuantity(product: Product): number {
    return product.stock || 0;
  }

  getTotalBags(): number {
    return this.filteredGroups.reduce((sum, g) => sum + g.totalBags, 0);
  }

  getTotalInventory(): number {
    return this.filteredGroups.reduce((sum, g) => sum + g.totalQuantity, 0);
  }
}
