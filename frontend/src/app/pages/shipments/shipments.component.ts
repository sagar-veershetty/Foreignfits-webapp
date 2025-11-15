import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../core/services/shipment.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  ShipmentResponse, 
  ShipmentStatus, 
  PaymentStatus,
  PaymentRequest 
} from '../../core/models';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shipments.component.html',
  styleUrl: './shipments.component.scss'
})
export class ShipmentsComponent implements OnInit {
  private shipmentService = inject(ShipmentService);
  private authService = inject(AuthService);

  // Signals
  shipments = signal<ShipmentResponse[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Filter signals
  statusFilter = signal<ShipmentStatus | null>(null);
  paymentFilter = signal<PaymentStatus | null>(null);
  brandedFilter = signal<boolean | null>(null);
  
  // Modal signals
  showPaymentModal = signal<boolean>(false);
  selectedShipment = signal<ShipmentResponse | null>(null);
  paymentAmount = signal<number>(0);
  paymentRemarks = signal<string>('');
  
  // User role checks
  currentUser = computed(() => this.authService.getCurrentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isChinaAgent = computed(() => this.currentUser()?.permissions?.includes('create:shipment') ?? false);
  isMumbaiAgent = computed(() => this.currentUser()?.permissions?.includes('receive:shipment') ?? false);
  canViewPayment = computed(() => this.authService.hasPermission('view:payment'));
  
  // Status and payment status enums for dropdowns
  shipmentStatuses: ShipmentStatus[] = [
    'CREATED', 'IN_TRANSIT', 'ARRIVED_MUMBAI', 'IN_CUSTOM_CLEARANCE', 
    'DELIVERED_TO_WAREHOUSE', 'RECEIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'
  ];
  
  paymentStatuses: PaymentStatus[] = ['UNPAID', 'PARTIALLY_PAID', 'PAID'];

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.loading.set(true);
    this.error.set(null);
    
    const filters = {
      status: this.statusFilter() ?? undefined,
      paymentStatus: this.paymentFilter() ?? undefined,
      isBranded: this.brandedFilter() ?? undefined
    };
    
    const observable = Object.values(filters).some(v => v !== undefined)
      ? this.shipmentService.searchShipments(filters)
      : this.shipmentService.getAllShipments();
    
    observable.subscribe({
      next: (data) => {
        this.shipments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load shipments: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value ? value as ShipmentStatus : null);
    this.loadShipments();
  }

  onPaymentFilterChange(value: string) {
    this.paymentFilter.set(value ? value as PaymentStatus : null);
    this.loadShipments();
  }

  onBrandedFilterChange(value: string) {
    if (value === '') {
      this.brandedFilter.set(null);
    } else {
      this.brandedFilter.set(value === 'true');
    }
    this.loadShipments();
  }

  clearFilters() {
    this.statusFilter.set(null);
    this.paymentFilter.set(null);
    this.brandedFilter.set(null);
    this.loadShipments();
  }

  getStatusColor(status: ShipmentStatus): string {
    return this.shipmentService.getStatusColor(status);
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    return this.shipmentService.getPaymentStatusColor(status);
  }

  formatStatus(status: ShipmentStatus): string {
    return this.shipmentService.formatStatus(status);
  }

  formatPaymentStatus(status: PaymentStatus): string {
    return this.shipmentService.formatPaymentStatus(status);
  }

  canUpdateStatus(shipment: ShipmentResponse): boolean {
    if (this.isAdmin()) return true;
    if (this.isChinaAgent() && shipment.createdByAgent === this.currentUser()?.email) {
      return ['CREATED', 'IN_TRANSIT', 'ARRIVED_MUMBAI', 'IN_CUSTOM_CLEARANCE', 'DELIVERED_TO_WAREHOUSE'].includes(shipment.status);
    }
    if (this.isMumbaiAgent()) {
      return ['DELIVERED_TO_WAREHOUSE', 'RECEIVED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(shipment.status);
    }
    return false;
  }

  getNextStatuses(currentStatus: ShipmentStatus): ShipmentStatus[] {
    const statusFlow: { [key in ShipmentStatus]: ShipmentStatus[] } = {
      'CREATED': ['IN_TRANSIT'],
      'IN_TRANSIT': ['ARRIVED_MUMBAI'],
      'ARRIVED_MUMBAI': ['IN_CUSTOM_CLEARANCE'],
      'IN_CUSTOM_CLEARANCE': ['DELIVERED_TO_WAREHOUSE'],
      'DELIVERED_TO_WAREHOUSE': ['RECEIVED'],
      'RECEIVED': ['OUT_FOR_DELIVERY'],
      'OUT_FOR_DELIVERY': ['DELIVERED'],
      'DELIVERED': ['COMPLETED'],
      'COMPLETED': []
    };
    
    if (this.isAdmin()) {
      // Admin can move to any next status or completed
      return [...statusFlow[currentStatus], 'COMPLETED'];
    }
    
    return statusFlow[currentStatus];
  }

  updateStatus(shipment: ShipmentResponse, newStatus: ShipmentStatus) {
    if (confirm(`Update shipment status to ${this.formatStatus(newStatus)}?`)) {
      this.loading.set(true);
      this.shipmentService.updateShipmentStatus(shipment.id, newStatus).subscribe({
        next: (updated) => {
          // Update the shipment in the list
          const shipmentList = this.shipments();
          const index = shipmentList.findIndex(s => s.id === updated.id);
          if (index !== -1) {
            shipmentList[index] = updated;
            this.shipments.set([...shipmentList]);
          }
          this.loading.set(false);
          alert('Status updated successfully!');
        },
        error: (err) => {
          this.error.set('Failed to update status: ' + err.error?.message || err.message);
          this.loading.set(false);
          alert('Failed to update status: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  openPaymentModal(shipment: ShipmentResponse) {
    this.selectedShipment.set(shipment);
    this.paymentAmount.set(0);
    this.paymentRemarks.set('');
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedShipment.set(null);
    this.paymentAmount.set(0);
    this.paymentRemarks.set('');
  }

  submitPayment() {
    const shipment = this.selectedShipment();
    if (!shipment) return;

    const amount = this.paymentAmount();
    if (amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (amount > shipment.pendingAmount) {
      alert('Payment amount cannot exceed pending amount');
      return;
    }

    const payment: PaymentRequest = {
      amount: amount,
      remarks: this.paymentRemarks() || undefined
    };

    this.loading.set(true);
    this.shipmentService.addPayment(shipment.id, payment).subscribe({
      next: (updated) => {
        // Update the shipment in the list
        const shipmentList = this.shipments();
        const index = shipmentList.findIndex(s => s.id === updated.id);
        if (index !== -1) {
          shipmentList[index] = updated;
          this.shipments.set([...shipmentList]);
        }
        this.loading.set(false);
        this.closePaymentModal();
        alert('Payment added successfully!');
      },
      error: (err) => {
        this.error.set('Failed to add payment: ' + err.error?.message || err.message);
        this.loading.set(false);
        alert('Failed to add payment: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteShipment(shipment: ShipmentResponse) {
    if (!confirm(`Are you sure you want to delete shipment ${shipment.shippingId}?`)) {
      return;
    }

    this.loading.set(true);
    this.shipmentService.deleteShipment(shipment.id).subscribe({
      next: () => {
        // Remove from list
        const shipmentList = this.shipments().filter(s => s.id !== shipment.id);
        this.shipments.set(shipmentList);
        this.loading.set(false);
        alert('Shipment deleted successfully!');
      },
      error: (err) => {
        this.error.set('Failed to delete shipment: ' + err.error?.message || err.message);
        this.loading.set(false);
        alert('Failed to delete shipment: ' + (err.error?.message || err.message));
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}
