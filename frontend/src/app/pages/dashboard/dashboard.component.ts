import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AppService } from '../../core/services/app.service';
import { Product, Location, Sale, StockMovement } from '../../core/models';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  
  // Signals for reactive state
  locationInventory = signal<LocationInventoryItem[]>([]);
  locations = signal<Location[]>([]);
  selectedLocationId = signal<string>('');
  products = signal<Product[]>([]);
  sales = signal<Sale[]>([]);
  stockMovements = signal<StockMovement[]>([]);
  isLoading = signal<boolean>(false);

  // Computed stats
  stats = computed(() => {
    const inventory = this.locationInventory();
    const sales = this.sales();
    const movements = this.stockMovements();
    const isAllLocations = this.selectedLocationId() === '';

    // If showing all locations, aggregate by product SKU
    let aggregatedInventory = inventory;
    let totalProducts = inventory.length;
    
    if (isAllLocations) {
      // Group by product SKU and sum quantities
      const productMap = new Map<string, LocationInventoryItem>();
      inventory.forEach(item => {
        const existing = productMap.get(item.productSku);
        if (existing) {
          // Save the old quantity before updating
          const oldQty = existing.quantity;
          const newQty = item.quantity;
          const totalQty = oldQty + newQty;
          
          // Update quantity
          existing.quantity = totalQty;
          
          // Calculate weighted average for prices using old quantities
          existing.cost = ((existing.cost * oldQty) + (item.cost * newQty)) / totalQty;
          existing.salePrice = ((existing.salePrice * oldQty) + (item.salePrice * newQty)) / totalQty;
          
          // For minStock, use the sum across locations
          existing.minStock = (existing.minStock || 0) + (item.minStock || 0);
        } else {
          productMap.set(item.productSku, { ...item });
        }
      });
      aggregatedInventory = Array.from(productMap.values());
      totalProducts = aggregatedInventory.length; // Unique products across all locations
    }

    const totalStock = aggregatedInventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // For low stock count, use the original inventory (before aggregation)
    // This matches the Inventory page behavior where each location-product pair is counted
    const lowStockCount = inventory.filter(item => 
      item.minStock && item.quantity <= item.minStock
    ).length;
    
    const inventoryValue = aggregatedInventory.reduce((sum, item) => 
      sum + (item.quantity * item.cost), 0
    );

    // Recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(sale => 
      new Date(sale.createdAt) >= thirtyDaysAgo
    );
    const totalSales = recentSales.reduce((sum, sale) => sum + sale.total, 0);

    // Recent movements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMovements = movements.filter(movement => 
      new Date(movement.createdAt) >= sevenDaysAgo
    );

    return {
      totalProducts,
      totalStock,
      lowStockCount,
      inventoryValue,
      totalSales,
      recentSalesCount: recentSales.length,
      recentMovementsCount: recentMovements.length
    };
  });

  // Low stock items
  lowStockItems = computed(() => {
    const inventory = this.locationInventory();
    const isAllLocations = this.selectedLocationId() === '';
    
    let itemsToCheck = inventory;
    
    // If showing all locations, aggregate by product SKU
    if (isAllLocations) {
      const productMap = new Map<string, LocationInventoryItem>();
      inventory.forEach(item => {
        const existing = productMap.get(item.productSku);
        if (existing) {
          existing.quantity += item.quantity;
          existing.minStock = (existing.minStock || 0) + (item.minStock || 0);
        } else {
          productMap.set(item.productSku, { ...item });
        }
      });
      itemsToCheck = Array.from(productMap.values());
    }
    
    return itemsToCheck
      .filter(item => item.minStock && item.quantity <= item.minStock)
      .sort((a, b) => {
        const aPercent = a.minStock ? (a.quantity / a.minStock) : 1;
        const bPercent = b.minStock ? (b.quantity / b.minStock) : 1;
        return aPercent - bPercent;
      })
      .slice(0, 5);
  });

  // Top products by stock value
  topProductsByValue = computed(() => {
    const inventory = this.locationInventory();
    const isAllLocations = this.selectedLocationId() === '';
    
    let itemsToRank = inventory;
    
    // If showing all locations, aggregate by product SKU
    if (isAllLocations) {
      const productMap = new Map<string, LocationInventoryItem>();
      inventory.forEach(item => {
        const existing = productMap.get(item.productSku);
        if (existing) {
          const totalQty = existing.quantity + item.quantity;
          existing.quantity = totalQty;
          // Use weighted average for sale price
          existing.salePrice = ((existing.salePrice * existing.quantity) + (item.salePrice * item.quantity)) / totalQty;
        } else {
          productMap.set(item.productSku, { ...item });
        }
      });
      itemsToRank = Array.from(productMap.values());
    }
    
    return itemsToRank
      .map(item => ({
        ...item,
        totalValue: item.quantity * item.salePrice
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  });

  // Product catalog for customers - all products with stock > 0
  productCatalog = computed(() => {
    const inventory = this.locationInventory();
    const products = this.products();
    const isAllLocations = this.selectedLocationId() === '';
    
    let catalogItems = inventory;
    
    // If showing all locations, aggregate by product SKU
    if (isAllLocations) {
      const productMap = new Map<string, LocationInventoryItem>();
      inventory.forEach(item => {
        const existing = productMap.get(item.productSku);
        if (existing) {
          const oldQty = existing.quantity;
          const newQty = item.quantity;
          const totalQty = oldQty + newQty;
          existing.quantity = totalQty;
          // Use weighted average for sale price
          existing.salePrice = ((existing.salePrice * oldQty) + (item.salePrice * newQty)) / totalQty;
        } else {
          productMap.set(item.productSku, { ...item });
        }
      });
      catalogItems = Array.from(productMap.values());
    }
    
    // Filter to only show products with stock > 0 and enrich with product details
    return catalogItems
      .filter(item => item.quantity > 0)
      .map(item => {
        const product = products.find(p => p.sku === item.productSku);
        return {
          ...item,
          product: product,
          category: product?.category || 'general',
          size: product?.size || '',
          color: product?.color || ''
        };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));
  });

  // Search and filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  // Filtered product catalog based on search and category
  filteredProductCatalog = computed(() => {
    const catalog = this.productCatalog();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    
    return catalog.filter(item => {
      // Category filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }
      
      // Search filter
      if (query) {
        const searchIn = `${item.productName} ${item.productSku} ${item.size} ${item.color}`.toLowerCase();
        return searchIn.includes(query);
      }
      
      return true;
    });
  });

  // Get unique categories from products
  categories = computed(() => {
    const products = this.products();
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  });

  constructor(
    public authService: AuthService,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupLocationAutoSelect();
    
    // Listen to navigation events and reload data
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/dashboard')) {
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

    this.appService.loadInitialData().subscribe({
      next: () => {
        let subscription: any;
        subscription = this.appService.appState$.subscribe(state => {
          this.products.set(state.products || []);
          this.sales.set(state.sales || []);
          this.stockMovements.set(state.stockMovements || []);
          this.locations.set(state.locations || []);

          const currentUser = this.authService.getCurrentUser();
          const isAdmin = this.authService.hasCrossLocationAccess();
          const locs = state.locations || [];

          if (isAdmin) {
            const locationId = this.selectedLocationId();
            if (locationId) {
              this.loadLocationInventory(parseInt(locationId));
            } else if (locs.length > 0) {
              // Default to "All Locations" for admin
              this.selectedLocationId.set('');
              this.loadAllLocationInventory();
            } else {
              this.isLoading.set(false);
            }
          } else if (currentUser?.locationId) {
            this.selectedLocationId.set(currentUser.locationId);
            this.loadLocationInventory(parseInt(currentUser.locationId));
          } else {
            this.isLoading.set(false);
          }

          if (subscription) {
            subscription.unsubscribe();
          }
        });
      },
      error: (error) => {
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
          cost: inv.cost || 0,
          salePrice: inv.salePrice || 0,
          wholesalePrice: inv.wholesalePrice || null,
          wholesaleMinQuantity: inv.wholesaleMinQuantity || null,
          product: productsMap.get(inv.productSku)
        }));
        
        this.locationInventory.set(items);
        this.isLoading.set(false);
      },
      error: (error) => {
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
        // Admin: Default to "All Locations" if not already selected
        if (!this.selectedLocationId()) {
          this.selectedLocationId.set('');
          this.loadAllLocationInventory();
        }
      }
    }, 500);
  }

  onLocationChange(): void {
    const locationId = this.selectedLocationId();
    if (locationId === '' || locationId === null) {
      // "All Locations" selected - load all inventory
      this.loadAllLocationInventory();
    } else if (locationId) {
      this.loadLocationInventory(parseInt(locationId));
    }
  }

  loadAllLocationInventory(): void {
    this.isLoading.set(true);
    
    this.appService.getAllLocationInventory().subscribe({
      next: (inventory) => {
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
      error: (error) => {
        this.locationInventory.set([]);
        this.isLoading.set(false);
      }
    });
  }

  canSwitchLocation(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  getStockStatusClass(item: LocationInventoryItem): string {
    if (!item.minStock) return 'bg-gray-100 text-gray-800';
    const percent = (item.quantity / item.minStock) * 100;
    if (percent <= 50) return 'bg-red-100 text-red-800';
    if (percent <= 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navigateToLowStock(): void {
    // Navigate to inventory page with low stock filter enabled
    this.router.navigate(['/inventory'], { 
      queryParams: { lowStock: 'true' } 
    });
  }

  // Helper getters for template access (avoid calling signals directly in complex expressions)
  get currentLocationName(): string {
    const locationId = this.selectedLocationId();
    if (!locationId || locationId === '') {
      return 'All Locations';
    }
    const location = this.locations().find(l => l.id === locationId);
    return location?.name || 'My Location';
  }

  get statsData() {
    const stats = this.stats();
    return stats;
  }

  get lowStockItemsList() {
    return this.lowStockItems();
  }

  get topProductsList() {
    return this.topProductsByValue();
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

  get catalogProducts() {
    return this.filteredProductCatalog();
  }

  get availableCategories() {
    return this.categories();
  }

  get currentSearchQuery() {
    return this.searchQuery();
  }

  set currentSearchQuery(value: string) {
    this.searchQuery.set(value);
  }

  get currentSelectedCategory() {
    return this.selectedCategory();
  }

  set currentSelectedCategory(value: string) {
    this.selectedCategory.set(value);
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
