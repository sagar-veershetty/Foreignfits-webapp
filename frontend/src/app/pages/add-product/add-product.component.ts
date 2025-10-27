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
              <span *ngIf="!isManualSku">Auto-generated from Name(2) + Category(3) + Size + Color(3) + Random(4)</span>
              <span *ngIf="isManualSku">Enter a unique SKU manually</span>
              <span class="ml-2" *ngIf="formData.stock > 0">• {{ formData.stock }} barcodes will be generated</span>
            </p>
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
            <button type="submit" [disabled]="!productForm.valid || isCheckingSku || skuError"
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
export class AddProductComponent implements OnInit {
  appState$: Observable<AppState>;
  
  formData = {
    name: 'Classic Denim Jacket',
    category: 'jackets' as Product['category'],
    size: 'M',
    color: 'Blue',
    price: 89.99,
    cost: 45.00,
    wholesalePrice: 65.00,
    wholesaleMinQuantity: 100,
    stock: 150,
    minStock: 20,
    sku: '',
    description: 'Premium quality denim jacket with vintage wash finish. Features button closure, chest pockets, and comfortable fit.',
    imageUrls: [] as string[],
    locationId: '',
  };

  // UI validation state
  skuError: string | null = null;
  isCheckingSku = false;
  isManualSku = false; // Toggle for manual SKU entry
  creationSuccess = false;
  isEditMode = false;
  editingProductId: string | null = null;

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
      console.log('Locations empty, forcing data reload...');
      this.appService.loadInitialData().subscribe({
        next: () => {
          console.log('Initial data loaded successfully');
          const state = this.appService.appStateBehaviorSubject.value;
          console.log('Locations after load:', state.locations);
          // Auto-set location to SUPPLIER for admin users after data loads
          if (this.isAdmin()) {
            this.formData.locationId = '1'; // SUPPLIER location ID
            console.log('Admin detected - locationId set to:', this.formData.locationId);
          }
        },
        error: (err) => {
          console.error('Failed to load initial data:', err);
        }
      });
    } else {
      console.log('Locations already loaded:', currentState.locations);
      // Auto-set location to SUPPLIER for admin users
      if (this.isAdmin()) {
        this.formData.locationId = '1'; // SUPPLIER location ID
        console.log('Admin detected - locationId set to:', this.formData.locationId);
      }
    }
    
    // Also subscribe to state changes for updates
    this.appService.appState$.subscribe(state => {
      if (this.isAdmin() && state.locations.length > 0) {
        // Double-check locationId is set for admin
        if (!this.formData.locationId) {
          this.formData.locationId = '1';
          console.log('Setting locationId in appState subscription:', this.formData.locationId);
        }
      }
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
            size: prod.size,
            color: prod.color,
            price: prod.price || 0,
            cost: prod.cost || 0,
            wholesalePrice: prod.wholesalePrice || 0,
            wholesaleMinQuantity: prod.wholesaleMinQuantity || 0,
            stock: prod.stock || 0,
            minStock: prod.minStock || 0,
            sku: prod.sku,
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
    
    console.log('Form submission - locationId:', this.formData.locationId);
    console.log('Is Admin:', this.isAdmin());
    console.log('Available locations:', appState.locations);
    
    // Check if locations are loaded
    if (!appState.locations || appState.locations.length === 0) {
      alert('Loading location data. Please wait a moment and try again.');
      console.error('Locations not loaded yet!');
      // Trigger data load
      this.appService.loadInitialData().subscribe();
      return;
    }
    
    // For admin users, ensure locationId is set to SUPPLIER (ID=1)
    if (this.isAdmin() && !this.formData.locationId) {
      this.formData.locationId = '1';
      console.log('Admin locationId was empty, set to:', this.formData.locationId);
    }
    
    const selectedLocation = appState.locations.find((loc: Location) => 
      loc.id === this.formData.locationId || 
      loc.id.toString() === this.formData.locationId ||
      this.formData.locationId === loc.id.toString()
    );
    
    console.log('Selected location:', selectedLocation);
    
    if (!selectedLocation) {
      console.error('Location not found! locationId:', this.formData.locationId);
      alert('Please select a location for the product');
      return;
    }
    if (this.isEditMode && this.editingProductId) {
      const product = {
        ...this.formData,
        location: selectedLocation,
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
          size: this.formData.size,
          color: this.formData.color,
          sku: this.formData.sku,
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
        this.appService.createProduct(product, locationId, pricing).subscribe({
          next: () => {
            // Product added successfully - redirect to dashboard silently (no popup)
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Create product failed', err);
            alert('Failed to add product. Please try again.');
          }
        });
      },
      error: (err) => {
        this.isCheckingSku = false;
        console.error('Validation check failed', err);
        alert('Could not validate SKU. Please try again.');
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
      imageUrls: [],
      locationId: '',
    };
    this.skuError = null;
    this.isCheckingSku = false;
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
