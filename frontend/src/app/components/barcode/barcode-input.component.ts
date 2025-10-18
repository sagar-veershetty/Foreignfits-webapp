import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-barcode-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
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
      <button type="button" (click)="showScanner = true" class="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs">
        Scan
      </button>

      <div *ngIf="showScanner" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div class="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs flex flex-col items-center">
          <zxing-scanner
            (scanSuccess)="onCodeResult($event)"
            [formats]="barcodeFormats"
            [autostart]="true"
            style="width:100%;height:260px;"
          ></zxing-scanner>
          <button type="button" (click)="showScanner = false" class="mt-3 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">Cancel</button>
        </div>
      </div>
    </div>
  `
})
export class BarcodeInputComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() scan = new EventEmitter<string>();

  valueInternal = '';
  showScanner = false;
  barcodeFormats = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];

  ngOnInit() {
    this.valueInternal = this.value || '';
  }

  onInputChange(v: string) {
    this.valueChange.emit(v);
  }

  handleEnter() {
    this.emitScan();
  }

  onCodeResult(result: string) {
    if (result) {
      this.scan.emit(result);
      this.showScanner = false;
    }
  }

  emitScan() {
    const code = (this.valueInternal || '').trim();
    if (code) this.scan.emit(code);
  }
}

