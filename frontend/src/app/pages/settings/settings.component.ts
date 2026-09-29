import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Location } from '../../core/models';

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
          Configure a flat instant discount percentage for billing.
          When enabled, the same discount percentage is applied to eligible sales.
          Coupon codes are not affected by this setting.
        </p>
        <div class="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <label class="text-xs text-gray-600 block mb-1" for="discountPercent">Flat Discount %</label>
            <input
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              [(ngModel)]="discountPercent"
              [disabled]="discountLoading"
              class="w-28 px-2 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <button
            (click)="saveDiscountConfig()"
            [disabled]="discountLoading"
            class="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-50">
            {{ discountLoading ? 'Saving…' : 'Save Percentage' }}
          </button>
        </div>
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

      <!-- Warehouse Management — Admin Only -->
      <div *ngIf="isAdmin" class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
        <div>
          <h2 class="text-sm font-medium text-gray-700 mb-1">Warehouse Management</h2>
          <p class="text-xs text-gray-500">View current warehouses, add new warehouses, and delete unused warehouses.</p>
        </div>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-3" (ngSubmit)="addWarehouse()">
          <input
            type="text"
            [(ngModel)]="newWarehouse.name"
            name="warehouseName"
            placeholder="Warehouse name"
            class="px-3 py-2 border border-gray-300 rounded text-sm"
            required />
          <input
            type="text"
            [(ngModel)]="newWarehouse.phone"
            name="warehousePhone"
            placeholder="Phone (optional)"
            class="px-3 py-2 border border-gray-300 rounded text-sm" />
          <input
            type="text"
            [(ngModel)]="newWarehouse.address"
            name="warehouseAddress"
            placeholder="Address"
            class="px-3 py-2 border border-gray-300 rounded text-sm md:col-span-2"
            required />
          <input
            type="text"
            [(ngModel)]="newWarehouse.city"
            name="warehouseCity"
            placeholder="City"
            class="px-3 py-2 border border-gray-300 rounded text-sm"
            required />
          <input
            type="text"
            [(ngModel)]="newWarehouse.state"
            name="warehouseState"
            placeholder="State"
            class="px-3 py-2 border border-gray-300 rounded text-sm"
            required />
          <input
            type="text"
            [(ngModel)]="newWarehouse.zipCode"
            name="warehouseZip"
            placeholder="Zip Code"
            class="px-3 py-2 border border-gray-300 rounded text-sm"
            required />
          <input
            type="text"
            [(ngModel)]="newWarehouse.manager"
            name="warehouseManager"
            placeholder="Manager (optional)"
            class="px-3 py-2 border border-gray-300 rounded text-sm" />
          <input
            type="number"
            min="0"
            [(ngModel)]="newWarehouse.capacity"
            name="warehouseCapacity"
            placeholder="Capacity (optional)"
            class="px-3 py-2 border border-gray-300 rounded text-sm" />
          <div class="md:col-span-2 flex gap-2">
            <button
              type="submit"
              [disabled]="warehouseLoading"
              class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-50">
              {{ warehouseLoading ? 'Saving…' : 'Add Warehouse' }}
            </button>
            <button
              type="button"
              (click)="loadWarehouses()"
              [disabled]="warehouseLoading"
              class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm disabled:opacity-50">
              Refresh
            </button>
          </div>
        </form>

        <p *ngIf="warehouseMessage" class="text-xs" [ngClass]="warehouseMessageType === 'success' ? 'text-green-600' : 'text-red-600'">
          {{ warehouseMessage }}
        </p>

        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600">
            Active Warehouses ({{ warehouses.length }})
          </div>

          <div *ngIf="!warehouses.length" class="px-3 py-3 text-sm text-gray-500">
            No warehouses found.
          </div>

          <div *ngFor="let warehouse of warehouses" class="px-3 py-3 border-t border-gray-100 flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ warehouse.name }}</p>
              <p class="text-xs text-gray-500">{{ warehouse.address }}, {{ warehouse.city }}, {{ warehouse.state }} - {{ warehouse.zipCode }}</p>
              <p class="text-xs text-gray-500" *ngIf="warehouse.phone || warehouse.manager">
                <span *ngIf="warehouse.phone">📞 {{ warehouse.phone }}</span>
                <span *ngIf="warehouse.phone && warehouse.manager"> · </span>
                <span *ngIf="warehouse.manager">👤 {{ warehouse.manager }}</span>
              </p>
            </div>
            <button
              type="button"
              (click)="deleteWarehouse(warehouse)"
              [disabled]="warehouseLoading"
              class="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-xs disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
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
  discountPercent = 10;
  discountLoading = false;
  discountMessage = '';

  warehouses: Location[] = [];
  warehouseLoading = false;
  warehouseMessage = '';
  warehouseMessageType: 'success' | 'error' = 'success';

  newWarehouse: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    manager: string;
    capacity: number | null;
  } = {
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    manager: '',
    capacity: null
  };

  constructor(private appService: AppService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.appService.getDiscountConfig().subscribe({
      next: config => {
        this.discountEnabled = config.enabled;
        this.discountPercent = config.percentage;
      },
      error: () => {
        this.discountEnabled = true;
        this.discountPercent = 10;
      }
    });

    if (this.isAdmin) {
      this.loadWarehouses();
    }
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  toggleDiscount(enabled: boolean): void {
    this.saveDiscountConfig(enabled);
  }

  saveDiscountConfig(enabled: boolean = this.discountEnabled): void {
    if (this.discountPercent < 0 || this.discountPercent > 100) {
      this.discountMessage = 'Discount percentage must be between 0 and 100.';
      return;
    }

    this.discountLoading = true;
    this.discountMessage = '';
    this.appService.setDiscountConfig(enabled, Number(this.discountPercent)).subscribe({
      next: (res) => {
        this.discountEnabled = !!res.enabled;
        this.discountPercent = Number(res.percentage ?? this.discountPercent);
        this.discountMessage = `Instant discount ${this.discountEnabled ? 'enabled' : 'disabled'} at ${this.discountPercent}% successfully.`;
        this.discountLoading = false;
      },
      error: (error) => {
        this.discountMessage = error?.error?.error || 'Failed to update discount setting. Please try again.';
        this.discountLoading = false;
      }
    });
  }

  loadWarehouses(): void {
    if (!this.isAdmin) {
      return;
    }

    this.warehouseLoading = true;
    this.appService.getWarehouses().subscribe({
      next: (warehouses) => {
        this.warehouses = warehouses;
        this.warehouseLoading = false;
      },
      error: (error) => {
        this.warehouseMessageType = 'error';
        this.warehouseMessage = error?.error?.error || 'Failed to load warehouses.';
        this.warehouseLoading = false;
      }
    });
  }

  addWarehouse(): void {
    if (!this.isAdmin) {
      return;
    }

    this.warehouseLoading = true;
    this.warehouseMessage = '';

    this.appService.addWarehouse({
      name: this.newWarehouse.name,
      address: this.newWarehouse.address,
      city: this.newWarehouse.city,
      state: this.newWarehouse.state,
      zipCode: this.newWarehouse.zipCode,
      phone: this.newWarehouse.phone || undefined,
      manager: this.newWarehouse.manager || undefined,
      capacity: this.newWarehouse.capacity
    }).subscribe({
      next: () => {
        this.warehouseMessageType = 'success';
        this.warehouseMessage = 'Warehouse added successfully.';
        this.resetWarehouseForm();
        this.loadWarehouses();
      },
      error: (error) => {
        this.warehouseMessageType = 'error';
        this.warehouseMessage = error?.error?.error || 'Failed to add warehouse.';
        this.warehouseLoading = false;
      }
    });
  }

  deleteWarehouse(warehouse: Location): void {
    if (!this.isAdmin) {
      return;
    }

    const confirmed = confirm(`Delete warehouse "${warehouse.name}"?\n\nThis action only works when no active users or inventory are assigned.`);
    if (!confirmed) {
      return;
    }

    this.warehouseLoading = true;
    this.warehouseMessage = '';

    this.appService.deleteWarehouse(Number(warehouse.id)).subscribe({
      next: () => {
        this.warehouseMessageType = 'success';
        this.warehouseMessage = `Warehouse "${warehouse.name}" deleted successfully.`;
        this.loadWarehouses();
      },
      error: (error) => {
        this.warehouseMessageType = 'error';
        this.warehouseMessage = error?.error?.error || 'Failed to delete warehouse.';
        this.warehouseLoading = false;
      }
    });
  }

  private resetWarehouseForm(): void {
    this.newWarehouse = {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      manager: '',
      capacity: null
    };
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

