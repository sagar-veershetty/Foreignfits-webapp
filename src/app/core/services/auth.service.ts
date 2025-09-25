import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

  initializeAuth(): void {
    const savedUser = localStorage.getItem('foreignfits_user');
    const savedToken = localStorage.getItem('foreignfits_token');
    
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } catch (error) {
        this.clearAuthData();
      }
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

  register(name: string, email: string, password: string, role: 'admin'|'sales'|'warehouse'): Observable<any> {
    this.updateAuthState({ ...this.authStateSubject.value, isLoading: true, error: null });

    const body = new HttpParams()
      .set('name', name)
      .set('email', email)
      .set('password', password)
      .set('role', role.toUpperCase());

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
      avatar: apiUser.avatar,
      createdAt: new Date(apiUser.createdAt),
      lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
    };
  }
}
