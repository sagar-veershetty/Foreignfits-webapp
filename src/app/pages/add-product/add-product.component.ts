import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { Product, Location } from '../../core/models';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Add New Product</h2>
          <p class="text-gray-600 mt-1">Foreign Fits - Global Fashion Collection</p>
        </div>

        <!-- Success banner -->
        <div *ngIf="creationSuccess" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
          <span>Product added successfully.</span>
          <div class="space-x-2">
            <button (click)="goToDashboard()" class="px-3 py-1 bg-green-600 text-white rounded">Go to Dashboard</button>
            <button (click)="dismissSuccess()" class="px-3 py-1 border border-green-300 rounded">Add another</button>
          </div>
        </div>
        
        <form (ngSubmit)="onSubmit()" #productForm="ngForm" class="space-y-6" *ngIf="appState$ | async as appState">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                [(ngModel)]="formData.name"
                name="name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                [(ngModel)]="formData.category"
                name="category"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="shirts">Shirts</option>
                <option value="pants">Pants</option>
                <option value="dresses">Dresses</option>
                <option value="jackets">Jackets</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <input
                type="text"
                required
                [(ngModel)]="formData.size"
                name="size"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., M, 32, One Size"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                required
                [(ngModel)]="formData.color"
                name="color"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter color"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Sale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                [(ngModel)]="formData.price"
                name="price"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cost Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                [(ngModel)]="formData.cost"
                name="cost"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                [(ngModel)]="formData.stock"
                name="stock"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level *
              </label>
              <input
                type="number"
                required
                min="0"
                [(ngModel)]="formData.minStock"
                name="minStock"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                [(ngModel)]="formData.wholesalePrice"
                name="wholesalePrice"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Minimum Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                [(ngModel)]="formData.wholesaleMinQuantity"
                name="wholesaleMinQuantity"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
              />
            </div>
          </div>

          <!-- Location Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Location (Warehouse/Store) *
            </label>
            <select
              required
              [(ngModel)]="formData.locationId"
              name="locationId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              <option *ngFor="let location of appState.locations" [value]="location.id">
                {{ location.name }} ({{ location.type }}) - {{ location.city }}, {{ location.state }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              required
              [(ngModel)]="formData.sku"
              name="sku"
              (blur)="validateSku()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter unique SKU"
            />
            <div *ngIf="skuError" class="mt-1 text-sm text-red-600">{{ skuError }}</div>
            <div *ngIf="!skuError && isCheckingSku" class="mt-1 text-sm text-gray-500">Checking SKU...</div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              [(ngModel)]="formData.description"
              name="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter product description (optional)"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Barcode (optional)
            </label>
            <input
              type="text"
              [(ngModel)]="formData.barcode"
              name="barcode"
              (blur)="validateBarcode()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto-generated if left blank"
            />
            <div *ngIf="barcodeError" class="mt-1 text-sm text-red-600">{{ barcodeError }}</div>
            <div *ngIf="!barcodeError && isCheckingBarcode" class="mt-1 text-sm text-gray-500">Checking barcode...</div>
          </div>

          <div class="flex space-x-4">
            <button
              type="submit"
              [disabled]="!productForm.valid || isCheckingSku || isCheckingBarcode || skuError || barcodeError"
              class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h2m0 0h9a2 2 0 002-2v-9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h4"></path>
              </svg>
              <span>Add Product</span>
            </button>
            <button
              type="button"
              (click)="resetForm()"
              class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddProductComponent {
  appState$: Observable<AppState>;
  
  formData = {
    name: '',
    category: 'shirts' as Product['category'],
    size: '',
    color: '',
    price: 0,
    cost: 0,
    wholesalePrice: 0,
    wholesaleMinQuantity: 100,
    stock: 0,
    minStock: 0,
    sku: '',
    description: '',
    barcode: '',
    imageUrls: [] as string[],
    locationId: '',
  };

  // UI validation state
  skuError: string | null = null;
  barcodeError: string | null = null;
  isCheckingSku = false;
  isCheckingBarcode = false;
  creationSuccess = false;

  constructor(private appService: AppService, private router: Router) {
    this.appState$ = this.appService.appState$;
  }

  onSubmit(): void {
    const appState = this.appService.appStateBehaviorSubject.value;
    const selectedLocation = appState.locations.find((loc: Location) => loc.id === this.formData.locationId);
    
    if (!selectedLocation) {
      alert('Please select a location for the product');
      return;
    }
    // Run duplicate checks before creating
    const skuCheck$ = this.appService.productExistsBySku(this.formData.sku);
    const barcodeCheck$ = this.formData.barcode ? this.appService.productExistsByBarcode(this.formData.barcode) : of(false);

    this.isCheckingSku = true;
    this.isCheckingBarcode = !!this.formData.barcode;

    forkJoin([skuCheck$, barcodeCheck$]).subscribe({
      next: ([skuExists, barcodeExists]) => {
        this.isCheckingSku = false;
        this.isCheckingBarcode = false;

        this.skuError = skuExists ? 'SKU already exists. Please use a unique SKU.' : null;
        this.barcodeError = barcodeExists ? 'Barcode already exists. Leave blank to auto-generate.' : null;

        if (skuExists || barcodeExists) {
          return; // stop submission; errors shown inline
        }

        const product = {
          ...this.formData,
          location: selectedLocation,
          barcode: this.formData.barcode || this.generateBarcode(),
        };

        this.appService.createProduct(product).subscribe({
          next: () => {
            const go = confirm('Product added successfully! Go to dashboard?');
            if (go) {
              this.goToDashboard();
            } else {
              this.creationSuccess = true;
              this.resetForm();
            }
          },
          error: (err) => {
            console.error('Create product failed', err);
            alert('Failed to add product. Please try again.');
          }
        });
      },
      error: (err) => {
        this.isCheckingSku = false;
        this.isCheckingBarcode = false;
        console.error('Validation checks failed', err);
        alert('Could not validate SKU/barcode. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      category: 'shirts',
      size: '',
      color: '',
      price: 0,
      cost: 0,
      wholesalePrice: 0,
      wholesaleMinQuantity: 100,
      stock: 0,
      minStock: 0,
      sku: '',
      description: '',
      barcode: '',
      imageUrls: [],
      locationId: '',
    };
    this.skuError = null;
    this.barcodeError = null;
    this.isCheckingSku = false;
    this.isCheckingBarcode = false;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  dismissSuccess(): void {
    this.creationSuccess = false;
  }

  validateSku(): void {
    const sku = this.formData.sku?.trim();
    this.skuError = null;
    if (!sku) return;
    this.isCheckingSku = true;
    this.appService.productExistsBySku(sku).subscribe({
      next: exists => {
        this.isCheckingSku = false;
        this.skuError = exists ? 'SKU already exists. Please use a unique SKU.' : null;
      },
      error: () => {
        this.isCheckingSku = false;
        // Silent error; user can still submit and backend will validate
      }
    });
  }

  validateBarcode(): void {
    const barcode = this.formData.barcode?.trim();
    this.barcodeError = null;
    if (!barcode) return; // optional field
    this.isCheckingBarcode = true;
    this.appService.productExistsByBarcode(barcode).subscribe({
      next: exists => {
        this.isCheckingBarcode = false;
        this.barcodeError = exists ? 'Barcode already exists. Leave blank to auto-generate.' : null;
      },
      error: () => {
        this.isCheckingBarcode = false;
      }
    });
  }

  private generateBarcode(): string {
    const categoryCode = {
      'shirts': '01',
      'pants': '02', 
      'dresses': '03',
      'jackets': '04',
      'shoes': '05',
      'accessories': '06'
    }[this.formData.category] || '00';
    
    const productHash = Date.now().toString().slice(-8).padStart(8, '0');
    const baseCode = categoryCode + productHash;
    const checksum = (parseInt(baseCode) % 97).toString().padStart(2, '0');
    
    return baseCode + checksum;
  }
}
