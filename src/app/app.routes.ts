import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'signup', 
    loadComponent: () => import('./components/auth/signup.component').then(m => m.SignupComponent)
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
    data: { roles: ['admin','warehouse'] }
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
    path: 'customer', 
    loadComponent: () => import('./pages/customer/customer-app.component').then(m => m.CustomerAppComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
