import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Check if token is valid (exists and not expired)
  const isValid = authService.isTokenValid();

  if (!isValid) {
    // Token is invalid or expired, redirect to unauthorized page and replace current page in history
    router.navigate(['/unauthorized'], { replaceUrl: true });
    return of(false);
  }

  // Token is valid, allow access
  return of(true);
};