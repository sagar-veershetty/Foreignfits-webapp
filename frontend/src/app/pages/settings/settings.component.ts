import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>

      <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 class="text-sm font-medium text-gray-700 mb-2">Dashboard Auto-Refresh</h2>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600" for="refreshInterval">Interval (seconds)</label>
          <input id="refreshInterval" type="number" min="5" [(ngModel)]="intervalSec" class="w-24 px-2 py-1 border border-gray-300 rounded" />
          <button (click)="applyInterval()" class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Apply</button>
          <button (click)="stopRefresh()" class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">Stop</button>
        </div>
        <p class="text-xs text-gray-500 mt-2">Controls the polling used to keep dashboard stats fresh.</p>
      </div>

      <!-- Discount Feature Toggle — Admin Only -->
      <div *ngIf="isAdmin" class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 class="text-sm font-medium text-gray-700 mb-1">Instant Discount Feature</h2>
        <p class="text-xs text-gray-500 mb-3">
          When enabled, customers automatically receive 10–15% off on purchases ≥ ₹5,000.
          Disabling this stops discounts from being applied at the time of sale.
          Coupon codes are not affected by this setting.
        </p>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">Status:</span>
          <span *ngIf="discountEnabled" class="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Enabled</span>
          <span *ngIf="!discountEnabled" class="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Disabled</span>
          <button
            *ngIf="discountEnabled"
            (click)="toggleDiscount(false)"
            [disabled]="discountLoading"
            class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50">
            {{ discountLoading ? 'Saving…' : 'Disable Discounts' }}
          </button>
          <button
            *ngIf="!discountEnabled"
            (click)="toggleDiscount(true)"
            [disabled]="discountLoading"
            class="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50">
            {{ discountLoading ? 'Saving…' : 'Enable Discounts' }}
          </button>
        </div>
        <p *ngIf="discountMessage" class="text-xs mt-2"
           [ngClass]="discountEnabled ? 'text-green-600' : 'text-red-600'">
          {{ discountMessage }}
        </p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 class="text-sm font-medium text-gray-700 mb-2">About</h2>
        <p class="text-sm text-gray-600">Foreign Fits Dashboard UI — configurable refresh and navigation.</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 class="text-sm font-medium text-gray-700 mb-3">Account</h2>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">{{ currentUserName }}</div>
            <div class="text-xs text-gray-500">{{ currentUserRole }}</div>
          </div>
          <button (click)="logout()" class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Logout</button>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  intervalSec = 10;
  discountEnabled = true;
  discountLoading = false;
  discountMessage = '';

  constructor(private appService: AppService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.appService.getDiscountEnabled().subscribe({
      next: enabled => this.discountEnabled = enabled,
      error: () => this.discountEnabled = true
    });
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  toggleDiscount(enabled: boolean): void {
    this.discountLoading = true;
    this.discountMessage = '';
    this.appService.setDiscountEnabled(enabled).subscribe({
      next: () => {
        this.discountEnabled = enabled;
        this.discountMessage = `Instant discounts ${enabled ? 'enabled' : 'disabled'} successfully.`;
        this.discountLoading = false;
      },
      error: () => {
        this.discountMessage = 'Failed to update discount setting. Please try again.';
        this.discountLoading = false;
      }
    });
  }

  applyInterval() {
    const ms = Math.max(5, this.intervalSec) * 1000;
    this.appService.startAutoRefresh(ms);
    alert(`Auto-refresh set to ${this.intervalSec}s`);
  }

  stopRefresh() {
    this.appService.stopAutoRefresh();
    alert('Auto-refresh stopped');
  }

  get currentUserName(): string {
    return this.authService.getCurrentUser()?.name || 'User';
  }

  get currentUserRole(): string {
    return this.authService.getCurrentUser()?.role || 'guest';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

