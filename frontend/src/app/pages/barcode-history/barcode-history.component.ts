import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { BarcodeHistory } from '../../core/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-barcode-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-history.component.html',
  styleUrls: ['./barcode-history.component.scss']
})
export class BarcodeHistoryComponent implements OnInit {
  history = signal<BarcodeHistory[]>([]);
  filteredHistory = signal<BarcodeHistory[]>([]);
  isLoading = signal<boolean>(false);
  
  // Filter controls
  searchBarcode: string = '';
  selectedEventType: string = '';
  startDate: string = '';
  endDate: string = '';
  
  eventTypes = ['CREATED', 'TRANSFERRED', 'SOLD', 'RETURNED', 'DAMAGED', 'LOST'];
  
  constructor(
    private appService: AppService,
    public authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadHistory();
  }
  
  loadHistory() {
    this.isLoading.set(true);
    
    const params: any = {};
    
    if (this.searchBarcode) {
      params.barcodeNumber = this.searchBarcode;
    }
    
    if (this.startDate && this.endDate) {
      params.startDate = new Date(this.startDate).toISOString();
      params.endDate = new Date(this.endDate).toISOString();
    }
    
    this.appService.getBarcodeHistory(params).subscribe({
      next: (data) => {
        this.history.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
      }
    });
  }
  
  applyFilters() {
    let filtered = this.history();
    
    // Filter by event type
    if (this.selectedEventType) {
      filtered = filtered.filter(h => h.eventType === this.selectedEventType);
    }
    
    this.filteredHistory.set(filtered);
  }
  
  onSearch() {
    this.loadHistory();
  }
  
  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.loadHistory();
    }
  }
  
  onEventTypeChange() {
    this.applyFilters();
  }
  
  clearFilters() {
    this.searchBarcode = '';
    this.selectedEventType = '';
    this.startDate = '';
    this.endDate = '';
    this.loadHistory();
  }
  
  getEventTypeClass(eventType: string): string {
    switch (eventType) {
      case 'CREATED':
        return 'bg-green-100 text-green-800';
      case 'TRANSFERRED':
        return 'bg-blue-100 text-blue-800';
      case 'SOLD':
        return 'bg-purple-100 text-purple-800';
      case 'RETURNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800';
      case 'LOST':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getEventCount(eventType: string): number {
    return this.filteredHistory().filter(h => h.eventType === eventType).length;
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
  
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
