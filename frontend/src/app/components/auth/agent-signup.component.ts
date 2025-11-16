import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-agent-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agent-signup.component.html',
  styleUrls: ['./agent-signup.component.scss']
})
export class AgentSignupComponent {
  // Form fields
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  agentType = signal<'china' | 'india'>('china'); // Default to China agent
  
  // State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Submit agent signup form
   */
  onSubmit(): void {
    this.error.set(null);

    // Validation
    if (!this.name() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.error.set('Please enter a valid email address');
      return;
    }

    this.loading.set(true);

    // Determine role based on agent type
    const role = this.agentType() === 'china' ? 'SHIPPING_AGENT_CHINA' : 'SHIPPING_AGENT_INDIA';

    // Call signup API
    this.authService.signup({
      name: this.name(),
      email: this.email(),
      password: this.password(),
      role: role
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  /**
   * Set agent type
   */
  setAgentType(type: 'china' | 'india'): void {
    this.agentType.set(type);
  }
}
