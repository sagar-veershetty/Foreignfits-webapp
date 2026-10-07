import { Component } from '@angular/core';
import { CustomerAppComponent } from '../customer/customer-app.component';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CustomerAppComponent],
  template: '<app-customer-app [showHero]="true" />'
})
export class PublicHomeComponent {}
