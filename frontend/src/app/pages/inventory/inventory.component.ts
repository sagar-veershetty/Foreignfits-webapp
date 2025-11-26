import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Location } from '../../core/models';

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

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Filtered inventory
  filteredInventory = computed(() => {
    const inventory = this.locationInventory();
    const search = this.searchTerm().toLowerCase();
    const category = this.categoryFilter();
    const lowStock = this.lowStockOnly();

    return inventory.filter(item => {
      // Hide products with 0 quantity
      if (item.quantity === 0) {
        return false;
      }

      const matchesSearch = !search || 
        item.productName.toLowerCase().includes(search) ||
        item.productSku.toLowerCase().includes(search);

      const matchesCategory = category === 'all' || 
        (item.product && item.product.category === category);

      const matchesLowStock = !lowStock || 
        (item.minStock && item.quantity <= item.minStock);

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  });

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

  categories = ['SHIRTS', 'PANTS', 'JACKETS', 'DRESSES', 'SHOES', 'ACCESSORIES'];

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
          product: productsMap.get(inv.productSku)
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
          product: productsMap.get(inv.productSku)
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
}
