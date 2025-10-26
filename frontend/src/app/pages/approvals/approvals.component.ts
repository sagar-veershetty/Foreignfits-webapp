import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, StockMovement, Product } from '../../core/models';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';

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
          <!-- All roles can see Stock Movements -->
          <button
            (click)="activeTab.set('stock-movements')"
            [class]="activeTab() === 'stock-movements' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Pending Stock Movements
            <span *ngIf="pendingMovementsCount() > 0" 
                  class="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {{ pendingMovementsCount() }}
            </span>
          </button>
          
          <!-- Admin and Sales can see Pending Users -->
          <button
            *ngIf="canSeePendingUsers()"
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
          
          <!-- Only Admin can see All Users -->
          <button
            *ngIf="isAdmin()"
            (click)="activeTab.set('all-users')"
            [class]="activeTab() === 'all-users' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            All Users
          </button>
        </nav>
      </div>

      <!-- Pending Stock Movements Tab -->
      <div *ngIf="activeTab() === 'stock-movements'" class="space-y-4">
        <div *ngIf="pendingMovements().length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No pending stock movement approvals
        </div>

        <div *ngFor="let movement of pendingMovements()" class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span [class]="'px-3 py-1 rounded-full text-xs font-medium ' + getMovementTypeClass(movement.type)">
                  {{ getMovementTypeLabel(movement.type) }}
                </span>
                <span [class]="'ml-2 px-3 py-1 rounded-full text-xs font-medium ' + getMovementStatusClass(movement)">
                  {{ getMovementStatus(movement) }}
                </span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">{{ movement.product.name }}</h3>
              <p class="text-sm text-gray-600">
                SKU: {{ movement.product.sku }} | Category: {{ movement.product.category }} | Size: {{ movement.product.size }}
              </p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold" [class.text-green-600]="movement.quantity > 0" [class.text-red-600]="movement.quantity < 0">
                {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
              </div>
              <div class="text-sm text-gray-600">
                {{ movement.previousStock }} → {{ movement.newStock }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">Reason:</span>
              <span class="text-gray-900 ml-2">{{ movement.reason }}</span>
            </div>
            <div *ngIf="movement.reference">
              <span class="font-medium text-gray-700">Reference:</span>
              <span class="text-gray-900 ml-2">{{ movement.reference }}</span>
            </div>
            <div *ngIf="movement.fromLocation">
              <span class="font-medium text-gray-700">From:</span>
              <span class="text-gray-900 ml-2">{{ movement.fromLocation.name }}</span>
            </div>
            <div *ngIf="movement.toLocation">
              <span class="font-medium text-gray-700">To:</span>
              <span class="text-gray-900 ml-2">{{ movement.toLocation.name }}</span>
            </div>
            <!-- Location field removed - all movements now have fromLocation and toLocation -->
            <div>
              <span class="font-medium text-gray-700">Created By:</span>
              <span class="text-gray-900 ml-2">{{ movement.createdBy }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Created At:</span>
              <span class="text-gray-900 ml-2">{{ formatDate(movement.createdAt) }}</span>
            </div>
          </div>

          <!-- Show action buttons based on permissions -->
          <div *ngIf="canApproveThisMovement(movement) || canRejectThisMovement(movement)" class="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              *ngIf="canApproveThisMovement(movement)"
              (click)="approveMovement(movement.id)"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Approve
            </button>
            <button 
              *ngIf="canRejectThisMovement(movement)"
              (click)="rejectMovement(movement.id)"
              [class]="canApproveThisMovement(movement) ? 'flex-1' : 'w-full'"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ canApproveThisMovement(movement) ? 'Reject' : 'Cancel' }}
            </button>
          </div>

          <!-- Show read-only message if user cannot approve or reject -->
          <div *ngIf="!canApproveThisMovement(movement) && !canRejectThisMovement(movement)" class="pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-500 italic text-center">
              <svg class="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Awaiting approval from destination location
            </p>
          </div>
        </div>
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
export class ApprovalsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private appService = inject(AppService);
  public authService = inject(AuthService);
  private routerSubscription?: Subscription;
  
  activeTab = signal<'stock-movements' | 'users' | 'all-users'>('stock-movements');
  pendingUsers = signal<User[]>([]);
  allUsers = signal<User[]>([]);
  pendingMovements = signal<StockMovement[]>([]);
  currentUser = signal<User | null>(null);
  
  pendingUsersCount = computed(() => this.pendingUsers().length);
  // Backend now filters movements, so count all returned movements
  pendingMovementsCount = computed(() => this.pendingMovements().length);

  ngOnInit() {
    this.loadCurrentUser();
    this.loadPendingMovements();
    this.loadPendingUsers();
    this.loadAllUsers();
    
    // Listen to navigation events and reload data when returning to this component
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/approvals')) {
          console.log('Approvals: Refreshing data on navigation');
          this.loadPendingMovements();
          this.loadPendingUsers();
          this.loadAllUsers();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadPendingUsers() {
    if (!this.canSeePendingUsers()) {
      return; // Don't load if user can't see this tab
    }
    this.http.get<User[]>(`${environment.apiUrl}/admin/pending-users`).subscribe({
      next: (users) => {
        // Admin sees all, Sales sees only their location
        if (this.isAdmin()) {
          this.pendingUsers.set(users);
        } else {
          const currentUser = this.currentUser();
          const filtered = users.filter(u => u.locationId === currentUser?.locationId);
          this.pendingUsers.set(filtered);
        }
      },
      error: (err) => console.error('Error loading pending users:', err)
    });
  }

  loadCurrentUser() {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
  }

  loadPendingMovements() {
    this.appService.getPendingStockMovements().subscribe({
      next: (movements: StockMovement[]) => this.pendingMovements.set(movements),
      error: (err: any) => console.error('Error loading pending movements:', err)
    });
  }

  loadAllUsers() {
    if (!this.isAdmin()) {
      return; // Only admin can see all users
    }
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

  // Stock Movement Methods
  approveMovement(movementId: string): void {
    if (confirm('Are you sure you want to approve this stock movement?')) {
      this.appService.approveStockMovement(movementId).subscribe({
        next: () => {
          alert('Stock movement approved successfully');
          this.loadPendingMovements();
        },
        error: (err: any) => {
          console.error('Error approving movement:', err);
          const errorMessage = err.error || 'Failed to approve stock movement';
          alert(errorMessage);
        }
      });
    }
  }

  rejectMovement(movementId: string): void {
    const reason = prompt('Please enter rejection reason:');
    if (reason && reason.trim()) {
      this.appService.rejectStockMovement(movementId, reason.trim()).subscribe({
        next: () => {
          alert('Stock movement rejected');
          this.loadPendingMovements();
        },
        error: (err: any) => {
          console.error('Error rejecting movement:', err);
          alert('Failed to reject stock movement');
        }
      });
    }
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'admin';
  }

  isSales(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'sales';
  }

  isWarehouse(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'warehouse';
  }

  // Tab visibility methods based on permissions (not roles)
  canSeePendingUsers(): boolean {
    // Users with approve users permission can see pending users
    return this.authService.canApproveUsers();
  }

  canApproveMovements(): boolean {
    return this.authService.canApproveStockMovements();
  }

  // Check if current user can approve a specific movement
  // For TRANSFERS: Can only approve if user is at destination (toLocation)
  // For NON-TRANSFERS: Can only approve if movement is at user's location
  // Cannot approve movements they created
  canApproveThisMovement(movement: StockMovement): boolean {
    const user = this.currentUser();
    
    // Must have general approval permission first
    if (!this.authService.canApproveStockMovements()) {
      return false;
    }
    
    if (!user?.locationId) {
      return false;
    }
    
    // Check if this is a TRANSFER movement (unified type) - case insensitive
    if (movement.type?.toLowerCase() === 'transfer' && movement.transferId && movement.toLocation) {
      // For transfers: Can ONLY approve if user is at destination location
      return movement.toLocation.id === user.locationId;
    }
    
    // Legacy transfer types (TRANSFER_IN/TRANSFER_OUT) - keep for backwards compatibility
    if (movement.transferId && movement.toLocation) {
      return movement.toLocation.id === user.locationId;
    } 
    
    // For non-transfer movements: Can approve if at their fromLocation or toLocation
    return movement.fromLocation?.id === user.locationId || 
           movement.toLocation?.id === user.locationId;
  }

  // Check if current user can reject a specific movement
  // For TRANSFERS: Source location (creator) can cancel, Destination can reject
  // For NON-TRANSFERS: Creator can reject their own, location can reject
  canRejectThisMovement(movement: StockMovement): boolean {
    const user = this.currentUser();
    
    // Must have general approval permission first
    if (!this.authService.canApproveStockMovements()) {
      return false;
    }
    
    if (!user?.locationId) {
      return false;
    }
    
    // Check if this is a TRANSFER movement (unified type) - case insensitive
    if (movement.type?.toLowerCase() === 'transfer' && movement.transferId) {
      if (movement.fromLocation && movement.toLocation) {
        // Source location (fromLocation) can cancel
        // Destination (toLocation) can reject
        return movement.fromLocation.id === user.locationId || 
               movement.toLocation.id === user.locationId;
      }
    }
    
    // Legacy transfer types (TRANSFER_IN/TRANSFER_OUT) - keep for backwards compatibility
    if (movement.transferId) {
      if (movement.fromLocation && movement.toLocation) {
        return movement.fromLocation.id === user.locationId || 
               movement.toLocation.id === user.locationId ||
               movement.createdBy === user.email;
      }
    }
    
    // For non-transfer movements: location OR creator can reject
    return movement.fromLocation?.id === user.locationId || 
           movement.toLocation?.id === user.locationId ||
           movement.createdBy === user.email;
  }

  getMovementTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'adjustment': return 'bg-yellow-100 text-yellow-800';
      case 'sale': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-green-100 text-green-800';
      case 'damage': return 'bg-red-100 text-red-800';
      case 'transfer_out': return 'bg-purple-100 text-purple-800';
      case 'transfer_in': return 'bg-indigo-100 text-indigo-800';
      case 'transfer': return 'bg-indigo-100 text-indigo-800';
      case 'restock': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getMovementTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'adjustment': return 'Adjustment';
      case 'sale': return 'Sale';
      case 'return': return 'Return';
      case 'damage': return 'Damage';
      case 'transfer_out': return 'Transfer Out';
      case 'transfer_in': return 'Transfer In';
      case 'transfer': return 'Transfer';
      case 'restock': return 'Restock';
      default: return type;
    }
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

  getMovementStatus(movement: StockMovement): string {
    if (movement.status === 'APPROVED') {
      return 'Approved';
    } else if (movement.status === 'REJECTED') {
      return 'Rejected';
    } else {
      return 'Pending';
    }
  }

  getMovementStatusClass(movement: StockMovement): string {
    if (movement.status === 'APPROVED') {
      return 'bg-green-100 text-green-800';
    } else if (movement.status === 'REJECTED') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
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
