import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Sale } from '../../core/models';

@Component({
  selector: 'app-pending-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-payments.component.html'
})
export class PendingPaymentsComponent implements OnInit {
  appState$: Observable<AppState>;

  searchQuery = '';
  locationFilter: string = 'all';

  showCollectModal = false;
  selectedSale: Sale | null = null;
  collectPaymentAmount = 0;
  collectPaymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER' = 'CASH';
  collectPaymentReference = '';
  collectPaymentError = '';
  collectPaymentSuccess = '';
  isCollectingPayment = false;

  constructor(private appService: AppService, private authService: AuthService) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    this.appService.refreshSales().subscribe();

    this.appService.appState$.pipe(take(1)).subscribe(state => {
      if (!state.dataLoaded) {
        this.appService.loadInitialData().subscribe();
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  getStoreLocations(appState: AppState) {
    return appState.locations.filter(loc => loc.type === 'store');
  }

  getPendingSales(appState: AppState): Sale[] {
    const query = this.searchQuery.trim().toLowerCase();

    let sales = appState.sales.filter(sale => this.getPendingAmount(sale) > 0);

    if (!this.isAdmin()) {
      const userLocationId = this.authService.getCurrentUser()?.locationId;
      if (userLocationId) {
        sales = sales.filter(sale => sale.location?.id === userLocationId);
      }
    }

    if (this.locationFilter !== 'all') {
      sales = sales.filter(sale => sale.location?.id === this.locationFilter);
    }

    if (query) {
      sales = sales.filter(sale => {
        const billId = sale.id?.toLowerCase() || '';
        const customer = sale.customerName?.toLowerCase() || '';
        const phone = sale.customerPhone?.toLowerCase() || '';
        return billId.includes(query) || customer.includes(query) || phone.includes(query);
      });
    }

    return sales.sort((a, b) => {
      const pendingDiff = this.getPendingAmount(b) - this.getPendingAmount(a);
      if (Math.abs(pendingDiff) > 0.01) {
        return pendingDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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

  openCollectModal(sale: Sale): void {
    this.selectedSale = sale;
    this.collectPaymentAmount = this.getPendingAmount(sale);
    this.collectPaymentMethod = 'CASH';
    this.collectPaymentReference = '';
    this.collectPaymentError = '';
    this.collectPaymentSuccess = '';
    this.showCollectModal = true;
  }

  closeCollectModal(): void {
    this.showCollectModal = false;
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
}
