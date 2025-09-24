import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService, AuthState, LoginCredentials } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  authState$: Observable<AuthState>;
  credentials: LoginCredentials = { email: '', password: '' };
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {
    this.authState$ = this.authService.authState$;
  }

  onSubmit(): void {
    this.authService.clearError();
    this.authService.login(this.credentials).subscribe({
      next: () => this.router.navigate(['/dashboard']), // redirect on success
      error: (err) => console.error('Login failed:', err)
    });
  }

  clearError(): void {
    this.authService.clearError();
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  handleDemoLogin(role: 'admin' | 'sales' | 'warehouse'): void {
    const demoCredentials: Record<typeof role, LoginCredentials> = {
      admin: { email: 'admin@foreignfits.com', password: 'admin123' },
      sales: { email: 'sales@foreignfits.com', password: 'sales123' },
      warehouse: { email: 'warehouse@foreignfits.com', password: 'warehouse123' },
    };
    this.credentials = demoCredentials[role];
    this.clearError();
    // optional: auto-submit
    // this.onSubmit();
  }
}
