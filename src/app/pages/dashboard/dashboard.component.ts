import { Component, OnInit } from '@angular/core';
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
export class DashboardComponent implements OnInit {
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
}
