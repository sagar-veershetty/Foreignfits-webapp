import { Component, EventEmitter, Input, Output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Fullscreen image viewer modal ("lightbox") with left/right navigation and
 * keyboard support (Escape to close, arrow keys to navigate). Shared between
 * the Inventory page and the public Customer catalog.
 */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-lightbox.component.html',
  styleUrls: ['./image-lightbox.component.scss']
})
export class ImageLightboxComponent {
  private _images: string[] = [];
  private _startIndex = 0;

  @Input() set images(value: string[]) {
    this._images = value || [];
  }
  get images(): string[] {
    return this._images;
  }

  @Input() set startIndex(value: number) {
    this._startIndex = value || 0;
    this.activeIndex.set(this._startIndex);
  }

  @Input() alt = '';

  @Output() closed = new EventEmitter<void>();

  activeIndex = signal<number>(0);

  get hasMultiple(): boolean {
    return this.images.length > 1;
  }

  currentImage(): string {
    return this.images[this.activeIndex()] || '';
  }

  close(): void {
    this.closed.emit();
  }

  next(event?: Event): void {
    event?.stopPropagation();
    if (this.images.length === 0) return;
    this.activeIndex.set((this.activeIndex() + 1) % this.images.length);
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    if (this.images.length === 0) return;
    this.activeIndex.set((this.activeIndex() - 1 + this.images.length) % this.images.length);
  }

  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    this.activeIndex.set(index);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }
}
