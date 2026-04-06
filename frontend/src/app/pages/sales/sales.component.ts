import { Component, OnInit } from '@angular/core';
import { ReceiptData, ReceiptItem } from './receipt.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { SalesPersonService } from '../../core/services/sales-person.service';
import { CouponService } from '../../services/coupon.service';
import { Product, SaleItem, Sale, LoyaltyCustomer, PointsCalculation, BarcodeInfo, SalesPerson } from '../../core/models';
import { Coupon, GeneratedCouponInfo } from '../../models/coupon.model';
import { BarcodeInputComponent } from '../../components/barcode/barcode-input.component';
import { PrintReceiptComponent } from './print-receipt.component';
import { ExchangeModalComponent } from '../../components/sales/exchange-modal.component';


@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeInputComponent, PrintReceiptComponent, ExchangeModalComponent],
  templateUrl: './sales.component.html'
})
export class SalesComponent implements OnInit {
  private readonly gstin = '29CBIPV3211R1ZW';
  private readonly gangaLocationId = 3;
  showReceiptModal = false;
  receiptData: ReceiptData | null = null;
  appState$: Observable<AppState>;
  barcodeInput = ''; // For barcode scanning
  customerName = '';
  customerPhone = '';
  customerCountryCode = '+91'; // Default to India
  salesPersonName = ''; // Sales person who assisted with the sale
  salesPersons: SalesPerson[] = []; // List of active sales persons for dropdown
  salesPersonSplits: Array<{ name: string; items: number }> = [{ name: '', items: 0 }];
  paymentMethod: 'cash' | 'card' | 'upi' = 'cash';
  completedSale: Sale | null = null;
  showSuccessMessage = false;
  successMessage = '';
  isProcessingBarcode = false;
  
  // Exchange modal properties
  showExchangeModal = false;
  exchangeSale: Sale | null = null;
  exchangeBarcodesSnapshot: string[] = []; // Snapshot of barcodes to pass to modal
  
  // Exchange search properties
  showExchangeSearch = false;
  exchangeBarcodeInput = '';
  isSearchingSale = false;
  exchangeSearchError = '';
  scannedExchangeBarcodes: Array<{
    barcode: string;
    productName: string;
    size: string;
    color: string;
    price: number;
  }> = []; // Track multiple scanned barcodes with details
  exchangeSuccessMessage = ''; // Success message after scanning
  
  // Split payment support
  payments: Array<{
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
    amount: number;
    reference: string;
  }> = [];
  useSplitPayment = false;
  
  // Loyalty points properties
  loyaltyCustomer: LoyaltyCustomer | null = null;
  pointsToEarn: PointsCalculation | null = null;
  pointsToRedeem = 0;
  discountFromPoints = 0;
  isLoadingLoyalty = false;
  
  // Coupon properties
  couponCode = '';
  appliedCoupon: Coupon | null = null;
  couponDiscount = 0;
  couponError = '';
  showCouponSuccess = false;
  customerCoupons: Coupon[] = [];
  showCustomerCoupons = false;
  isValidatingCoupon = false;

  // Price edit modal properties
  showPriceEditModal = false;
  priceEditBarcode: {
    barcodeId: number;
    barcodeNumber: string;
    productName: string;
    size: string;
    color: string;
    currentPrice: number;
  } | null = null;
  newPrice: number = 0;
  isUpdatingPrice = false;
  pendingBarcodeInfo: any = null; // Store barcode info while price is being edited

