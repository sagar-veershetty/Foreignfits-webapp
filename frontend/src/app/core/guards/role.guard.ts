import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Generic role guard: read allowed roles from route data.roles
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowed: Array<'admin'|'sales'|'warehouse'> = (route.data && (route.data['roles'] as any)) || [];

  return authService.authState$.pipe(
    map(auth => {
      if (!auth.isAuthenticated) {
        router.navigate(['/login']);
        return false;
      }
      if (!allowed || allowed.length === 0) {
        return true; // no role restriction
      }
      const user = auth.user;
      if (user && (allowed as string[]).includes(user.role)) {
        return true;
      }
      // Not allowed — send to dashboard
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
