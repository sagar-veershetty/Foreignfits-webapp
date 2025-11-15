import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../core/services/shipment.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  ShipmentRequest, 
  ShipmentResponse, 
  ShipmentStatus,
  PaymentRequest 
} from '../../core/models';

@Component({
  selector: 'app-shipment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shipment-form.component.html',
  styleUrls: ['./shipment-form.component.scss']
})
export class ShipmentFormComponent implements OnInit {
  private shipmentService = inject(ShipmentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Component state
  shipmentId = signal<string | null>(null);
  isEditMode = computed(() => !!this.shipmentId());
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Current shipment data (for edit mode)
  currentShipment = signal<ShipmentResponse | null>(null);

  // User role checks
  currentUser = computed(() => this.authService.getCurrentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isChinaAgent = computed(() => this.currentUser()?.permissions?.includes('create:shipment') ?? false);
  isMumbaiAgent = computed(() => this.currentUser()?.permissions?.includes('receive:shipment') ?? false);
  canViewPayment = computed(() => this.authService.hasPermission('view:payment'));

  // Form fields as signals
  shippingId = signal('');
  totalCost = signal<number>(0);
  totalPackages = signal<number>(0);
  totalCbm = signal<number>(0);
  isBranded = signal(false);
  perCbmRate = signal<number>(0);
  etd = signal('');
  eta = signal('');
  trackingUrl = signal('');
  remarks = signal('');
  originLocation = signal('China');
  destinationLocation = signal('Mumbai, India');
  localLogisticProvider = signal('');
  localTrackingNumber = signal('');
  indiaWarehouseAddress = signal('');
  indiaContactPhone = signal('');
  indiaContactEmail = signal('');
  currentStatus = signal<ShipmentStatus | ''>('');

  // Available status options
  shipmentStatuses: ShipmentStatus[] = [
    'CREATED', 'IN_TRANSIT', 'ARRIVED_MUMBAI', 'IN_CUSTOM_CLEARANCE',
    'DELIVERED_TO_WAREHOUSE', 'RECEIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'
  ];

  // Validation
  formErrors = signal<{ [key: string]: string }>({});

  ngOnInit() {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.shipmentId.set(id);
      this.loadShipment(id);
    }

    // Auto-generate shipping ID if creating new
    if (!id) {
      this.generateShippingId();
    }
  }

  /**
   * Load shipment data for editing
   */
  loadShipment(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.shipmentService.getShipmentById(id).subscribe({
      next: (shipment) => {
        this.currentShipment.set(shipment);
        this.populateForm(shipment);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load shipment: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  /**
   * Populate form with existing shipment data
   */
  populateForm(shipment: ShipmentResponse) {
    this.shippingId.set(shipment.shippingId);
    this.totalCost.set(shipment.totalCost);
    this.totalPackages.set(shipment.totalPackages);
    this.totalCbm.set(shipment.totalCbm);
    this.isBranded.set(shipment.isBranded);
    this.perCbmRate.set(shipment.perCbmRate);
    this.etd.set(this.formatDateForInput(shipment.etd));
    this.eta.set(this.formatDateForInput(shipment.eta));
    this.trackingUrl.set(shipment.trackingUrl || '');
    this.remarks.set(shipment.remarks || '');
    this.originLocation.set(shipment.originLocation);
    this.destinationLocation.set(shipment.destinationLocation);
    this.localLogisticProvider.set(shipment.localLogisticProvider || '');
    this.localTrackingNumber.set(shipment.localTrackingNumber || '');
    this.indiaWarehouseAddress.set(shipment.indiaWarehouseAddress || '');
    this.indiaContactPhone.set(shipment.indiaContactPhone || '');
    this.indiaContactEmail.set(shipment.indiaContactEmail || '');
    this.currentStatus.set(shipment.status);
  }

  /**
   * Generate unique shipping ID
   */
  generateShippingId() {
    const prefix = 'SHP';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.shippingId.set(`${prefix}-${timestamp}-${random}`);
  }

  /**
   * Validate form
   */
  validateForm(): boolean {
    const errors: { [key: string]: string } = {};

    if (!this.shippingId().trim()) {
      errors['shippingId'] = 'Shipping ID is required';
    }

    if (this.totalCost() <= 0) {
      errors['totalCost'] = 'Total cost must be greater than 0';
    }

    if (this.totalPackages() <= 0) {
      errors['totalPackages'] = 'Total packages must be greater than 0';
    }

    if (this.totalCbm() <= 0) {
      errors['totalCbm'] = 'Total CBM must be greater than 0';
    }

    if (this.perCbmRate() <= 0) {
      errors['perCbmRate'] = 'Per CBM rate must be greater than 0';
    }

    if (!this.etd()) {
      errors['etd'] = 'ETD is required';
    }

    if (!this.eta()) {
      errors['eta'] = 'ETA is required';
    }

    // Check if ETA is after ETD
    if (this.etd() && this.eta()) {
      const etdDate = new Date(this.etd());
      const etaDate = new Date(this.eta());
      if (etaDate < etdDate) {
        errors['eta'] = 'ETA must be after ETD';
      }
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Calculate total cost based on CBM and rate
   */
  calculateTotalCost() {
    const cbm = this.totalCbm();
    const rate = this.perCbmRate();
    if (cbm > 0 && rate > 0) {
      this.totalCost.set(parseFloat((cbm * rate).toFixed(2)));
    }
  }

  /**
   * Submit form (create or update)
   */
  submitForm() {
    if (!this.validateForm()) {
      this.error.set('Please fix the validation errors');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const request: ShipmentRequest = {
      shippingId: this.shippingId(),
      totalCost: this.totalCost(),
      totalPackages: this.totalPackages(),
      totalCbm: this.totalCbm(),
      isBranded: this.isBranded(),
      perCbmRate: this.perCbmRate(),
      etd: new Date(this.etd()),
      eta: new Date(this.eta()),
      trackingUrl: this.trackingUrl() || undefined,
      status: this.currentStatus() || undefined,
      remarks: this.remarks() || undefined,
      originLocation: this.originLocation(),
      destinationLocation: this.destinationLocation(),
      localLogisticProvider: this.localLogisticProvider() || undefined,
      localTrackingNumber: this.localTrackingNumber() || undefined,
      indiaWarehouseAddress: this.indiaWarehouseAddress() || undefined,
      indiaContactPhone: this.indiaContactPhone() || undefined,
      indiaContactEmail: this.indiaContactEmail() || undefined
    };

    const operation = this.isEditMode()
      ? this.shipmentService.updateShipment(this.shipmentId()!, request)
      : this.shipmentService.createShipment(request);

    operation.subscribe({
      next: (response) => {
        this.successMessage.set(
          this.isEditMode() 
            ? 'Shipment updated successfully!' 
            : 'Shipment created successfully!'
        );
        this.saving.set(false);

        // Navigate back to list after a short delay
        setTimeout(() => {
          this.router.navigate(['/shipments']);
        }, 1500);
      },
      error: (err) => {
        this.error.set(
          'Failed to save shipment: ' + (err.error?.message || err.message)
        );
        this.saving.set(false);
      }
    });
  }

  /**
   * Cancel and go back
   */
  cancel() {
    this.router.navigate(['/shipments']);
  }

  /**
   * Format Date object for input field
   */
  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    return this.formErrors()[fieldName] || null;
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    return !!this.formErrors()[fieldName];
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status order index
   */
  private getStatusIndex(status: string): number {
    const statusOrder = [
      'CREATED', 
      'IN_TRANSIT', 
      'ARRIVED_MUMBAI', 
      'IN_CUSTOM_CLEARANCE',
      'DELIVERED_TO_WAREHOUSE',
      'RECEIVED', 
      'OUT_FOR_DELIVERY', 
      'DELIVERED', 
      'COMPLETED'
    ];
    return statusOrder.indexOf(status);
  }

  /**
   * Check if a status step is completed
   */
  isStatusCompleted(status: string): boolean {
    if (!this.currentShipment()) return false;
    const currentIndex = this.getStatusIndex(this.currentShipment()!.status);
    const stepIndex = this.getStatusIndex(status);
    return currentIndex > stepIndex;
  }

  /**
   * Check if a status step is currently active
   */
  isStatusActive(status: string): boolean {
    if (!this.currentShipment()) return false;
    return this.currentShipment()!.status === status;
  }

  /**
   * Get CSS class for status step
   */
  getStatusClass(status: string): string {
    if (this.isStatusActive(status)) {
      return 'bg-indigo-600 ring-4 ring-indigo-100';
    } else if (this.isStatusCompleted(status)) {
      return 'bg-green-500';
    } else {
      return 'bg-gray-300';
    }
  }
}