  constructor(
    private appService: AppService,
    private authService: AuthService,
    public loyaltyService: LoyaltyService,
    private salesPersonService: SalesPersonService,
    private couponService: CouponService
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    // Ensure initial data is loaded (especially important after page refresh)
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe();
      }
    });
    
    // Load active sales persons for dropdown
    this.loadActiveSalesPersons();
  }

  /**
   * Load active sales persons for dropdown
   */
  loadActiveSalesPersons(): void {
    this.salesPersonService.getActiveSalesPersons().subscribe({
      next: (salesPersons) => {
        this.salesPersons = salesPersons;
        console.log('Loaded active sales persons:', salesPersons.length);
      },
      error: (error) => {
        console.error('Error loading sales persons:', error);
      }
    });
  }

  /**
   * Handle barcode input change
   */
  onBarcodeInputChange(value: string): void {
    this.barcodeInput = value;
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

      // Use individual barcode sale price if available, fallback to location inventory price
      const unitPrice = barcodeInfo.salePrice || inventory.salePrice;
      
      // Warn if barcode doesn't have individual price
      if (!barcodeInfo.salePrice || barcodeInfo.salePrice <= 0) {
        console.warn(`Barcode ${barcodeNumber} does not have an individual sale price. Using location inventory price: ${inventory.salePrice}`);
      }

      // ALWAYS show price edit modal to allow user to verify/update price
      // This helps when physical sticker price doesn't match system price
      this.showPriceEditModalForBarcode(barcodeInfo, unitPrice);

      // Note: The rest of the logic (adding to cart) is now handled in proceedToAddToCart()
      // which is called after user confirms price or updates it

    } catch (error: any) {
      alert(error?.error?.message || 'Failed to process barcode. Please try again.');
      this.barcodeInput = '';
    } finally {
      this.isProcessingBarcode = false;
    }
  }

  removeFromSale(productId: string): void {
    this.appService.removeFromSale(productId);
  }

  updateItemSalesPerson(productId: string, salesPersonName?: string): void {
    this.appService.updateSaleItemSalesPerson(productId, salesPersonName);
  }

  /**
   * Fetch loyalty customer when phone number is entered
   */
  onPhoneChange(): void {
    // Clear previous loyalty data
    this.loyaltyCustomer = null;
    this.pointsToEarn = null;
    
    // Clear previous coupon data
    this.customerCoupons = [];
    this.showCustomerCoupons = false;
    
    if (this.isGangaStore()) {
      return;
    }

    // Only fetch if we have a valid phone number (at least 10 digits)
    if (this.customerPhone && this.customerPhone.length >= 10) {
      this.isLoadingLoyalty = true;
      
      // Fetch loyalty customer
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
      
      // Fetch customer coupons
      this.loadCustomerCoupons();
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
    if (this.isGangaStore()) {
      alert('Loyalty discounts are not available for Ganga wholesale sales.');
      return;
    }

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

  /**
   * Load customer's active coupons
   */
  loadCustomerCoupons(): void {
    if (this.isGangaStore()) return;

    if (!this.customerPhone || this.customerPhone.length < 10) return;
    
    this.couponService.getCustomerCoupons(this.customerPhone, this.customerCountryCode).subscribe({
      next: (coupons) => {
        this.customerCoupons = coupons;
        this.showCustomerCoupons = coupons.length > 0;
      },
      error: (error) => {
        console.error('Error loading customer coupons:', error);
        this.customerCoupons = [];
        this.showCustomerCoupons = false;
      }
    });
  }

  /**
   * Apply coupon code
   */
  applyCoupon(): void {
    if (this.isGangaStore()) {
      this.couponError = 'Coupons are not applicable for Ganga wholesale sales.';
      return;
    }

    if (!this.couponCode || !this.couponCode.trim()) {
      this.couponError = 'Please enter a coupon code';
      return;
    }
    
    const appState = this.appService.appStateBehaviorSubject.value;
    const subtotal = this.getSubtotal(appState);
    
    if (subtotal === 0) {
      this.couponError = 'Please add items to cart first';
      return;
    }
    
    this.isValidatingCoupon = true;
    this.couponError = '';
    
    this.couponService.validateCoupon(this.couponCode.toUpperCase(), subtotal).subscribe({
      next: (validation) => {
        this.isValidatingCoupon = false;
        
        if (validation.valid && validation.discountAmount) {
          this.couponDiscount = validation.discountAmount;
          this.couponError = '';
          this.showCouponSuccess = true;
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.showCouponSuccess = false;
          }, 3000);
        } else {
          this.couponError = validation.message;
          this.couponDiscount = 0;
        }
      },
      error: () => {
        this.isValidatingCoupon = false;
        this.couponError = 'Failed to validate coupon. Please try again.';
        this.couponDiscount = 0;
      }
    });
  }

  /**
   * Select and apply a coupon from customer's list
   */
  selectCoupon(coupon: Coupon): void {
    this.couponCode = coupon.code;
    this.applyCoupon();
  }

  /**
   * Remove applied coupon
   */
  removeCoupon(): void {
    this.couponCode = '';
    this.couponDiscount = 0;
    this.couponError = '';
    this.showCouponSuccess = false;
  }

  getSubtotal(appState: AppState): number {
    return appState.currentSale.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Calculate total quantity of all items in cart
   */
  getTotalQuantity(appState: AppState): number {
    return appState.currentSale.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSalesPersonBreakdown(appState: AppState): Array<{ name: string; total: number; quantity: number }> {
    const summary = new Map<string, { name: string; total: number; quantity: number }>();

    appState.currentSale.forEach((item) => {
      const name = (item.salesPersonName || 'Unassigned').trim() || 'Unassigned';
      const existing = summary.get(name) || { name, total: 0, quantity: 0 };
      existing.total += item.total;
      existing.quantity += item.quantity;
      summary.set(name, existing);
    });

    return Array.from(summary.values()).sort((a, b) => b.total - a.total);
  }

  addSalesPersonSplitRow(): void {
    this.salesPersonSplits.push({ name: '', items: 0 });
  }

  removeSalesPersonSplitRow(index: number): void {
    this.salesPersonSplits.splice(index, 1);
    if (this.salesPersonSplits.length === 0) {
      this.salesPersonSplits.push({ name: '', items: 0 });
    }
  }

  getTotalSplitItems(): number {
    return this.salesPersonSplits.reduce((sum, split) => sum + (split.items || 0), 0);
  }

  getRemainingSplitItems(appState: AppState): number {
    const totalUnits = this.getTotalQuantity(appState);
    return totalUnits - this.getTotalSplitItems();
  }

  hasInvalidSalesPersonSplits(appState: AppState): boolean {
    const totalUnits = this.getTotalQuantity(appState);
    const totalSplit = this.getTotalSplitItems();
    if (totalSplit > totalUnits) return true;

    return this.salesPersonSplits.some(split => {
      if (split.items < 0) return true;
      if (split.items > 0 && !split.name?.trim()) return true;
      return false;
    });
  }

  applySalesPersonSplits(appState: AppState): void {
    if (appState.currentSale.length === 0) return;

    const assignments: string[] = [];
    this.salesPersonSplits.forEach(split => {
      const name = split.name?.trim();
      if (!name || split.items <= 0) return;

      for (let i = 0; i < split.items; i += 1) {
        assignments.push(name);
      }
    });

    const units: Array<{
      productId: string;
      product: SaleItem['product'];
      price: number;
      barcode?: string;
    }> = [];

    appState.currentSale.forEach(item => {
      const barcodes = item.barcodes || [];
      for (let i = 0; i < item.quantity; i += 1) {
        const barcode = barcodes[i];
        const price = barcode && item.barcodePrices?.[barcode] ? item.barcodePrices[barcode] : item.price;
        units.push({
          productId: item.productId,
          product: item.product,
          price,
          barcode
        });
      }
    });

    const grouped = new Map<string, SaleItem>();

    units.forEach((unit, index) => {
      const name = assignments[index];
      const key = `${unit.productId}::${name || ''}`;
      const existing = grouped.get(key);
      const unitPrice = unit.price || 0;

      if (existing) {
        existing.quantity += 1;
        existing.total += unitPrice;
        existing.price = existing.quantity > 0 ? Number((existing.total / existing.quantity).toFixed(2)) : existing.price;
        if (unit.barcode) {
          existing.barcodes = existing.barcodes ? [...existing.barcodes, unit.barcode] : [unit.barcode];
          if (existing.barcodePrices) {
            existing.barcodePrices[unit.barcode] = unitPrice;
          } else {
            existing.barcodePrices = { [unit.barcode]: unitPrice };
          }
        }
      } else {
        grouped.set(key, {
          productId: unit.productId,
          product: unit.product,
          quantity: 1,
          price: Number(unitPrice.toFixed(2)),
          total: unitPrice,
          barcodes: unit.barcode ? [unit.barcode] : undefined,
          barcodePrices: unit.barcode ? { [unit.barcode]: unitPrice } : undefined,
          salesPersonName: name || undefined
        });
      }
    });

    this.appService.setCurrentSale(Array.from(grouped.values()));
  }

  private getDiscountTotal(appState: AppState): number {
    if (this.isGangaStore()) {
      return 0;
    }

    const loyaltyDiscount = this.discountFromPoints || 0;
    const instantDiscount = this.getInstantDiscount(appState).amount;
    const couponDiscount = this.couponDiscount || 0;
    return loyaltyDiscount + instantDiscount + couponDiscount;
  }

  getTax(appState: AppState): number {
    // GST included in price at a flat 5%
    const subtotal = this.getSubtotal(appState);
    if (subtotal <= 0) return 0;

    const totalDiscount = Math.min(subtotal, this.getDiscountTotal(appState));
    const taxable = Math.max(0, subtotal - totalDiscount);
    return Number(((taxable * 0.05) / 1.05).toFixed(2));
  }

  /**
   * Calculate instant discount based on subtotal thresholds
   */
  getInstantDiscount(appState: AppState): { percent: number, amount: number } {
    if (this.isGangaStore()) {
      return { percent: 0, amount: 0 };
    }

    const subtotal = this.getSubtotal(appState);
    
    if (subtotal >= 10000) {
      return { percent: 15, amount: subtotal * 0.15 };
    } else if (subtotal >= 7500) {
      return { percent: 12, amount: subtotal * 0.12 };
    } else if (subtotal >= 5000) {
      return { percent: 10, amount: subtotal * 0.10 };
    }
    
    return { percent: 0, amount: 0 };
  }

  getTotal(appState: AppState): number {
    // Total already includes GST; subtract discounts only
    const subtotal = this.getSubtotal(appState);
    const totalDiscount = this.getDiscountTotal(appState);
    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    return Number(discountedSubtotal.toFixed(2));
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

    // DEBUG: Log coupon state before building sale data
    console.log('=== FRONTEND DEBUG: completeSale called ===');
    console.log('this.couponCode =', this.couponCode);
    console.log('this.couponDiscount =', this.couponDiscount);

    // Build sale data with either single payment or split payments
    const saleData: any = {
      locationId: parseInt(user.locationId),
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerCountryCode: this.customerCountryCode,
      pointsToRedeem: !this.isGangaStore() && this.pointsToRedeem > 0 ? this.pointsToRedeem : undefined,
      discountFromPoints: !this.isGangaStore() && this.discountFromPoints > 0 ? this.discountFromPoints : undefined,
      couponCode: !this.isGangaStore() && this.couponCode && this.couponDiscount > 0 ? this.couponCode.toUpperCase() : undefined,
    };

    // DEBUG: Log what's being sent
    console.log('=== saleData.couponCode =', saleData.couponCode);
    console.log('=== FULL saleData being sent:', JSON.stringify(saleData, null, 2));

    // Add payment information
    if (this.useSplitPayment) {
      // Validate split payments
      const total = this.getTotal(appState);
      const paid = this.getTotalPayments();

      if (this.isGangaStore()) {
        if (paid <= 0) {
          alert('Please enter at least one payment amount.');
          return;
        }
        if (paid - total > 0.01) {
          alert(`Payment total (₹${paid.toFixed(2)}) exceeds sale total (₹${total.toFixed(2)}). Please adjust payment amounts.`);
          return;
        }
      } else if (Math.abs(total - paid) >= 0.01) {
        alert(`Payment total (₹${paid.toFixed(2)}) does not match sale total (₹${total.toFixed(2)}). Please adjust payment amounts.`);
        return;
      }

      if (this.payments.length === 0 || this.payments.some(p => p.amount <= 0)) {
        alert('Please enter valid payment amounts for all payment methods.');
        return;
      }

      // Send payments array for split payment
      saleData.payments = this.payments;
    } else {
      // Send single paymentMethod for backward compatibility
      saleData.paymentMethod = this.paymentMethod;
    }

    this.appService.createSale(saleData, appState.currentSale).subscribe({
      next: (sale) => {
        // Show success message
        this.showSuccessMessage = true;
        this.successMessage = `✅ Sale Completed Successfully! Total: ₹${this.getTotal(appState).toFixed(2)}`;
        setTimeout(() => this.showSuccessMessage = false, 3000);
        
        // Store the completed sale for exchange option
        this.completedSale = sale;
        
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
  const paidAmount = this.useSplitPayment ? this.getTotalPayments() : total;
  const pendingAmount = Math.max(0, total - paidAmount);
        
        // Format payment method for receipt
        let paymentMethodLabel = '';
        if (this.useSplitPayment) {
          paymentMethodLabel = this.payments
            .map(p => `${p.paymentMethod} ₹${p.amount.toFixed(2)}`)
            .join(' + ');
        } else {
          paymentMethodLabel = this.paymentMethod.toUpperCase();
        }
        
        // Get location-specific information for receipt
        const user = this.authService.getCurrentUser();
        let locationName = 'Foreign Fits';
        let locationAddress = '';
        let locationPhone = '';
        
        if (user && user.locationName) {
          locationName = user.locationName;
          
          // Set address and phone based on location
          if (user.locationName.toLowerCase().includes('yamuna')) {
            locationAddress = 'Mohan Market, Bidar';
            locationPhone = '+919900724232, +919035707779';
          } else if (user.locationName.toLowerCase().includes('gangotri')) {
            locationAddress = '123 Fashion Street, Style City';
            locationPhone = '(555) 123-4567';
          } else {
            // Default fallback
            locationAddress = '123 Fashion Street, Style City';
            locationPhone = '(555) 123-4567';
          }
        }
        
        this.receiptData = {
          number: sale.id || 'N/A',
          date: now.toLocaleDateString('en-GB'),
          time: now.toLocaleTimeString('en-GB'),
          customer: this.customerName || 'Walk-in Customer',
          gstin: this.gstin,
          items: receiptItems,
          subtotal,
          taxLabel: 'GST (5% included)',
          tax,
          total,
          paidAmount,
          pendingAmount,
          paymentMethod: paymentMethodLabel,
          locationName: locationName,
          locationAddress: locationAddress,
          locationPhone: locationPhone,
          instantDiscount: this.getInstantDiscount(appState).amount > 0 ? {
            percent: this.getInstantDiscount(appState).percent,
            amount: this.getInstantDiscount(appState).amount
          } : undefined,
          appliedCoupon: this.couponCode && this.couponDiscount > 0 ? {
            code: this.couponCode.toUpperCase(),
            discount: this.couponDiscount
          } : undefined,
          generatedCoupon: sale.generatedCouponCode ? {
            code: sale.generatedCouponCode,
            amount: 500,
            validDays: 30,
            minPurchase: 2000
          } : undefined
        };
        this.showReceiptModal = true;
        
        // Reset form, loyalty data, and coupon data
        this.customerName = '';
        this.customerPhone = '';
        this.customerCountryCode = '+91';
        this.salesPersonName = '';
  this.salesPersonSplits = [{ name: '', items: 0 }];
        this.barcodeInput = '';
        this.loyaltyCustomer = null;
        this.pointsToEarn = null;
        this.pointsToRedeem = 0;
        this.discountFromPoints = 0;
        this.couponCode = '';
        this.couponDiscount = 0;
        this.couponError = '';
        this.showCouponSuccess = false;
        this.customerCoupons = [];
        this.showCustomerCoupons = false;
        this.payments = [];
        this.useSplitPayment = false;
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401) {
          alert('Session expired. Please log in again.');
        } else if (status === 403) {
          alert("You don't have permission to complete sales. Please sign in as Sales or Admin.");
        } else if (status === 400) {
          const message = typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || err?.error?.error || 'Request invalid.';
          alert(`Failed to complete sale: ${message}`);
        } else {
          const message = err?.error?.message || err?.error?.error || err?.error || 'Failed to complete sale. Please try again.';
          alert(`Failed to complete sale: ${message}`);
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

  /**
   * Toggle between single payment and split payment mode
   */
  toggleSplitPayment(): void {
    this.useSplitPayment = !this.useSplitPayment;
    if (this.useSplitPayment && this.payments.length === 0) {
      // Initialize with one payment row
      this.addPaymentRow();
    }
  }

  /**
   * Start a part payment flow (Ganga wholesale only)
   */
  startPartPayment(appState: AppState): void {
    this.useSplitPayment = true;
    if (this.payments.length === 0) {
      this.payments.push({
        paymentMethod: 'CASH',
        amount: 0,
        reference: ''
      });
      return;
    }

    if (this.payments.length === 1) {
      const total = this.getTotal(appState);
      if (Math.abs(this.payments[0].amount - total) < 0.01) {
        this.payments[0].amount = 0;
      }
    }
  }

  /**
   * Add a new payment row
   */
  addPaymentRow(): void {
    const appState = this.appService.appStateBehaviorSubject.value;
    const remaining = this.getRemainingBalance(appState);
    
    // Pre-fill with remaining amount (or total if first payment)
    const suggestedAmount = this.payments.length === 0 ? this.getTotal(appState) : remaining;
    
    this.payments.push({
      paymentMethod: 'CASH',
      amount: suggestedAmount,
      reference: ''
    });
  }

  /**
   * Remove a payment row
   */
  removePaymentRow(index: number): void {
    this.payments.splice(index, 1);
  }

  /**
   * Calculate total amount of all payments
   */
  getTotalPayments(): number {
    return this.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }

  /**
   * Calculate remaining balance (sale total - payments)
   */
  getRemainingBalance(appState: AppState): number {
    const total = this.getTotal(appState);
    const paid = this.getTotalPayments();
    return Math.max(0, total - paid);
  }

  /**
   * Check if sale can be completed (all payments entered)
   */
  canCompleteSale(appState: AppState): boolean {
    if (appState.currentSale.length === 0) return false;
    
    if (this.useSplitPayment) {
      // For split payment, check that payments sum to total and all amounts are valid
      const total = this.getTotal(appState);
      const paid = this.getTotalPayments();
      const hasValidPayments = this.payments.length > 0 && 
                               this.payments.every(p => p.amount > 0);

      if (!hasValidPayments) {
        return false;
      }

      if (this.isGangaStore()) {
        return paid <= total + 0.01;
      }

      return Math.abs(total - paid) < 0.01; // Allow small rounding differences
    }
    
    return true; // Single payment mode is always valid if cart has items
  }

  /**
   * Check if any payment has invalid (zero or negative) amount
   */
  hasInvalidPaymentAmounts(): boolean {
    return this.payments.some(p => p.amount <= 0);
  }

  isGangaStore(): boolean {
    const user = this.authService.getCurrentUser();
    const locationIdMatch = !!user?.locationId && Number(user.locationId) === this.gangaLocationId;
    const locationNameMatch = user?.locationName?.toLowerCase().includes('ganga') || false;
    return locationIdMatch || locationNameMatch;
  }

  /**
   * Open exchange modal for the last completed sale
   */
  openExchangeModal(): void {
    if (!this.completedSale) {
      alert('No recent sale found. Please complete a sale first or use Sales History for older sales.');
      return;
    }
    
    this.exchangeSale = this.completedSale;
    this.showExchangeModal = true;
  }

  /**
   * Close exchange modal
   */
  closeExchangeModal(): void {
    this.showExchangeModal = false;
    this.exchangeSale = null;
  }

  /**
   * Handle successful exchange creation
   */
  onExchangeCreated(exchange: any): void {
    console.log('Exchange created:', exchange);
    
    // Fetch the new sale to generate receipt
    this.appService.getSaleById(exchange.newSaleId.toString()).subscribe({
      next: (newSale) => {
        // Build receipt data for the exchange
        const now = new Date();
        
        // Get location-specific information for receipt
        const user = this.authService.getCurrentUser();
        let locationName = 'Foreign Fits';
        let locationAddress = '';
        let locationPhone = '';
        
        if (user && user.locationName) {
          locationName = user.locationName;
          
          // Set address and phone based on location
          if (user.locationName.toLowerCase().includes('yamuna')) {
            locationAddress = 'Mohan Market, Bidar';
            locationPhone = '+919900724232, +919035707779';
          } else if (user.locationName.toLowerCase().includes('gangotri')) {
            locationAddress = '123 Fashion Street, Style City';
            locationPhone = '(555) 123-4567';
          } else {
            // Default fallback
            locationAddress = '123 Fashion Street, Style City';
            locationPhone = '(555) 123-4567';
          }
        }
        
        // Build new items list from the exchange
        const newItems: ReceiptItem[] = exchange.items
          .filter((item: any) => item.itemType === 'EXCHANGED')
          .map((item: any) => ({
            name: item.productName,
            details: item.barcode ? `Barcode: ${item.barcode}` : '',
            qty: item.quantity,
            price: item.price || 0, // Use price from backend
            barcode: item.barcode
          }));
        
        // Build returned items list from the exchange
        const returnedItems: ReceiptItem[] = exchange.items
          .filter((item: any) => item.itemType === 'RETURNED')
          .map((item: any) => ({
            name: item.productName,
            details: item.barcode ? `Barcode: ${item.barcode}` : '',
            qty: item.quantity,
            price: item.price || 0, // Use price from backend
            barcode: item.barcode
          }));
        
        // Helper to resolve price using barcode-specific value, then averages
        const resolvePriceFromSaleItem = (receiptItem: ReceiptItem, saleItem: any) => {
          console.log('Resolving price for receipt item:', receiptItem);
          console.log('From sale item:', saleItem);
          
          const barcodePrices = saleItem.barcodePrices as Record<string, number | string | undefined> | undefined;
          console.log('Barcode prices object:', barcodePrices);

          const averageFromTotal = saleItem.total && saleItem.quantity
            ? saleItem.total / saleItem.quantity
            : undefined;

          const averageFromBarcodePrices = barcodePrices && Object.values(barcodePrices).length > 0
            ? Object.values(barcodePrices).reduce((sum: number, p: any) => sum + (Number(p) || 0), 0) /
              Object.values(barcodePrices).length
            : undefined;

          if (receiptItem.barcode && barcodePrices) {
            // Match barcode allowing numeric/string keys
            const matchedEntry = Object.entries(barcodePrices).find(([k]) => String(k) === String(receiptItem.barcode));
            console.log('Matched barcode entry:', matchedEntry);
            if (matchedEntry && matchedEntry[1]) {
              const price = Number(matchedEntry[1]);
              console.log('Using barcode-specific price:', price);
              return price;
            }
            // If only one barcode price exists, use it
            const values = Object.values(barcodePrices).filter(v => v != null);
            if (values.length === 1) {
              const price = Number(values[0]);
              console.log('Using single barcode price:', price);
              return price;
            }
          }

          // Try to use the sale item price (average price per item)
          if (saleItem.price && saleItem.price > 0) {
            console.log('Using sale item price:', saleItem.price);
            return saleItem.price;
          }

          // Try average from barcode prices
          if (averageFromBarcodePrices && averageFromBarcodePrices > 0) {
            console.log('Using average from barcode prices:', averageFromBarcodePrices);
            return averageFromBarcodePrices;
          }

          // Try average from total
          if (averageFromTotal && averageFromTotal > 0) {
            console.log('Using average from total:', averageFromTotal);
            return averageFromTotal;
          }

          console.warn('Could not resolve price, using receipt item price:', receiptItem.price);
          return receiptItem.price;
        };

        newItems.forEach(receiptItem => {
          const saleItem = newSale.items.find(si => {
            if (receiptItem.barcode && si.barcodes && si.barcodes.length > 0) {
              return si.barcodes.some((b: string) => String(b) === String(receiptItem.barcode));
            }
            return si.product.name === receiptItem.name;
          });

          if (saleItem) {
            receiptItem.price = resolvePriceFromSaleItem(receiptItem, saleItem);
          }
        });
        
        console.log('New items with prices:', newItems);
        console.log('Returned items with prices:', returnedItems);
        
        // Calculate totals
        const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        let returnedTotal = returnedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

        console.log('Calculated newTotal:', newTotal);
        console.log('Calculated returnedTotal:', returnedTotal);
        console.log('Backend priceDifference:', exchange.priceDifference);

        // Prefer backend-calculated price difference for accuracy
        const backendDifference = typeof exchange.priceDifference === 'number' ? exchange.priceDifference : null;
        
        // If we failed to get returned prices correctly (returnedTotal is too low or zero), 
        // calculate it from backend data: returnedTotal = newTotal - priceDifference
        if (backendDifference !== null) {
          const calculatedReturnedTotal = newTotal - backendDifference;
          
          // Use backend calculation if our local calculation seems wrong
          // (either zero, or doesn't match the expected difference)
          if (returnedTotal === 0 || Math.abs((newTotal - returnedTotal) - backendDifference) > 1) {
            console.warn('Local returned total calculation seems incorrect. Using backend calculation.');
            console.warn(`Local returnedTotal: ${returnedTotal}, Calculated from backend: ${calculatedReturnedTotal}`);
            returnedTotal = Math.max(0, calculatedReturnedTotal);
          }
        }
        
        // Final price difference (prefer backend, fallback to local calculation)
        const priceDifference = backendDifference !== null ? backendDifference : newTotal - returnedTotal;
        
        console.log('Final returnedTotal:', returnedTotal);
        console.log('Final priceDifference:', priceDifference);
        
  // Use backend-calculated subtotal and tax (GST included)
  const subtotal = typeof newSale.subtotal === 'number' ? newSale.subtotal : newTotal;
  const tax = typeof newSale.tax === 'number' ? newSale.tax : 0;
        
        // Format payment method
        let paymentMethodLabel = 'EXCHANGE';
        if (priceDifference > 0) {
          paymentMethodLabel = 'EXCHANGE + CASH/UPI';
        } else if (priceDifference < 0) {
          paymentMethodLabel = 'EXCHANGE + REFUND';
        }
        
        // Build complete receipt data
        this.receiptData = {
          number: newSale.id || exchange.newSaleId,
          date: now.toLocaleDateString('en-GB'),
          time: now.toLocaleTimeString('en-GB'),
          customer: this.exchangeSale?.customerName || 'Walk-in Customer',
          gstin: this.gstin,
          items: newItems,
          subtotal,
          taxLabel: 'GST (5% included)',
          tax,
          total: subtotal,
          paymentMethod: paymentMethodLabel,
          locationName: locationName,
          locationAddress: locationAddress,
          locationPhone: locationPhone,
          exchangeDetails: {
            originalBillNumber: this.exchangeSale?.id || exchange.originalSaleId,
            returnedItems: returnedItems,
            returnedTotal: returnedTotal,
            newItems: newItems,
            newTotal: newTotal,
            priceDifference: priceDifference,
            exchangeReason: exchange.exchangeReason
          }
        };
        
        // Show the receipt modal
        this.showReceiptModal = true;
        
        // Show success message
        this.successMessage = `Exchange completed successfully! Bill #${this.receiptData.number}`;
        this.showSuccessMessage = true;
        setTimeout(() => this.showSuccessMessage = false, 5000);
      },
      error: (err) => {
        console.error('Error fetching new sale:', err);
        this.successMessage = 'Exchange completed successfully!';
        this.showSuccessMessage = true;
        setTimeout(() => this.showSuccessMessage = false, 5000);
      }
    });
  }

  /**
   * Toggle exchange search panel
   */
  toggleExchangeSearch(): void {
    this.showExchangeSearch = !this.showExchangeSearch;
    if (this.showExchangeSearch) {
      this.exchangeBarcodeInput = '';
      this.exchangeSearchError = '';
      this.scannedExchangeBarcodes = [];
      this.exchangeSuccessMessage = '';
      console.log('🧹 toggleExchangeSearch - Cleared scannedExchangeBarcodes');
    }
  }

  /**
   * Handle exchange barcode input change
   */
  onExchangeBarcodeChange(value: string): void {
    this.exchangeBarcodeInput = value;
  }

  /**
   * Search for a sale by scanning product barcode
   */
  searchSaleByBarcode(barcodeNumber: string): void {
    if (!barcodeNumber || !barcodeNumber.trim()) {
      this.exchangeSearchError = 'Please scan a product barcode';
      return;
    }

    // Check if already scanned
    if (this.scannedExchangeBarcodes.some(item => item.barcode === barcodeNumber)) {
      this.exchangeSuccessMessage = `✓ Barcode ${barcodeNumber} already added`;
      this.exchangeBarcodeInput = '';
      setTimeout(() => {
        this.exchangeSuccessMessage = '';
      }, 2000);
      return;
    }

    this.isSearchingSale = true;
    this.exchangeSearchError = '';
    this.exchangeSuccessMessage = '';

    // Lookup the barcode to get product details and verify it was sold
    this.appService.lookupBarcode(barcodeNumber).subscribe({
      next: (barcodeData: any) => {
        console.log('Barcode lookup response:', barcodeData);
        console.log('salePrice:', barcodeData.salePrice);
        console.log('price:', barcodeData.price);
        console.log('product:', barcodeData.product);
        
        if (!barcodeData || !barcodeData.product) {
          this.isSearchingSale = false;
          this.exchangeSearchError = `Barcode ${barcodeNumber} not found`;
          this.exchangeBarcodeInput = '';
          return;
        }

        // Check if this barcode has been sold
        this.appService.getBarcodeHistoryForBarcode(barcodeNumber).subscribe({
          next: (history) => {
            // Find the most recent SOLD event
            const soldEvent = history
              .filter(h => h.eventType === 'SOLD')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (!soldEvent || !soldEvent.referenceId) {
              this.isSearchingSale = false;
              this.exchangeSearchError = `Barcode ${barcodeNumber} has not been sold yet or sale information is not available.`;
              this.exchangeBarcodeInput = '';
              return;
            }

            // Add barcode with details to the list
            this.scannedExchangeBarcodes.push({
              barcode: barcodeNumber,
              productName: barcodeData.product.name,
              size: barcodeData.product.size || '',
              color: barcodeData.product.color || '',
              price: barcodeData.salePrice || 0
            });
            
            console.log('✅ Added barcode to scannedExchangeBarcodes:', barcodeNumber);
            console.log('📦 Total scanned barcodes:', this.scannedExchangeBarcodes.length);
            console.log('📋 Current array:', this.scannedExchangeBarcodes);
            
            this.exchangeSuccessMessage = `✓ Added ${barcodeData.product.name} (${this.scannedExchangeBarcodes.length} items)`;
            this.exchangeBarcodeInput = '';
            this.isSearchingSale = false;
            
            // Auto-hide success message
            setTimeout(() => {
              this.exchangeSuccessMessage = '';
            }, 2000);
          },
          error: (error) => {
            this.isSearchingSale = false;
            this.exchangeBarcodeInput = '';
            this.exchangeSearchError = 'Failed to verify barcode sale status. Please try again.';
          }
        });
      },
      error: (error) => {
        this.isSearchingSale = false;
        this.exchangeBarcodeInput = '';
        if (error.status === 404) {
          this.exchangeSearchError = `Barcode ${barcodeNumber} not found in system. Please check and try again.`;
        } else {
          this.exchangeSearchError = 'Failed to lookup barcode. Please try again.';
        }
      }
    });
  }

  /**
   * Remove a barcode from the scanned list
   */
  removeScannedBarcode(barcode: string): void {
    const index = this.scannedExchangeBarcodes.findIndex(item => item.barcode === barcode);
    if (index > -1) {
      this.scannedExchangeBarcodes.splice(index, 1);
    }
  }

  /**
   * Calculate total value of scanned exchange barcodes
   */
  getScannedBarcodesTotal(): number {
    return this.scannedExchangeBarcodes.reduce((sum, item) => sum + item.price, 0);
  }

  /**
   * Get list of scanned barcode strings for exchange modal
   */
  getScannedBarcodesList(): string[] {
    return this.scannedExchangeBarcodes.map(item => item.barcode);
  }

  /**
   * Proceed with exchange after scanning all barcodes
   */
  proceedWithExchange(): void {
    if (this.scannedExchangeBarcodes.length === 0) {
      this.exchangeSearchError = 'Please scan at least one barcode';
      return;
    }

    this.isSearchingSale = true;
    
    // First, verify all barcodes belong to the same sale
    const barcodeNumbers = this.getScannedBarcodesList();
    console.log('Verifying all barcodes belong to the same sale:', barcodeNumbers);
    
    // Check the first barcode to find the sale
    const firstBarcode = this.scannedExchangeBarcodes[0].barcode;
    
    this.appService.getBarcodeHistoryForBarcode(firstBarcode).subscribe({
      next: (history) => {
        const soldEvent = history
          .filter(h => h.eventType === 'SOLD')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!soldEvent || !soldEvent.referenceId) {
          this.isSearchingSale = false;
          this.exchangeSearchError = 'Unable to find sale information.';
          return;
        }

        const saleId = soldEvent.referenceId.toString();
        console.log(`First barcode ${firstBarcode} belongs to sale #${saleId}`);
        
        // Verify all other barcodes belong to the same sale
        let verificationCount = 0;
        let allBelongToSameSale = true;
        
        // If only one barcode, skip verification
        if (barcodeNumbers.length === 1) {
          this.fetchAndShowSale(saleId);
          return;
        }
        
        // Verify each barcode
        barcodeNumbers.forEach((barcode, index) => {
          if (index === 0) {
            verificationCount++;
            return; // Skip first barcode, already checked
          }
          
          this.appService.getBarcodeHistoryForBarcode(barcode).subscribe({
            next: (hist) => {
              const sold = hist
                .filter(h => h.eventType === 'SOLD')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              
              if (!sold || !sold.referenceId || sold.referenceId.toString() !== saleId) {
                console.error(`Barcode ${barcode} does not belong to sale #${saleId}`);
                allBelongToSameSale = false;
              }
              
              verificationCount++;
              if (verificationCount === barcodeNumbers.length) {
                if (allBelongToSameSale) {
                  console.log('All barcodes verified to belong to the same sale');
                  this.fetchAndShowSale(saleId);
                } else {
                  this.isSearchingSale = false;
                  this.exchangeSearchError = 'The scanned barcodes belong to different sales. Please scan items from the same purchase.';
                }
              }
            },
            error: () => {
              verificationCount++;
              allBelongToSameSale = false;
              if (verificationCount === barcodeNumbers.length) {
                this.isSearchingSale = false;
                this.exchangeSearchError = 'Error verifying barcodes. Please try again.';
              }
            }
          });
        });
      },
      error: () => {
        this.isSearchingSale = false;
        this.exchangeSearchError = 'Error finding sale. Please try again.';
      }
    });
  }

  /**
   * Fetch and display the sale in exchange modal
   */
  private fetchAndShowSale(saleId: string): void {
    console.log('🔍 fetchAndShowSale called with saleId:', saleId);
    console.log('📦 Current scannedExchangeBarcodes:', this.scannedExchangeBarcodes);
    console.log('📋 Barcodes to pass to modal:', this.getScannedBarcodesList());
    
    // CRITICAL: Create a snapshot of the scanned barcodes BEFORE anything else
    // This prevents the array from being cleared during modal lifecycle
    this.exchangeBarcodesSnapshot = [...this.getScannedBarcodesList()];
    console.log('💾 Saved barcodes snapshot:', this.exchangeBarcodesSnapshot);
    
    // IMPORTANT: Don't close the search modal yet - keep the scannedBarcodes data
    // this.showExchangeSearch = false; // Move this AFTER setting exchange sale
    
    this.appService.getSaleById(saleId).subscribe({
      next: (sale) => {
        console.log('=== Fetched Sale for Exchange ===');
        console.log('Sale ID:', sale.id);
        console.log('Sale Items with Barcodes:', sale.items.map(item => ({
          product: item.product.name,
          productId: item.product.id,
          productIdType: typeof item.product.id,
          barcodes: item.barcodes,
          barcodePrices: item.barcodePrices,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })));
        console.log('Scanned Barcodes to Match:', this.getScannedBarcodesList());
        console.log('Scanned Barcodes Types:', this.getScannedBarcodesList().map(b => typeof b));
        console.log('=================================');
        
        this.exchangeSale = sale;
        this.showExchangeModal = true;
        // Close search modal AFTER setting exchange modal data
        this.showExchangeSearch = false;
        this.isSearchingSale = false;
      },
      error: (error) => {
        this.isSearchingSale = false;
        if (error.status === 404) {
          this.exchangeSearchError = 'Sale not found. Please try again.';
        } else if (error.status === 403) {
          this.exchangeSearchError = 'You do not have permission to access this sale.';
        } else {
          this.exchangeSearchError = 'Failed to fetch sale. Please try again.';
        }
      }
    });
  }

  /**
   * Show price edit modal with barcode details
   */
  showPriceEditModalForBarcode(barcodeInfo: any, currentPrice: number): void {
    this.priceEditBarcode = {
      barcodeId: barcodeInfo.id,
      barcodeNumber: barcodeInfo.barcodeNumber,
      productName: barcodeInfo.product.name,
      size: barcodeInfo.product.size || 'N/A',
      color: barcodeInfo.product.color || 'N/A',
      currentPrice: currentPrice
    };
    this.newPrice = currentPrice;
    this.pendingBarcodeInfo = barcodeInfo;
    this.showPriceEditModal = true;
  }

  /**
   * Close price edit modal
   */
  closePriceEditModal(): void {
    this.showPriceEditModal = false;
    this.priceEditBarcode = null;
    this.newPrice = 0;
    this.pendingBarcodeInfo = null;
    this.barcodeInput = '';
    this.isProcessingBarcode = false;
  }

  /**
   * Update barcode price in system
   */
  async updateBarcodePrice(): Promise<void> {
    if (!this.priceEditBarcode || !this.newPrice || this.newPrice <= 0) {
      return;
    }

    this.isUpdatingPrice = true;

    try {
      // Use the existing method which takes purchasePrice, salePrice, originalPrice
      // We only update salePrice, so pass null for others
      await this.appService.updateBarcodePrice(
        this.priceEditBarcode.barcodeId, 
        null as any, // purchasePrice - not updating
        this.newPrice, // salePrice - the price we're updating
        null as any // originalPrice - not updating
      ).toPromise();
      
      // Show success message
      this.successMessage = `Price updated to ₹${this.newPrice.toFixed(2)} for barcode ${this.priceEditBarcode.barcodeNumber}`;
      this.showSuccessMessage = true;
      setTimeout(() => this.showSuccessMessage = false, 3000);

      // Update the pending barcode info with new price
      if (this.pendingBarcodeInfo) {
        this.pendingBarcodeInfo.salePrice = this.newPrice;
      }

      // Close modal and proceed with adding to cart
      this.showPriceEditModal = false;
      await this.proceedToAddToCart();
    } catch (error: any) {
      alert(error?.error?.message || 'Failed to update barcode price. Please try again.');
    } finally {
      this.isUpdatingPrice = false;
    }
  }

  /**
   * Proceed without updating price (use existing system price)
   */
  async proceedWithoutPriceUpdate(): Promise<void> {
    this.showPriceEditModal = false;
    await this.proceedToAddToCart();
  }

  /**
   * Add the barcode to cart after price update/skip
   */
  private async proceedToAddToCart(): Promise<void> {
    if (!this.pendingBarcodeInfo) {
      this.barcodeInput = '';
      this.isProcessingBarcode = false;
      return;
    }

    const barcodeInfo = this.pendingBarcodeInfo;
    const barcodeNumber = barcodeInfo.barcodeNumber;
    
    try {
      const user = this.authService.getCurrentUser();
      if (!user || !user.locationId) {
        alert('User location not found. Please contact administrator.');
        this.barcodeInput = '';
        this.isProcessingBarcode = false;
        return;
      }

      // Fetch location inventory for pricing
      const inventory = await this.appService
        .getInventoryByLocationAndSku(parseInt(user.locationId), barcodeInfo.product.sku)
        .toPromise();

      if (!inventory) {
        alert(`Product "${barcodeInfo.product.name}" inventory not found at this location.`);
        this.barcodeInput = '';
        this.isProcessingBarcode = false;
        return;
      }

      // Create product object from barcode info
      const product: Product = {
        id: barcodeInfo.product.id,
        name: barcodeInfo.product.name,
        sku: barcodeInfo.product.sku,
        size: barcodeInfo.product.size || '',
        color: barcodeInfo.product.color || '',
        category: 'shirts' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Use updated price (if updated) or barcode sale price or inventory price
      const unitPrice = barcodeInfo.salePrice || inventory.salePrice;

      // Get current app state
      const appState = this.appService.appStateBehaviorSubject.value;

      // Check if there's already an item for this product
      const existingProductItem = appState.currentSale.find(item => item.productId === product.id);

      if (existingProductItem && existingProductItem.barcodes) {
        // Add this barcode to existing item
        existingProductItem.barcodes.push(barcodeNumber);
        
        // Store individual barcode price
        if (!existingProductItem.barcodePrices) {
          existingProductItem.barcodePrices = {};
        }
        existingProductItem.barcodePrices[barcodeNumber] = unitPrice;
        
        // Update quantity
        existingProductItem.quantity = existingProductItem.barcodes.length;
        
        // Calculate total by summing all individual barcode prices
        existingProductItem.total = Object.values(existingProductItem.barcodePrices).reduce((sum, price) => sum + price, 0);
        
        // Update average price for display
        existingProductItem.price = existingProductItem.total / existingProductItem.quantity;
        
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
          barcodes: [barcodeNumber],
          barcodePrices: { [barcodeNumber]: unitPrice }
        };

        this.appService.addToSale(saleItem);
      }

      // Show success feedback
      this.showSuccessMessage = true;
      this.successMessage = `Added: ${product.name} (${barcodeNumber})`;
      setTimeout(() => this.showSuccessMessage = false, 2000);

      // Clear pending data
      this.pendingBarcodeInfo = null;
      this.priceEditBarcode = null;
      this.barcodeInput = '';

    } catch (error: any) {
      alert(error?.error?.message || 'Failed to process barcode. Please try again.');
      this.barcodeInput = '';
    } finally {
      this.isProcessingBarcode = false;
    }
  }
}
