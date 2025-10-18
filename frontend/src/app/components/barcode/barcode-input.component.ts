import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-barcode-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke-width="1.6"/><path stroke-linecap="round" stroke-width="1.6" d="M20 20l-3.5-3.5"/></svg>
      </div>
      <input
        type="text"
        [placeholder]="placeholder || 'Search or scan barcode...'"
        [(ngModel)]="valueInternal"
        (ngModelChange)="onInputChange($event)"
        (keydown.enter)="handleEnter()"
        class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button type="button" (click)="emitScan()" class="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs">
        Scan
      </button>
    </div>
  `
})
export class BarcodeInputComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() scan = new EventEmitter<string>();

  valueInternal = '';

  ngOnInit() {
    this.valueInternal = this.value || '';
  }

  onInputChange(v: string) {
    this.valueChange.emit(v);
  }

  handleEnter() {
    this.emitScan();
  }

  emitScan() {
    const code = (this.valueInternal || '').trim();
    if (code) this.scan.emit(code);
  }
}

