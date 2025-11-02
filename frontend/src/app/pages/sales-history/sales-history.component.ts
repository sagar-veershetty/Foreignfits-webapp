import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale } from '../../core/models';
import { PrintReceiptComponent } from '../sales/print-receipt.component';
import { ReceiptData, ReceiptItem } from '../sales/receipt.model';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule, PrintReceiptComponent],
  templateUrl: './sales-history.component.html'
})
export class SalesHistoryComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  appState$: Observable<AppState>;

  // Filters
  filterMode: 'all' | 'today' | 'week' | 'range' = 'all';
  fromDate?: string; // yyyy-MM-dd
  toDate?: string;   // yyyy-MM-dd
  locationFilter: string = 'all'; // Location filter for ADMIN
  searchQuery: string = ''; // Search by Bill ID

  // Sale details modal
  showSaleDetails: boolean = false;
  selectedSale: Sale | null = null;

  // Receipt modal
  showReceiptModal = false;
  receiptData: ReceiptData | null = null;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private router: Router
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    // Ensure initial data is loaded (especially important after page refresh)
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe({
          error: (e) => console.error('Sales History: initial data load failed', e)
        });
      }
    });
    
    // Listen to navigation events and reload data when returning to this component
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/sales-history')) {
          console.log('Sales History: Refreshing data on navigation');
          this.appService.loadInitialData().subscribe({
            error: (e) => console.error('Sales History: data refresh failed', e)
          });
        }
      });
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

  getPaymentMethodClass(method: string): string {
    const classes = {
      cash: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      card: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      other: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
    };
    return classes[method as keyof typeof classes] || classes.other;
  }

  setFilter(mode: 'all' | 'today' | 'week' | 'range'): void {
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
    return this.getFilteredSales(appState).reduce((sum, s) => sum + (s.total || 0), 0);
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
}
