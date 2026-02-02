import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Location } from '../../core/models';

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
            <!-- Subcategory -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select [(ngModel)]="formData.subcategory" name="subcategory"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">-- Select Subcategory --</option>
                <option value="mens">Men's</option>
                <option value="womens">Women's</option>
                <option value="kids">Kids</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="infant">Infant</option>
                <option value="toddler">Toddler</option>
                <option value="unisex">Unisex</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Target demographic (e.g., Men's, Women's, Kids)</p>
            </div>
            <!-- Product Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
              <input type="text" [(ngModel)]="formData.productType" name="productType" 
                     placeholder="e.g., Denim Jeans, Polo Shirt"
                     list="productTypesList"
                     maxlength="100"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <datalist id="productTypesList">
                <!-- Shirts category -->
                <option *ngIf="formData.category === 'shirts'" value="T-Shirt">
                <option *ngIf="formData.category === 'shirts'" value="Polo Shirt">
                <option *ngIf="formData.category === 'shirts'" value="Dress Shirt">
                <option *ngIf="formData.category === 'shirts'" value="Casual Shirt">
                <option *ngIf="formData.category === 'shirts'" value="Flannel Shirt">
                <option *ngIf="formData.category === 'shirts'" value="Oxford Shirt">
                
                <!-- Pants category -->
                <option *ngIf="formData.category === 'pants'" value="Jeans">
                <option *ngIf="formData.category === 'pants'" value="Denim Jeans">
                <option *ngIf="formData.category === 'pants'" value="Chinos">
                <option *ngIf="formData.category === 'pants'" value="Cargo Pants">
                <option *ngIf="formData.category === 'pants'" value="Dress Pants">
                <option *ngIf="formData.category === 'pants'" value="Joggers">
                <option *ngIf="formData.category === 'pants'" value="Leggings">
                <option *ngIf="formData.category === 'pants'" value="Trousers">
                
                <!-- Jackets category -->
                <option *ngIf="formData.category === 'jackets'" value="Denim Jacket">
                <option *ngIf="formData.category === 'jackets'" value="Leather Jacket">
                <option *ngIf="formData.category === 'jackets'" value="Bomber Jacket">
                <option *ngIf="formData.category === 'jackets'" value="Windbreaker">
                <option *ngIf="formData.category === 'jackets'" value="Parka">
                <option *ngIf="formData.category === 'jackets'" value="Blazer">
                <option *ngIf="formData.category === 'jackets'" value="Hoodie">
                <option *ngIf="formData.category === 'jackets'" value="Sweater">
                
                <!-- Dresses category -->
                <option *ngIf="formData.category === 'dresses'" value="Casual Dress">
                <option *ngIf="formData.category === 'dresses'" value="Party Dress">
                <option *ngIf="formData.category === 'dresses'" value="Maxi Dress">
                <option *ngIf="formData.category === 'dresses'" value="Midi Dress">
                <option *ngIf="formData.category === 'dresses'" value="Mini Dress">
                <option *ngIf="formData.category === 'dresses'" value="Skirt">
                <option *ngIf="formData.category === 'dresses'" value="Gown">
                
                <!-- Shoes category -->
                <option *ngIf="formData.category === 'shoes'" value="Sneakers">
                <option *ngIf="formData.category === 'shoes'" value="Boots">
                <option *ngIf="formData.category === 'shoes'" value="Sandals">
                <option *ngIf="formData.category === 'shoes'" value="Loafers">
                <option *ngIf="formData.category === 'shoes'" value="Heels">
                <option *ngIf="formData.category === 'shoes'" value="Flats">
                
                <!-- Accessories category -->
                <option *ngIf="formData.category === 'accessories'" value="Belt">
                <option *ngIf="formData.category === 'accessories'" value="Hat">
                <option *ngIf="formData.category === 'accessories'" value="Scarf">
                <option *ngIf="formData.category === 'accessories'" value="Bag">
                <option *ngIf="formData.category === 'accessories'" value="Watch">
                <option *ngIf="formData.category === 'accessories'" value="Sunglasses">
              </datalist>
              <p class="text-xs text-gray-500 mt-1">Specific type within the category (e.g., for Pants: "Denim Jeans", "Chinos")</p>
            </div>
            <!-- Product Code -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">Product Code</label>
                <button type="button" (click)="suggestProductCode()" [disabled]="!formData.productType || !formData.subcategory"
                        class="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                  Suggest Code
                </button>
              </div>
              <input type="text" [(ngModel)]="formData.productCode" name="productCode" 
                     placeholder="e.g., JN-KD-001 (Jeans-Kids-001)"
                     list="productCodesList"
                     maxlength="50"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <datalist id="productCodesList">
                <option *ngFor="let code of existingProductCodes" [value]="code">
              </datalist>
              <p class="text-xs text-gray-500 mt-1">
                Groups similar products across multiple bags. Format: TYPE-SUB-SEQ (e.g., JN-KD-001)
              </p>
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
              <div *ngIf="formData.stock > 0" class="mt-2">
                <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="applyPriceToBarcode" name="applyPriceToBarcode" 
                         class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span>Apply sale price to all barcodes (₹{{ formData.price?.toFixed(2) || '0.00' }})</span>
                </label>
                <p class="text-xs text-gray-500 mt-1 ml-6">
                  When checked, all {{ formData.stock }} barcodes will have the sale price. Uncheck to set prices individually later.
                </p>
              </div>
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
            <!-- Admin users: Products automatically added to SUPPLIER location -->
            <div *ngIf="isAdmin()">
              <label class="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <div class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                <span class="font-medium">Supplier</span>
                <span class="text-xs text-gray-500 ml-2">(Products added to supplier inventory)</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Products will be added to Supplier location. Use Stock Transfer to move to warehouses.</p>
              <!-- Hidden input to maintain form binding for admin -->
              <input type="hidden" [(ngModel)]="formData.locationId" name="locationId" value="1" />
            </div>
            
            <!-- Warehouse users: Select warehouse location -->
            <div *ngIf="!isAdmin()">
              <label class="block text-sm font-medium text-gray-700 mb-2">Location (Warehouse) *</label>
              <select required [(ngModel)]="formData.locationId" name="locationId"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select warehouse</option>
                <option *ngFor="let location of getWarehouseLocations(appState.locations)" [value]="location.id">
                  {{ location.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Choose the warehouse where this product will be stored</p>
            </div>
          </div>

          <!-- SKU -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">SKU *</label>
              <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" [(ngModel)]="isManualSku" name="isManualSku" 
                       class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Manual SKU</span>
              </label>
            </div>
            <div class="flex gap-2">
              <input type="text" required [(ngModel)]="formData.sku" name="sku" (blur)="validateSku()" 
                     [readonly]="!isManualSku"
                     placeholder="Click 'Generate SKU' or enable manual entry"
                     [class.bg-gray-50]="!isManualSku"
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button type="button" (click)="generateSku()" [disabled]="isManualSku || !canGenerateSku()"
                      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate SKU
              </button>
            </div>
            <div *ngIf="skuError" class="mt-1 text-sm text-red-600">{{ skuError }}</div>
            <div *ngIf="!skuError && isCheckingSku" class="mt-1 text-sm text-gray-500">Checking SKU...</div>
            <p class="text-xs text-gray-500 mt-1">
              <span *ngIf="!isManualSku">Auto-generated from Name(2) + Category(3) + Random(4)</span>
              <span *ngIf="isManualSku">Enter a unique SKU manually</span>
              <span class="ml-2" *ngIf="formData.stock > 0">• {{ formData.stock }} barcodes will be generated</span>
            </p>
          </div>

          <!-- Bag Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bag Number</label>
            <input type="text" [(ngModel)]="formData.bagNumber" name="bagNumber" 
                   placeholder="e.g., BAG-001, A-12, Rack-3-Shelf-2"
                   maxlength="50"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <p class="text-xs text-gray-500 mt-1">Physical location identifier to help warehouse staff locate this product quickly</p>
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
            <button type="submit" [disabled]="!productForm.valid || isCheckingSku || skuError || isSubmitting"
                    class="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg *ngIf="!isSubmitting" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h2m0 0h9a2 2 0 002-2v-9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h4"/></svg>
              <svg *ngIf="isSubmitting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSubmitting ? 'Processing...' : (isEditMode ? 'Update Product' : 'Add Product') }}</span>
            </button>
            <button type="button" (click)="resetForm()" [disabled]="isSubmitting" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddProductComponent implements OnInit {
  appState$: Observable<AppState>;
  
  formData = {
    name: 'Classic Denim Jacket',
    category: 'jackets' as Product['category'],
    subcategory: '' as Product['subcategory'],
    productType: '',
    productCode: '',
    size: 'M',
    color: 'Blue',
    price: 89.99,
    cost: 45.00,
    wholesalePrice: 65.00,
    wholesaleMinQuantity: 100,
    stock: 150,
    minStock: 20,
    sku: '',
    bagNumber: '',
    description: 'Premium quality denim jacket with vintage wash finish. Features button closure, chest pockets, and comfortable fit.',
    imageUrls: [] as string[],
    locationId: '',
  };

  // UI validation state
  skuError: string | null = null;
  isCheckingSku = false;
  isManualSku = false; // Toggle for manual SKU entry
  applyPriceToBarcode = true; // Toggle for applying price to barcodes (default: true)
  creationSuccess = false;
  isEditMode = false;
  editingProductId: string | null = null;
  isSubmitting = false; // Loading state for form submission
  existingProductCodes: string[] = []; // List of existing product codes for autocomplete

  constructor(
    private appService: AppService, 
    private authService: AuthService,
    private router: Router, 
    private route: ActivatedRoute
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    // Ensure initial data (including locations) is loaded
    // Force reload if locations are empty
    const currentState = this.appService.appStateBehaviorSubject.value;
    if (!currentState.locations || currentState.locations.length === 0) {
      this.appService.loadInitialData().subscribe({
        next: () => {
          const state = this.appService.appStateBehaviorSubject.value;
          // Auto-set location to SUPPLIER for admin users after data loads
          if (this.isAdmin()) {
            this.formData.locationId = '1'; // SUPPLIER location ID
          }
        }
      });
    } else {
      // Auto-set location to SUPPLIER for admin users
      if (this.isAdmin()) {
        this.formData.locationId = '1'; // SUPPLIER location ID
      }
    }
    
    // Also subscribe to state changes for updates
    this.appService.appState$.subscribe(state => {
      if (this.isAdmin() && state.locations.length > 0) {
        // Double-check locationId is set for admin
        if (!this.formData.locationId) {
          this.formData.locationId = '1';
        }
      }
      
      // Load existing product codes for autocomplete
      const codes = state.products
        .map(p => p.productCode)
        .filter((code): code is string => !!code && code.length > 0);
      this.existingProductCodes = [...new Set(codes)].sort();
    });
    
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editingProductId = id;
        const state = this.appService.appStateBehaviorSubject.value;
        const prod = state.products.find(p => p.id === id);
        if (prod) {
          // NOTE: Product pricing/location fields are deprecated (backend returns null)
          // For edit mode, use default values if null
          this.formData = {
            name: prod.name,
            category: prod.category,
            subcategory: prod.subcategory || '' as Product['subcategory'],
            productType: prod.productType || '',
            productCode: prod.productCode || '',
            size: prod.size,
            color: prod.color,
            price: prod.price || 0,
            cost: prod.cost || 0,
            wholesalePrice: prod.wholesalePrice || 0,
            wholesaleMinQuantity: prod.wholesaleMinQuantity || 0,
            stock: prod.stock || 0,
            minStock: prod.minStock || 0,
            sku: prod.sku,
            bagNumber: prod.bagNumber || '',
            description: prod.description || '',
            imageUrls: prod.imageUrls || [],
            locationId: prod.locationId || '',
          };
        }
      } else {
        this.isEditMode = false;
        this.editingProductId = null;
      }
    });
  }

  onSubmit(): void {
    const appState = this.appService.appStateBehaviorSubject.value;
    
    // Check if locations are loaded
    if (!appState.locations || appState.locations.length === 0) {
      alert('Loading location data. Please wait a moment and try again.');
      // Trigger data load
      this.appService.loadInitialData().subscribe();
      return;
    }
    
    // For admin users, ensure locationId is set to SUPPLIER (ID=1)
    if (this.isAdmin() && !this.formData.locationId) {
      this.formData.locationId = '1';
    }
    
    const selectedLocation = appState.locations.find((loc: Location) => 
      loc.id === this.formData.locationId || 
      loc.id.toString() === this.formData.locationId ||
      this.formData.locationId === loc.id.toString()
    );
    
    if (!selectedLocation) {
      alert('Please select a location for the product');
      return;
    }
    if (this.isEditMode && this.editingProductId) {
      const product = {
        ...this.formData,
        location: selectedLocation,
      };

      this.isSubmitting = true; // Start loading
      this.appService.updateProduct(this.editingProductId, product).subscribe({
        next: () => {
          this.isSubmitting = false; // Stop loading
          alert('Product updated successfully!');
          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          this.isSubmitting = false; // Stop loading on error
          alert('Failed to update product. Please try again.');
        }
      });
      return;
    }

    // Run duplicate checks before creating (only SKU check needed now)
    const skuCheck$ = this.appService.productExistsBySku(this.formData.sku);

    this.isCheckingSku = true;

    skuCheck$.subscribe({
      next: (skuExists) => {
        this.isCheckingSku = false;

        this.skuError = skuExists ? 'SKU already exists. Please use a unique SKU.' : null;

        if (skuExists) {
          return; // stop submission; errors shown inline
        }

        // Extract product master data (no location/pricing, no barcode)
        const product = {
          name: this.formData.name,
          category: this.formData.category,
          subcategory: this.formData.subcategory || undefined,
          productType: this.formData.productType || undefined,
          productCode: this.formData.productCode || undefined,
          size: this.formData.size,
          color: this.formData.color,
          sku: this.formData.sku,
          bagNumber: this.formData.bagNumber,
          description: this.formData.description,
          imageUrls: this.formData.imageUrls,
          // Deprecated fields - set to null for compatibility
          price: null,
          cost: null,
          wholesalePrice: null,
          wholesaleMinQuantity: null,
          stock: this.formData.stock, // Used for initial quantity at first location
          minStock: this.formData.minStock, // Used for initial threshold
          locationId: null,
          location: null,
        };

        // Extract location-specific pricing
        const locationId = parseInt(selectedLocation.id);
        const pricing = {
          cost: this.formData.cost,
          salePrice: this.formData.price,
          wholesalePrice: this.formData.wholesalePrice,
          wholesaleMinQuantity: this.formData.wholesaleMinQuantity,
        };

        // NEW: createProduct now requires locationId and pricing as separate params
        this.isSubmitting = true; // Start loading
        this.appService.createProduct(product, locationId, pricing, this.applyPriceToBarcode).subscribe({
          next: () => {
            this.isSubmitting = false; // Stop loading
            // Product added successfully - redirect to dashboard silently (no popup)
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.isSubmitting = false; // Stop loading on error
            alert('Failed to add product. Please try again.');
          }
        });
      },
      error: (err) => {
        this.isCheckingSku = false;
        alert('Could not validate SKU. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      category: 'shirts',
      subcategory: '' as Product['subcategory'],
      productType: '',
      productCode: '',
      size: '',
      color: '',
      price: 0,
      cost: 0,
      wholesalePrice: 0,
      wholesaleMinQuantity: 100,
      stock: 0,
      minStock: 0,
      sku: '',
      bagNumber: '',
      description: '',
      imageUrls: [],
      locationId: '',
    };
    this.skuError = null;
    this.isCheckingSku = false;
  }

  // Suggest product code based on product type and subcategory
  suggestProductCode(): void {
    const productType = this.formData.productType?.trim();
    const subcategory = this.formData.subcategory;
    
    if (!productType || !subcategory) {
      return;
    }
    
    // Generate type code (first 2-3 letters of product type)
    const typeCode = productType
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 2)
      .toUpperCase();
    
    // Generate subcategory code
    const subMap: Record<string, string> = {
      'mens': 'MN',
      'womens': 'WM',
      'kids': 'KD',
      'boys': 'BY',
      'girls': 'GL',
      'infant': 'IF',
      'toddler': 'TD',
      'unisex': 'UN'
    };
    const subCode = subMap[subcategory] || 'XX';
    
    // Find next sequence number for this type-sub combination
    const prefix = `${typeCode}-${subCode}-`;
    const existingSequences = this.existingProductCodes
      .filter(code => code.startsWith(prefix))
      .map(code => {
        const match = code.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    
    const nextSeq = existingSequences.length > 0 
      ? Math.max(...existingSequences) + 1 
      : 1;
    
    this.formData.productCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  dismissSuccess(): void {
    this.creationSuccess = false;
  }

  // Generate SKU from product attributes
  generateSku(): void {
    const name = this.formData.name?.trim() || '';
    const category = this.formData.category?.trim() || '';
    const size = this.formData.size?.trim() || '';
    const color = this.formData.color?.trim() || '';

    if (!this.canGenerateSku()) {
      alert('Please fill in Name, Category, Size, and Color to generate SKU');
      return;
    }

    // Extract alphanumeric characters only
    const extractAlphaNum = (str: string) => str.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Name: first 2 alphanumeric characters
    const namePart = extractAlphaNum(name).substring(0, 2).padEnd(2, 'X');
    
    // Category: first 3 alphanumeric characters
    const categoryPart = extractAlphaNum(category).substring(0, 3).padEnd(3, 'X');
    
    // Size: all alphanumeric characters (no limit)
    const sizePart = extractAlphaNum(size);
    
    // Color: first 3 alphanumeric characters
    const colorPart = extractAlphaNum(color).substring(0, 3).padEnd(3, 'X');
    
    // Random: 4 digits
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();

    // Combine: NAME(2)-CATEGORY(3)-SIZE-COLOR(3)-RANDOM(4)
    this.formData.sku = `${namePart}${categoryPart}${sizePart}${colorPart}${randomPart}`;
    
    // Validate the generated SKU
    this.validateSku();
  }

  // Check if we have enough data to generate SKU
  canGenerateSku(): boolean {
    return !!(
      this.formData.name?.trim() &&
      this.formData.category?.trim() &&
      this.formData.size?.trim() &&
      this.formData.color?.trim()
    );
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

  // Filter locations to only show warehouses (exclude Supplier and Stores)
  getWarehouseLocations(locations: Location[]): Location[] {
    return locations.filter(loc => 
      loc.type.toLowerCase() === 'warehouse' && 
      loc.name.toLowerCase() !== 'supplier'
    );
  }

  // Check if current user is admin
  isAdmin(): boolean {
    return this.authService.hasCrossLocationAccess();
  }
}
