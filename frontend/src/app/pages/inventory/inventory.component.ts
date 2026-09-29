import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Location } from '../../core/models';
import {
  DEPARTMENTS,
  DEPARTMENT_PRODUCT_TYPES,
  deriveDepartmentFromCodeOrSubcategory
} from '../../core/constants/product-master';
import { ImageCarouselComponent } from '../../components/shared/image-carousel/image-carousel.component';
import { ImageLightboxComponent } from '../../components/shared/image-lightbox/image-lightbox.component';

interface LocationInventoryItem {
  id: string;
  locationId: string;
  locationName: string;
  productSku: string;
  productName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  cost: number;
  salePrice: number;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
  product?: Product;
}

interface ProductGroup {
  key: string;
  productCode?: string;
  productType: string;
  subcategory: string;
  category: string;
  totalBags: number;
  totalQuantity: number;
  items: LocationInventoryItem[];
}

// Parent/child grouping used by Card View: one parent card per Product Code
// (same product, same location), with each size variant shown as a child row.
// This avoids showing a separate full-size card for every size of the same product.
interface ProductCodeGroup {
  key: string;
  productCode: string;
  productName: string;
  productType?: string;
  category?: string;
  subcategory?: string;
  bagNumber?: string;
  locationName: string;
  imageUrls: string[];
  sizes: string[];
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  items: LocationInventoryItem[];
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCarouselComponent, ImageLightboxComponent],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;

  // Signals for reactive state
  locationInventory = signal<LocationInventoryItem[]>([]);
  locations = signal<Location[]>([]);
  selectedLocationId = signal<string>('');
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);

  // Filter signals
  searchTerm = signal<string>('');
  categoryFilter = signal<string>('all');
  lowStockOnly = signal<boolean>(false);
  
  // View mode: 'cards' or 'grouped'
  viewMode = signal<'cards' | 'grouped'>('cards');
  
  // Category (department) filter - mirrors Add Product's Category dropdown
  departmentFilter = signal<string>('all');

  // Product filter - mirrors Add Product's Product dropdown, options depend on departmentFilter
  productFilter = signal<string>('all');

  // Kept for backward compatibility with any legacy references (unused by new filter UI)
  subcategoryFilter = signal<string>('all');
  productTypeFilter = signal<string>('');
  
  // Expanded groups tracking
  expandedGroups = new Set<string>();

  // Edit modal state
  editModalOpen = signal<boolean>(false);
  editingItem = signal<LocationInventoryItem | null>(null);
  editForm = signal({
    cost: 0,
    salePrice: 0,
    wholesalePrice: 0,
    wholesaleMinQuantity: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0
  });

  // Restock modal state - add quantity to an existing product and generate fresh barcodes
  restockModalOpen = signal<boolean>(false);
  restockingItem = signal<LocationInventoryItem | null>(null);
  restockForm = signal({
    quantity: 0,
    applyPriceToBarcode: true,
    reason: ''
  });
  isRestocking = signal<boolean>(false);
  // Sibling size variants of the product being restocked (same productCode/name, same location)
  // so multiple sizes can be restocked together in one submission.
  restockSiblings = signal<{ item: LocationInventoryItem; quantity: number }[]>([]);
  // Brand-new sizes that don't exist yet at this location (e.g. a size found in
  // store recount that was never registered before) - these get created as new
  // products+SKUs with initial stock rather than restocked.
  restockNewSizes = signal<{ size: string; quantity: number }[]>([]);

  // Fullscreen image lightbox state (used by the image carousel on each product card)
  lightboxOpen = signal<boolean>(false);
  lightboxImages = signal<string[]>([]);
  lightboxStartIndex = signal<number>(0);
  lightboxAlt = signal<string>('');

  openLightbox(payload: { images: string[]; index: number }, alt: string): void {
    this.lightboxImages.set(payload.images);
    this.lightboxStartIndex.set(payload.index);
    this.lightboxAlt.set(alt);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }


  // Filtered inventory
  filteredInventory = computed(() => {
    const inventory = this.locationInventory();
    const search = this.searchTerm().toLowerCase();
    const department = this.departmentFilter();
    const product = this.productFilter();
    const lowStock = this.lowStockOnly();

    return inventory.filter(item => {
      // Hide products with 0 quantity
      if (item.quantity === 0) {
        return false;
      }

      const matchesSearch = !search || 
        item.productName.toLowerCase().includes(search) ||
        item.productSku.toLowerCase().includes(search) ||
        (item.product?.productCode?.toLowerCase().includes(search) ?? false);

      const itemDepartment = deriveDepartmentFromCodeOrSubcategory(item.product?.productCode, item.product?.subcategory);

      const matchesDepartment = department === 'all' || itemDepartment === department;

      const matchesProduct = product === 'all' ||
        (item.product?.productType?.toLowerCase() === product.toLowerCase()) ||
        item.productName.toLowerCase().includes(product.toLowerCase());

      const matchesLowStock = !lowStock || 
        (item.minStock && item.quantity <= item.minStock);

      return matchesSearch && matchesDepartment && matchesProduct && matchesLowStock;
    });
  });

  // Product options for the currently selected department filter (mirrors Add Product's Product dropdown)
  getProductOptionsForDepartmentFilter(): { label: string; code: string }[] {
    const department = this.departmentFilter();
    if (department === 'all') return [];
    return DEPARTMENT_PRODUCT_TYPES[department] || [];
  }

  onDepartmentFilterChange(): void {
    // Reset product filter whenever department changes since options differ per department
    this.productFilter.set('all');
  }

  // Stats
  stats = computed(() => {
    const inventory = this.filteredInventory();
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter(item => 
      item.minStock && item.quantity <= item.minStock
    ).length;
    
    // Only calculate cost-based value for admin users
    // Sales managers and warehouse managers should not see cost/inventory value
    const currentUser = this.authService.getCurrentUser();
    const canSeeCost = currentUser?.role === 'admin';
    
    const totalValue = canSeeCost 
      ? inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0)
      : inventory.reduce((sum, item) => sum + (item.quantity * item.salePrice), 0);

    return { totalItems, totalStock, lowStockCount, totalValue, canSeeCost };
  });
  
  // Departments (Category) for filtering - mirrors Add Product's Category dropdown
  departments = DEPARTMENTS;

  // Expanded state for Card View's parent/child Product Code groups
  expandedProductCodeGroups = new Set<string>();

  toggleProductCodeGroup(key: string): void {
    if (this.expandedProductCodeGroups.has(key)) {
      this.expandedProductCodeGroups.delete(key);
    } else {
      this.expandedProductCodeGroups.add(key);
    }
  }

  isProductCodeGroupExpanded(key: string): boolean {
    return this.expandedProductCodeGroups.has(key);
  }

  // Card View: group inventory items by Product Code (+ location) so all sizes
  // of the same product appear as one parent card with expandable size rows,
  // instead of a separate full card per size.
  productCodeGroups = computed(() => {
    const inventory = this.filteredInventory();
    const groups = new Map<string, LocationInventoryItem[]>();

    inventory.forEach(item => {
      const code = item.product?.productCode?.trim();
      const key = code
        ? `${code}::${item.locationId}`
        : `NAME-${item.productName}::${item.locationId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const sorted = [...items].sort((a, b) =>
        (a.product?.size || '').localeCompare(b.product?.size || '', undefined, { numeric: true })
      );
      const first = sorted[0];
      const sizes = Array.from(new Set(sorted.map(i => i.product?.size).filter((s): s is string => !!s)));
      const prices = sorted.map(i => i.salePrice).filter(p => p != null && p >= 0);

      const group: ProductCodeGroup = {
        key,
        productCode: first.product?.productCode || 'N/A',
        productName: first.productName,
        productType: first.product?.productType,
        category: first.product?.category,
        subcategory: first.product?.subcategory,
        bagNumber: first.product?.bagNumber,
        locationName: first.locationName,
        imageUrls: first.product?.imageUrls || [],
        sizes,
        totalStock: sorted.reduce((sum, i) => sum + i.quantity, 0),
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        items: sorted
      };
      return group;
    }).sort((a, b) => a.productName.localeCompare(b.productName));
  });

  // Grouped inventory by product type and department
  groupedInventory = computed(() => {
    const inventory = this.filteredInventory();
    
    // Group by product type within each department
    const groups = new Map<string, { subcategory: string; items: LocationInventoryItem[] }>();
    
    inventory.forEach(item => {
      if (!item.product) return;
      
      const subcategory = item.product.subcategory || 'UNISEX';
      const productType = item.product.productType || item.product.name.split(' ')[0]; // e.g., "Jeans" from "Jeans Blue Size 32"
      const key = `${subcategory}-${productType}`;
      
      if (!groups.has(key)) {
        groups.set(key, { subcategory, items: [] });
      }
      groups.get(key)!.items.push(item);
    });
    
    // Convert to array and calculate totals
    return Array.from(groups.entries()).map(([key, data]) => {
      const [subcategory, productType] = key.split('-');
      return {
        key,
        subcategory,
        productType,
        category: data.items[0].product?.category || '',
        totalBags: data.items.length,
        totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
        items: data.items
      };
    }).sort((a, b) => {
      // Sort by subcategory first, then by product type
      if (a.subcategory !== b.subcategory) {
        return a.subcategory.localeCompare(b.subcategory);
      }
      return a.productType.localeCompare(b.productType);
    });
  });

  constructor(
    public authService: AuthService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for lowStock query parameter from navigation
    this.route.queryParams.subscribe(params => {
      if (params['lowStock'] === 'true') {
        this.lowStockOnly.set(true);
      }
    });

    this.loadData();
    this.setupLocationAutoSelect();

    // Listen to navigation events
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/inventory')) {
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadData(): void {
    this.isLoading.set(true);

    // First, ensure initial data (products, locations, etc.) is loaded
    this.appService.loadInitialData().subscribe({
      next: () => {
        // After initial data is loaded, subscribe to app state
        let subscription: any;
        subscription = this.appService.appState$.subscribe(state => {
          this.products.set(state.products || []);
          this.locations.set(state.locations || []);

          // After state is loaded, determine which location inventory to load
          const currentUser = this.authService.getCurrentUser();
          const isAdmin = this.authService.hasCrossLocationAccess();
          const locs = state.locations || [];

          if (isAdmin) {
            // Admin: Load selected location or "all" by default
            const locationId = this.selectedLocationId();
            if (locationId) {
              if (locationId === 'all') {
                this.loadAllInventory();
              } else {
                this.loadLocationInventory(parseInt(locationId));
              }
            } else {
              // Default to "all" for admin
              this.selectedLocationId.set('all');
              this.loadAllInventory();
            }
          } else if (currentUser?.locationId) {
            // Regular user: Load only their location
            this.selectedLocationId.set(currentUser.locationId);
            this.loadLocationInventory(parseInt(currentUser.locationId));
          } else {
            this.isLoading.set(false);
          }

          // Unsubscribe after first load
          if (subscription) {
            subscription.unsubscribe();
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadLocationInventory(locationId: number): void {
    this.isLoading.set(true);
    this.appService.getLocationInventory(locationId).subscribe({
      next: (inventory) => {
        const productsMap = new Map(this.products().map(p => [p.sku, p]));
        const items: LocationInventoryItem[] = inventory.map((inv: any) => ({
          id: inv.id?.toString() || '',
          locationId: inv.locationId?.toString() || locationId.toString(),
          locationName: inv.locationName || '',
          productSku: inv.productSku || '',
          productName: inv.productName || '',
          quantity: inv.quantity || 0,
          minStock: inv.minStock || 0,
          maxStock: inv.maxStock || 0,
          reorderPoint: inv.reorderPoint || 0,
          cost: inv.cost || 0,  // Already in rupees from backend
          salePrice: inv.salePrice || 0,  // Already in rupees from backend
          wholesalePrice: inv.wholesalePrice || null,  // Already in rupees from backend
          wholesaleMinQuantity: inv.wholesaleMinQuantity || null,
          // Use product from API response if available (includes bagNumber), otherwise fallback to local products
          product: inv.product || productsMap.get(inv.productSku)
        }));
        this.locationInventory.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.locationInventory.set([]);
        this.isLoading.set(false);
      }
    });
  }

  loadAllInventory(): void {
    this.isLoading.set(true);
    this.appService.getAllLocationInventory().subscribe({
      next: (inventory: any) => {
        const productsMap = new Map(this.products().map(p => [p.sku, p]));
        const items: LocationInventoryItem[] = inventory.map((inv: any) => ({
          id: inv.id?.toString() || '',
          locationId: inv.locationId?.toString() || '',
          locationName: inv.locationName || '',
          productSku: inv.productSku || '',
          productName: inv.productName || '',
          quantity: inv.quantity || 0,
          minStock: inv.minStock || 0,
          maxStock: inv.maxStock || 0,
          reorderPoint: inv.reorderPoint || 0,
          cost: inv.cost || 0,
          salePrice: inv.salePrice || 0,
          wholesalePrice: inv.wholesalePrice || null,
          wholesaleMinQuantity: inv.wholesaleMinQuantity || null,
          // Use product from API response if available (includes bagNumber), otherwise fallback to local products
          product: inv.product || productsMap.get(inv.productSku)
        }));
        this.locationInventory.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.locationInventory.set([]);
        this.isLoading.set(false);
      }
    });
  }

  setupLocationAutoSelect(): void {
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      const isAdmin = this.authService.hasCrossLocationAccess();

      if (!isAdmin && currentUser?.locationId) {
        this.selectedLocationId.set(currentUser.locationId);
        this.loadLocationInventory(parseInt(currentUser.locationId));
      } else if (isAdmin) {
        // Default to "all" locations for admins if not already selected
        if (!this.selectedLocationId()) {
          this.selectedLocationId.set('all');
          this.loadAllInventory();
        }
      }
    }, 500);
  }

  onLocationChange(): void {
    const locationId = this.selectedLocationId();
    if (locationId) {
      if (locationId === 'all') {
        this.loadAllInventory();
      } else {
        this.loadLocationInventory(parseInt(locationId));
      }
    }
  }

  canSwitchLocation(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  canGenerateBarcodes(): boolean {
    const user = this.authService.getCurrentUser();
    // ADMIN and WAREHOUSE can generate barcodes for bulk printing
    // But not in STORE locations (barcodes should be generated at warehouse)
    const userHasPermission = user?.role === 'admin' || user?.role === 'warehouse';
    
    const locationId = this.selectedLocationId();
    const location = this.locations().find(l => l.id === locationId);
    const isNotStore = location?.type !== 'store';
    
    return userHasPermission && isNotStore;
  }

  canPrintIndividualBarcode(): boolean {
    // ADMIN, WAREHOUSE, and SALES users can print individual barcodes
    // SALES users can print barcodes when prices are updated at their store
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'warehouse' || user?.role === 'sales';
  }

  openEditModal(item: LocationInventoryItem): void {
    this.editingItem.set(item);
    this.editForm.set({
      // Values are already in rupees from backend, no need to divide
      cost: item.cost,
      salePrice: item.salePrice,
      wholesalePrice: item.wholesalePrice || 0,
      wholesaleMinQuantity: item.wholesaleMinQuantity || 0,
      minStock: item.minStock,
      maxStock: item.maxStock,
      reorderPoint: item.reorderPoint
    });
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editingItem.set(null);
  }

  saveEdit(): void {
    const item = this.editingItem();
    const form = this.editForm();
    
    if (!item) return;

    this.isLoading.set(true);

    // Update pricing via API
    this.appService.updateInventoryPricing(parseInt(item.id), {
      cost: form.cost,
      salePrice: form.salePrice,
      wholesalePrice: form.wholesalePrice > 0 ? form.wholesalePrice : undefined,
      wholesaleMinQuantity: form.wholesaleMinQuantity > 0 ? form.wholesaleMinQuantity : undefined
    }).subscribe({
      next: () => {
        // Reload inventory
        const locationId = this.selectedLocationId();
        if (locationId) {
          this.loadLocationInventory(parseInt(locationId));
        }
        this.closeEditModal();
      },
      error: (error) => {
        alert('Failed to update inventory: ' + (error.error?.message || error.message));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Admin-only: permanently remove a product's inventory from a specific
   * store/warehouse. Deletes the LocationInventory record and any non-SOLD
   * barcodes for that product at that location. SOLD barcodes are preserved
   * for sales history.
   */
  canDeleteInventory(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  /**
   * Admin-only: add additional quantity to an existing product's inventory
   * (e.g. re-registering stock found during a physical recount at a store)
   * and generate fresh barcodes for the newly added units.
   */
  canRestockInventory(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }

  openRestockModal(item: LocationInventoryItem): void {
    this.restockingItem.set(item);
    this.restockForm.set({
      quantity: 0,
      applyPriceToBarcode: true,
      reason: ''
    });
    // Find sibling size variants of this same product (same productCode, or same
    // name if no productCode) at the same location, so multiple sizes can be
    // restocked together in one go (e.g. jeans in sizes 110/120/130).
    const siblings = this.locationInventory().filter(inv => {
      if (inv.id === item.id) return false;
      if (inv.locationId !== item.locationId) return false;
      if (item.product?.productCode) {
        return inv.product?.productCode === item.product.productCode;
      }
      return inv.product?.name === item.product?.name;
    });
    this.restockSiblings.set(siblings.map(s => ({ item: s, quantity: 0 })));
    this.restockNewSizes.set([]);
    this.restockModalOpen.set(true);
  }

  closeRestockModal(): void {
    this.restockModalOpen.set(false);
    this.restockingItem.set(null);
    this.restockSiblings.set([]);
    this.restockNewSizes.set([]);
  }

  updateSiblingRestockQuantity(index: number, value: number): void {
    this.restockSiblings.update(rows => rows.map((r, i) => i === index ? { ...r, quantity: value } : r));
  }

  addRestockNewSizeRow(): void {
    this.restockNewSizes.update(rows => [...rows, { size: '', quantity: 0 }]);
  }

  removeRestockNewSizeRow(index: number): void {
    this.restockNewSizes.update(rows => rows.filter((_, i) => i !== index));
  }

  updateRestockNewSizeField(index: number, field: 'size' | 'quantity', value: string | number): void {
    this.restockNewSizes.update(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  hasAnyRestockQuantity(): boolean {
    return this.restockSiblings().some(r => r.quantity > 0) ||
      this.restockNewSizes().some(r => r.size?.trim() && r.quantity > 0);
  }

  updateRestockQuantity(value: number): void {
    this.restockForm.update(f => ({ ...f, quantity: value }));
  }

  updateRestockApplyPrice(value: boolean): void {
    this.restockForm.update(f => ({ ...f, applyPriceToBarcode: value }));
  }

  updateRestockReason(value: string): void {
    this.restockForm.update(f => ({ ...f, reason: value }));
  }

  saveRestock(): void {
    const item = this.restockingItem();
    const form = this.restockForm();
    const siblings = this.restockSiblings().filter(s => s.quantity > 0);
    const newSizes = this.restockNewSizes().filter(s => s.size?.trim() && Number(s.quantity) > 0);

    if (!item || !item.product) return;

    const mainQuantity = Number(form.quantity) || 0;
    if (mainQuantity <= 0 && siblings.length === 0 && newSizes.length === 0) {
      alert('Please enter a quantity greater than 0 for at least one size.');
      return;
    }

    // Build the full list of restock calls: main item (if quantity > 0) + any sibling sizes with quantity > 0
    const jobs: { productId: string; locationId: number; quantity: number; label: string }[] = [];
    if (mainQuantity > 0) {
      jobs.push({ productId: item.product.id, locationId: parseInt(item.locationId), quantity: mainQuantity, label: item.productName });
    }
    siblings.forEach(s => {
      if (s.item.product) {
        jobs.push({ productId: s.item.product.id, locationId: parseInt(s.item.locationId), quantity: s.quantity, label: `${s.item.productName} (${s.item.product.size})` });
      }
    });

    this.isRestocking.set(true);

    const results: string[] = [];

    // Any brand-new sizes (not previously registered at this location) get created
    // as new products+SKUs with initial stock, using the same Product Code / Category /
    // Color / pricing as the product being restocked.
    const createNewSize = (index: number, onDone: () => void): void => {
      if (index >= newSizes.length) {
        onDone();
        return;
      }

      const row = newSizes[index];
      const size = row.size.trim();
      const baseProduct = item.product!;
      const sku = this.buildSkuForNewSize(baseProduct.name, baseProduct.category, size, baseProduct.color);

      const product = {
        name: baseProduct.name,
        category: baseProduct.category,
        subcategory: baseProduct.subcategory || undefined,
        productType: baseProduct.productType || undefined,
        productCode: baseProduct.productCode || undefined,
        size: size,
        color: baseProduct.color,
        sku: sku,
        bagNumber: baseProduct.bagNumber,
        description: baseProduct.description || '',
        imageUrls: baseProduct.imageUrls || [],
        price: null,
        cost: null,
        wholesalePrice: null,
        wholesaleMinQuantity: null,
        stock: Number(row.quantity),
        minStock: item.minStock,
        locationId: null,
        location: null,
      };

      const pricing = {
        cost: item.cost,
        salePrice: item.salePrice,
        wholesalePrice: item.wholesalePrice || undefined,
        wholesaleMinQuantity: item.wholesaleMinQuantity || undefined,
      };

      this.appService.createProduct(product as any, parseInt(item.locationId), pricing, form.applyPriceToBarcode).subscribe({
        next: () => {
          results.push(`${row.quantity} added for new size "${size}"`);
          createNewSize(index + 1, onDone);
        },
        error: (error: any) => {
          this.isRestocking.set(false);
          alert(`Failed to create new size "${size}": ` + (error.error?.message || error.message) +
            (results.length > 0 ? `\n\nAlready completed: ${results.join(', ')}` : ''));
        }
      });
    };

    const runNext = (index: number): void => {
      if (index >= jobs.length) {
        this.isRestocking.set(false);
        this.closeRestockModal();
        alert(`Success! ${results.join(', ')}. You can now print these barcodes and move the stock through the transfer workflow.`);
        const locationId = this.selectedLocationId();
        if (locationId) {
          this.loadLocationInventory(parseInt(locationId));
        }
        return;
      }

      const job = jobs[index];
      this.appService.restockProduct(
        job.productId,
        job.locationId,
        job.quantity,
        form.applyPriceToBarcode,
        form.reason || undefined
      ).subscribe({
        next: () => {
          results.push(`${job.quantity} added for ${job.label}`);
          runNext(index + 1);
        },
        error: (error) => {
          this.isRestocking.set(false);
          alert(`Failed to restock "${job.label}": ` + (error.error?.message || error.message) +
            (results.length > 0 ? `\n\nAlready completed: ${results.join(', ')}` : ''));
        }
      });
    };

    createNewSize(0, () => runNext(0));
  }

  // Simple SKU generator for brand-new size variants created from the Restock modal
  // (mirrors the Add Product SKU pattern: Name(2) + Category(3) + Size + Color(3) + Random(4))
  private buildSkuForNewSize(name: string, category: string, size: string, color: string): string {
    const extractAlphaNum = (str: string) => (str || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const namePart = extractAlphaNum(name).substring(0, 2).padEnd(2, 'X');
    const categoryPart = extractAlphaNum(category).substring(0, 3).padEnd(3, 'X');
    const sizePart = extractAlphaNum(size);
    const colorPart = extractAlphaNum(color).substring(0, 3).padEnd(3, 'X');
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    return `${namePart}${categoryPart}${sizePart}${colorPart}${randomPart}`;
  }

  deleteInventoryItem(item: LocationInventoryItem): void {
    if (!this.canDeleteInventory()) return;

    const confirmed = confirm(
      `Remove "${item.productName}" (SKU: ${item.productSku}) from ${item.locationName}?\n\n` +
      `This will permanently delete ${item.quantity} unit(s) of unsold stock at this location. ` +
      `This action cannot be undone.`
    );
    if (!confirmed) return;

    this.isLoading.set(true);
    this.appService.deleteInventoryFromLocation(parseInt(item.locationId), item.productSku).subscribe({
      next: () => {
        const locationId = this.selectedLocationId();
        if (locationId === 'all') {
          this.loadAllInventory();
        } else if (locationId) {
          this.loadLocationInventory(parseInt(locationId));
        }
      },
      error: (error) => {
        alert('Failed to delete inventory: ' + (error.error?.error || error.error?.message || error.message));
        this.isLoading.set(false);
      }
    });
  }

  getStockStatusClass(item: LocationInventoryItem): string {
    if (!item.minStock) return 'bg-gray-100 text-gray-800';
    const percent = (item.quantity / item.minStock) * 100;
    if (percent <= 50) return 'bg-red-100 text-red-800';
    if (percent <= 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getStockStatusText(item: LocationInventoryItem): string {
    if (!item.minStock) return 'Normal';
    const percent = (item.quantity / item.minStock) * 100;
    if (percent <= 50) return 'Critical';
    if (percent <= 100) return 'Low';
    return 'Good';
  }

  getLocationBadgeClass(item: LocationInventoryItem): string {
    const locationId = item.locationId;
    const location = this.locations().find(l => l.id === locationId);
    
    if (!location) {
      return 'bg-gray-50 text-gray-700'; // Default
    }
    
    // Different colors for different location types
    switch (location.type.toLowerCase()) {
      case 'warehouse':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'store':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  }

  printBarcode(item: LocationInventoryItem): void {
    if (item.product?.id) {
      this.router.navigate(['/print-barcode'], { 
        queryParams: { productId: item.product.id } 
      });
    }
  }

  generateBarcodes(): void {
    // Navigate to print-barcode without query params for bulk mode
    this.router.navigate(['/print-barcode']);
  }

  navigateToAddProduct(): void {
    this.router.navigate(['/add-product']);
  }

  // Helper getters for template access
  get currentLocationName(): string {
    const locationId = this.selectedLocationId();
    if (locationId === 'all') {
      return 'All Locations';
    }
    const location = this.locations().find(l => l.id === locationId);
    return location?.name || 'My Location';
  }

  get statsData() {
    return this.stats();
  }

  get inventoryList() {
    return this.filteredInventory();
  }

  get locationsList() {
    return this.locations();
  }

  get currentSelectedLocationId() {
    return this.selectedLocationId();
  }

  set currentSelectedLocationId(value: string) {
    this.selectedLocationId.set(value);
  }

  get isLoadingData() {
    return this.isLoading();
  }

  get isModalOpen() {
    return this.editModalOpen();
  }

  get currentEditingItem() {
    return this.editingItem();
  }

  // Format currency in Indian numbering system
  formatIndianCurrency(value: number): string {
    if (value === 0) return '0.00';
    
    // Convert to string and split into integer and decimal parts
    const parts = value.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Format integer part with Indian numbering system (lakhs, crores)
    let formatted = '';
    const length = integerPart.length;
    
    if (length <= 3) {
      // Less than 1000
      formatted = integerPart;
    } else {
      // Split into groups: last 3 digits, then groups of 2
      const lastThree = integerPart.substring(length - 3);
      const remaining = integerPart.substring(0, length - 3);
      
      // Format remaining digits in groups of 2 from right to left
      const groups: string[] = [];
      for (let i = remaining.length; i > 0; i -= 2) {
        const start = Math.max(0, i - 2);
        groups.unshift(remaining.substring(start, i));
      }
      
      formatted = groups.join(',') + ',' + lastThree;
    }
    
    return formatted + '.' + decimalPart;
  }
  
  // View mode toggle
  toggleViewMode(mode: 'cards' | 'grouped'): void {
    this.viewMode.set(mode);
    // Clear expanded groups when switching views
    this.expandedGroups.clear();
  }
  
  // Toggle group expansion
  toggleGroup(groupKey: string): void {
    if (this.expandedGroups.has(groupKey)) {
      this.expandedGroups.delete(groupKey);
    } else {
      this.expandedGroups.add(groupKey);
    }
  }
  
  // Check if group is expanded
  isGroupExpanded(groupKey: string): boolean {
    return this.expandedGroups.has(groupKey);
  }
  
  // Get grouped inventory list
  get groupedInventoryList() {
    return this.groupedInventory();
  }
  
  // Clear all filters
  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('all');
    this.departmentFilter.set('all');
    this.productFilter.set('all');
    this.subcategoryFilter.set('all');
    this.productTypeFilter.set('');
    this.lowStockOnly.set(false);
  }
}
