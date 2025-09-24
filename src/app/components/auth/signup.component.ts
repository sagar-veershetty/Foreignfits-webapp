import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, AuthState } from '../../core/services/auth.service';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'sales' | 'warehouse';
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  authState$: Observable<AuthState>;
  validationError: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  signupData: SignupData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales'
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authState$ = this.authService.authState$;
  }

  onSubmit(): void {
    this.clearErrors();

    // Validate passwords match
    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.validationError = 'Passwords do not match';
      return;
    }

    // Validate password strength
    if (this.signupData.password.length < 6) {
      this.validationError = 'Password must be at least 6 characters long';
      return;
    }

    // For now, show success message since backend signup isn't implemented
    alert('Account creation is not yet implemented. Please use the demo accounts on the login page.');
    this.goToLogin();
  }

  clearErrors(): void {
    this.validationError = null;
    this.authService.clearError();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}