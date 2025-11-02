import { Component, OnInit } from '@angular/core';
import { ReceiptData, ReceiptItem } from './receipt.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { Product, SaleItem, Sale, LoyaltyCustomer, PointsCalculation, BarcodeInfo } from '../../core/models';
import { BarcodeInputComponent } from '../../components/barcode/barcode-input.component';
import { PrintReceiptComponent } from './print-receipt.component';


@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeInputComponent, PrintReceiptComponent],
  templateUrl: './sales.component.html'
})
export class SalesComponent implements OnInit {
  showReceiptModal = false;
  receiptData: ReceiptData | null = null;
  appState$: Observable<AppState>;
  barcodeInput = ''; // For barcode scanning
  customerName = '';
  customerPhone = '';
  customerCountryCode = '+91'; // Default to India
  salesPersonName = ''; // Sales person who assisted with the sale
  paymentMethod: 'cash' | 'card' | 'other' = 'cash';
  completedSale: Sale | null = null;
  showSuccessMessage = false;
  successMessage = '';
  isProcessingBarcode = false;
  
  // Loyalty points properties
  loyaltyCustomer: LoyaltyCustomer | null = null;
  pointsToEarn: PointsCalculation | null = null;
  pointsToRedeem = 0;
  discountFromPoints = 0;
  isLoadingLoyalty = false;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    public loyaltyService: LoyaltyService
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    // Ensure initial data is loaded (especially important after page refresh)
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe({
          error: (e) => console.error('Sales: initial data load failed', e)
        });
      }
    });
  }

  /**
   * Handle barcode scan - lookup barcode and add to cart
   */
  async onBarcodeScan(barcodeNumber: string): Promise<void> {
    if (!barcodeNumber || this.isProcessingBarcode) return;
    
    this.isProcessingBarcode = true;
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.locationId) {
      alert('User location not found. Please contact administrator.');
      this.isProcessingBarcode = false;
      return;
    }

    try {
      // Lookup barcode details
      const barcodeInfo = await this.appService.lookupBarcode(barcodeNumber).toPromise();
      
      if (!barcodeInfo) {
        alert(`Barcode "${barcodeNumber}" not found in system.`);
        this.isProcessingBarcode = false;
        this.barcodeInput = '';
        return;
      }

      // Validate barcode status
      if (barcodeInfo.status !== 'ACTIVE') {
        alert(`Barcode "${barcodeNumber}" is ${barcodeInfo.status}. Only ACTIVE barcodes can be sold.`);
        this.isProcessingBarcode = false;
        this.barcodeInput = '';
        return;
      }

      // Validate barcode location (compare as strings since backend sends number but user.locationId is string)
      if (String(barcodeInfo.currentLocation.id) !== String(user.locationId)) {
        alert(`Barcode "${barcodeNumber}" is at ${barcodeInfo.currentLocation.name}. You can only sell items from your location (${user.locationId}).`);
        this.isProcessingBarcode = false;
        this.barcodeInput = '';
        return;
      }

      // Check if this exact barcode is already in the cart
      const appState = this.appService.appStateBehaviorSubject.value;
      const existingItem = appState.currentSale.find(item => 
        item.barcodes && item.barcodes.includes(barcodeNumber)
      );

      if (existingItem) {
        alert(`Barcode "${barcodeNumber}" is already in the cart.`);
        this.isProcessingBarcode = false;
        this.barcodeInput = '';
        return;
      }

      // Fetch location inventory for pricing
      const inventory = await this.appService
        .getInventoryByLocationAndSku(parseInt(user.locationId), barcodeInfo.product.sku)
        .toPromise();

      if (!inventory) {
        alert(`Product "${barcodeInfo.product.name}" inventory not found at this location.`);
        this.isProcessingBarcode = false;
        this.barcodeInput = '';
        return;
      }

      // Create product object from barcode info
      const product: Product = {
        id: barcodeInfo.product.id,
        name: barcodeInfo.product.name,
        sku: barcodeInfo.product.sku,
        size: barcodeInfo.product.size || '',
        color: barcodeInfo.product.color || '',
        category: 'shirts' as any, // Default, will be fetched from full product if needed
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Use sale price from location inventory
      const unitPrice = inventory.salePrice;

      // Check if there's already an item for this product (to group multiple barcodes of same product)
      const existingProductItem = appState.currentSale.find(item => item.productId === product.id);

      if (existingProductItem && existingProductItem.barcodes) {
        // Add this barcode to existing item
        existingProductItem.barcodes.push(barcodeNumber);
        existingProductItem.quantity = existingProductItem.barcodes.length;
        existingProductItem.total = existingProductItem.quantity * existingProductItem.price;
        // Trigger state update
        this.appService.appStateBehaviorSubject.next({
          ...appState,
          currentSale: [...appState.currentSale]
        });
      } else {
        // Create new sale item with this barcode
        const saleItem: SaleItem = {
          productId: product.id,
          product,
          quantity: 1,
          price: unitPrice,
          total: unitPrice,
          barcodes: [barcodeNumber] // Store the scanned barcode
        };

        this.appService.addToSale(saleItem);
      }

      // Show success feedback
      this.showSuccessMessage = true;
      this.successMessage = `Added: ${product.name} (${barcodeNumber})`;
      setTimeout(() => this.showSuccessMessage = false, 2000);

      // Clear barcode input
      this.barcodeInput = '';

    } catch (error: any) {
      console.error('Failed to process barcode:', error);
      alert(error?.error?.message || 'Failed to process barcode. Please try again.');
      this.barcodeInput = '';
    } finally {
      this.isProcessingBarcode = false;
    }
  }

  removeFromSale(productId: string): void {
    this.appService.removeFromSale(productId);
  }

  /**
   * Fetch loyalty customer when phone number is entered
   */
  onPhoneChange(): void {
    // Clear previous loyalty data
    this.loyaltyCustomer = null;
    this.pointsToEarn = null;
    
    // Only fetch if we have a valid phone number (at least 10 digits)
    if (this.customerPhone && this.customerPhone.length >= 10) {
      this.isLoadingLoyalty = true;
      this.loyaltyService.getCustomerByPhone(this.customerPhone, this.customerCountryCode).subscribe({
        next: (customer) => {
          this.loyaltyCustomer = customer;
          this.isLoadingLoyalty = false;
          
          // Calculate points to earn for current cart
          const appState = this.appService.appStateBehaviorSubject.value;
          const total = this.getTotal(appState);
          if (total > 0) {
            this.calculatePointsToEarn(total);
          }
        },
        error: () => {
          this.isLoadingLoyalty = false;
        }
      });
    }
  }

  /**
   * Calculate points that will be earned for current cart total
   */
  private calculatePointsToEarn(amount: number): void {
    if (!this.customerPhone) return;
    
    this.loyaltyService.calculatePoints(amount, this.customerPhone, this.customerCountryCode).subscribe({
      next: (calculation) => {
        this.pointsToEarn = calculation;
      }
    });
  }

  /**
   * Apply points redemption
   */
  applyPointsRedemption(): void {
    if (!this.loyaltyCustomer || this.pointsToRedeem <= 0) return;
    
    // Check minimum points requirement
    if (this.pointsToRedeem < 500) {
      alert('Minimum 500 points required for redemption');
      return;
    }
    
    // Check if customer has enough points
    if (this.pointsToRedeem > this.loyaltyCustomer.currentPoints) {
      alert(`Customer only has ${this.loyaltyCustomer.currentPoints} points available`);
      return;
    }
    
    // Calculate discount
    this.loyaltyService.calculateDiscount(this.pointsToRedeem).subscribe({
      next: (calculation) => {
        if (calculation) {
          this.discountFromPoints = calculation.discountAmount;
          alert(`Discount of ₹${this.discountFromPoints.toFixed(2)} applied!`);
        }
      }
    });
  }

  /**
   * Clear points redemption
   */
  clearPointsRedemption(): void {
    this.pointsToRedeem = 0;
    this.discountFromPoints = 0;
  }

  getSubtotal(appState: AppState): number {
    return appState.currentSale.reduce((sum, item) => sum + item.total, 0);
  }

  getTax(appState: AppState): number {
    // GST is inclusive - calculate the tax portion from subtotal
    // Tax = Subtotal × (GST_RATE / (1 + GST_RATE))
    const subtotal = this.getSubtotal(appState);
    return subtotal * (0.05 / 1.05);
  }

  getTotal(appState: AppState): number {
    // Total equals subtotal since GST is inclusive (customer doesn't pay extra)
    // Subtract loyalty discount if applied
    const subtotal = this.getSubtotal(appState);
    return Math.max(0, subtotal - this.discountFromPoints);
  }

  completeSale(appState: AppState): void {
    if (appState.currentSale.length === 0) return;
    
    // Permission check: only admin or sales can complete a sale
    const user = this.authService.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      alert("You don't have permission to complete sales. Please sign in as Sales or Admin.");
      return;
    }

    if (!user.locationId) {
      alert('User location not found. Please contact administrator.');
      return;
    }

    const saleData: any = {
      locationId: parseInt(user.locationId), // NEW: Required for new schema
      paymentMethod: this.paymentMethod,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerCountryCode: this.customerCountryCode,
      pointsRedeemed: this.pointsToRedeem > 0 ? this.pointsToRedeem : undefined,
      discountFromPoints: this.discountFromPoints > 0 ? this.discountFromPoints : undefined,
    };

    // Add salesPersonName only if it has a value
    if (this.salesPersonName && this.salesPersonName.trim()) {
      saleData.salesPersonName = this.salesPersonName.trim();
    }

    console.log('Sale Data being sent:', saleData);

    this.appService.createSale(saleData, appState.currentSale).subscribe({
      next: (sale) => {
        // Build receipt data
        const now = new Date();
        const receiptItems: ReceiptItem[] = appState.currentSale.map(item => ({
          name: item.product.name,
          details: `${item.product.size} – ${item.product.color}`,
          qty: item.quantity,
          price: item.price
        }));
        const subtotal = this.getSubtotal(appState);
        const tax = this.getTax(appState);
        const total = this.getTotal(appState);
        this.receiptData = {
          number: sale.id || 'N/A',
          date: now.toLocaleDateString('en-GB'),
          time: now.toLocaleTimeString('en-GB'),
          customer: this.customerName || 'Walk-in Customer',
          items: receiptItems,
          subtotal,
          taxLabel: '5% GST (included)',
          tax,
          total,
          paymentMethod: this.paymentMethod.toUpperCase()
        };
        this.showReceiptModal = true;
        
        // Reset form and loyalty data
        this.customerName = '';
        this.customerPhone = '';
        this.customerCountryCode = '+91';
        this.salesPersonName = '';
        this.barcodeInput = '';
        this.loyaltyCustomer = null;
        this.pointsToEarn = null;
        this.pointsToRedeem = 0;
        this.discountFromPoints = 0;
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401) {
          alert('Session expired. Please log in again.');
        } else if (status === 403) {
          alert("You don't have permission to complete sales. Please sign in as Sales or Admin.");
        } else if (status === 400) {
          const message = err?.error?.message || err?.error?.error || 'Request invalid.';
          alert(`Failed to complete sale: ${message}`);
        } else {
          alert('Failed to complete sale. Please try again.');
        }
      }
    });
  }

  onReceiptModalClose(): void {
    this.showReceiptModal = false;
    
    // Show success message
    if (this.receiptData) {
      this.successMessage = `Sale completed successfully! Bill #${this.receiptData.number}`;
      this.showSuccessMessage = true;
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    }
  }

  closeSuccessMessage(): void {
    this.showSuccessMessage = false;
  }
}
