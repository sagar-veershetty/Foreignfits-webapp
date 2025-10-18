import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/layout/navbar.component';
import { AuthService } from './core/services/auth.service';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar *ngIf="isAuthenticated$ | async"></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.authState$.pipe(
      map(state => state.isAuthenticated)
    );
  }

  ngOnInit(): void {
    // Listen to all navigation events (including back/forward)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Validate token on every navigation
      const currentUrl = this.router.url;
      const isHomePage = currentUrl === '/' || currentUrl === '';
      const isLoginPage = currentUrl === '/login' || currentUrl === '/signup';
      const isUnauthorizedPage = currentUrl === '/unauthorized';
      const isValid = this.authService.isTokenValid();

      // Home and unauthorized pages are accessible to everyone
      if (isHomePage || isUnauthorizedPage) {
        // Allow access to home and unauthorized page for everyone
        return;
      }

      if (!isLoginPage) {
        // For protected pages, validate token
        if (!isValid) {
          // Token is invalid, redirect to unauthorized page
          this.router.navigate(['/unauthorized']);
        }
      } else {
        // For login/signup pages, redirect to dashboard if already authenticated
        if (isValid) {
          // User is authenticated, redirect to dashboard
          this.router.navigate(['/dashboard']);
        }
      }
    });

    // Also check token when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const currentUrl = this.router.url;
        const isHomePage = currentUrl === '/' || currentUrl === '';
        const isLoginPage = currentUrl === '/login' || currentUrl === '/signup';
        const isUnauthorizedPage = currentUrl === '/unauthorized';
        const isValid = this.authService.isTokenValid();

        // Home and unauthorized pages are accessible to everyone
        if (isHomePage || isUnauthorizedPage) {
          return;
        }

        if (!isLoginPage) {
          if (!isValid) {
            this.router.navigate(['/unauthorized']);
          }
        } else {
          // For login/signup pages, redirect to dashboard if already authenticated
          if (isValid) {
            this.router.navigate(['/dashboard']);
          }
        }
      }
    });
  }
}
