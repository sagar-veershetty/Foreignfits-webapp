import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, AuthState } from '../../core/services/auth.service';

interface NavigationTab {
  id: string;
  label: string;
  route: string;
  iconPath: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  authState$: Observable<AuthState>;

  private tabs: NavigationTab[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      route: '/dashboard',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      route: '/inventory',
      iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    { 
      id: 'sales', 
      label: 'Sales', 
      route: '/sales',
      iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01'
    },
    { 
      id: 'sales-history', 
      label: 'Sales History', 
      route: '/sales-history',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    { 
      id: 'add-product', 
      label: 'Add Product', 
      route: '/add-product',
      iconPath: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
    },
    { 
      id: 'stock-movement', 
      label: 'Stock Movement', 
      route: '/stock-movement',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    { 
      id: 'approvals', 
      label: 'Approvals', 
      route: '/approvals',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
  ];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    this.authState$ = this.authService.authState$;
  }

  getFilteredTabs(): NavigationTab[] {
    const user = this.authService.getCurrentUser();
    
    // If user not loaded yet, return all tabs temporarily (will update reactively)
    if (!user || !user.permissions) {
      return this.tabs;
    }
    
    const tabs: NavigationTab[] = [];
    
    // Dashboard - available to all authenticated users
    tabs.push(this.tabs.find(t => t.id === 'dashboard')!);
    
    // Inventory - available to users with view products permission
    if (this.authService.canViewProducts()) {
      tabs.push(this.tabs.find(t => t.id === 'inventory')!);
    }
    
    // Sales (POS) - ONLY available to users who can CREATE sales (sales staff only)
    if (this.authService.canCreateSale()) {
      tabs.push(this.tabs.find(t => t.id === 'sales')!);
    }
    
    // Sales History - available to users with view sales history permission
    if (this.authService.canViewSalesHistory()) {
      tabs.push(this.tabs.find(t => t.id === 'sales-history')!);
    }
    
    // Add Product - available to users with add product permission (admin only)
    if (this.authService.canAddProduct()) {
      tabs.push(this.tabs.find(t => t.id === 'add-product')!);
    }
    
    // Stock Movement - available to users with view stock movements permission
    if (this.authService.canViewStockMovements()) {
      tabs.push(this.tabs.find(t => t.id === 'stock-movement')!);
    }
    
    // Approvals - available to all authenticated users (role-based filtering inside component)
    tabs.push(this.tabs.find(t => t.id === 'approvals')!);
    
    return tabs.filter(t => t !== undefined);
  }

  getTabClasses(route: string): string {
    const isActive = this.router.url === route;
    const baseClasses = 'tab-button';
    return `${baseClasses} ${isActive ? 'tab-button-active' : 'tab-button-inactive'}`;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
