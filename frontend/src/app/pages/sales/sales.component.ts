import { Component, OnInit } from '@angular/core';
import { ReceiptData, ReceiptItem } from './receipt.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { Product, SaleItem, Sale, LoyaltyCustomer, PointsCalculation } from '../../core/models';
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
  searchTerm = '';
  customerName = '';
  customerPhone = '';
  customerCountryCode = '+91'; // Default to India
  paymentMethod: 'cash' | 'card' | 'other' = 'cash';
  completedSale: Sale | null = null;
  private imageIndex: Record<string, number> = {};
  showSuccessMessage = false;
  successMessage = '';
  
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

  // Template helpers for strict mode
  hasImages(product: Product): boolean {
    return !!(product.imageUrls && product.imageUrls.length > 0);
  }

  getFirstImage(product: Product): string | undefined {
    return product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined;
  }

  getFilteredProducts(appState: AppState): Product[] {
    const user = this.authService.getCurrentUser();
    
    return appState.products.filter(product => {
      // Filter by user's location for SALES users
      if (user?.role === 'sales' && user?.locationId) {
        if (product.locationId !== user.locationId) {
          return false;
        }
      }
      
      // Filter by stock and search term
      return product.stock > 0 && (
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(this.searchTerm))
      );
    });
  }

  addToSale(product: Product): void {
    const quantity = 1;
    const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
    
    const saleItem: SaleItem = {
      productId: product.id,
      product,
      quantity,
      price: unitPrice,
      total: unitPrice,
    };
    
    this.appService.addToSale(saleItem);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.appService.removeFromSale(productId);
    } else {
      const appState = this.appService.appStateBehaviorSubject.value;
      const product = appState.products.find((p: Product) => p.id === productId);
      if (product) {
        const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
        this.appService.updateSaleQuantity(productId, quantity, unitPrice);
      }
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

    const saleData = {
      paymentMethod: this.paymentMethod,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerCountryCode: this.customerCountryCode,
      pointsRedeemed: this.pointsToRedeem > 0 ? this.pointsToRedeem : undefined,
      discountFromPoints: this.discountFromPoints > 0 ? this.discountFromPoints : undefined,
    };

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
        this.searchTerm = '';
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

  onBarcodeScan(code: string): void {
    // Set the search term to the scanned barcode
    this.searchTerm = code;
    
    // Wait for Angular change detection to update the filtered products
    setTimeout(() => {
      const state = this.appService.appStateBehaviorSubject.value;
      const filteredProducts = this.getFilteredProducts(state);
      
      // If exactly one product matches, auto-add it to sale
      if (filteredProducts.length === 1) {
        this.addToSale(filteredProducts[0]);
        this.searchTerm = ''; // Clear search after adding
      }
      // If multiple products match, keep the search term so user can see and select
    }, 0);
  }

  // Simple per-card image carousel helpers
  hasMultipleImages(product: Product): boolean {
    return !!(product.imageUrls && product.imageUrls.length > 1);
  }

  nextImage(product: Product): void {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;
    const cur = this.imageIndex[product.id] || 0;
    this.imageIndex[product.id] = (cur + 1) % product.imageUrls.length;
  }

  prevImage(product: Product): void {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;
    const cur = this.imageIndex[product.id] || 0;
    this.imageIndex[product.id] = (cur - 1 + product.imageUrls.length) % product.imageUrls.length;
  }

  currentImage(product: Product): string | undefined {
    if (!product.imageUrls || product.imageUrls.length === 0) return undefined;
    const idx = this.imageIndex[product.id] || 0;
    return product.imageUrls[idx] || product.imageUrls[0];
  }

  currentImageNo(product: Product): number {
    const idx = this.imageIndex[product.id] || 0;
    return (idx + 1);
  }

  imageCount(product: Product): number {
    return product.imageUrls ? product.imageUrls.length : 0;
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
