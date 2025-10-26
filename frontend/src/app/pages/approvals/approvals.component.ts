import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models';

interface Sale {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  soldBy?: User;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Pending Approvals</h1>
      
      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            (click)="activeTab.set('users')"
            [class]="activeTab() === 'users' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Pending Users
            <span *ngIf="pendingUsersCount() > 0" 
                  class="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {{ pendingUsersCount() }}
            </span>
          </button>
          <button
            (click)="activeTab.set('sales')"
            [class]="activeTab() === 'sales' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Pending Sales
            <span *ngIf="pendingSalesCount() > 0" 
                  class="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {{ pendingSalesCount() }}
            </span>
          </button>
          <button
            (click)="activeTab.set('all-users')"
            [class]="activeTab() === 'all-users' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            All Users
          </button>
        </nav>
      </div>

      <!-- Pending Users Tab -->
      <div *ngIf="activeTab() === 'users'" class="bg-white rounded-lg shadow overflow-hidden">
        <div *ngIf="pendingUsers().length === 0" class="p-8 text-center text-gray-500">
          No pending user approvals
        </div>
        <div *ngIf="pendingUsers().length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of pendingUsers()">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getRoleBadgeClass(user.role)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.locationName || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    (click)="approveUser(user.id)"
                    class="text-green-600 hover:text-green-900 mr-3">
                    Approve
                  </button>
                  <button 
                    (click)="rejectUser(user.id)"
                    class="text-red-600 hover:text-red-900">
                    Reject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pending Sales Tab -->
      <div *ngIf="activeTab() === 'sales'" class="bg-white rounded-lg shadow overflow-hidden">
        <div *ngIf="pendingSales().length === 0" class="p-8 text-center text-gray-500">
          No pending sale approvals
        </div>
        <div *ngIf="pendingSales().length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold By</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let sale of pendingSales()">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{{ sale.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ sale.customerName || 'Walk-in' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  ₹{{ sale.total | number:'1.2-2' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {{ sale.paymentMethod }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ sale.soldBy?.name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(sale.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    (click)="approveSale(sale.id)"
                    class="text-green-600 hover:text-green-900 mr-3">
                    Approve
                  </button>
                  <button 
                    (click)="rejectSale(sale.id)"
                    class="text-red-600 hover:text-red-900">
                    Reject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- All Users Tab -->
      <div *ngIf="activeTab() === 'all-users'" class="bg-white rounded-lg shadow overflow-hidden">
        <div *ngIf="allUsers().length === 0" class="p-8 text-center text-gray-500">
          No users found
        </div>
        <div *ngIf="allUsers().length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of allUsers()">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getRoleBadgeClass(user.role)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.locationName || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    *ngIf="!user.isActive"
                    (click)="approveUser(user.id)"
                    class="text-green-600 hover:text-green-900 mr-3">
                    Activate
                  </button>
                  <button 
                    *ngIf="user.isActive"
                    (click)="rejectUser(user.id)"
                    class="text-red-600 hover:text-red-900">
                    Deactivate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ApprovalsComponent implements OnInit {
  private http = inject(HttpClient);
  
  activeTab = signal<'users' | 'sales' | 'all-users'>('users');
  pendingUsers = signal<User[]>([]);
  pendingSales = signal<Sale[]>([]);
  allUsers = signal<User[]>([]);
  
  pendingUsersCount = computed(() => this.pendingUsers().length);
  pendingSalesCount = computed(() => this.pendingSales().length);

  ngOnInit() {
    this.loadPendingUsers();
    this.loadPendingSales();
    this.loadAllUsers();
  }

  loadPendingUsers() {
    this.http.get<User[]>(`${environment.apiUrl}/admin/pending-users`).subscribe({
      next: (users) => this.pendingUsers.set(users),
      error: (err) => console.error('Error loading pending users:', err)
    });
  }

  loadPendingSales() {
    this.http.get<Sale[]>(`${environment.apiUrl}/admin/pending-sales`).subscribe({
      next: (sales) => this.pendingSales.set(sales),
      error: (err) => console.error('Error loading pending sales:', err)
    });
  }

  loadAllUsers() {
    this.http.get<User[]>(`${environment.apiUrl}/admin/all-users`).subscribe({
      next: (users) => this.allUsers.set(users),
      error: (err) => console.error('Error loading all users:', err)
    });
  }

  approveUser(userId: string) {
    this.http.post(`${environment.apiUrl}/admin/approve-user/${userId}`, {}).subscribe({
      next: () => {
        alert('User approved successfully');
        this.loadPendingUsers();
        this.loadAllUsers();
      },
      error: (err) => alert('Error approving user: ' + (err.error?.error || 'Unknown error'))
    });
  }

  rejectUser(userId: string) {
    this.http.post(`${environment.apiUrl}/admin/reject-user/${userId}`, {}).subscribe({
      next: () => {
        alert('User deactivated successfully');
        this.loadPendingUsers();
        this.loadAllUsers();
      },
      error: (err) => alert('Error deactivating user: ' + (err.error?.error || 'Unknown error'))
    });
  }

  approveSale(saleId: string) {
    this.http.post(`${environment.apiUrl}/admin/approve-sale/${saleId}`, {}).subscribe({
      next: () => {
        alert('Sale approved successfully');
        this.loadPendingSales();
      },
      error: (err) => alert('Error approving sale: ' + (err.error?.error || 'Unknown error'))
    });
  }

  rejectSale(saleId: string) {
    this.http.post(`${environment.apiUrl}/admin/reject-sale/${saleId}`, {}).subscribe({
      next: () => {
        alert('Sale rejected successfully');
        this.loadPendingSales();
      },
      error: (err) => alert('Error rejecting sale: ' + (err.error?.error || 'Unknown error'))
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'sales':
        return 'bg-blue-100 text-blue-800';
      case 'warehouse':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateInput: string | Date): string {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
