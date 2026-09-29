import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppService } from '../../core/services/app.service';
import {
  DEPARTMENTS,
  DEPARTMENT_PRODUCT_TYPES,
  deriveDepartmentFromCodeOrSubcategory
} from '../../core/constants/product-master';
import { ImageCarouselComponent } from '../../components/shared/image-carousel/image-carousel.component';
import { ImageLightboxComponent } from '../../components/shared/image-lightbox/image-lightbox.component';

interface CatalogItem {
  productSku: string;
  productName: string;
  salePrice: number;
  category: string;
  productType?: string;
  productCode?: string;
  subcategory?: string;
  size: string;
  color: string;
  available: boolean;
  imageUrls?: string[];
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
}

@Component({
  selector: 'app-customer-app',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageCarouselComponent, ImageLightboxComponent],
  templateUrl: './customer-app.component.html',
  styleUrls: ['./customer-app.component.scss']
})
export class CustomerAppComponent implements OnInit {
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  catalog = signal<CatalogItem[]>([]);

  // Fullscreen image lightbox state
  lightboxOpen = signal<boolean>(false);
  lightboxImages = signal<string[]>([]);
  lightboxStartIndex = signal<number>(0);
  lightboxAlt = signal<string>('');

  openLightbox(payload: { images: string[]; index: number }, alt: string): void {
    this.lightboxImages.set(payload.images);
    this.lightboxStartIndex.set(payload.index);
    this.lightboxAlt.set(alt);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  // Filters - mirrors Inventory page's Category (Department) / Product filters
  searchTerm = signal<string>('');
  departmentFilter = signal<string>('all');
  productFilter = signal<string>('all');
  selectedSize = signal<string>('all');
  selectedColor = signal<string>('all');
  sortBy = signal<string>('name-asc');

  departments = DEPARTMENTS;

  // Product options for the currently selected department filter (mirrors Add Product/Inventory's Product dropdown)
  getProductOptionsForDepartmentFilter(): { label: string; code: string }[] {
    const department = this.departmentFilter();
    if (department === 'all') return [];
    return DEPARTMENT_PRODUCT_TYPES[department] || [];
  }

  onDepartmentFilterChange(): void {
    // Reset product filter whenever department changes since options differ per department
    this.productFilter.set('all');
  }

  sizes = computed(() => {
    const set = new Set<string>();
    this.catalog().forEach(item => {
      if (item.size) set.add(item.size);
    });
    return Array.from(set).sort();
  });

  colors = computed(() => {
    const set = new Set<string>();
    this.catalog().forEach(item => {
      if (item.color) set.add(item.color);
    });
    return Array.from(set).sort();
  });

  filteredCatalog = computed(() => {
    let items = this.catalog();

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      items = items.filter(item =>
        item.productName?.toLowerCase().includes(term) ||
        item.productType?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term)
      );
    }

    const department = this.departmentFilter();
    if (department !== 'all') {
      items = items.filter(item => {
        const itemDepartment = deriveDepartmentFromCodeOrSubcategory(item.productCode, item.subcategory);
        return itemDepartment === department;
      });
    }

    const product = this.productFilter();
    if (product !== 'all') {
      items = items.filter(item =>
        (item.productType?.toLowerCase() === product.toLowerCase()) ||
        item.productName?.toLowerCase().includes(product.toLowerCase())
      );
    }

    const size = this.selectedSize();
    if (size !== 'all') {
      items = items.filter(item => item.size === size);
    }

    const color = this.selectedColor();
    if (color !== 'all') {
      items = items.filter(item => item.color === color);
    }

    const sorted = [...items];
    switch (this.sortBy()) {
      case 'price-asc':
        sorted.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
        break;
      case 'name-asc':
      default:
        sorted.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    }

    return sorted;
  });

  // Group filtered catalog items by productCode (or name fallback) so each distinct
  // product shows as a single card with a size selector, instead of one card per size.
  productGroups = computed(() => {
    const items = this.filteredCatalog();
    const groups = new Map<string, {
      key: string;
      productName: string;
      category: string;
      productType?: string;
      imageUrls: string[];
      items: CatalogItem[];
    }>();

    for (const item of items) {
      const key = item.productCode ? item.productCode : `NAME-${item.productName}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          productName: item.productName,
          category: item.category,
          productType: item.productType,
          imageUrls: item.imageUrls && item.imageUrls.length ? item.imageUrls : [],
          items: []
        };
        groups.set(key, group);
      }
      if ((!group.imageUrls || group.imageUrls.length === 0) && item.imageUrls?.length) {
        group.imageUrls = item.imageUrls;
      }
      group.items.push(item);
    }

    const result = Array.from(groups.values()).map(group => {
      const sortedItems = [...group.items].sort((a, b) => {
        const aNum = parseFloat(a.size);
        const bNum = parseFloat(b.size);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return (a.size || '').localeCompare(b.size || '');
      });
      const sizes = Array.from(new Set(sortedItems.map(i => i.size).filter(Boolean)));
      const prices = sortedItems.map(i => i.salePrice || 0).filter(p => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      return {
        ...group,
        items: sortedItems,
        sizes,
        minPrice,
        maxPrice,
        selectedItem: signal<CatalogItem>(sortedItems[0])
      };
    });

    result.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    return result;
  });

  selectGroupSize(group: { items: CatalogItem[]; selectedItem: import('@angular/core').WritableSignal<CatalogItem> }, size: string): void {
    const match = group.items.find(i => i.size === size);
    if (match) {
      group.selectedItem.set(match);
    }
  }

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.error.set(null);
    this.appService.getPublicCatalog().subscribe({
      next: (data) => {
        this.catalog.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load products right now. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.departmentFilter.set('all');
    this.productFilter.set('all');
    this.selectedSize.set('all');
    this.selectedColor.set('all');
    this.sortBy.set('name-asc');
  }

  trackBySku(_index: number, item: CatalogItem): string {
    return item.productSku;
  }

  trackByGroupKey(_index: number, group: { key: string }): string {
    return group.key;
  }
}