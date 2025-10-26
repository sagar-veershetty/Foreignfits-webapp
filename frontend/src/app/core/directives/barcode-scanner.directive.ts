import { Directive, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[barcodeScanner]',
  standalone: true
})
export class BarcodeScannerDirective implements OnInit, OnDestroy {
  @Output() barcodeScanned = new EventEmitter<string>();

  private buffer = '';
  private timer: any;
  private listening = false;

  ngOnInit() {
    this.listening = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    this.listening = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (!this.listening) return;
    // Ignore modifier keys
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    
    // Initialize buffer if undefined
    if (!this.buffer) {
      this.buffer = '';
    }
    
    // Most scanners send barcode then Enter
    if (event.key === 'Enter') {
      if (this.buffer && this.buffer.length > 3) {
        this.barcodeScanned.emit(this.buffer);
      }
      this.buffer = '';
      clearTimeout(this.timer);
      return;
    }
    // Only accept printable characters
    if (event.key && event.key.length === 1) {
      this.buffer += event.key;
      clearTimeout(this.timer);
      // Reset buffer if no input for 100ms (scanner is fast)
      this.timer = setTimeout(() => {
        this.buffer = '';
      }, 100);
    }
  };
}
