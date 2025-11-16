import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const loginGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token is valid (exists and not expired)
  const isValid = authService.isTokenValid();
  
  console.log('🔐 loginGuard - token valid?', isValid);
  console.log('🔐 loginGuard - token:', localStorage.getItem('foreignfits_token'));
  console.log('🔐 loginGuard - user:', localStorage.getItem('foreignfits_user'));

  if (isValid) {
    // Token is valid, user is authenticated, redirect to dashboard
    console.log('🔐 loginGuard - Redirecting to dashboard');
    router.navigate(['/dashboard']);
    return of(false);
  }

  // No valid token, allow access to login page
  console.log('🔐 loginGuard - Allowing access');
  return of(true);
};
