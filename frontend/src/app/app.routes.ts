import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/public-home/public-home.component').then(m => m.PublicHomeComponent)
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
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
    path: 'agent-signup', 
    loadComponent: () => import('./components/auth/agent-signup.component').then(m => m.AgentSignupComponent)
    // No guard - allow anyone to access agent signup
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
    path: 'product-groups', 
    loadComponent: () => import('./pages/product-groups/product-groups.component').then(m => m.ProductGroupsComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','warehouse'] }
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
    path: 'expenses', 
    loadComponent: () => import('./pages/expenses/expenses.component').then(m => m.ExpensesComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','sales_manager','sales'] }
  },
  { 
    path: 'sales-person-management', 
    loadComponent: () => import('./pages/sales-person-management/sales-person-management.component').then(m => m.SalesPersonManagementComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/role.guard').then(m => m.roleGuard)
    ],
    data: { roles: ['admin','sales_manager','sales'] }
  },
  { 
    path: 'shipments', 
    loadComponent: () => import('./pages/shipments/shipments.component').then(m => m.ShipmentsComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard)
    ]
  },
  { 
    path: 'shipments/create', 
    loadComponent: () => import('./pages/shipments/shipment-form.component').then(m => m.ShipmentFormComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard)
    ]
  },
  { 
    path: 'shipments/:id', 
    loadComponent: () => import('./pages/shipments/shipment-form.component').then(m => m.ShipmentFormComponent),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard)
    ]
  },
  { 
    path: 'customer', 
    loadComponent: () => import('./pages/customer/customer-app.component').then(m => m.CustomerAppComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
