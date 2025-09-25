import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-history.component.html'
})
export class SalesHistoryComponent {
  appState$: Observable<AppState>;

  // Filters
  filterMode: 'all' | 'today' | 'week' | 'range' = 'all';
  fromDate?: string; // yyyy-MM-dd
  toDate?: string;   // yyyy-MM-dd

  constructor(private appService: AppService) {
    this.appState$ = this.appService.appState$;
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
    const sales = appState.sales;
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
}
