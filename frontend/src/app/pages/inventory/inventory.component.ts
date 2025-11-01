import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
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
    const totalValue = inventory.reduce((sum, item) => 
      sum + (item.quantity * item.salePrice), 0
    );

    return { totalItems, totalStock, lowStockCount, totalValue };
  });

  categories = ['SHIRTS', 'PANTS', 'JACKETS', 'DRESSES', 'SHOES', 'ACCESSORIES'];

  constructor(
    public authService: AuthService,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
        const subscription = this.appService.appState$.subscribe(state => {
          this.products.set(state.products || []);
          this.locations.set(state.locations || []);

          // After state is loaded, determine which location inventory to load
          const currentUser = this.authService.getCurrentUser();
          const isAdmin = this.authService.hasCrossLocationAccess();
          const locs = state.locations || [];

          if (isAdmin) {
            // Admin: Load selected location or first available
            const locationId = this.selectedLocationId();
            if (locationId) {
              this.loadLocationInventory(parseInt(locationId));
            } else if (locs.length > 0) {
              this.selectedLocationId.set(locs[0].id);
              this.loadLocationInventory(parseInt(locs[0].id));
            } else {
              this.isLoading.set(false);
            }
          } else if (currentUser?.locationId) {
            // Regular user: Load only their location
            this.selectedLocationId.set(currentUser.locationId);
            this.loadLocationInventory(parseInt(currentUser.locationId));
          } else {
            this.isLoading.set(false);
          }

          // Unsubscribe after first load
          subscription.unsubscribe();
        });
      },
      error: (error) => {
        console.error('Failed to load initial data:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadLocationInventory(locationId: number): void {
    this.isLoading.set(true);
    console.log('Loading location inventory for location:', locationId);
    this.appService.getLocationInventory(locationId).subscribe({
      next: (inventory) => {
        console.log('Received inventory data:', inventory);
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
        console.log('Mapped inventory items:', items);
        console.log('Stats:', this.stats());
        this.locationInventory.set(items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load location inventory:', error);
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
        console.error('Failed to update inventory:', error);
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
}
