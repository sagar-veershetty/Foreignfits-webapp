import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AppService, AppState } from '../../core/services/app.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  appState$: Observable<AppState>;

  constructor(
    private authService: AuthService,
    private appService: AppService,
    private router: Router
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    // Ensure initial data is loaded once after auth
    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe({
          error: (e) => console.error('Dashboard: initial data load failed', e)
        });
      }
    });

    // Start live auto-refresh (sales) for live stats
    this.appService.startAutoRefresh(10000);
  }

  ngOnDestroy(): void {
    this.appService.stopAutoRefresh();
  }

  getDashboardTitle(): string {
    const user = this.authService.getCurrentUser();
    switch (user?.role) {
      case 'admin': return 'Admin Dashboard';
      case 'sales': return 'Sales Dashboard';
      case 'warehouse': return 'Warehouse Dashboard';
      default: return 'Dashboard';
    }
  }

  getDashboardSubtitle(): string {
    const user = this.authService.getCurrentUser();
    switch (user?.role) {
      case 'admin': return 'Complete Business Overview';
      case 'sales': return 'Track your sales performance';
      case 'warehouse': return 'Inventory & Stock Management';
      default: return 'Business Overview';
    }
  }

  getStats(appState: AppState): DashboardStats {
    const today = new Date();
    const todaySales = appState.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    });

    return {
      totalProducts: appState.products.length,
      lowStockItems: appState.products.filter(p => p.stock <= p.minStock).length,
      todaySales: todaySales.length,
      totalRevenue: appState.sales.reduce((sum, sale) => sum + sale.total, 0),
    };
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getTopCategories(appState: AppState): Array<{ name: string; count: number; color: string }> {
    const counts: Record<string, number> = {};
    appState.sales.forEach(s => s.items.forEach(it => {
      const cat = it.product.category;
      counts[cat] = (counts[cat] || 0) + it.quantity;
    }));
    // Fallback: if no sales, show categories from products with 0
    if (Object.keys(counts).length === 0) {
      appState.products.forEach(p => { counts[p.category] = counts[p.category] || 0; });
    }
    const palette: Record<string, string> = {
      shirts: 'bg-purple-500',
      accessories: 'bg-pink-500',
      pants: 'bg-green-500',
      dresses: 'bg-yellow-500',
      jackets: 'bg-slate-500',
      shoes: 'bg-emerald-500'
    };
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, color: palette[name] || 'bg-gray-400' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  getLowStockProducts(appState: AppState) {
    return appState.products
      .filter(p => p.stock <= p.minStock)
      .sort((a, b) => (a.stock - a.minStock) - (b.stock - b.minStock))
      .slice(0, 3);
  }

  getRecentTransactions(appState: AppState) {
    return [...appState.sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }
}
