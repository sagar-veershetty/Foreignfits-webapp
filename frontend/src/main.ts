import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { AuthService } from './app/core/services/auth.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(BrowserAnimationsModule),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AuthService],
      useFactory: (authService: AuthService) => () => authService.initializeAuth()
    }
  ]
}).catch(err => {
  console.error('Bootstrap error:', err);
  // Show error in DOM if bootstrap fails
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
      <h1>Application Failed to Start</h1>
      <p>Error: ${err.message}</p>
      <pre>${err.stack}</pre>
    </div>
  `;
});
