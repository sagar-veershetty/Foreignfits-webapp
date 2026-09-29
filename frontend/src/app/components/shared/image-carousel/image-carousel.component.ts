import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable image carousel with left/right navigation, dot indicators, and an
 * optional click-to-zoom handler (used to open a fullscreen lightbox modal).
 * Used by both the Inventory page (admin/staff) and the public Customer catalog.
 */
@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss']
})
export class ImageCarouselComponent {
  @Input() images: string[] = [];
  @Input() alt = '';
  @Input() heightClass = 'h-full';
  @Input() zoomable = true;

  @Output() imageClick = new EventEmitter<{ images: string[]; index: number }>();

  activeIndex = signal<number>(0);

  get hasImages(): boolean {
    return !!this.images && this.images.length > 0;
  }

  get hasMultiple(): boolean {
    return !!this.images && this.images.length > 1;
  }

  currentImage(): string {
    return this.images?.[this.activeIndex()] || '';
  }

  next(event?: Event): void {
    event?.stopPropagation();
    if (!this.images || this.images.length === 0) return;
    this.activeIndex.set((this.activeIndex() + 1) % this.images.length);
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    if (!this.images || this.images.length === 0) return;
    this.activeIndex.set((this.activeIndex() - 1 + this.images.length) % this.images.length);
  }

  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    this.activeIndex.set(index);
  }

  onImageClick(): void {
    if (!this.zoomable || !this.hasImages) return;
    this.imageClick.emit({ images: this.images, index: this.activeIndex() });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/logo.jpeg';
  }
}
