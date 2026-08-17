import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale, SaleItem, SalesPerson } from '../../core/models';
import { PrintReceiptComponent } from '../sales/print-receipt.component';
import { ReceiptData, ReceiptItem } from '../sales/receipt.model';
import { ExchangeModalComponent } from '../../components/sales/exchange-modal.component';
import { SalesPersonService } from '../../core/services/sales-person.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, PrintReceiptComponent, ExchangeModalComponent],
  templateUrl: './sales-history.component.html'
})
export class SalesHistoryComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  private refreshSubscription?: Subscription;
  appState$: Observable<AppState>;

  private readonly gstin = '29CBIPV3211R1ZW';
  
  // Expose Math for template
  Math = Math;

  // Filters — default to 'today' so only today's sales are fetched on page load
  filterMode: 'all' | 'today' | 'week' | 'month' | 'range' = 'today';
  fromDate?: string; // yyyy-MM-dd
  toDate?: string;   // yyyy-MM-dd
  locationFilter: string = 'all'; // Location filter for ADMIN
  paymentFilter: string = 'all'; // Payment type filter (all, cash, card, upi)
  salesPersonFilter: string = 'all'; // Sales person filter for incentive tracking
  searchQuery: string = ''; // Search by Bill ID

  // Sale details modal
  showSaleDetails: boolean = false;
  selectedSale: Sale | null = null;

  // Collect payment form
  collectPaymentAmount = 0;
  collectPaymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER' = 'CASH';
  collectPaymentReference = '';
  collectPaymentError = '';
  collectPaymentSuccess = '';
  isCollectingPayment = false;

  editingPaymentId: string | null = null;
  editingPaymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER' = 'CASH';
  updatePaymentError = '';
  updatePaymentSuccess = '';
  isUpdatingPayment = false;
  showPaymentToast = false;
  paymentToastMessage = '';

  // Receipt modal
  showReceiptModal = false;
  receiptData: ReceiptData | null = null;

  // Exchange modal
  showExchangeModal = false;
  exchangeSale: Sale | null = null;

  activeSalesPersons: SalesPerson[] = [];
  isLoadingSales = false;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private salesPersonService: SalesPersonService,
    private router: Router
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    console.log('[SalesHistory] Component initialized');
    
    // Always refresh sales when visiting this page
    console.log('[SalesHistory] Refreshing sales data...');
    this.refreshSalesData();
    
    // Also ensure initial data is loaded if not already (for first visit after page refresh)
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        console.log('[SalesHistory] Loading initial data for first time...');
        this.appService.loadInitialData().subscribe();
      }
    });
    
    // Listen to navigation events and reload sales when returning to this component
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        console.log('[SalesHistory] Navigation event:', event.url);
        if (event.url.includes('/sales-history')) {
          console.log('[SalesHistory] Navigated to sales-history, refreshing sales...');
          this.refreshSalesData();
        }
      });

    // Load active sales persons for dropdown
    this.loadActiveSalesPersons();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  isAdmin(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  // Get only store locations (exclude warehouses) for admin dropdown
  getStoreLocations(appState: AppState) {
    return appState.locations.filter(loc => loc.type === 'store');
  }

  // Get unique sales person names for dropdown filter
  getUniqueSalesPersons(appState: AppState): string[] {
    const salesPersons = new Set<string>();
    appState.sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (item.salesPersonName && item.salesPersonName.trim()) {
          salesPersons.add(item.salesPersonName.trim());
        }
      });
      if (sale.salesPersonName && sale.salesPersonName.trim()) {
        salesPersons.add(sale.salesPersonName.trim());
      }
    });
    return Array.from(salesPersons).sort();
  }

  getSalesPersonOptions(appState: AppState): string[] {
    if (this.activeSalesPersons.length > 0) {
      const user = this.authService.getCurrentUser();
      const locationId = user?.locationId ? Number(user.locationId) : null;

      const filtered = this.activeSalesPersons
        .filter(person => this.isAdmin() || !locationId || person.locationId === locationId || person.locationId == null)
        .map(person => person.name)
        .filter(name => !!name && name.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));

      if (filtered.length > 0) {
        return filtered;
      }

      return this.activeSalesPersons
        .map(person => person.name)
        .filter(name => !!name && name.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));
    }

    return this.getUniqueSalesPersons(appState);
  }

  private loadActiveSalesPersons(): void {
    this.salesPersonService.getActiveSalesPersons().subscribe({
      next: (salesPersons) => {
        this.activeSalesPersons = salesPersons || [];
      },
      error: (err) => {
        console.error('[SalesHistory] Failed to load active sales persons', err);
        this.activeSalesPersons = [];
      }
    });
  }

  private refreshSalesData(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.isLoadingSales = true;

    // Pick how many days to fetch based on the current filter
    let days = 1; // today
    if (this.filterMode === 'week') days = 7;
    else if (this.filterMode === 'month') days = 31;
    else if (this.filterMode === 'range') days = 90;
    else if (this.filterMode === 'all') {
      this.refreshSubscription = this.appService.refreshAllSales().subscribe({
        next: () => {
          console.log('[SalesHistory] All sales loaded');
          this.isLoadingSales = false;
        },
        error: (err) => {
          console.error('[SalesHistory] Error loading all sales:', err);
          this.isLoadingSales = false;
        }
      });
      return;
    }

    this.refreshSubscription = this.appService.refreshSales(days).subscribe({
      next: () => {
        console.log(`[SalesHistory] Sales refreshed (${days} days)`);
        this.isLoadingSales = false;
      },
      error: (err) => {
        console.error('[SalesHistory] Error refreshing sales:', err);
        this.isLoadingSales = false;
      }
    });
  }

  getPaymentMethodClass(method: string): string {
    const classes = {
      cash: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      card: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      other: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
    };
    return classes[method as keyof typeof classes] || classes.other;
  }

  /**
   * Check if a sale has split payments
   */
  hasSplitPayment(sale: Sale): boolean {
    return !!(sale.payments && sale.payments.length > 1);
  }

  /**
   * Format split payment display
   */
  formatSplitPayment(sale: Sale): string {
    if (!sale.payments || sale.payments.length === 0) {
      return sale.paymentMethod.toUpperCase();
    }
    
    if (sale.payments.length === 1) {
      return sale.payments[0].paymentMethod;
    }
    
    // Multiple payments - show as "CASH ₹500 + CARD ₹500"
    return sale.payments
      .map(p => `${p.paymentMethod} ₹${p.amount.toFixed(0)}`)
      .join(' + ');
  }

  /**
   * Get the display amount for a sale
   * For exchange sales, shows the difference amount customer paid/received
   * For regular sales, shows the total
   */
  getDisplayAmount(sale: Sale): number {
    // Debug logging
    if (sale.isExchangeSale) {
      console.log('🔍 Exchange Sale Display:', {
        saleId: sale.id,
        isExchangeSale: sale.isExchangeSale,
        exchangeId: sale.exchangeId,
        exchangePriceDifference: sale.exchangePriceDifference,
        total: sale.total,
        willDisplay: sale.exchangePriceDifference != null ? Math.abs(sale.exchangePriceDifference) : sale.total
      });
    }
    
    if (sale.isExchangeSale && sale.exchangePriceDifference != null) {
      return Math.abs(sale.exchangePriceDifference);
    }
    return sale.total;
  }

  getPaidAmount(sale: Sale): number {
    if (sale.paidAmount != null) {
      return sale.paidAmount;
    }

    if (sale.payments && sale.payments.length > 0) {
      return sale.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }

    return sale.total;
  }

  getPendingAmount(sale: Sale): number {
    if (sale.pendingAmount != null) {
      return sale.pendingAmount;
    }

    const pending = sale.total - this.getPaidAmount(sale);
    return pending > 0 ? pending : 0;
  }

  getPaymentStatusLabel(sale: Sale): string {
    if (sale.paymentStatus) {
      return sale.paymentStatus.replace('_', ' ');
    }

    const pending = this.getPendingAmount(sale);
    if (pending > 0) {
      return 'PARTIALLY PAID';
    }

    return 'PAID';
  }

  getSalesPersonSummary(sale: Sale): Array<{ name: string; items: number; quantity: number }> {
    const summary = new Map<string, { items: number; quantity: number }>();

    (sale.items || []).forEach(item => {
      const name = item.salesPersonName || sale.salesPersonName || 'Unassigned';
      const existing = summary.get(name) || { items: 0, quantity: 0 };
      existing.items += 1;
      existing.quantity += item.quantity || 0;
      summary.set(name, existing);
    });

    return Array.from(summary.entries()).map(([name, stats]) => ({
      name,
      items: stats.items,
      quantity: stats.quantity
    }));
  }

  getSalesPersonNames(sale: Sale): string[] {
    const names = new Set<string>();
    (sale.items || []).forEach(item => {
      if (item.salesPersonName && item.salesPersonName.trim()) {
        names.add(item.salesPersonName.trim());
      }
    });

    if (sale.salesPersonName && sale.salesPersonName.trim()) {
      names.add(sale.salesPersonName.trim());
    }

    return Array.from(names);
  }

  getSaleUnits(sale: Sale): number {
    return (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getFilteredUnitsCount(appState: AppState): number {
    return this.getFilteredSales(appState).reduce((sum, sale) => sum + this.getSaleUnits(sale), 0);
  }

  startEditPayment(paymentId?: string, paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'OTHER'): void {
    if (!paymentId) return;
    this.editingPaymentId = paymentId;
    this.editingPaymentMethod = this.normalizePaymentMethod(paymentMethod);
    this.updatePaymentError = '';
    this.updatePaymentSuccess = '';
  }

  startEditSalePaymentMethod(paymentMethod?: string): void {
    this.editingPaymentId = 'sale';
    this.editingPaymentMethod = this.normalizePaymentMethod(paymentMethod);
    this.updatePaymentError = '';
    this.updatePaymentSuccess = '';
  }

  cancelEditPayment(): void {
    this.editingPaymentId = null;
    this.updatePaymentError = '';
    this.updatePaymentSuccess = '';
  }

  private triggerPaymentToast(message: string): void {
    this.paymentToastMessage = message;
    this.showPaymentToast = true;
    setTimeout(() => {
      this.showPaymentToast = false;
    }, 2500);
  }

  private normalizePaymentMethod(paymentMethod?: string): 'CASH' | 'CARD' | 'UPI' | 'OTHER' {
    const normalized = (paymentMethod || '').toUpperCase();
    if (normalized === 'CASH' || normalized === 'CARD' || normalized === 'UPI' || normalized === 'OTHER') {
      return normalized as 'CASH' | 'CARD' | 'UPI' | 'OTHER';
    }
    return 'CASH';
  }

  savePaymentMethod(sale: Sale, paymentId?: string): void {
    if (!paymentId) return;

    this.isUpdatingPayment = true;
    this.updatePaymentError = '';
    this.updatePaymentSuccess = '';

    this.appService.updateSalePaymentMethod(sale.id, paymentId, this.editingPaymentMethod)
      .subscribe({
        next: (updatedSale) => {
          this.selectedSale = updatedSale;
          this.editingPaymentId = null;
          this.updatePaymentSuccess = 'Payment method updated.';
          this.appService.refreshSales().subscribe();
        },
        error: (err) => {
          const message = err?.error?.error || err?.error?.message || 'Failed to update payment method.';
          this.updatePaymentError = message;
          this.isUpdatingPayment = false;
        },
        complete: () => {
          this.isUpdatingPayment = false;
        }
      });
  }

  /**
   * Get the label for the display amount
   */
  getAmountLabel(sale: Sale): string {
    if (sale.isExchangeSale && sale.exchangePriceDifference != null) {
      return sale.exchangePriceDifference >= 0 ? 'Customer Paid' : 'Refunded';
    }
    return 'Total';
  }

  /**
   * Returns per-barcode rows for an item so each barcode shows its own price.
   * Falls back to the item average price if barcodePrices map is absent.
   */
  getBarcodeRows(item: SaleItem): Array<{ barcode: string; price: number }> {
    if (!item.barcodes || item.barcodes.length === 0) {
      return [{ barcode: '', price: item.price }];
    }
    return item.barcodes.map(b => ({
      barcode: b,
      price: item.barcodePrices?.[b] ?? item.price
    }));
  }

  /**
   * Returns true if an item has barcodes with different prices (needs expanded rows).
   */
  hasVariedPrices(item: SaleItem): boolean {
    if (!item.barcodes || item.barcodes.length <= 1 || !item.barcodePrices) return false;
    const prices = item.barcodes.map(b => item.barcodePrices![b] ?? item.price);
    return new Set(prices).size > 1;
  }

  setFilter(mode: 'all' | 'today' | 'week' | 'month' | 'range'): void {
    this.filterMode = mode;
    // Re-fetch from backend with the appropriate window
    this.refreshSalesData();
  }

  // Return filtered sales based on the selected filter
  getFilteredSales(appState: AppState) {
    let sales = appState.sales;
    
    const user = this.authService.getCurrentUser();
    
    // Filter by user's location for SALES users (they can only see their location's sales)
    if (user?.role === 'sales' && user?.locationId) {
      sales = sales.filter(sale => {
        // Check if the sale was made at the user's location
        return sale.location?.id?.toString() === user.locationId?.toString();
      });
    }
    // Filter by location (ADMIN only - for location dropdown selection)
    else if (this.isAdmin() && this.locationFilter !== 'all') {
      sales = sales.filter(sale => {
        // Check if the sale was made at the selected location
        return sale.location?.id?.toString() === this.locationFilter;
      });
    }
    
    // Filter by search query (Bill ID, Customer Name, or Mobile Number)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      sales = sales.filter(sale => {
        // Search by Bill ID
        const billIdMatch = sale.id.toLowerCase().includes(query) || 
                           sale.id.slice(0, 8).toLowerCase().includes(query);
        
        // Search by Customer Name
        const nameMatch = sale.customerName?.toLowerCase().includes(query) || false;
        
        // Search by Mobile Number (with or without country code)
        const phoneMatch = sale.customerPhone?.includes(query) || false;
        const fullPhoneMatch = sale.customerPhone && sale.customerCountryCode 
          ? (sale.customerCountryCode + sale.customerPhone).includes(query)
          : false;
        
        return billIdMatch || nameMatch || phoneMatch || fullPhoneMatch;
      });
    }
    
    // Filter by payment type
    if (this.paymentFilter !== 'all') {
      sales = sales.filter(sale => {
        // For split payments, check if any payment method matches the filter
        if (sale.payments && sale.payments.length > 0) {
          return sale.payments.some(payment => 
            payment.paymentMethod.toLowerCase() === this.paymentFilter.toLowerCase()
          );
        }
        // For single payments, check the paymentMethod field
        return sale.paymentMethod.toLowerCase() === this.paymentFilter.toLowerCase();
      });
    }
    
    // Filter by sales person name (for incentive tracking)
    if (this.salesPersonFilter !== 'all') {
      sales = sales.filter(sale => {
        const matchesItem = (sale.items || []).some(item => item.salesPersonName?.trim() === this.salesPersonFilter);
        const matchesSale = sale.salesPersonName?.trim() === this.salesPersonFilter;
        return matchesItem || matchesSale;
      });
    }
    
    // Filter by date
    let filtered = sales;

    if (this.filterMode !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (this.filterMode === 'today') {
        filtered = sales.filter(s => new Date(s.createdAt).getTime() >= startOfToday.getTime());
      } else if (this.filterMode === 'week') {
        // Start of the current week (Mon) at 00:00
        const day = startOfToday.getDay();
        const diffToMonday = (day === 0 ? -6 : 1 - day); // Sunday -> -6
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() + diffToMonday);
        filtered = sales.filter(s => new Date(s.createdAt).getTime() >= startOfWeek.getTime());
      } else if (this.filterMode === 'month') {
        // Start of the current month at 00:00
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = sales.filter(s => new Date(s.createdAt).getTime() >= startOfMonth.getTime());
      } else if (this.filterMode === 'range' && this.fromDate && this.toDate) {
        const start = new Date(this.fromDate);
        const end = new Date(this.toDate);
        // Include the whole end day
        end.setHours(23, 59, 59, 999);
        filtered = sales.filter(s => {
          const t = new Date(s.createdAt).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
      }
    }

    return filtered.sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);

      if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
        return bId - aId;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  saveSalePaymentMethod(sale: Sale): void {
    this.isUpdatingPayment = true;
    this.updatePaymentError = '';
    this.updatePaymentSuccess = '';

    this.appService.updateSalePaymentMethodOnly(sale.id, this.editingPaymentMethod)
      .subscribe({
        next: (updatedSale) => {
          this.selectedSale = updatedSale;
          this.editingPaymentId = null;
          this.updatePaymentSuccess = 'Payment method updated.';
          this.triggerPaymentToast('Exchange payment method updated.');
          this.appService.refreshSales().subscribe();
        },
        error: (err) => {
          const message = err?.error?.error || err?.error?.message || 'Failed to update payment method.';
          this.updatePaymentError = message;
          this.isUpdatingPayment = false;
        },
        complete: () => {
          this.isUpdatingPayment = false;
        }
      });
  }

  getFilteredCount(appState: AppState): number {
    return this.getFilteredSales(appState).length;
  }

  getFilteredItemsCount(appState: AppState): number {
    return this.getFilteredSales(appState).reduce((sum, s) => sum + (s.items?.length || 0), 0);
  }

  getFilteredRevenue(appState: AppState): number {
    const filteredSales = this.getFilteredSales(appState);
    
    // If a payment filter is active, sum only the amounts paid by that method
    if (this.paymentFilter !== 'all') {
      return filteredSales.reduce((sum, sale) => {
        // For split payments, get the amount for the filtered payment method
        if (sale.payments && sale.payments.length > 0) {
          const matchingPayments = sale.payments.filter(p => 
            p.paymentMethod.toLowerCase() === this.paymentFilter.toLowerCase()
          );
          const paymentTotal = matchingPayments.reduce((pSum, p) => pSum + p.amount, 0);
          return sum + paymentTotal;
        }
        // For single payments, include the full total (use exchange difference when applicable)
        return sum + this.getDisplayAmount(sale);
      }, 0);
    }
    
    // If no payment filter, sum all sale totals
    return filteredSales.reduce((sum, s) => sum + this.getDisplayAmount(s), 0);
  }

  viewSaleDetails(sale: Sale): void {
    this.selectedSale = sale;
    this.showSaleDetails = true;

    this.collectPaymentAmount = this.getPendingAmount(sale);
    this.collectPaymentMethod = 'CASH';
    this.collectPaymentReference = '';
    this.collectPaymentError = '';
    this.collectPaymentSuccess = '';
  }

  closeSaleDetails(): void {
    this.showSaleDetails = false;
    this.selectedSale = null;
    this.collectPaymentError = '';
    this.collectPaymentSuccess = '';
  }

  recordFollowUpPayment(): void {
    if (!this.selectedSale) return;

    this.collectPaymentError = '';
    this.collectPaymentSuccess = '';

    const pending = this.getPendingAmount(this.selectedSale);
    if (this.collectPaymentAmount <= 0) {
      this.collectPaymentError = 'Payment amount must be greater than 0.';
      return;
    }

    if (this.collectPaymentAmount - pending > 0.01) {
      this.collectPaymentError = `Payment amount exceeds pending balance (₹${pending.toFixed(2)}).`;
      return;
    }

    this.isCollectingPayment = true;
    this.appService.collectSalePayment(this.selectedSale.id, {
      paymentMethod: this.collectPaymentMethod,
      amount: this.collectPaymentAmount,
      reference: this.collectPaymentReference?.trim() || undefined
    }).subscribe({
      next: (updatedSale) => {
        this.selectedSale = updatedSale;
        this.collectPaymentSuccess = 'Payment recorded successfully.';
        this.collectPaymentAmount = this.getPendingAmount(updatedSale);
        this.collectPaymentReference = '';

        // Refresh sales list to keep filters and totals in sync
        this.appService.refreshSales().subscribe();
      },
      error: (err) => {
        const message = err?.error?.error || err?.error?.message || 'Failed to record payment.';
        this.collectPaymentError = message;
        this.isCollectingPayment = false;
      },
      complete: () => {
        this.isCollectingPayment = false;
      }
    });
  }

  printSale(): void {
    if (!this.selectedSale) return;

    // Convert sale to receipt data
    const receiptItems: ReceiptItem[] = this.selectedSale.items.map(item => ({
      name: item.product.name,
      details: `${item.product.size} – ${item.product.color}`,
      qty: item.quantity,
      price: item.price
    }));

    this.receiptData = {
      number: this.selectedSale.id || 'N/A',
      date: this.selectedSale.createdAt.toLocaleDateString('en-GB'),
      time: this.selectedSale.createdAt.toLocaleTimeString('en-GB'),
      customer: this.selectedSale.customerName || 'Walk-in Customer',
      gstin: this.gstin,
      items: receiptItems,
      subtotal: this.selectedSale.subtotal,
  taxLabel: 'GST (5% included)',
      tax: this.selectedSale.tax,
      total: this.selectedSale.total,
      paymentMethod: this.selectedSale.paymentMethod.toUpperCase(),
      paidAmount: this.getPaidAmount(this.selectedSale),
      pendingAmount: this.getPendingAmount(this.selectedSale)
    };

    // Close sale details modal and open receipt modal
    this.showSaleDetails = false;
    this.showReceiptModal = true;
  }

  openExchangeModal(sale: Sale): void {
    this.exchangeSale = sale;
    this.showExchangeModal = true;
    this.showSaleDetails = false; // Close sale details if open
  }

  closeExchangeModal(): void {
    this.showExchangeModal = false;
    this.exchangeSale = null;
  }

  onExchangeCreated(): void {
    // Reload sales data to reflect the exchange
    this.appService.loadInitialData().subscribe();
    this.closeExchangeModal();
  }
  deleteSale(sale: Sale): void {
    const billId = sale.id.slice(0, 8).toUpperCase();
    const confirmed = confirm(
      `Are you sure you want to delete this sale?\n\n` +
      `Bill ID: #${billId}\n` +
      `Customer: ${sale.customerName || 'Walk-in Customer'}\n` +
      `Total: ₹${sale.total.toFixed(2)}\n\n` +
      `This action cannot be undone!`
    );
    
    if (!confirmed) return;
    
    this.appService.deleteSale(sale.id).subscribe({
      next: () => {
        alert(`Sale #${billId} deleted successfully!`);
        this.appService.refreshSales().subscribe();
      },
      error: (err: any) => {
        alert(`Failed to delete sale: ${err.error?.error || err.message}`);
      }
    });
  }

}
