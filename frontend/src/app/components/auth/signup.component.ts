import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService, AuthState } from '../../core/services/auth.service';
import { AppService } from '../../core/services/app.service';
import { Location } from '../../core/models';
import { environment } from '../../../environments/environment';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'sales' | 'warehouse';
  locationId: number | null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  authState$: Observable<AuthState>;
  validationError: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  
  allLocations = signal<Location[]>([]);
  isLoadingLocations = signal(false);
  selectedRole = signal<'admin' | 'sales' | 'warehouse'>('sales');

  signupData: SignupData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    locationId: null
  };

  // Computed: Filter locations based on selected role
  availableLocations = computed(() => {
    const role = this.selectedRole();
    const locations = this.allLocations();

    if (role === 'admin') {
      return []; // ADMIN doesn't need location
    } else if (role === 'sales') {
      // Show only stores for sales users
      return locations.filter(loc => loc.type.toLowerCase() === 'store');
    } else if (role === 'warehouse') {
      // Show only warehouses for warehouse users (exclude supplier by name)
      return locations.filter(loc => 
        loc.type.toLowerCase() === 'warehouse' && 
        !loc.name.toLowerCase().includes('supplier')
      );
    }
    return [];
  });

  // Computed: Check if location is required
  isLocationRequired = computed(() => {
    return this.selectedRole() === 'sales' || this.selectedRole() === 'warehouse';
  });

  constructor(
    private authService: AuthService,
    private appService: AppService,
    private http: HttpClient,
    private router: Router
  ) {
    this.authState$ = this.authService.authState$;
  }

  ngOnInit(): void {
    // Initialize selectedRole signal with current role
    this.selectedRole.set(this.signupData.role);
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoadingLocations.set(true);
    
    // Fetch locations directly from API
    this.http.get<any[]>(`${environment.apiUrl}/locations`).subscribe({
      next: (apiLocations) => {
        const locations: Location[] = apiLocations.map(loc => ({
          id: loc.id?.toString() || '',
          name: loc.name || '',
          type: loc.type?.toLowerCase() || 'store',
          address: loc.address || '',
          city: loc.city || '',
          state: loc.state || '',
          zipCode: loc.zipCode || '',
          phone: loc.phone || '',
          manager: loc.manager || '',
          capacity: loc.capacity || 0,
          isActive: loc.isActive !== false,
          createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
        }));
        this.allLocations.set(locations);
        this.isLoadingLocations.set(false);
      },
      error: (err) => {
        this.isLoadingLocations.set(false);
        this.validationError = 'Failed to load locations. Please refresh the page.';
      }
    });
  }

  onRoleChange(): void {
    // Update the signal to trigger computed properties
    this.selectedRole.set(this.signupData.role);
    // Reset location when role changes
    this.signupData.locationId = null;
    this.clearErrors();
  }

  parseInt(value: string): number {
    return parseInt(value, 10);
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

    // Validate location for SALES and WAREHOUSE roles
    if (this.isLocationRequired() && !this.signupData.locationId) {
      this.validationError = `Please select a ${this.signupData.role === 'sales' ? 'store' : 'warehouse'} location`;
      return;
    }

    this.authService.register(
      this.signupData.name.trim(),
      this.signupData.email.trim(),
      this.signupData.password,
      this.signupData.role,
      this.signupData.locationId
    ).subscribe({
      next: () => {
        alert('Account created successfully! Your account is pending admin approval. You will be able to log in once approved.');
        this.goToLogin();
      },
      error: (err) => {
        this.validationError = err.error?.error || err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  clearErrors(): void {
    this.validationError = null;
    this.authService.clearError();
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
