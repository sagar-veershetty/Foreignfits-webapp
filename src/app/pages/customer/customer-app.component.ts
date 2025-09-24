import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-app',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="mb-6">
            <div class="p-3 bg-purple-600 rounded-full mx-auto w-fit mb-4">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Foreign Fits</h1>
            <p class="text-gray-600">Customer Shopping Portal</p>
          </div>
          
          <div class="space-y-4">
            <p class="text-gray-600">Customer shopping experience coming soon!</p>
            <a
              href="/"
              class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>← Back to Management Portal</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerAppComponent {}