import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowRight, Search, SlidersHorizontal, X, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight, Plus, MapPin, Mail, Pause, Play } from 'lucide-angular';
import { AppService } from '../../core/services/app.service';
import { DEPARTMENTS, deriveDepartmentFromCodeOrSubcategory } from '../../core/constants/product-master';
import { HomepageBanner, parseHomepageImages } from './homepage-images';
import { Subscription } from 'rxjs';
import { MultiBuyOffer, multiBuyOfferLabel } from '../../core/models/multi-buy';

export interface CatalogItem {
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
  multiBuyOffer?: MultiBuyOffer;
}

export interface CatalogGroup {
  key: string;
  name: string;
  department: string;
  type: string;
  images: string[];
  items: CatalogItem[];
  minPrice: number;
  maxPrice: number;
}

export function groupCatalog(items: CatalogItem[]): CatalogGroup[] {
  const groups = new Map<string, CatalogGroup>();
  const seen = new Set<string>();
  for (const item of items) {
    // A SKU can be returned once per warehouse. Do not duplicate variants.
    if (!item.available || seen.has(item.productSku)) continue;
    seen.add(item.productSku);
    const name = item.productName.trim();
    const key = item.productCode || `${name}|${item.category}|${item.subcategory || ''}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, name, department: deriveDepartmentFromCodeOrSubcategory(item.productCode, item.subcategory), type: item.productType || item.category, images: [], items: [], minPrice: 0, maxPrice: 0 };
      groups.set(key, group);
    }
    group.items.push(item);
    group.images = [...new Set([...group.images, ...(item.imageUrls || [])])];
  }
  return [...groups.values()].map(group => {
    const prices = group.items.map(item => item.salePrice);
    return { ...group, minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  });
}

@Component({
  selector: 'app-customer-app',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './customer-app.component.html',
  styleUrls: ['./customer-app.component.scss']
})
export class CustomerAppComponent implements OnInit, OnDestroy {
  multiBuyOfferLabel = multiBuyOfferLabel;
  @Input() showHero = false;
  @ViewChild('quickView') quickView!: ElementRef<HTMLDialogElement>;
  readonly icons = { ArrowRight, Search, SlidersHorizontal, X, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight, Plus, MapPin, Mail, Pause, Play };
  readonly defaultBanners: HomepageBanner[] = [
    { department: 'newborn', label: 'Newborn', caption: 'Little beginnings. Lovely little fits.', images: ['newborn-blue.png', 'newborn-yellow.png', 'newborn-green.png'], darkText: true },
    { department: 'men', label: 'Men', caption: 'Everyday style. Your signature.', images: ['men-denim-group-oct03.png'], mobileImages: ['/editorial/men-denim-oct03.png'], darkText: false },
    { department: 'women', label: 'Women', caption: 'Find a little more you.', images: ['women-blazer-oct03.png', 'women-blazer-detail-oct03.png'], darkText: false },
    { department: 'kids', label: 'Kids', caption: 'Big personality. Little fits.', images: ['kids-red-jacket-oct03.png', 'kids-pink-jacket-oct03.png'], darkText: false },
    { department: 'footwear', label: 'Footwear', caption: 'A playful step into every day.', images: ['footwear-group.png'], darkText: false }
  ];
  private remoteBanners = signal<HomepageBanner[] | null>(null);
  private categoryImages = signal<Record<string, string>>({});
  private homepageRequest?: Subscription;
  get banners(): HomepageBanner[] { return this.remoteBanners() || this.defaultBanners; }
  bannerImage(photo: string): string { return photo.startsWith('/') ? photo : '/editorial/' + photo; }
  readonly bannerInterval = 6000;
  activeBanner = signal(0);
  banner = computed(() => this.banners[this.activeBanner()]);
  carouselPaused = signal(false);
  carouselHovered = signal(false);
  carouselFocused = signal(false);
  private carouselTimer?: ReturnType<typeof setInterval>;
  private motionPreference?: MediaQueryList;
  private readonly onMotionChange = (event: MediaQueryListEvent) => {
    if (event.matches) this.carouselPaused.set(true);
  };
  readonly generalEnquiry = 'https://wa.me/353892266219?text=' + encodeURIComponent('Hello Foreign Fits! I would like to enquire about your collection.');
  loading = signal(true);
  error = signal(false);
  catalog = signal<CatalogItem[]>([]);
  searchTerm = signal('');
  departmentFilter = signal('all');
  selectedSize = signal('all');
  selectedColor = signal('all');
  productFilter = signal('all');
  sortBy = signal('featured');
  filtersOpen = signal(false);
  visibleCount = signal(24);
  selectedGroup = signal<CatalogGroup | null>(null);
  selectedItem = signal<CatalogItem | null>(null);
  activeImage = signal(0);
  groups = computed(() => groupCatalog(this.catalog()));
  departments = computed(() => DEPARTMENTS.filter(d => this.groups().some(g => g.department === d.value)));
  productTypes = computed(() => [...new Set(this.groups().filter(g => this.departmentFilter() === 'all' || g.department === this.departmentFilter()).map(g => g.type).filter(Boolean))].sort());
  departmentEdits = computed(() => this.departments().filter(d => ['men', 'women', 'kids', 'footwear'].includes(d.value)).map(d => ({
    ...d,
    image: this.categoryImages()[d.value] || ({ men: '/editorial/men-denim-oct03.png', women: '/editorial/women-blazer-oct03.png', kids: '/editorial/kids-pink-jacket-oct03.png' } as Record<string, string>)[d.value] || this.groups().find(g => g.department === d.value && g.images.length)?.images[0],
    count: this.groups().filter(g => g.department === d.value).length
  })));
  styleEdits = computed(() => [
    { title: 'The denim edit', caption: 'Your everyday, reimagined.', term: 'jeans' },
    { title: 'Off-duty layers', caption: 'Easy pieces. Plenty of personality.', term: 'sweatshirt' },
    { title: 'Little fits', caption: 'For their own little world.', term: 'frock' }
  ].map(edit => ({ ...edit, product: this.groups().find(g => g.images.length && `${g.name} ${g.type}`.toLowerCase().includes(edit.term)) })).filter(edit => edit.product));
  variantFiltersEnabled = computed(() => this.productFilter() !== 'all');
  typeVariants = computed(() => this.variantFiltersEnabled() ? this.catalog().filter(item =>
    item.available &&
    (item.productType || item.category) === this.productFilter() &&
    (this.departmentFilter() === 'all' || deriveDepartmentFromCodeOrSubcategory(item.productCode, item.subcategory) === this.departmentFilter())
  ) : []);
  sizes = computed(() => [...new Set(this.typeVariants().map(i => i.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  colors = computed(() => [...new Set(this.typeVariants().map(i => i.color).filter(Boolean))].sort());
  filteredGroups = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    // Filter variants together so a size and color must match the same SKU.
    const groups = groupCatalog(this.catalog().filter(item =>
      (this.departmentFilter() === 'all' || deriveDepartmentFromCodeOrSubcategory(item.productCode, item.subcategory) === this.departmentFilter()) &&
      (this.selectedSize() === 'all' || item.size === this.selectedSize()) &&
      (this.selectedColor() === 'all' || item.color === this.selectedColor()) &&
      (this.productFilter() === 'all' || (item.productType || item.category) === this.productFilter()) &&
      (!term || [item.productName, item.productType, item.color, item.productSku].some(v => v?.toLowerCase().includes(term)))
    ));
    switch (this.sortBy()) {
      case 'price-asc': return groups.sort((a, b) => a.minPrice - b.minPrice);
      case 'price-desc': return groups.sort((a, b) => b.minPrice - a.minPrice);
      case 'name': return groups.sort((a, b) => a.name.localeCompare(b.name));
      default: return groups.sort((a, b) => Number(!!b.images.length) - Number(!!a.images.length));
    }
  });
  visibleGroups = computed(() => this.filteredGroups().slice(0, this.visibleCount()));
  hasFilters = computed(() => !!this.searchTerm() || this.departmentFilter() !== 'all' || this.selectedSize() !== 'all' || this.selectedColor() !== 'all' || this.productFilter() !== 'all');
  galleryImages = computed(() => this.selectedItem()?.imageUrls?.length ? this.selectedItem()!.imageUrls! : this.selectedGroup()?.images || []);

  constructor(private appService: AppService) {}
  ngOnInit(): void {
    this.loadCatalog();
    if (this.showHero) {
      this.homepageRequest = this.appService.getHomepageImages().subscribe({
        next: data => {
          const images = parseHomepageImages(data, this.defaultBanners);
          if (!images) return;
          this.activeBanner.set(0);
          this.remoteBanners.set(images.banners);
          this.categoryImages.set(images.categories);
          this.restartCarousel();
        },
        error: () => { /* Keep the bundled campaign when S3 is unavailable. */ }
      });
      this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.carouselPaused.set(this.motionPreference.matches);
      this.motionPreference.addEventListener('change', this.onMotionChange);
      this.restartCarousel();
    }
  }
  ngOnDestroy(): void {
    this.homepageRequest?.unsubscribe();
    clearInterval(this.carouselTimer);
    this.motionPreference?.removeEventListener('change', this.onMotionChange);
  }
  private restartCarousel(): void {
    clearInterval(this.carouselTimer);
    if (!this.showHero) return;
    this.carouselTimer = setInterval(() => {
      if (!this.carouselPaused() && !this.carouselHovered() && !this.carouselFocused() && !document.hidden) {
        this.activeBanner.update(index => (index + 1) % this.banners.length);
      }
    }, this.bannerInterval);
  }
  selectBanner(index: number): void {
    this.activeBanner.set((index + this.banners.length) % this.banners.length);
    this.restartCarousel();
  }
  toggleCarousel(): void {
    this.carouselPaused.update(paused => !paused);
    this.restartCarousel();
  }
  setCarouselHover(hovered: boolean): void {
    this.carouselHovered.set(hovered);
    if (!hovered) this.restartCarousel();
  }
  onCarouselFocusOut(event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      this.carouselFocused.set(false);
      this.restartCarousel();
    }
  }
  @HostListener('document:visibilitychange')
  onPageVisibilityChange(): void { this.restartCarousel(); }
  loadCatalog(): void {
    this.loading.set(true);
    this.error.set(false);
    this.appService.getPublicCatalog().subscribe({
      next: data => { this.catalog.set(data || []); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }
  chooseDepartment(value: string): void {
    this.departmentFilter.set(value);
    this.chooseProductType('all');
  }
  exploreDepartment(value: string): void {
    this.clearFilters();
    this.chooseDepartment(value);
  }
  exploreEdit(term: string): void {
    this.clearFilters();
    this.searchTerm.set(term);
  }
  chooseProductType(value: string): void {
    this.productFilter.set(value);
    this.selectedSize.set('all');
    this.selectedColor.set('all');
    this.visibleCount.set(24);
  }
  clearFilters(): void {
    this.searchTerm.set(''); this.departmentFilter.set('all'); this.productFilter.set('all'); this.selectedSize.set('all'); this.selectedColor.set('all'); this.visibleCount.set(24);
  }
  departmentLabel(value: string): string { return DEPARTMENTS.find(d => d.value === value)?.label || 'Collection'; }
  groupSizes(group: CatalogGroup): string { return [...new Set(group.items.map(i => i.size).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(' / '); }
  groupColors(group: CatalogGroup): string[] { return [...new Set(group.items.map(i => i.color).filter(Boolean))]; }
  swatch(color: string): string | null {
    const colors: Record<string, string> = { black: '#232323', blue: '#2355bc', white: '#ffffff', red: '#c33838', green: '#3b7854', pink: '#dc83a5', yellow: '#e7c34a', grey: '#858585', gray: '#858585' };
    return colors[color.trim().toLowerCase()] || null;
  }
  openProduct(group: CatalogGroup): void {
    this.selectedGroup.set(group); this.selectedItem.set(group.items[0]); this.activeImage.set(0);
    this.quickView.nativeElement.showModal();
  }
  closeProduct(): void { this.quickView.nativeElement.close(); }
  onDialogClick(event: MouseEvent): void {
    // Returning false from an Angular listener cancels nested link navigation.
    if (event.target === this.quickView.nativeElement) this.closeProduct();
  }
  selectVariant(sku: string): void {
    const item = this.selectedGroup()?.items.find(i => i.productSku === sku);
    if (item) { this.selectedItem.set(item); this.activeImage.set(0); }
  }
  moveImage(direction: number): void {
    const count = this.galleryImages().length;
    if (count) this.activeImage.set((this.activeImage() + direction + count) % count);
  }
  enquiryUrl(item: CatalogItem): string {
    const text = `Hello Foreign Fits! I'm interested in ${item.productName.trim()}.\nSKU: ${item.productSku}\nSize: ${item.size || 'Not specified'}\nColor: ${item.color || 'Not specified'}\nSelling price: INR ${item.salePrice}\nPlease confirm availability and how to order.`;
    return 'https://wa.me/353892266219?text=' + encodeURIComponent(text);
  }
  imageFailed(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/foreign-fits-logo.png')) image.src = '/foreign-fits-logo.png';
  }
}
