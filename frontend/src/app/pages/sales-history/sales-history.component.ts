import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale, SalesPerson } from '../../core/models';
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
  appState$: Observable<AppState>;
  
  // Expose Math for template
  Math = Math;

  // Filters
  filterMode: 'all' | 'today' | 'week' | 'month' | 'range' = 'all';
  fromDate?: string; // yyyy-MM-dd
  toDate?: string;   // yyyy-MM-dd
  locationFilter: string = 'all'; // Location filter for ADMIN
  paymentFilter: string = 'all'; // Payment type filter (all, cash, card, upi)
  salesPersonFilter: string = 'all'; // Sales person filter for incentive tracking
  searchQuery: string = ''; // Search by Bill ID

  // Sale details modal
  showSaleDetails: boolean = false;
  selectedSale: Sale | null = null;

  // Receipt modal
  showReceiptModal = false;
  receiptData: ReceiptData | null = null;

  // Exchange modal
  showExchangeModal = false;
  exchangeSale: Sale | null = null;

  activeSalesPersons: SalesPerson[] = [];

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
    this.appService.refreshSales().subscribe({
      next: () => console.log('[SalesHistory] Sales refreshed successfully'),
      error: (err) => console.error('[SalesHistory] Error refreshing sales:', err)
    });
    
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
          this.appService.refreshSales().subscribe({
            next: () => console.log('[SalesHistory] Sales refreshed on navigation'),
            error: (err) => console.error('[SalesHistory] Error refreshing on navigation:', err)
          });
        }
      });

    // Load active sales persons for dropdown
    this.loadActiveSalesPersons();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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

  /**
   * Get the label for the display amount
   */
  getAmountLabel(sale: Sale): string {
    if (sale.isExchangeSale && sale.exchangePriceDifference != null) {
      return sale.exchangePriceDifference >= 0 ? 'Customer Paid' : 'Refunded';
    }
    return 'Total';
  }

  setFilter(mode: 'all' | 'today' | 'week' | 'month' | 'range'): void {
    this.filterMode = mode;
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
        return sale.salesPersonName?.trim() === this.salesPersonFilter;
      });
    }
    
    // Filter by date
    if (this.filterMode === 'all') return sales;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.filterMode === 'today') {
      return sales.filter(s => new Date(s.createdAt).getTime() >= startOfToday.getTime());
    }

    if (this.filterMode === 'week') {
      // Start of the current week (Mon) at 00:00
      const day = startOfToday.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day); // Sunday -> -6
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() + diffToMonday);
      return sales.filter(s => new Date(s.createdAt).getTime() >= startOfWeek.getTime());
    }

    if (this.filterMode === 'month') {
      // Start of the current month at 00:00
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return sales.filter(s => new Date(s.createdAt).getTime() >= startOfMonth.getTime());
    }

    if (this.filterMode === 'range' && this.fromDate && this.toDate) {
      const start = new Date(this.fromDate);
      const end = new Date(this.toDate);
      // Include the whole end day
      end.setHours(23, 59, 59, 999);
      return sales.filter(s => {
        const t = new Date(s.createdAt).getTime();
        return t >= start.getTime() && t <= end.getTime();
      });
    }

    return sales;
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
  }

  closeSaleDetails(): void {
    this.showSaleDetails = false;
    this.selectedSale = null;
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
      items: receiptItems,
      subtotal: this.selectedSale.subtotal,
      taxLabel: '5% GST (included)',
      tax: this.selectedSale.tax,
      total: this.selectedSale.total,
      paymentMethod: this.selectedSale.paymentMethod.toUpperCase()
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
