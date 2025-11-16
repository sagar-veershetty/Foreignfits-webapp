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

    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter(item => 
      item.minStock && item.quantity <= item.minStock
    ).length;
    
    const inventoryValue = inventory.reduce((sum, item) => 
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
    return inventory
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
    return inventory
      .map(item => ({
        ...item,
        totalValue: item.quantity * item.salePrice
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
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

    // Load basic data from app state
    this.appService.appState$.subscribe(state => {
      this.products.set(state.products || []);
      this.sales.set(state.sales || []);
      this.stockMovements.set(state.stockMovements || []);
      this.locations.set(state.locations || []);
    });

    // Load location inventory based on user role
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = this.authService.hasCrossLocationAccess();

    if (isAdmin) {
      // Admin: Load all locations inventory or selected location
      const locationId = this.selectedLocationId();
      if (locationId) {
        this.loadLocationInventory(parseInt(locationId));
      } else {
        // Load first location by default or all if needed
        const locs = this.locations();
        if (locs.length > 0) {
          this.selectedLocationId.set(locs[0].id);
          this.loadLocationInventory(parseInt(locs[0].id));
        }
      }
    } else if (currentUser?.locationId) {
      // Regular user: Load only their location
      this.selectedLocationId.set(currentUser.locationId);
      this.loadLocationInventory(parseInt(currentUser.locationId));
    }

    this.isLoading.set(false);
  }

  loadLocationInventory(locationId: number): void {
    this.appService.getLocationInventory(locationId).subscribe({
      next: (inventory) => {
        // Map products to inventory items
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
      },
      error: (error) => {
        console.error('Failed to load location inventory:', error);
        this.locationInventory.set([]);
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
        const locs = this.locations();
        if (locs.length > 0 && !this.selectedLocationId()) {
          this.selectedLocationId.set(locs[0].id);
          this.loadLocationInventory(parseInt(locs[0].id));
        }
      }
    }, 500);
  }

  onLocationChange(): void {
    const locationId = this.selectedLocationId();
    if (locationId) {
      this.loadLocationInventory(parseInt(locationId));
    }
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

  // Helper getters for template access (avoid calling signals directly in complex expressions)
  get currentLocationName(): string {
    const locationId = this.selectedLocationId();
    const location = this.locations().find(l => l.id === locationId);
    return location?.name || 'My Location';
  }

  get statsData() {
    return this.stats();
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
}
