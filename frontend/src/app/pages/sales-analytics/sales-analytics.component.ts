import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { take, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale, SaleItem, SalesPerson } from '../../core/models';
import { SalesChartsComponent } from '../../components/sales-charts/sales-charts.component';
import { SalesPersonService } from '../../core/services/sales-person.service';

type Period = 'today' | 'week' | 'month' | 'custom';

type SalesPersonPerformance = {
  name: string;
  totalSales: number;
  totalItems: number;
  totalUnits: number;
  totalRevenue: number;
  avgOrder: number;
  coupon3000: number;
  coupon5000: number;
  coupon7500: number;
  coupon10000: number;
};

type SalesPersonHighlight = {
  name: string;
  totalSales: number;
  totalRevenue: number;
};

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesChartsComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6" *ngIf="appState$ | async as state">
      <button class="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mb-4" (click)="router.navigate(['/dashboard'])">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <span>Back to Overview</span>
      </button>

      <div class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">Sales Analytics</h1>
            <p class="text-purple-100">Foreign Fits – Global Fashion</p>
            <p class="text-purple-200 text-sm mt-1">Comprehensive sales data and insights</p>
          </div>
          <div class="p-3 bg-blue-500 rounded-full">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10"/></svg>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-2 mb-6">
        <div class="text-gray-700 font-medium mr-2">Sales Period: {{ periodLabel }}</div>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('today')" (click)="setPeriod('today'); updateData(state)">Today</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('week')" (click)="setPeriod('week'); updateData(state)">This Week</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('month')" (click)="setPeriod('month'); updateData(state)">This Month</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('custom')" (click)="setPeriod('custom')">Custom</button>
        </div>
        <div *ngIf="period==='custom'" class="flex items-center gap-2 ml-2">
          <input type="date" [(ngModel)]="from" class="px-3 py-1.5 border border-gray-300 rounded-lg"/>
          <span class="text-gray-400">to</span>
          <input type="date" [(ngModel)]="to" class="px-3 py-1.5 border border-gray-300 rounded-lg"/>
          <button class="px-3 py-1.5 rounded-lg bg-gray-900 text-white" (click)="updateData(state)">Apply</button>
        </div>
        <div class="flex-1"></div>
        <select *ngIf="isAdmin()" [(ngModel)]="locationFilter" (change)="updateData(state)" class="px-3 py-1.5 border border-gray-300 rounded-lg">
          <option value="all">All Locations</option>
          <option *ngFor="let location of state.locations" [value]="location.id">{{ location.name }} ({{ location.type }})</option>
        </select>
        <select [(ngModel)]="paymentFilter" (change)="updateData(state)" class="px-3 py-1.5 border border-gray-300 rounded-lg">
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="other">Other</option>
        </select>
        <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" (click)="exportCsv()">Export CSV</button>
      </div>

      <!-- KPI Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Total Sales</div>
          <div class="text-3xl font-bold text-gray-900">{{ filtered.length }}</div>
          <div class="text-xs text-blue-600 mt-1">Transactions</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Total Revenue</div>
          <div class="text-3xl font-bold text-green-600">₹{{ totalRevenue | number:'1.2-2' }}</div>
          <div class="text-xs text-green-600 mt-1">Gross sales</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Avg Order Value</div>
          <div class="text-3xl font-bold text-purple-600">₹{{ avgOrder | number:'1.2-2' }}</div>
          <div class="text-xs text-purple-600 mt-1">Per transaction</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Items Sold</div>
          <div class="text-3xl font-bold text-amber-600">{{ itemsSold }}</div>
          <div class="text-xs text-amber-600 mt-1">Total units</div>
        </div>
      </div>

      <!-- Sales Person Performance Highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Best Performer (This Week)</div>
          <div class="text-xl font-semibold text-gray-900 mt-1">
            {{ bestWeekPerformer?.name || '—' }}
          </div>
          <div class="text-xs text-gray-500 mt-2" *ngIf="bestWeekPerformer">
            ₹{{ bestWeekPerformer.totalRevenue | number:'1.2-2' }} • {{ bestWeekPerformer.totalSales }} sales
          </div>
          <div class="text-xs text-gray-400 mt-2" *ngIf="!bestWeekPerformer">No sales this week.</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Best Performer (This Month)</div>
          <div class="text-xl font-semibold text-gray-900 mt-1">
            {{ bestMonthPerformer?.name || '—' }}
          </div>
          <div class="text-xs text-gray-500 mt-2" *ngIf="bestMonthPerformer">
            ₹{{ bestMonthPerformer.totalRevenue | number:'1.2-2' }} • {{ bestMonthPerformer.totalSales }} sales
          </div>
          <div class="text-xs text-gray-400 mt-2" *ngIf="!bestMonthPerformer">No sales this month.</div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-sm text-gray-600">Most Number of Sales</div>
          <div class="text-xl font-semibold text-gray-900 mt-1">
            {{ mostSalesPerformer?.name || '—' }}
          </div>
          <div class="text-xs text-gray-500 mt-2" *ngIf="mostSalesPerformer">
            {{ mostSalesPerformer.totalSales }} sales • ₹{{ mostSalesPerformer.totalRevenue | number:'1.2-2' }}
          </div>
          <div class="text-xs text-gray-400 mt-2" *ngIf="!mostSalesPerformer">No sales found.</div>
        </div>
      </div>

      <!-- Sales Person Performance Grid -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-gray-900 font-semibold">Sales Person Performance</div>
          <div class="text-xs text-gray-500">Showing {{ salesPersonStats.length }} sales persons</div>
        </div>
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Sales Person</th>
                <th class="px-3 py-2 text-right">Total Sales</th>
                <th class="px-3 py-2 text-right">Items Sold</th>
                <th class="px-3 py-2 text-right">Units</th>
                <th class="px-3 py-2 text-right">Revenue</th>
                <th class="px-3 py-2 text-right">Avg Order</th>
                <th class="px-3 py-2 text-right">₹3,000+</th>
                <th class="px-3 py-2 text-right">₹5,000+</th>
                <th class="px-3 py-2 text-right">₹7,500+</th>
                <th class="px-3 py-2 text-right">₹10,000+</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let person of salesPersonStats" class="border-t">
                <td class="px-3 py-2 font-medium text-gray-900">{{ person.name }}</td>
                <td class="px-3 py-2 text-right">{{ person.totalSales }}</td>
                <td class="px-3 py-2 text-right">{{ person.totalItems }}</td>
                <td class="px-3 py-2 text-right">{{ person.totalUnits }}</td>
                <td class="px-3 py-2 text-right">₹{{ person.totalRevenue | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">₹{{ person.avgOrder | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">{{ person.coupon3000 }}</td>
                <td class="px-3 py-2 text-right">{{ person.coupon5000 }}</td>
                <td class="px-3 py-2 text-right">{{ person.coupon7500 }}</td>
                <td class="px-3 py-2 text-right">{{ person.coupon10000 }}</td>
              </tr>
              <tr *ngIf="salesPersonStats.length === 0">
                <td class="px-3 py-6 text-center text-gray-500" colspan="9">No sales person data available for this period.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sales Charts -->
      <app-sales-charts [sales]="filtered" [products]="state.products"></app-sales-charts>

      <!-- Payment Methods and Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-gray-900 font-semibold mb-3">Payment Methods</div>
          <div *ngIf="payments.length > 0; else noPay" class="space-y-1 text-sm">
            <div *ngFor="let p of payments" class="flex items-center justify-between">
              <span class="capitalize">{{ p.method }}</span>
              <span class="font-medium">{{ p.count }}</span>
            </div>
          </div>
          <ng-template #noPay>
            <div class="text-sm text-gray-500">No payment data available for selected period.</div>
          </ng-template>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-gray-900 font-semibold mb-3">Top Products by Revenue</div>
          <div *ngIf="topProducts.length > 0; else noTop" class="space-y-1 text-sm">
            <div *ngFor="let t of topProducts" class="flex items-center justify-between">
              <span class="truncate max-w-[220px]" [title]="t.name">{{ t.name }}</span>
              <span class="font-medium">₹{{ t.revenue | number:'1.2-2' }}</span>
            </div>
          </div>
          <ng-template #noTop>
            <div class="text-sm text-gray-500">No sales data available for selected period.</div>
          </ng-template>
        </div>
      </div>

      <!-- Details -->
      <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <div class="text-gray-900 font-semibold">Sales Details ({{ filtered.length }} transactions)</div>
          <button class="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm" (click)="showDetails = !showDetails">{{ showDetails ? 'Hide' : 'Show' }} Details</button>
        </div>
        <div *ngIf="showDetails" class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">ID</th>
                <th class="px-3 py-2 text-left">Items</th>
                <th class="px-3 py-2 text-left">Units</th>
                <th class="px-3 py-2 text-right">Subtotal</th>
                <th class="px-3 py-2 text-right">Tax</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-left">Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of filtered" class="border-t">
                <td class="px-3 py-2">{{ sale.createdAt | date:'short' }}</td>
                <td class="px-3 py-2">#{{ sale.id }}</td>
                <td class="px-3 py-2">{{ sale.items.length }}</td>
                <td class="px-3 py-2">{{ getSaleUnits(sale) }}</td>
                <td class="px-3 py-2 text-right">₹{{ sale.subtotal | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">₹{{ sale.tax | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">₹{{ sale.total | number:'1.2-2' }}</td>
                <td class="px-3 py-2 capitalize">{{ sale.paymentMethod }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SalesAnalyticsComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  appState$ = this.app.appState$;
  period: Period = 'today';
  from = '';
  to = '';
  paymentFilter: 'all'|'cash'|'card'|'upi'|'other' = 'all';
  locationFilter: string = 'all';
  showDetails = false;
  activeSalesPersons: SalesPerson[] = [];
  
  // Computed values (updated by updateData)
  filtered: Sale[] = [];
  totalRevenue = 0;
  avgOrder = 0;
  itemsSold = 0;
  payments: Array<{method: string; count: number}> = [];
  topProducts: Array<{name: string; revenue: number}> = [];
  salesPersonStats: SalesPersonPerformance[] = [];
  bestWeekPerformer: SalesPersonHighlight | null = null;
  bestMonthPerformer: SalesPersonHighlight | null = null;
  mostSalesPerformer: SalesPersonHighlight | null = null;

  constructor(
    public router: Router, 
    private app: AppService,
    private authService: AuthService,
    private salesPersonService: SalesPersonService
  ) {}

  ngOnInit(): void {
    // Load active sales persons
    this.loadActiveSalesPersons();
    
    // Load initial data
    this.app.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.app.loadInitialData().subscribe();
      } else {
        this.updateData(state);
      }
    });
    
    // Update data whenever state changes
    this.routerSubscription = this.app.appState$.subscribe(state => {
      if (state.dataLoaded) {
        this.updateData(state);
      }
    });
  }

  private loadActiveSalesPersons(): void {
    this.salesPersonService.getActiveSalesPersons().subscribe({
      next: (persons) => {
        this.activeSalesPersons = persons;
      },
      error: (error) => {
        console.error('Error loading active sales persons:', error);
        this.activeSalesPersons = [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateData(state: AppState): void {
    // Filter sales
    this.filtered = this.getFilteredSales(state);
    
    // Calculate metrics once
    this.totalRevenue = this.filtered.reduce((sum, s) => sum + s.total, 0);
    this.avgOrder = this.filtered.length ? this.totalRevenue / this.filtered.length : 0;
    this.itemsSold = this.filtered.reduce((sum, s) => 
      sum + s.items.reduce((n, i) => n + i.quantity, 0), 0
    );
    
    // Payment method distribution
    const paymentMap: Record<string, number> = {};
    this.filtered.forEach(s => {
      const method = s.paymentMethod.toLowerCase();
      paymentMap[method] = (paymentMap[method] || 0) + 1;
    });
    this.payments = Object.entries(paymentMap).map(([method, count]) => ({method, count}));
    
    // Top products by revenue
    const productMap: Record<string, {name: string; revenue: number}> = {};
    this.filtered.forEach(s => {
      s.items.forEach((it: SaleItem) => {
        const id = it.product.id;
        if (!productMap[id]) {
          productMap[id] = { name: it.product.name, revenue: 0 };
        }
        productMap[id].revenue += it.total;
      });
    });
    this.topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales person performance for current period
    this.salesPersonStats = this.computeSalesPersonStats(this.filtered);

    // Highlights for week/month and overall sales count
    const baseSales = this.applyNonDateFilters(state.sales);
    const weekSales = this.filterByPeriod(baseSales, 'week');
    const monthSales = this.filterByPeriod(baseSales, 'month');

    this.bestWeekPerformer = this.getTopSalesPerson(weekSales, 'revenue');
    this.bestMonthPerformer = this.getTopSalesPerson(monthSales, 'revenue');
    this.mostSalesPerformer = this.getTopSalesPerson(baseSales, 'count');
  }

  isAdmin(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  get periodLabel(): string {
    switch (this.period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Custom';
    }
  }

  btnClass(p: Period) {
    const active = this.period === p;
    return active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }

  setPeriod(p: Period): void {
    this.period = p;
    if (p !== 'custom') { 
      this.from = this.to = ''; 
    }
  }

  private inRange(d: Date): boolean {
    const now = new Date();
    if (this.period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.getTime() >= start.getTime();
    }
    if (this.period === 'week') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const day = startOfToday.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      const start = new Date(startOfToday);
      start.setDate(startOfToday.getDate() + diffToMonday);
      return d.getTime() >= start.getTime();
    }
    if (this.period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.getTime() >= start.getTime();
    }
    if (this.from && this.to) {
      const start = new Date(this.from);
      const end = new Date(this.to);
      end.setHours(23,59,59,999);
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    }
    return true;
  }

  private filterByPeriod(sales: Sale[], period: Period): Sale[] {
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return sales.filter(s => new Date(s.createdAt).getTime() >= start.getTime());
    }
    if (period === 'week') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const day = startOfToday.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      const start = new Date(startOfToday);
      start.setDate(startOfToday.getDate() + diffToMonday);
      return sales.filter(s => new Date(s.createdAt).getTime() >= start.getTime());
    }
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return sales.filter(s => new Date(s.createdAt).getTime() >= start.getTime());
    }
    return sales;
  }

  private applyNonDateFilters(sales: Sale[]): Sale[] {
    let filteredSales = sales;

    if (this.paymentFilter !== 'all') {
      filteredSales = filteredSales.filter((s: Sale) => s.paymentMethod.toLowerCase() === this.paymentFilter);
    }

    if (this.isAdmin() && this.locationFilter !== 'all') {
      filteredSales = filteredSales.filter(sale => sale.location?.id?.toString() === this.locationFilter);
    }

    return filteredSales;
  }

  getFilteredSales(state: AppState): Sale[] {
    if (!state) return [];
    let sales = this.applyNonDateFilters(state.sales);
    sales = sales.filter((s: Sale) => this.inRange(new Date(s.createdAt)));
    return sales;
  }

  private computeSalesPersonStats(sales: Sale[]): SalesPersonPerformance[] {
    const statsMap: Record<string, SalesPersonPerformance> = {};
    
    // Get the current user's location
    const currentUser = this.authService.getCurrentUser();
    const userLocationId = currentUser?.locationId;
    
    // Filter active sales persons by location (including null locationId persons)
    const relevantSalesPersons = this.activeSalesPersons.filter(person => 
      person.locationId === null || person.locationId === userLocationId || currentUser?.crossLocationAccess
    );
    
    // Create a map of sales person names (normalized) for quick lookup
    const activeSalesPersonNames = new Set(
      relevantSalesPersons.map(p => p.name.toLowerCase().trim())
    );
    const hasActiveSalesPersonFilter = activeSalesPersonNames.size > 0;
    
    sales.forEach(sale => {
  const perPersonTotals = new Map<string, { revenue: number; items: number; units: number }>();

      sale.items.forEach(item => {
        const name = item.salesPersonName?.trim() || 'Unassigned';
        const normalizedName = name.toLowerCase();

        // Only include sales from active sales persons when list is available
        if (hasActiveSalesPersonFilter && name !== 'Unassigned' && !activeSalesPersonNames.has(normalizedName)) {
          return;
        }

        const entry = perPersonTotals.get(name) || { revenue: 0, items: 0, units: 0 };
        entry.revenue += item.total || 0;
        entry.items += 1;
        entry.units += item.quantity || 0;
        perPersonTotals.set(name, entry);
      });

      perPersonTotals.forEach((entry, name) => {
        if (!statsMap[name]) {
          statsMap[name] = {
            name,
            totalSales: 0,
            totalItems: 0,
            totalUnits: 0,
            totalRevenue: 0,
            avgOrder: 0,
            coupon3000: 0,
            coupon5000: 0,
            coupon7500: 0,
            coupon10000: 0
          };
        }

        statsMap[name].totalSales += 1;
        statsMap[name].totalRevenue += entry.revenue;
  statsMap[name].totalItems += entry.items;
  statsMap[name].totalUnits += entry.units;

        if (entry.revenue >= 3000) statsMap[name].coupon3000 += 1;
        if (entry.revenue >= 5000) statsMap[name].coupon5000 += 1;
        if (entry.revenue >= 7500) statsMap[name].coupon7500 += 1;
        if (entry.revenue >= 10000) statsMap[name].coupon10000 += 1;
      });
    });

    return Object.values(statsMap)
      .map(stat => ({
        ...stat,
        avgOrder: stat.totalSales ? stat.totalRevenue / stat.totalSales : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private getTopSalesPerson(sales: Sale[], mode: 'revenue' | 'count'): SalesPersonHighlight | null {
    if (!sales.length) return null;
    const stats = this.computeSalesPersonStats(sales);
    if (!stats.length) return null;

    if (mode === 'count') {
      const topByCount = [...stats].sort((a, b) => b.totalSales - a.totalSales)[0];
      return {
        name: topByCount.name,
        totalSales: topByCount.totalSales,
        totalRevenue: topByCount.totalRevenue
      };
    }

    const topByRevenue = stats[0];
    return {
      name: topByRevenue.name,
      totalSales: topByRevenue.totalSales,
      totalRevenue: topByRevenue.totalRevenue
    };
  }

  getSaleUnits(sale: Sale): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  exportCsv(): void {
    const rows = [['Date','Id','Items','Subtotal','Tax','Total','Payment'] as string[]]
      .concat(this.filtered.map(s => [
        new Date(s.createdAt).toISOString(),
        String(s.id),
        String(s.items.length),
        String(s.subtotal),
        String(s.tax),
        String(s.total),
        s.paymentMethod
      ]));
    const csv = rows.map(r => r.map(v => '"'+v.replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_analytics.csv'; a.click(); URL.revokeObjectURL(url);
  }
}
