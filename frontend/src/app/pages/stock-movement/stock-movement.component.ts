import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class StockMovementComponent implements OnInit {
  activeTab = signal<'movements' | 'adjustment' | 'transfer'>('movements');
  
  stockMovements = signal<StockMovement[]>([]);
  products = signal<Product[]>([]);
  locations = signal<Location[]>([]);
  currentUser = signal<User | null>(null);
  
  // Filters
  filterType = signal<string>('all');
  filterDateRange = signal<string>('all');
  searchQuery = signal<string>('');
  
  // Adjustment Form
  adjustmentForm = {
    productId: '',
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
  
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor(
    private appService: AppService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadCurrentUser();
    
    // Auto-set FROM location for warehouse users
    setTimeout(() => {
      if (this.isWarehouseUser() && this.getUserLocationId()) {
        this.transferForm.fromLocationId = this.getUserLocationId() || '';
      }
    }, 500);
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
    return this.currentUser()?.role === 'admin';
  }

  isWarehouseOrAdmin(): boolean {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'warehouse';
  }

  isWarehouseUser(): boolean {
    return this.currentUser()?.role === 'warehouse';
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
    
    // Filter by user's location for WAREHOUSE users (they can only see their location's movements)
    if (user?.role === 'warehouse' && user?.locationId) {
      movements = movements.filter(m => {
        // Check if movement's locationId matches user's location
        // OR if product's locationId matches user's location
        return m.locationId === user.locationId || 
               m.product?.locationId === user.locationId;
      });
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

  getSelectedProduct(): Product | undefined {
    const productId = this.activeTab() === 'adjustment' 
      ? this.adjustmentForm.productId 
      : this.transferForm.productId;
    return this.products().find(p => p.id === productId);
  }

  submitAdjustment() {
    this.clearMessages();
    
    if (!this.adjustmentForm.productId || !this.adjustmentForm.quantity || !this.adjustmentForm.reason) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    if (!this.isAdmin()) {
      this.errorMessage.set('Access denied. Only admins can make stock adjustments.');
      return;
    }
    
    this.isLoading.set(true);
    
    this.appService.adjustStock({
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
        !this.transferForm.reason) {
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

    const selectedProduct = this.getSelectedProduct();
    if (selectedProduct && this.transferForm.quantity > selectedProduct.stock) {
      this.errorMessage.set(`Insufficient stock. Available: ${selectedProduct.stock}`);
      return;
    }
    
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
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      reference: ''
    };
  }

  resetTransferForm() {
    this.transferForm = {
      productId: '',
      fromLocationId: '',
      toLocationId: '',
      quantity: 0,
      reason: '',
      reference: '',
      notes: ''
    };
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
}