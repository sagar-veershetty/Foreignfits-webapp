import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { Product, Location } from '../../core/models';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h2>
          <p class="text-gray-500 mt-1">Foreign Fits - Global Fashion Collection</p>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input type="text" required [(ngModel)]="formData.name" name="name" placeholder="Enter product name"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select required [(ngModel)]="formData.category" name="category"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="shirts">Shirts</option>
                <option value="pants">Pants</option>
                <option value="dresses">Dresses</option>
                <option value="jackets">Jackets</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <!-- Size -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Size *</label>
              <input type="text" required [(ngModel)]="formData.size" name="size" placeholder="e.g., M, 32, One Size"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Color -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Color *</label>
              <input type="text" required [(ngModel)]="formData.color" name="color" placeholder="Enter color"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Sale Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sale Price *</label>
              <input type="number" required step="0.01" min="0" [(ngModel)]="formData.price" name="price" placeholder="0.00"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Cost Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cost Price *</label>
              <input type="number" required step="0.01" min="0" [(ngModel)]="formData.cost" name="cost" placeholder="0.00"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Wholesale Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wholesale Price *</label>
              <input type="number" required step="0.01" min="0" [(ngModel)]="formData.wholesalePrice" name="wholesalePrice" placeholder="0.00"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Wholesale Min Qty -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wholesale Min Quantity *</label>
              <input type="number" required min="1" [(ngModel)]="formData.wholesaleMinQuantity" name="wholesaleMinQuantity" placeholder="100"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Initial Stock -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Initial Stock *</label>
              <input type="number" required min="0" [(ngModel)]="formData.stock" name="stock" placeholder="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <!-- Min Stock -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Stock Level *</label>
              <input type="number" required min="0" [(ngModel)]="formData.minStock" name="minStock" placeholder="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <!-- Location -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Location (Warehouse/Store) *</label>
            <select required [(ngModel)]="formData.locationId" name="locationId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select location</option>
              <option *ngFor="let location of appState.locations" [value]="location.id">
                {{ location.name }} ({{ location.type }})
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Choose the warehouse or store where this product will be stored</p>
          </div>

          <!-- SKU -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
            <input type="text" required [(ngModel)]="formData.sku" name="sku" (blur)="validateSku()" placeholder="Enter unique SKU"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <div *ngIf="skuError" class="mt-1 text-sm text-red-600">{{ skuError }}</div>
            <div *ngIf="!skuError && isCheckingSku" class="mt-1 text-sm text-gray-500">Checking SKU...</div>
          </div>

          <!-- Barcode -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Barcode (optional)</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="2" height="16"></rect><rect x="7" y="4" width="1" height="16"></rect><rect x="10" y="4" width="2" height="16"></rect><rect x="14" y="4" width="1" height="16"></rect><rect x="17" y="4" width="2" height="16"></rect></svg>
                </div>
                <input type="text" [(ngModel)]="formData.barcode" name="barcode" (blur)="validateBarcode(); renderBarcode()" (ngModelChange)="renderBarcode()"
                       placeholder="Enter or scan barcode"
                       class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <button type="button" (click)="onGenerateBarcode()" class="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800">Generate</button>
            </div>
            <div *ngIf="barcodeError" class="mt-1 text-sm text-red-600">{{ barcodeError }}</div>
            <div *ngIf="!barcodeError && isCheckingBarcode" class="mt-1 text-sm text-gray-500">Checking barcode...</div>
            <div class="mt-3 border border-gray-200 rounded-lg p-3">
              <div class="text-sm text-gray-600 mb-2">Preview</div>
              <div class="flex items-center justify-center min-h-[70px]">
                <svg #barcodeSvg class="w-full h-16"></svg>
              </div>
              <div class="text-center text-xs text-gray-500 mt-1">{{ formData.barcode || '—' }}</div>
            </div>
          </div>

          <!-- Images uploader -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">Product Images ({{ formData.imageUrls.length }}/5)</label>
              <input type="file" accept="image/*" multiple (change)="onImagesSelected($event)" class="text-sm" />
            </div>
            <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
              <div class="grid grid-cols-5 gap-3 mb-4" *ngIf="formData.imageUrls.length">
                <div *ngFor="let img of formData.imageUrls; let i = index" class="relative group">
                  <img [src]="img" alt="preview" class="h-20 w-full object-cover rounded-lg border" />
                  <button type="button" (click)="removeImage(i)" class="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow hover:text-red-600">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div class="text-sm">Drag and drop images here, or click to browse (max 5 images, 5MB each)</div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea [(ngModel)]="formData.description" name="description" rows="3" placeholder="Enter product description (optional)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button type="submit" [disabled]="!productForm.valid || isCheckingSku || isCheckingBarcode || skuError || barcodeError"
                    class="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h2m0 0h9a2 2 0 002-2v-9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h4"/></svg>
              <span>{{ isEditMode ? 'Update Product' : 'Add Product' }}</span>
            </button>
            <button type="button" (click)="resetForm()" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Reset</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddProductComponent implements OnInit, AfterViewInit {
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
  isEditMode = false;
  editingProductId: string | null = null;
  @ViewChild('barcodeSvg') barcodeSvg?: ElementRef<SVGSVGElement>;

  constructor(private appService: AppService, private router: Router, private route: ActivatedRoute) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editingProductId = id;
        const state = this.appService.appStateBehaviorSubject.value;
        const prod = state.products.find(p => p.id === id);
        if (prod) {
          this.formData = {
            name: prod.name,
            category: prod.category,
            size: prod.size,
            color: prod.color,
            price: prod.price,
            cost: prod.cost,
            wholesalePrice: prod.wholesalePrice,
            wholesaleMinQuantity: prod.wholesaleMinQuantity,
            stock: prod.stock,
            minStock: prod.minStock,
            sku: prod.sku,
            description: prod.description || '',
            barcode: prod.barcode || '',
            imageUrls: prod.imageUrls || [],
            locationId: prod.locationId,
          };
          setTimeout(() => this.renderBarcode(), 0);
        }
      } else {
        this.isEditMode = false;
        this.editingProductId = null;
      }
    });
  }
  ngAfterViewInit(): void {
    this.renderBarcode();
  }

  onSubmit(): void {
    const appState = this.appService.appStateBehaviorSubject.value;
    const selectedLocation = appState.locations.find((loc: Location) => loc.id === this.formData.locationId);
    
    if (!selectedLocation) {
      alert('Please select a location for the product');
      return;
    }
    if (this.isEditMode && this.editingProductId) {
      const product = {
        ...this.formData,
        location: selectedLocation,
        barcode: this.formData.barcode || this.generateBarcode(),
      };

      this.appService.updateProduct(this.editingProductId, product).subscribe({
        next: () => {
          alert('Product updated successfully!');
          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          console.error('Update product failed', err);
          alert('Failed to update product. Please try again.');
        }
      });
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

  generateBarcode(): string {
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
  onGenerateBarcode(): void {
    this.formData.barcode = this.generateBarcode();
    this.renderBarcode();
  }
  renderBarcode(): void {
    try {
      if (!this.barcodeSvg) return;
      const code = (this.formData.barcode || '').trim();
      if (!code) { (this.barcodeSvg.nativeElement as any).innerHTML = ''; return; }
      JsBarcode(this.barcodeSvg.nativeElement, code, { format: 'CODE128', width: 2, height: 60, displayValue: true, fontSize: 12, margin: 0 });
    } catch {}
  }

  // Image uploading helpers
  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const remaining = Math.max(0, 5 - this.formData.imageUrls.length);
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return; // 5MB
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        this.formData.imageUrls.push(url);
      };
      reader.readAsDataURL(file);
    });
    // reset input
    input.value = '';
  }

  removeImage(index: number): void {
    this.formData.imageUrls.splice(index, 1);
  }
}
