import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService, AuthState, LoginCredentials } from '../../core/services/auth.service';
import { AppService } from '../../core/services/app.service';

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

  constructor(
    private authService: AuthService, 
    private router: Router,
    private appService: AppService
  ) {
    this.authState$ = this.authService.authState$;
  }

  onSubmit(): void {
    this.authService.clearError();
    this.authService.login(this.credentials).subscribe({
      next: () => {
        // Reset app data when new user logs in to force fresh data load with correct role permissions
        this.appService.resetDataLoadedFlag();
        
        // Get the logged-in user to determine redirect destination
        const user = this.authService.getCurrentUser();
        
        // Shipping agents go directly to Shipments, others to Dashboard
        if (user?.role === 'shipping_agent_china' || user?.role === 'shipping_agent_india') {
          this.router.navigate(['/shipments'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      }
    });
  }

  clearError(): void {
    this.authService.clearError();
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToAgentSignup(): void {
    this.router.navigate(['/agent-signup']);
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
