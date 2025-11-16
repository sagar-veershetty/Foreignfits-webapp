import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AuthService, AuthState } from '../../core/services/auth.service';
import { AppService } from '../../core/services/app.service';
import { LoginComponent } from './login.component';
import { NavbarComponent } from '../layout/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-guard',
  standalone: true,
  imports: [CommonModule, LoginComponent, NavbarComponent, RouterOutlet],
  templateUrl: './auth-guard.component.html',
  styleUrls: ['./auth-guard.component.scss']
})
export class AuthGuardComponent implements OnInit {
  authState$: Observable<AuthState>;

  constructor(
    private authService: AuthService,
    private appService: AppService
  ) {
    this.authState$ = this.authService.authState$;
  }

  ngOnInit(): void {
    // Wait until the user is authenticated AND app data hasn't been loaded yet.
    // Then load initial data once.
    combineLatest([this.authState$, this.appService.appState$])
      .pipe(
        filter(([authState, appState]) => authState.isAuthenticated && !appState.dataLoaded),
        take(1) // run exactly once
      )
      .subscribe(() => {
        this.appService.loadInitialData().subscribe();
      });
  }
}
