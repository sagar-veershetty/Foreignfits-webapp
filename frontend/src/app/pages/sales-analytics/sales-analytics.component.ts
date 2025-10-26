import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale, SaleItem } from '../../core/models';

type Period = 'today' | 'week' | 'month' | 'custom';

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 space-y-6" *ngIf="state as s">
      <button class="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700" (click)="router.navigate(['/dashboard'])">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <span>Back to Overview</span>
      </button>

      <div class="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg">
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
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-2">
        <div class="text-gray-700 font-medium mr-2">Sales Period: {{ periodLabel }}</div>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('today')" (click)="setPeriod('today')">Today</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('week')" (click)="setPeriod('week')">This Week</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('month')" (click)="setPeriod('month')">This Month</button>
          <button class="px-3 py-1.5 rounded-lg" [ngClass]="btnClass('custom')" (click)="setPeriod('custom')">Custom</button>
        </div>
        <div *ngIf="period==='custom'" class="flex items-center gap-2 ml-2">
          <input type="date" [(ngModel)]="from" class="px-3 py-1.5 border border-gray-300 rounded-lg"/>
          <span class="text-gray-400">to</span>
          <input type="date" [(ngModel)]="to" class="px-3 py-1.5 border border-gray-300 rounded-lg"/>
          <button class="px-3 py-1.5 rounded-lg bg-gray-900 text-white" (click)="refresh()">Apply</button>
        </div>
        <div class="flex-1"></div>
        <select *ngIf="isAdmin()" [(ngModel)]="locationFilter" class="px-3 py-1.5 border border-gray-300 rounded-lg">
          <option value="all">All Locations</option>
          <option *ngFor="let location of s.locations" [value]="location.id">{{ location.name }} ({{ location.type }})</option>
        </select>
        <select [(ngModel)]="paymentFilter" class="px-3 py-1.5 border border-gray-300 rounded-lg">
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
        <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" (click)="exportCsv()">Export CSV</button>
      </div>

      <!-- KPI Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <!-- Payment Methods and Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div class="text-gray-900 font-semibold mb-3">Payment Methods</div>
          <div *ngIf="payments.length; else noPay" class="space-y-1 text-sm">
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
          <div *ngIf="topProducts.length; else noTop" class="space-y-1 text-sm">
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
                <th class="px-3 py-2 text-right">Subtotal</th>
                <th class="px-3 py-2 text-right">Tax</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-left">Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filtered" class="border-t">
                <td class="px-3 py-2">{{ s.createdAt | date:'short' }}</td>
                <td class="px-3 py-2">#{{ s.id }}</td>
                <td class="px-3 py-2">{{ s.items.length }}</td>
                <td class="px-3 py-2 text-right">₹{{ s.subtotal | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">₹{{ s.tax | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">₹{{ s.total | number:'1.2-2' }}</td>
                <td class="px-3 py-2 capitalize">{{ s.paymentMethod }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SalesAnalyticsComponent implements OnInit {
  state: AppState | null = null;
  period: Period = 'today';
  from = '';
  to = '';
  paymentFilter: 'all'|'cash'|'card'|'other' = 'all';
  locationFilter: string = 'all'; // Location filter for ADMIN
  showDetails = false;

  constructor(
    public router: Router, 
    private app: AppService,
    private authService: AuthService
  ) {
    this.app.appState$.subscribe(s => { this.state = s; });
  }

  ngOnInit(): void {
    this.app.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.app.loadInitialData().subscribe({
          error: (e) => console.error('SalesAnalytics: initial data load failed', e)
        });
      }
    });
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

  setPeriod(p: Period) {
    this.period = p;
    if (p !== 'custom') { this.from = this.to = ''; }
  }

  refresh() {}

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

  get filtered(): Sale[] {
    if (!this.state) return [];
    let sales = this.state.sales;
    
    // Filter by date
    sales = sales.filter((s: Sale) => this.inRange(new Date(s.createdAt)));
    
    // Filter by payment method
    if (this.paymentFilter !== 'all') {
      sales = sales.filter((s: Sale) => s.paymentMethod === this.paymentFilter);
    }
    
    // Filter by location (ADMIN only)
    if (this.isAdmin() && this.locationFilter !== 'all') {
      sales = sales.filter(sale => {
        // Check if any item in the sale belongs to the selected location
        return sale.items?.some(item => item.product.locationId?.toString() === this.locationFilter);
      });
    }
    
    return sales;
  }

  get totalRevenue(): number {
    return this.filtered.reduce((sum, s) => sum + s.total, 0);
  }
  get avgOrder(): number { return this.filtered.length ? this.totalRevenue / this.filtered.length : 0; }
  get itemsSold(): number { return this.filtered.reduce((sum, s) => sum + s.items.reduce((n,i)=>n+i.quantity,0), 0); }

  get payments(): Array<{method:string; count:number}> {
    const map: Record<string, number> = {};
    this.filtered.forEach(s => { map[s.paymentMethod] = (map[s.paymentMethod]||0)+1; });
    return Object.entries(map).map(([method,count])=>({method,count}));
  }

  get topProducts(): Array<{ name:string; revenue:number }> {
    const map: Record<string, {name:string; revenue:number}> = {};
    this.filtered.forEach(s => s.items.forEach((it: SaleItem)=>{
      const id = it.product.id;
      if(!map[id]) map[id] = { name: it.product.name, revenue: 0 };
      map[id].revenue += it.total;
    }));
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
  }

  exportCsv() {
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
