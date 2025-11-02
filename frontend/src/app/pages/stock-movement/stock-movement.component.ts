import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { take, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { StockMovement, Product, Location, User } from '../../core/models';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-movement.component.html',
  styleUrls: ['./stock-movement.component.scss']
})
export class StockMovementComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  activeTab = signal<'movements' | 'adjustment' | 'transfer'>('movements');
  
  stockMovements = signal<StockMovement[]>([]);
  pendingMovements = signal<StockMovement[]>([]);
  products = signal<Product[]>([]);
  locations = signal<Location[]>([]);
  currentUser = signal<User | null>(null);
  
  // Location inventory for filtering products
  transferFromLocationInventory = signal<any[]>([]);
  adjustmentLocationInventory = signal<any[]>([]);
  
  // Filters
  filterType = signal<string>('all');
  filterDateRange = signal<string>('all');
  searchQuery = signal<string>('');
  
  // Adjustment Form
  adjustmentForm = {
    productId: '',
    locationId: '', // Add location for adjustment
    adjustmentType: 'increase' as 'increase' | 'decrease' | 'set',
    quantity: 0,
    reason: '',
    reference: ''
  };
  
  // Transfer Form
  transferForm = {
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: 0,
    reason: '',
    reference: '',
    notes: ''
  };
  
  // Signal to track fromLocationId changes for reactive computed
  transferFromLocationId = signal<string>('');
  adjustmentLocationId = signal<string>('');
  
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor(
    private appService: AppService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadCurrentUser();
    
    // Ensure initial data is loaded (especially important after page refresh)
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe({
          error: (e) => console.error('Stock Movement: initial data load failed', e)
        });
      }
    });
    
    // Listen to navigation events and reload data when returning to this component
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/stock-movement')) {
          console.log('Stock Movement: Refreshing data on navigation');
          // Force reload from backend to get fresh data
          this.appService.loadInitialData().subscribe({
            next: () => {
              console.log('Stock Movement: Data refreshed successfully');
              this.loadData();
            },
            error: (e) => {
              console.error('Stock Movement: Failed to refresh data', e);
              this.loadData(); // Still load from cache if refresh fails
            }
          });
        }
      });
    
    // Auto-set FROM location for warehouse users
    setTimeout(() => {
      if (this.isWarehouseUser() && this.getUserLocationId()) {
        const locationId = this.getUserLocationId() || '';
        this.transferForm.fromLocationId = locationId;
        this.transferFromLocationId.set(locationId); // Update signal to trigger computed
        this.loadTransferLocationInventory(parseInt(locationId));
      }
      // Auto-set FROM location for sales users (can also transfer stock)
      if (this.isSalesUser() && this.getUserLocationId()) {
        const locationId = this.getUserLocationId() || '';
        this.transferForm.fromLocationId = locationId;
        this.transferFromLocationId.set(locationId); // Update signal to trigger computed
        this.loadTransferLocationInventory(parseInt(locationId));
      }
      // Auto-set FROM location to SUPPLIER for admin users
      if (this.isAdmin()) {
        this.transferForm.fromLocationId = '1'; // SUPPLIER location ID
        this.transferFromLocationId.set('1'); // Update signal to trigger computed
        this.loadTransferLocationInventory(1);
        
        // Auto-set adjustment location to admin's location
        const adminLocationId = this.getUserLocationId() || '1';
        this.adjustmentForm.locationId = adminLocationId;
        this.adjustmentLocationId.set(adminLocationId);
        this.loadAdjustmentLocationInventory(parseInt(adminLocationId));
      }
    }, 500);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadData() {
    this.isLoading.set(true);
    this.appService.appState$.subscribe(state => {
      this.stockMovements.set(state.stockMovements || []);
      this.products.set(state.products || []);
      this.locations.set(state.locations || []);
      this.isLoading.set(state.isLoading);
    });
  }

  loadCurrentUser() {
    this.authService.authState$.subscribe(state => {
      this.currentUser.set(state.user);
    });
  }

  isAdmin(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  isWarehouseOrAdmin(): boolean {
    return this.authService.canCreateStockMovement();
  }

  isWarehouseUser(): boolean {
    return this.currentUser()?.role === 'warehouse';
  }

  isSalesUser(): boolean {
    return this.currentUser()?.role === 'sales';
  }

  getUserLocationId(): string | undefined {
    return this.currentUser()?.locationId;
  }

  getUserLocationName(): string | undefined {
    return this.currentUser()?.locationName;
  }

  filteredMovements = computed(() => {
    let movements = this.stockMovements();
    const user = this.currentUser();
    
    // Show ALL movements (pending, approved, rejected) in Movement History
    // Status badge will indicate whether it's pending/approved/rejected
    
    // Filter by user's location based on role
    if (user?.locationId && !this.isAdmin()) {
      if (user.role === 'warehouse') {
        // WAREHOUSE users: See movements that came TO or went OUT FROM their warehouse
        // All movements now have fromLocation and toLocation via transfer
        movements = movements.filter(m => {
          return m.fromLocation?.id === user.locationId || 
                 m.toLocation?.id === user.locationId ||
                 m.product?.locationId === user.locationId;
        });
      } else if (user.role === 'sales') {
        // SALES users: See movements related to their store
        movements = movements.filter(m => {
          // Check fromLocation or toLocation
          return m.fromLocation?.id === user.locationId || 
                 m.toLocation?.id === user.locationId;
        });
      }
    }
    
    // Filter by type
    if (this.filterType() !== 'all') {
      movements = movements.filter(m => m.type === this.filterType());
    }
    
    // Filter by date range
    if (this.filterDateRange() !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (this.filterDateRange()) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      movements = movements.filter(m => new Date(m.createdAt) >= cutoffDate);
    }
    
    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      movements = movements.filter(m => 
        m.product?.name.toLowerCase().includes(query) ||
        m.product?.sku.toLowerCase().includes(query) ||
        m.reason?.toLowerCase().includes(query)
      );
    }
    
    return movements.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  setActiveTab(tab: 'movements' | 'adjustment' | 'transfer') {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  // Get available destination locations (excluding only the source location)
  getAvailableDestinationLocations = computed(() => {
    const fromLocationId = this.transferFromLocationId(); // Use signal instead of form property
    const allLocations = this.locations();
    
    if (!fromLocationId) {
      return allLocations;
    }
    
    // For ADMIN: Only show WAREHOUSES (exclude SUPPLIER and stores) as destinations
    if (this.isAdmin()) {
      return allLocations.filter(loc => 
        loc.id.toString() !== fromLocationId && 
        loc.type.toLowerCase() === 'warehouse' && 
        loc.name.toLowerCase() !== 'supplier'
      );
    }
    
    // For WAREHOUSE users: Filter out ONLY the source location (can transfer to Supplier, other warehouses, stores)
    return allLocations.filter(loc => loc.id.toString() !== fromLocationId);
  });

  // Handle from location change - clear to location if it's the same
  onFromLocationChange() {
    // Update the signal to trigger computed re-evaluation
    this.transferFromLocationId.set(this.transferForm.fromLocationId);
    
    if (this.transferForm.fromLocationId === this.transferForm.toLocationId) {
      this.transferForm.toLocationId = '';
    }
    
    // Load inventory for the selected FROM location
    if (this.transferForm.fromLocationId) {
      this.loadTransferLocationInventory(parseInt(this.transferForm.fromLocationId));
    } else {
      this.transferFromLocationInventory.set([]);
    }
    
    // Clear selected product as it may not be available at new location
    this.transferForm.productId = '';
  }

  // Handle adjustment location change
  onAdjustmentLocationChange() {
    this.adjustmentLocationId.set(this.adjustmentForm.locationId);
    
    // Load inventory for the selected location
    if (this.adjustmentForm.locationId) {
      this.loadAdjustmentLocationInventory(parseInt(this.adjustmentForm.locationId));
    } else {
      this.adjustmentLocationInventory.set([]);
    }
    
    // Clear selected product as it may not be available at new location
    this.adjustmentForm.productId = '';
  }

  // Load inventory for transfer FROM location
  loadTransferLocationInventory(locationId: number) {
    this.appService.getLocationInventory(locationId).subscribe({
      next: (inventory) => {
        this.transferFromLocationInventory.set(inventory);
      },
      error: (error) => {
        console.error('Failed to load transfer location inventory:', error);
        this.transferFromLocationInventory.set([]);
      }
    });
  }

  // Load inventory for adjustment location
  loadAdjustmentLocationInventory(locationId: number) {
    this.appService.getLocationInventory(locationId).subscribe({
      next: (inventory) => {
        this.adjustmentLocationInventory.set(inventory);
      },
      error: (error) => {
        console.error('Failed to load adjustment location inventory:', error);
        this.adjustmentLocationInventory.set([]);
      }
    });
  }

  getSelectedProduct(): Product | undefined {
    const productId = this.activeTab() === 'adjustment' 
      ? this.adjustmentForm.productId 
      : this.transferForm.productId;
    return this.products().find(p => p.id === productId);
  }

  // Get products available at the selected FROM location for transfer
  getTransferableProducts(): Product[] {
    const inventory = this.transferFromLocationInventory();
    const allProducts = this.products();
    
    if (!this.transferForm.fromLocationId || inventory.length === 0) {
      return [];
    }
    
    // Only show products that have inventory at the FROM location
    const availableSkus = new Set(inventory.map((inv: any) => inv.productSku));
    return allProducts.filter(p => availableSkus.has(p.sku));
  }

  // Get products available at the selected location for adjustment
  getAdjustableProducts(): Product[] {
    const inventory = this.adjustmentLocationInventory();
    const allProducts = this.products();
    
    if (!this.adjustmentForm.locationId || inventory.length === 0) {
      return [];
    }
    
    // Only show products that have inventory at the selected location
    const availableSkus = new Set(inventory.map((inv: any) => inv.productSku));
    return allProducts.filter(p => availableSkus.has(p.sku));
  }

  submitAdjustment() {
    this.clearMessages();
    
    if (!this.adjustmentForm.locationId || !this.adjustmentForm.productId || !this.adjustmentForm.quantity || !this.adjustmentForm.reason) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    if (!this.isAdmin()) {
      this.errorMessage.set('Access denied. Only admins can make stock adjustments.');
      return;
    }
    
    this.isLoading.set(true);
    
    this.appService.adjustStock({
      locationId: this.adjustmentForm.locationId,
      productId: this.adjustmentForm.productId,
      adjustmentType: this.adjustmentForm.adjustmentType,
      quantity: this.adjustmentForm.quantity,
      reason: this.adjustmentForm.reason,
      reference: this.adjustmentForm.reference
    }).subscribe({
      next: () => {
        this.successMessage.set('Stock adjustment recorded successfully!');
        this.resetAdjustmentForm();
        this.isLoading.set(false);
        
        setTimeout(() => {
          this.clearMessages();
          this.setActiveTab('movements');
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to record stock adjustment. Please try again.');
        console.error('Stock adjustment error:', error);
      }
    });
  }

  submitTransfer() {
    this.clearMessages();
    
    if (!this.transferForm.productId || 
        !this.transferForm.fromLocationId || 
        !this.transferForm.toLocationId || 
        !this.transferForm.quantity || 
        this.transferForm.quantity <= 0 ||
        !this.transferForm.reason || 
        !this.transferForm.reason.trim()) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }
    
    if (this.transferForm.fromLocationId === this.transferForm.toLocationId) {
      this.errorMessage.set('Source and destination locations must be different');
      return;
    }

    if (!this.isWarehouseOrAdmin()) {
      this.errorMessage.set('Access denied. Only warehouse and admin users can create stock transfers.');
      return;
    }

    // NOTE: Product.stock is deprecated (backend returns null)
    // Stock validation will be done by backend via LocationInventory
    // Remove client-side stock check
    
    this.isLoading.set(true);
    
    this.appService.createStockTransfer({
      productId: this.transferForm.productId,
      fromLocationId: this.transferForm.fromLocationId,
      toLocationId: this.transferForm.toLocationId,
      quantity: this.transferForm.quantity,
      reason: this.transferForm.reason,
      reference: this.transferForm.reference,
      notes: this.transferForm.notes
    }).subscribe({
      next: () => {
        this.successMessage.set('Stock transfer request created successfully!');
        this.resetTransferForm();
        this.isLoading.set(false);
        
        setTimeout(() => {
          this.clearMessages();
          this.setActiveTab('movements');
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to create stock transfer. Please try again.');
        console.error('Stock transfer error:', error);
      }
    });
  }

  resetAdjustmentForm() {
    this.adjustmentForm = {
      productId: '',
      locationId: '',
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      reference: ''
    };
  }

  resetTransferForm() {
    const preserveFromLocation = this.isWarehouseUser() ? this.transferForm.fromLocationId : '';
    this.transferForm = {
      productId: '',
      fromLocationId: preserveFromLocation,
      toLocationId: '',
      quantity: 0,
      reason: '',
      reference: '',
      notes: ''
    };
    if (preserveFromLocation) {
      this.transferFromLocationId.set(preserveFromLocation);
    }
  }

  clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  getMovementTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'adjustment': 'Adjustment',
      'sale': 'Sale',
      'return': 'Return',
      'damage': 'Damage',
      'transfer_out': 'Transfer Out',
      'transfer_in': 'Transfer In',
      'restock': 'Restock'
    };
    return labels[type] || type;
  }

  getMovementTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'adjustment': 'bg-blue-100 text-blue-800',
      'sale': 'bg-green-100 text-green-800',
      'return': 'bg-yellow-100 text-yellow-800',
      'damage': 'bg-red-100 text-red-800',
      'transfer_out': 'bg-purple-100 text-purple-800',
      'transfer_in': 'bg-indigo-100 text-indigo-800',
      'restock': 'bg-teal-100 text-teal-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  // Approval Methods
  loadPendingMovements(): void {
    this.appService.getPendingStockMovements().subscribe({
      next: (movements: StockMovement[]) => {
        this.pendingMovements.set(movements);
      },
      error: (err: any) => {
        console.error('Error loading pending movements:', err);
        this.errorMessage.set('Failed to load pending movements');
      }
    });
  }

  canApproveMovements(): boolean {
    return this.authService.canApproveStockMovements();
  }

  // Filter pending movements based on user role
  getFilteredPendingMovements(): StockMovement[] {
    const user = this.currentUser();
    const allPending = this.pendingMovements();
    
    // Admin can see ALL pending movements
    if (this.isAdmin()) {
      return allPending;
    }
    
    // Warehouse and Sales users only see pending movements for THEIR location
    // Important: They should only approve movements ARRIVING AT their location
    // (not movements being sent FROM their location)
    if (user?.locationId) {
      return allPending.filter(movement => {
        // Only show movements where this location is the DESTINATION (toLocation)
        // Check both toLocation and fromLocation to show all relevant movements
        return movement.toLocation?.id === user.locationId || 
               movement.fromLocation?.id === user.locationId;
      });
    }
    
    return [];
  }

  approveMovement(movementId: string): void {
    if (confirm('Are you sure you want to approve this stock movement?')) {
      this.appService.approveStockMovement(movementId).subscribe({
        next: () => {
          this.successMessage.set('Stock movement approved successfully');
          this.loadPendingMovements();
          this.loadData();
        },
        error: (err: any) => {
          console.error('Error approving movement:', err);
          this.errorMessage.set('Failed to approve stock movement');
        }
      });
    }
  }

  rejectMovement(movementId: string): void {
    const reason = prompt('Please enter rejection reason:');
    if (reason && reason.trim()) {
      this.appService.rejectStockMovement(movementId, reason.trim()).subscribe({
        next: () => {
          this.successMessage.set('Stock movement rejected');
          this.loadPendingMovements();
        },
        error: (err: any) => {
          console.error('Error rejecting movement:', err);
          this.errorMessage.set('Failed to reject stock movement');
        }
      });
    }
  }

  getApprovalStatusBadge(movement: StockMovement): string {
    if (movement.status === 'PENDING') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return movement.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getApprovalStatusLabel(movement: StockMovement): string {
    if (movement.status === 'PENDING') {
      return 'Pending';
    }
    return movement.status === 'APPROVED' ? 'Approved' : 'Rejected';
  }
}