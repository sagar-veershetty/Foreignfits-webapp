import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-6">
      <div class="max-w-md w-full text-center">
        <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <!-- Icon -->
          <div class="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>

          <!-- Message -->
          <div class="space-y-3">
            <h1 class="text-3xl font-bold text-gray-900">Not Logged In</h1>
            <p class="text-lg text-gray-600">
              You need to be logged in to access this page.
            </p>
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <button (click)="goToLogin()"
                    class="w-full px-6 py-3 bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 rounded-lg shadow-md transition-colors">
              Go to Login
            </button>
            <button (click)="goToHome()"
                    class="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-colors">
              Back to Home
            </button>
          </div>
        </div>

        <!-- Additional Info -->
        <p class="mt-6 text-sm text-gray-500">
          Your session may have expired or you logged out.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  goToHome(): void {
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
