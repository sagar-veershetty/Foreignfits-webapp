import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AppService, AppState } from '../../core/services/app.service';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-history.component.html'
})
export class SalesHistoryComponent {
  appState$: Observable<AppState>;

  constructor(private appService: AppService) {
    this.appState$ = this.appService.appState$;
  }

  getPaymentMethodClass(method: string): string {
    const classes = {
      cash: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      card: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      other: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
    };
    return classes[method as keyof typeof classes] || classes.other;
  }
}