import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'login', 
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent),
    canActivate: [() => import('./core/guards/login.guard').then(m => m.loginGuard)]
  },
  { 
    path: 'signup', 
    loadComponent: () => import('./components/auth/signup.component').then(m => m.SignupComponent),
    canActivate: [() => import('./core/guards/login.guard').then(m => m.loginGuard)]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  { 
    path: 'inventory', 
    loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  {
    path: 'print-barcode',
    loadComponent: () => import('./pages/inventory/print-barcode.component').then(m => m.PrintBarcodeComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  { 
    path: 'sales', 
    loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','sales'] }
  },
  { 
    path: 'add-product', 
    loadComponent: () => import('./pages/add-product/add-product.component').then(m => m.AddProductComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin'] }
  },
  { 
    path: 'stock-movement', 
    loadComponent: () => import('./pages/stock-movement/stock-movement.component').then(m => m.StockMovementComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','warehouse'] }
  },
  { 
    path: 'sales-history', 
    loadComponent: () => import('./pages/sales-history/sales-history.component').then(m => m.SalesHistoryComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','sales'] }
  },
  { 
    path: 'sales-analytics', 
    loadComponent: () => import('./pages/sales-analytics/sales-analytics.component').then(m => m.SalesAnalyticsComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','sales'] }
  },
  { 
    path: 'barcode-history', 
    loadComponent: () => import('./pages/barcode-history/barcode-history.component').then(m => m.BarcodeHistoryComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','warehouse','sales'] }
  },
  { 
    path: 'approvals', 
    loadComponent: () => import('./pages/approvals/approvals.component').then(m => m.ApprovalsComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  { 
    path: 'customer', 
    loadComponent: () => import('./pages/customer/customer-app.component').then(m => m.CustomerAppComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
