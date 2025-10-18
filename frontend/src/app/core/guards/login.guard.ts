import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const loginGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token is valid (exists and not expired)
  const isValid = authService.isTokenValid();

  if (isValid) {
    // Token is valid, user is authenticated, redirect to dashboard
    router.navigate(['/dashboard']);
    return of(false);
  }

  // No valid token, allow access to login page
  return of(true);
};
