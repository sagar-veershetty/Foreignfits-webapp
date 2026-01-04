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
  isMobileMenuOpen = false;

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
      id: 'barcode-history', 
      label: 'Barcode History', 
      route: '/barcode-history',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    { 
      id: 'expenses', 
      label: 'Expenses', 
      route: '/expenses',
      iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z'
    },
    { 
      id: 'sales-person-management', 
      label: 'Sales Team', 
      route: '/sales-person-management',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    { 
      id: 'shipments', 
      label: 'Shipments', 
      route: '/shipments',
      iconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
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
    
    // Special case: Shipping agents ONLY see Shipments tab
    if (user.role === 'shipping_agent_china' || user.role === 'shipping_agent_india') {
      tabs.push(this.tabs.find(t => t.id === 'shipments')!);
      return tabs.filter(t => t !== undefined);
    }
    
    // For all other roles (admin, sales, warehouse, etc.)
    
    // Dashboard - available to all non-shipping-agent users
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
    
    // Barcode History - available to users with view inventory permission
    if (this.authService.canViewProducts()) {
      tabs.push(this.tabs.find(t => t.id === 'barcode-history')!);
    }
    
    // Expenses - available to Admin, Sales Manager, and Sales users
    if (user.role === 'admin' || user.role === 'sales_manager' || user.role === 'sales') {
      tabs.push(this.tabs.find(t => t.id === 'expenses')!);
    }
    
    // Shipments - available to Admin only (shipping agents handled above)
    if (user.role === 'admin') {
      tabs.push(this.tabs.find(t => t.id === 'shipments')!);
    }
    
    // Approvals - available to all non-shipping-agent users (role-based filtering inside component)
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
    this.isMobileMenuOpen = false; // Close menu after navigation
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.isMobileMenuOpen = false;
  }
}
