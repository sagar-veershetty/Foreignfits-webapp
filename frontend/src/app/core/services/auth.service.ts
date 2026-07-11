import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = environment.apiUrl;
  
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private injector: Injector) {}

  initializeAuth(): void {
    const savedUser = localStorage.getItem('foreignfits_user');
    const savedToken = localStorage.getItem('foreignfits_token');
    
    if (savedUser && savedToken) {
      try {
        let user = JSON.parse(savedUser);
        
        // If user doesn't have permissions (old login), extract from token
        if (!user.permissions || user.permissions.length === 0) {
          try {
            const tokenPayload = JSON.parse(atob(savedToken.split('.')[1]));
            user.permissions = tokenPayload.permissions || [];
            user.crossLocationAccess = tokenPayload.crossLocationAccess || false;
            // Update localStorage with permissions
            localStorage.setItem('foreignfits_user', JSON.stringify(user));
          } catch (e) {
            // Could not extract permissions from token
          }
        }
        
        // Validate token by checking if it's still valid
        this.validateToken(user, savedToken);
      } catch (error) {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }
    } else {
      // No token found, ensure user is not authenticated
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }

  login(credentials: LoginCredentials): Observable<any> {
    this.updateAuthState({ ...this.authStateSubject.value, isLoading: true, error: null });

    return this.http.post<any>(`${this.API_BASE_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          const user = this.convertApiUserToUser(response.user);
          localStorage.setItem('foreignfits_token', response.token);
          localStorage.setItem('foreignfits_user', JSON.stringify(user));
          
          this.updateAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        }),
        catchError(error => {
          this.updateAuthState({
            ...this.authStateSubject.value,
            isLoading: false,
            error: error.error?.error || 'Login failed'
          });
          return throwError(() => error);
        })
      );
  }

  register(name: string, email: string, password: string, role: 'admin'|'sales'|'warehouse'|'sales_manager', locationId: number | null = null): Observable<any> {
    this.updateAuthState({ ...this.authStateSubject.value, isLoading: true, error: null });

    let body = new HttpParams()
      .set('name', name)
      .set('email', email)
      .set('password', password)
      .set('role', role.toUpperCase());
    
    // Add locationId only if it's not null
    if (locationId !== null) {
      body = body.set('locationId', locationId.toString());
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<any>(`${this.API_BASE_URL}/auth/register`, body.toString(), { headers })
      .pipe(
        tap(() => {
          this.updateAuthState({ ...this.authStateSubject.value, isLoading: false, error: null });
        }),
        catchError(error => {
          this.updateAuthState({ ...this.authStateSubject.value, isLoading: false, error: error.error?.error || 'Signup failed' });
          return throwError(() => error);
        })
      );
  }

  /**
   * Signup method for agent registration (supports shipping agent roles)
   */
  signup(data: { name: string; email: string; password: string; role: string }): Observable<any> {
    this.updateAuthState({ ...this.authStateSubject.value, isLoading: true, error: null });

    let body = new HttpParams()
      .set('name', data.name)
      .set('email', data.email)
      .set('password', data.password)
      .set('role', data.role);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<any>(`${this.API_BASE_URL}/auth/register`, body.toString(), { headers })
      .pipe(
        tap(() => {
          this.updateAuthState({ ...this.authStateSubject.value, isLoading: false, error: null });
        }),
        catchError(error => {
          this.updateAuthState({ ...this.authStateSubject.value, isLoading: false, error: error.error?.error || 'Signup failed' });
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearAuthData();
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    // Reset app data on logout using lazy injection to avoid circular dependency
    // AppService depends on AuthService, so we use Injector to get it dynamically
    try {
      // Import dynamically to avoid circular dependency at module level
      import('./app.service').then(({ AppService }) => {
        const appService = this.injector.get(AppService);
        appService.resetDataLoadedFlag();
      });
    } catch (error) {
      // Could not reset app data on logout
    }
    
    this.router.navigate(['/']);
  }

  clearError(): void {
    this.updateAuthState({
      ...this.authStateSubject.value,
      error: null
    });
  }

  getToken(): string | null {
    return localStorage.getItem('foreignfits_token');
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) {
      return false;
    }
    return permissions.some(p => user.permissions!.includes(p));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) {
      return false;
    }
    return permissions.every(p => user.permissions!.includes(p));
  }

  /**
   * Check if user has cross-location access (admin only)
   */
  hasCrossLocationAccess(): boolean {
    const user = this.getCurrentUser();
    return user?.crossLocationAccess === true;
  }

  // Convenience permission check methods for common operations
  canViewProducts(): boolean {
    return this.hasPermission('view:products');
  }

  canAddProduct(): boolean {
    return this.hasPermission('add:product');
  }

  canEditProduct(): boolean {
    return this.hasPermission('edit:product');
  }

  canDeleteProduct(): boolean {
    return this.hasPermission('delete:product');
  }

  canManageInventory(): boolean {
    return this.hasPermission('manage:inventory');
  }

  canViewSales(): boolean {
    return this.hasPermission('view:sales');
  }

  canCreateSale(): boolean {
    return this.hasPermission('create:sale');
  }

  canViewSalesHistory(): boolean {
    return this.hasPermission('view:sales_history');
  }

  canViewSalesAnalytics(): boolean {
    return this.hasPermission('view:sales_analytics');
  }

  canViewStockMovements(): boolean {
    return this.hasPermission('view:stock_movements');
  }

  canCreateStockMovement(): boolean {
    return this.hasPermission('create:stock_movement');
  }

  canAdjustStock(): boolean {
    return this.hasPermission('adjust:stock');
  }

  canApproveStockMovements(): boolean {
    return this.hasPermission('approve:stock_movement');
  }

  canApproveProducts(): boolean {
    return this.hasPermission('approve:product');
  }

  canRequestStockTransfer(): boolean {
    return this.hasPermission('request:stock_transfer');
  }

  canApproveStockTransfer(): boolean {
    return this.hasPermission('approve:stock_transfer');
  }

  canApproveUsers(): boolean {
    return this.hasPermission('approve:users');
  }

  canViewUsers(): boolean {
    return this.hasPermission('view:users');
  }

  canCompleteStockTransfer(): boolean {
    return this.hasPermission('complete:stock_transfer');
  }

  canManageUsers(): boolean {
    return this.hasPermission('create:user');
  }

  canManageSettings(): boolean {
    return this.hasPermission('manage:settings');
  }

  canViewLoyalty(): boolean {
    return this.hasPermission('view:loyalty');
  }

  canManageLoyalty(): boolean {
    return this.hasPermission('manage:loyalty');
  }

  canEarnLoyaltyPoints(): boolean {
    return this.hasPermission('earn:loyalty_points');
  }

  canRedeemLoyaltyPoints(): boolean {
    return this.hasPermission('redeem:loyalty_points');
  }

  canViewAttendance(): boolean {
    return this.hasPermission('view:attendance');
  }

  canManageAttendance(): boolean {
    return this.hasPermission('manage:attendance');
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    const user = localStorage.getItem('foreignfits_user');

    // If no token or user, not valid
    if (!token || !user) {
      return false;
    }

    try {
      // Parse JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      // Check if token is expired
      if (currentTime >= expirationTime) {
        // Token expired, clear auth data
        this.clearAuthData();
        this.updateAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token format, clear auth data
      this.clearAuthData();
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      return false;
    }
  }

  private updateAuthState(newState: AuthState): void {
    this.authStateSubject.next(newState);
  }

  private clearAuthData(): void {
    localStorage.removeItem('foreignfits_token');
    localStorage.removeItem('foreignfits_user');
  }

  private convertApiUserToUser(apiUser: any): User {
    return {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role.toLowerCase(),
      locationId: apiUser.locationId?.toString(),
      locationName: apiUser.locationName,
      avatar: apiUser.avatar,
      isActive: apiUser.isActive !== false, // Default to true if not specified
      createdAt: new Date(apiUser.createdAt),
      lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
      permissions: apiUser.permissions || [],
      crossLocationAccess: apiUser.crossLocationAccess || false,
    };
  }

  private validateToken(user: User, token: string): void {
    // Set the user as authenticated immediately for better UX
    this.updateAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    // Validate token in background by making a request to a protected endpoint
    // If it fails, the interceptor will handle the 401 and clear the auth
  }
}
