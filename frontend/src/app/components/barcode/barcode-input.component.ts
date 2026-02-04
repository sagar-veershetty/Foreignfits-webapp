import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
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
      <button type="button" (click)="openScanner()" class="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs">
        Scan
      </button>

      <div *ngIf="showScanner" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
        <div class="bg-white rounded-lg shadow-lg p-4 w-full max-w-md flex flex-col items-center">
          <div class="flex items-center justify-between w-full mb-3">
            <h3 class="text-lg font-semibold text-gray-900">Scan Barcode</h3>
            <button
              type="button"
              (click)="toggleTorch()"
              class="p-2 rounded-full hover:bg-gray-100"
              *ngIf="torchAvailable">
              <svg class="h-5 w-5" [class.text-yellow-500]="torchEnabled" [class.text-gray-600]="!torchEnabled" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
              </svg>
            </button>
          </div>

          <div class="text-sm text-gray-600 mb-2 text-center">
            <p class="font-medium">Tips for scanning from phone screen:</p>
            <p class="text-xs mt-1">• Increase screen brightness to maximum</p>
            <p class="text-xs">• Hold steady and avoid glare</p>
            <p class="text-xs">• Try different angles if not detecting</p>
          </div>

          <div *ngIf="cameraError" class="w-full rounded-md bg-red-50 border border-red-200 text-red-700 text-xs p-2 mb-2 text-center">
            {{ cameraError }}
          </div>

          <zxing-scanner
            (scanSuccess)="onCodeResult($event)"
            (camerasFound)="onCamerasFound($event)"
            (camerasNotFound)="onCamerasNotFound()"
            (permissionResponse)="onPermissionResponse($event)"
            (torchCompatible)="onTorchCompatible($event)"
            (scanError)="onScanError($event)"
            [formats]="barcodeFormats"
            [tryHarder]="true"
            [enable]="showScanner"
            [device]="preferredCamera"
            [videoConstraints]="videoConstraints"
            [autofocusEnabled]="true"
            [torch]="torchEnabled"
            style="width:100%;height:300px;"
          ></zxing-scanner>

          <button type="button" (click)="closeScanner()" class="mt-3 px-6 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
})
export class BarcodeInputComponent implements OnChanges {
  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() scan = new EventEmitter<string>();

  valueInternal = '';
  showScanner = false;
  torchEnabled = false;
  torchAvailable = false;
  cameraError = '';
  preferredCamera: MediaDeviceInfo | undefined;

  readonly isSecureContext =
    (typeof window !== 'undefined' && window.isSecureContext) ||
    (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname));
  readonly isIos = typeof navigator !== 'undefined'
    ? /iPad|iPhone|iPod/.test(navigator.userAgent)
    : false;

  readonly videoConstraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' }
  };

  // Add more barcode formats including QR code for better detection
  barcodeFormats = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
  ];

  ngOnInit() {
    this.valueInternal = this.value || '';
  }

  ngOnChanges(changes: SimpleChanges) {
    // When parent component clears the value, clear internal value too
    if (changes['value'] && changes['value'].currentValue !== changes['value'].previousValue) {
      this.valueInternal = this.value || '';
    }
  }

  onInputChange(v: string) {
    this.valueChange.emit(v);
  }

  handleEnter() {
    this.emitScan();
  }

  openScanner() {
    this.cameraError = '';
  this.preferredCamera = undefined;

    if (!this.isSecureContext) {
      this.showScanner = true;
      this.cameraError = 'Camera access is blocked on HTTP. Please open this site over HTTPS to use the scanner.';
      return;
    }

    if (this.isIos) {
      this.cameraError = 'On iOS, allow camera permissions in Safari and ensure the page is opened over HTTPS.';
    }

  this.showScanner = true;
  }

  onCodeResult(result: string) {
    if (result) {
      this.scan.emit(result);
      this.valueInternal = result;
      this.valueChange.emit(result);
      this.closeScanner();
    }
  }

  emitScan() {
    const code = (this.valueInternal || '').trim();
    if (code) this.scan.emit(code);
  }

  closeScanner() {
    this.showScanner = false;
    this.torchEnabled = false;
    this.cameraError = '';
  }

  onCamerasFound(cameras: MediaDeviceInfo[]) {
    if (!cameras || cameras.length === 0) {
      this.cameraError = 'No cameras were detected on this device.';
      return;
    }

    const backCamera = cameras.find(camera =>
      /back|rear|environment/i.test(camera.label)
    );

    this.preferredCamera = backCamera || cameras[0];
  }

  onCamerasNotFound() {
    this.cameraError = 'No cameras were detected on this device.';
  }

  onPermissionResponse(allowed: boolean) {
    if (!allowed) {
      this.cameraError = 'Camera permission denied. Please allow camera access and try again.';
    }
  }

  onScanError(error: unknown) {
    if (error) {
      this.cameraError = 'Unable to access the camera. Please check permissions and try again.';
    }
  }

  onTorchCompatible(isCompatible: boolean) {
    this.torchAvailable = isCompatible;
  }

  toggleTorch() {
    this.torchEnabled = !this.torchEnabled;
  }
}
