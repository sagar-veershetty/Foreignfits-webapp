import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Location } from '../../core/models';
import {
  DEPARTMENTS,
  DEPARTMENT_PRODUCT_TYPES,
  mapDepartmentToCategory,
  mapDepartmentToSubcategory,
  deriveDepartmentFromCodeOrSubcategory
} from '../../core/constants/product-master';

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
            <!-- Category (Department) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select required [(ngModel)]="formData.department" name="department" (ngModelChange)="onDepartmentChange()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">-- Select Category --</option>
                <option *ngFor="let dept of departments" [value]="dept.value">{{ dept.label }}</option>
              </select>
            </div>
            <!-- Product (replaces Subcategory + Product Type) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Product *</label>
              <select required [(ngModel)]="formData.productType" name="productType" [disabled]="!formData.department"
                      (ngModelChange)="formData.productCode = ''"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50">
                <option value="">-- Select Product --</option>
                <option *ngFor="let pt of getProductTypesForDepartment()" [value]="pt.label">{{ pt.label }}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Choose the specific product for the selected category</p>
            </div>
            <!-- Product Code -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">Product Code</label>
                <button type="button" (click)="suggestProductCode()" [disabled]="!formData.productType || !formData.department"
                        class="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                  Suggest Code
                </button>
              </div>
              <input type="text" [(ngModel)]="formData.productCode" name="productCode" 
      placeholder="e.g., FF-MEN-JKT-001"
                     list="productCodesList"
                     maxlength="50"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <datalist id="productCodesList">
                <option *ngFor="let code of existingProductCodes" [value]="code">
              </datalist>
              <p class="text-xs text-gray-500 mt-1">
                Format: FF-[DEPT]-[TYPE]-[001]. Underwear uses FF-UWR-[MEN/WOM/KID]-[TYPE]-[001].
              </p>
            </div>
            <!-- Size -->
            <div *ngIf="!multiSizeMode">
              <label class="block text-sm font-medium text-gray-700 mb-2">Size *</label>
              <input type="text" required [(ngModel)]="formData.size" name="size" placeholder="e.g., M, 32, One Size"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <label *ngIf="!isEditMode" class="flex items-center gap-2 text-xs text-blue-600 mt-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="multiSizeMode" name="multiSizeMode" [ngModelOptions]="{standalone: true}"
                       class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>This product comes in multiple sizes with different quantities (e.g. jeans in 110/120/130)</span>
              </label>
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
            <div *ngIf="!multiSizeMode">
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

          <!-- Multi-Size Variants Table -->
          <div *ngIf="multiSizeMode" class="border border-blue-200 bg-blue-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="text-sm font-semibold text-blue-900">Sizes &amp; Quantities</h3>
                <p class="text-xs text-blue-700 mt-0.5">Each size will be created as its own SKU with its own barcodes at the quantity you enter. All sizes share the same Product Code, Category, and Color above. Prices default to the values above, but you can override per size (e.g. bigger sizes cost more) using "Custom Price" below.</p>
              </div>
              <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                <input type="checkbox" [(ngModel)]="applyPriceToBarcode" name="applyPriceToBarcodeMulti" [ngModelOptions]="{standalone: true}"
                       class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span>Apply sale price to barcodes</span>
              </label>
            </div>

            <div class="space-y-2">
              <div *ngFor="let row of sizeVariants; let i = index" class="bg-white border border-blue-100 rounded-lg p-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <input type="text" [(ngModel)]="row.size" [name]="'variantSize' + i" [ngModelOptions]="{standalone: true}"
                           placeholder="Size (e.g., 110, M, XL)"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
                  </div>
                  <div class="w-28">
                    <input type="number" min="0" [(ngModel)]="row.quantity" [name]="'variantQty' + i" [ngModelOptions]="{standalone: true}"
                           placeholder="Quantity"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
                  </div>
                  <button type="button" (click)="row.showCustomPrice = !row.showCustomPrice"
                          class="text-xs whitespace-nowrap px-2 py-2 rounded-lg"
                          [ngClass]="row.showCustomPrice ? 'bg-amber-100 text-amber-800' : 'text-blue-700 hover:bg-blue-100'">
                    {{ row.showCustomPrice ? 'Using Custom Price' : 'Custom Price' }}
                  </button>
                  <button type="button" (click)="removeSizeVariantRow(i)" [disabled]="sizeVariants.length === 1"
                          class="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Remove size">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                <div *ngIf="row.showCustomPrice" class="mt-2 pl-1 grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-0.5">Sale Price for this size</label>
                    <input type="number" step="0.01" min="0" [(ngModel)]="row.salePrice" [name]="'variantSale' + i" [ngModelOptions]="{standalone: true}"
                           [placeholder]="'Default: ' + (formData.price || 0)"
                           class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-gray-500 mb-0.5">Cost Price for this size</label>
                    <input type="number" step="0.01" min="0" [(ngModel)]="row.costPrice" [name]="'variantCost' + i" [ngModelOptions]="{standalone: true}"
                           [placeholder]="'Default: ' + (formData.cost || 0)"
                           class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <button type="button" (click)="addSizeVariantRow()"
                    class="mt-3 text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Add Another Size
            </button>

            <div class="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-blue-800">
              <span>Total pieces across all sizes:</span>
              <span class="font-semibold">{{ getTotalVariantQuantity() }}</span>
            </div>

            <div *ngIf="variantProgress.total > 0" class="mt-3 bg-white border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
              Creating size {{ variantProgress.current }} of {{ variantProgress.total }}...
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
          <div *ngIf="!multiSizeMode">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">SKU *</label>
              <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" [(ngModel)]="isManualSku" name="isManualSku" 
                       class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Manual SKU</span>
              </label>
            </div>
            <div class="flex gap-2">
              <input type="text" [required]="!multiSizeMode" [(ngModel)]="formData.sku" name="sku" (blur)="validateSku()" 
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
          <div *ngIf="multiSizeMode" class="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            SKU will be auto-generated for each size (Name + Category + Size + Color + Random).
          </div>

          <!-- Rack No -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rack No</label>
            <input type="text" [(ngModel)]="formData.bagNumber" name="bagNumber" 
                   placeholder="e.g., RACK-001, A-12, Rack-3-Shelf-2"
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
              <span>{{ isSubmitting ? 'Processing...' : (isEditMode ? 'Update Product' : (multiSizeMode ? 'Add All Sizes' : 'Add Product')) }}</span>
            </button>
            <button type="button" (click)="resetForm()" [disabled]="isSubmitting" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddProductComponent implements OnInit {
  // Category (department) options shown in the Category dropdown (shared master data)
  departments: { value: string; label: string }[] = DEPARTMENTS;

  // Product options per department, sourced from Foreign_Fits_Product_Code_Master (shared master data)
  private readonly departmentProductTypes: Record<string, { label: string; code: string }[]> = DEPARTMENT_PRODUCT_TYPES;

  appState$: Observable<AppState>;
  
  formData = {
    name: 'Classic Denim Jacket',
    department: '',
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

  // Multi-size mode: create the same product in several sizes at once,
  // each with its own SKU, quantity, and barcodes (e.g. jeans in sizes 110/120/130).
  multiSizeMode = false;
  sizeVariants: { size: string; quantity: number; showCustomPrice?: boolean; salePrice?: number | null; costPrice?: number | null }[] = [{ size: '', quantity: 0 }];
  variantProgress = { current: 0, total: 0 };

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
      console.log('[AddProduct] Locations not loaded, triggering loadInitialData...');
      this.appService.loadInitialData().subscribe({
        next: () => {
          const state = this.appService.appStateBehaviorSubject.value;
          console.log('[AddProduct] Data loaded, locations:', state.locations.length);
          // Auto-set location to SUPPLIER for admin users after data loads
          if (this.isAdmin()) {
            this.formData.locationId = '1'; // SUPPLIER location ID
          }
        },
        error: (err) => {
          console.error('[AddProduct] Failed to load initial data:', err);
          alert('Failed to load location data. Please refresh the page and try again.');
        }
      });
    } else {
      console.log('[AddProduct] Locations already loaded:', currentState.locations.length);
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
            department: this.deriveDepartmentFromProduct(prod),
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
      console.error('[AddProduct] Locations not loaded. App state:', appState);
      alert('Loading location data. Please wait a moment and try again.');
      // Trigger data load
      this.appService.loadInitialData().subscribe({
        next: () => {
          console.log('[AddProduct] Data loaded successfully');
        },
        error: (err) => {
          console.error('[AddProduct] Failed to load data:', err);
          alert('Failed to load location data. Please check your connection and try again.');
        }
      });
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

    // Multi-size mode: create one Product+SKU per size row
    if (this.multiSizeMode && !this.isEditMode) {
      this.submitMultipleSizes(selectedLocation);
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
      department: '',
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
    this.multiSizeMode = false;
    this.sizeVariants = [{ size: '', quantity: 0 }];
    this.variantProgress = { current: 0, total: 0 };
  }

  // Returns the list of Product options for the currently selected Category (department)
  getProductTypesForDepartment(): { label: string; code: string }[] {
    return this.departmentProductTypes[this.formData.department] || [];
  }

  // Called when the Category (department) dropdown changes
  onDepartmentChange(): void {
    this.formData.productType = '';
    this.formData.productCode = '';
    this.formData.category = this.mapDepartmentToCategory(this.formData.department) as Product['category'];
    this.formData.subcategory = this.mapDepartmentToSubcategory(this.formData.department) as Product['subcategory'];
  }

  private mapDepartmentToCategory(department: string): string {
    return mapDepartmentToCategory(department);
  }

  private mapDepartmentToSubcategory(department: string): string {
    return mapDepartmentToSubcategory(department);
  }

  // Best-effort reverse mapping used when loading a product for editing
  private deriveDepartmentFromProduct(prod: Product): string {
    return deriveDepartmentFromCodeOrSubcategory(prod.productCode, prod.subcategory);
  }

  // Suggest product code based on selected Category (department) and Product
  suggestProductCode(): void {
    const department = this.formData.department;
    const productTypeLabel = this.formData.productType?.trim();

    if (!department || !productTypeLabel) {
      return;
    }

    const options = this.departmentProductTypes[department] || [];
    const match = options.find(o => o.label === productTypeLabel);
    const typeCode = match?.code ||
      productTypeLabel.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');

    let prefix: string;
    if (department.startsWith('uwr-')) {
      const seg = department === 'uwr-men' ? 'MEN' : department === 'uwr-women' ? 'WOM' : 'KID';
      prefix = `FF-UWR-${seg}-${typeCode}-`;
    } else {
      const deptCodeMap: Record<string, string> = {
        men: 'MEN', women: 'WOM', kids: 'KID', newborn: 'BAB',
        footwear: 'FWT', accessories: 'ACC', toys: 'TOY'
      };
      const deptCode = deptCodeMap[department] || 'GEN';
      prefix = `FF-${deptCode}-${typeCode}-`;
    }

    const existingSequences = this.existingProductCodes
      .map(code => {
        const match = code.match(/-(\d{3,5})$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(seq => seq > 0);

    const nextSeq = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
    this.formData.productCode = `${prefix}${String(nextSeq).padStart(5, '0')}`;
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

    // Combine: NAME(2)-CATEGORY(3)-SIZE-COLOR(3)-RANDOM(4)
    this.formData.sku = this.buildSku(name, category, size, color);
    
    // Validate the generated SKU
    this.validateSku();
  }

  // Shared SKU builder used both for single-size and multi-size (variant) creation
  private buildSku(name: string, category: string, size: string, color: string): string {
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

    return `${namePart}${categoryPart}${sizePart}${colorPart}${randomPart}`;
  }

  // ===== Multi-size variant helpers =====

  addSizeVariantRow(): void {
    this.sizeVariants.push({ size: '', quantity: 0 });
  }

  removeSizeVariantRow(index: number): void {
    if (this.sizeVariants.length > 1) {
      this.sizeVariants.splice(index, 1);
    }
  }

  getTotalVariantQuantity(): number {
    return this.sizeVariants.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  }

  // Create one Product (own SKU + barcodes) per size row, sequentially,
  // so each size can be tracked, sold, and reported on individually while
  // sharing the same Product Code / Category / Color / Prices.
  private submitMultipleSizes(selectedLocation: Location): void {
    const validRows = this.sizeVariants.filter(r => r.size?.trim() && Number(r.quantity) > 0);

    if (validRows.length === 0) {
      alert('Please add at least one size with a quantity greater than 0.');
      return;
    }

    const locationId = parseInt(selectedLocation.id);

    this.isSubmitting = true;
    this.variantProgress = { current: 0, total: validRows.length };

    const createNext = (index: number): void => {
      if (index >= validRows.length) {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
        return;
      }

      const row = validRows[index];
      const size = row.size.trim();
      const candidateSku = this.buildSku(this.formData.name, this.formData.category, size, this.formData.color);

      // Use per-size custom price if provided, otherwise fall back to the base price above
      const pricing = {
        cost: (row.showCustomPrice && row.costPrice != null && row.costPrice > 0) ? row.costPrice : this.formData.cost,
        salePrice: (row.showCustomPrice && row.salePrice != null && row.salePrice > 0) ? row.salePrice : this.formData.price,
        wholesalePrice: this.formData.wholesalePrice,
        wholesaleMinQuantity: this.formData.wholesaleMinQuantity,
      };

      this.appService.productExistsBySku(candidateSku).subscribe({
        next: (exists) => {
          // Extremely unlikely collision (random 4-digit suffix) - regenerate once if so
          const finalSku = exists
            ? this.buildSku(this.formData.name, this.formData.category, size, this.formData.color)
            : candidateSku;

          const product = {
            name: this.formData.name,
            category: this.formData.category,
            subcategory: this.formData.subcategory || undefined,
            productType: this.formData.productType || undefined,
            productCode: this.formData.productCode || undefined,
            size: size,
            color: this.formData.color,
            sku: finalSku,
            bagNumber: this.formData.bagNumber,
            description: this.formData.description,
            imageUrls: this.formData.imageUrls,
            price: null,
            cost: null,
            wholesalePrice: null,
            wholesaleMinQuantity: null,
            stock: Number(row.quantity),
            minStock: this.formData.minStock,
            locationId: null,
            location: null,
          };

          this.appService.createProduct(product, locationId, pricing, this.applyPriceToBarcode).subscribe({
            next: () => {
              this.variantProgress.current = index + 1;
              createNext(index + 1);
            },
            error: () => {
              this.isSubmitting = false;
              alert(`Failed to create size "${size}". Created ${index} of ${validRows.length} sizes so far. Please check Inventory, then add any remaining sizes.`);
            }
          });
        },
        error: () => {
          this.isSubmitting = false;
          alert(`Could not validate SKU for size "${size}". Please try again.`);
        }
      });
    };

    createNext(0);
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
      this.compressImage(file).then(url => {
        this.formData.imageUrls.push(url);
      }).catch(() => {
        // Fallback: if compression fails for any reason, still try to read the original file
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result || '');
          this.formData.imageUrls.push(url);
        };
        reader.readAsDataURL(file);
      });
    });
    // reset input
    input.value = '';
  }

  /**
   * Resize/compress an image file to a reasonable max dimension and JPEG quality
   * before converting to a base64 data URL. This keeps the multi-size Add Product
   * payload (which re-sends the same images for every size) well under the
   * server's request size limit, instead of sending multi-megabyte originals.
   */
  private compressImage(file: File, maxDimension = 1200, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
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
