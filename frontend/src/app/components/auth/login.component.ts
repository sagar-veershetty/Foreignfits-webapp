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
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true }), // replace login page in history
      error: (err) => console.error('Login failed:', err)
    });
  }

  clearError(): void {
    this.authService.clearError();
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  handleDemoLogin(role: 'admin' | 'warehouse1' | 'warehouse2' | 'sales-wholesale' | 'sales-retail'): void {
    const demoCredentials: Record<typeof role, LoginCredentials> = {
      // All demo accounts use password 'admin123'
      admin: { email: 'admin@foreignfits.com', password: 'admin123' },
      warehouse1: { email: 'warehouse1@foreignfits.com', password: 'admin123' },
      warehouse2: { email: 'warehouse2@foreignfits.com', password: 'admin123' },
      'sales-wholesale': { email: 'sales.wholesale@foreignfits.com', password: 'admin123' },
      'sales-retail': { email: 'sales.retail@foreignfits.com', password: 'admin123' },
    };
    this.credentials = demoCredentials[role];
    this.clearError();
    // Auto-submit the demo login
    this.onSubmit();
  }
}
