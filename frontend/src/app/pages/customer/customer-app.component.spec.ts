import { of, throwError } from 'rxjs';
import { CatalogItem, CustomerAppComponent, groupCatalog } from './customer-app.component';
import { AppService } from '../../core/services/app.service';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

describe('Customer storefront', () => {
  const item = (overrides: Partial<CatalogItem> = {}): CatalogItem => ({
    productSku: 'BLUE-M', productName: 'Cotton Shirt', productCode: 'FF-MEN-SHT-001',
    category: 'SHIRTS', subcategory: 'mens', productType: 'Shirt',
    salePrice: 899, size: 'M', color: 'Blue', available: true, imageUrls: ['shirt.jpg'], ...overrides
  });
  let component: CustomerAppComponent;
  let service: jasmine.SpyObj<AppService>;
  beforeEach(() => {
    service = jasmine.createSpyObj('AppService', ['getPublicCatalog', 'getHomepageImages']);
    service.getHomepageImages.and.returnValue(of(null));
    service.getPublicCatalog.and.returnValue(of([]));
    component = new CustomerAppComponent(service);
  });
  afterEach(() => component.ngOnDestroy());
  it('loads the remote banner list and resets an out-of-range slide', () => {
    component.showHero = true;
    component.activeBanner.set(4);
    service.getHomepageImages.and.returnValue(of({ version: 1, banners: [
      { department: 'men', images: ['/homepage/images/banners/men/01.png?v=abc'] }
    ] }));
    component.ngOnInit();
    expect(component.banners.length).toBe(1);
    expect(component.activeBanner()).toBe(0);
    expect(component.banner().department).toBe('men');
    component.selectBanner(1);
    expect(component.activeBanner()).toBe(0);
  });
  it('keeps bundled banners if the remote manifest fails', () => {
    component.showHero = true;
    service.getHomepageImages.and.returnValue(throwError(() => new Error('offline')));
    component.ngOnInit();
    expect(component.banners).toBe(component.defaultBanners);
  });
  it('does not load campaign assets on the direct catalogue page', () => {
    component.ngOnInit();
    expect(service.getHomepageImages).not.toHaveBeenCalled();
  });
  it('rotates the five banners every six seconds and wraps around', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    component.showHero = true;
    component.ngOnInit();
    expect(component.banners.map(b => b.department)).toEqual(['newborn', 'men', 'women', 'kids', 'footwear']);
    tick(5999); expect(component.activeBanner()).toBe(0);
    tick(1); expect(component.activeBanner()).toBe(1);
    tick(24000); expect(component.activeBanner()).toBe(0);
    component.ngOnDestroy();
    tick(6000); expect(component.activeBanner()).toBe(0);
  }));
  it('pauses for hover, focus, hidden pages, and the pause control', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    const hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    component.showHero = true; component.ngOnInit();
    component.setCarouselHover(true); tick(6000); expect(component.activeBanner()).toBe(0);
    component.setCarouselHover(false); component.carouselFocused.set(true); tick(6000); expect(component.activeBanner()).toBe(0);
    component.carouselFocused.set(false); hidden.and.returnValue(true); tick(6000); expect(component.activeBanner()).toBe(0);
    hidden.and.returnValue(false); component.toggleCarousel(); tick(6000); expect(component.activeBanner()).toBe(0);
    component.toggleCarousel(); tick(6000); expect(component.activeBanner()).toBe(1);
    component.ngOnDestroy();
  }));
  it('starts paused for reduced motion and supports manual banner selection', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    component.showHero = true; component.ngOnInit();
    tick(12000); expect(component.activeBanner()).toBe(0);
    expect(component.carouselPaused()).toBeTrue();
    component.selectBanner(-1); expect(component.banner().department).toBe('footwear');
    component.selectBanner(5); expect(component.banner().department).toBe('newborn');
    component.ngOnDestroy();
  }));
  it('does not cancel WhatsApp navigation when the click bubbles through the dialog', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerAppComponent],
      providers: [provideRouter([]), { provide: AppService, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomerAppComponent);
    const group = groupCatalog([item()])[0];
    fixture.componentInstance.selectedGroup.set(group);
    fixture.componentInstance.selectedItem.set(group.items[0]);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.whatsapp');
    expect(link.href).toContain('https://wa.me/353892266219?text=');
    // Keep the test offline while exercising the real bubbling template listener.
    link.removeAttribute('href');
    const close = spyOn(fixture.componentInstance, 'closeProduct');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBeFalse();
    expect(close).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('dialog').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(close).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('deduplicates warehouse rows without dropping distinct variants', () => {
    const groups = groupCatalog([item(), item(), item({ productSku: 'RED-L', size: 'L', color: 'Red', salePrice: 999 })]);
    expect(groups.length).toBe(1);
    expect(groups[0].items.length).toBe(2);
    expect(groups[0].minPrice).toBe(899);
    expect(groups[0].maxPrice).toBe(999);
  });
  it('excludes unavailable products', () => {
    expect(groupCatalog([item({ available: false })])).toEqual([]);
  });
  it('matches size and color on the same variant', () => {
    component.catalog.set([item(), item({ productSku: 'RED-L', size: 'L', color: 'Red' })]);
    component.selectedSize.set('M'); component.selectedColor.set('Red');
    expect(component.filteredGroups()).toEqual([]);
    component.selectedColor.set('Blue');
    expect(component.filteredGroups()[0].items.length).toBe(1);
  });
  it('sorts groups by price rather than overriding with alphabetical order', () => {
    component.catalog.set([item({ productName: 'A', salePrice: 999 }), item({ productSku: 'B', productCode: 'FF-MEN-SHT-002', productName: 'Z', salePrice: 599 })]);
    component.sortBy.set('price-asc');
    expect(component.filteredGroups().map(g => g.minPrice)).toEqual([599, 999]);
    component.sortBy.set('price-desc');
    expect(component.filteredGroups().map(g => g.minPrice)).toEqual([999, 599]);
  });
  it('includes exact selected SKU and price in the WhatsApp draft', () => {
    const url = new URL(component.enquiryUrl(item({ productName: 'Shirt & Top', salePrice: 899.5 })));
    expect(url.origin + url.pathname).toBe('https://wa.me/353892266219');
    const text = url.searchParams.get('text')!;
    for (const expected of ['Shirt & Top', 'BLUE-M', 'Size: M', 'Color: Blue', 'INR 899.5']) expect(text).toContain(expected);
  });
  it('changes gallery and price when selecting a variant', () => {
    const group = groupCatalog([item(), item({ productSku: 'RED-L', salePrice: 999, imageUrls: ['red.jpg'] })])[0];
    component.selectedGroup.set(group);
    component.activeImage.set(2);
    component.selectVariant('RED-L');
    expect(component.selectedItem()?.salePrice).toBe(999);
    expect(component.galleryImages()).toEqual(['red.jpg']);
    expect(component.activeImage()).toBe(0);
  });
  it('shows only categories with available inventory', () => {
    component.catalog.set([item()]);
    expect(component.departments().map(d => d.value)).toEqual(['men']);
  });
  it('builds editorial entries only for available matching styles', () => {
    component.catalog.set([item(), item({ productSku: 'JEANS', productCode: 'FF-MEN-JNS-001', productName: 'Blue Jeans', productType: 'Jeans' })]);
    expect(component.departmentEdits().map(d => d.value)).toEqual(['men']);
    expect(component.departmentEdits()[0].count).toBe(2);
    expect(component.styleEdits().map(edit => edit.term)).toEqual(['jeans']);
  });
  it('clears stale filters when following a department or editorial link', () => {
    component.searchTerm.set('frock'); component.selectedSize.set('M'); component.productFilter.set('Shirt');
    component.exploreDepartment('men');
    expect(component.searchTerm()).toBe('');
    expect(component.departmentFilter()).toBe('men');
    expect(component.selectedSize()).toBe('all');
    component.exploreEdit('jeans');
    expect(component.departmentFilter()).toBe('all');
    expect(component.productFilter()).toBe('all');
    expect(component.searchTerm()).toBe('jeans');
  });
  it('handles loading failure and retry', () => {
    service.getPublicCatalog.and.returnValue(throwError(() => new Error('offline')));
    component.loadCatalog();
    expect(component.error()).toBeTrue(); expect(component.loading()).toBeFalse();
    service.getPublicCatalog.and.returnValue(of([item()])); component.loadCatalog();
    expect(component.error()).toBeFalse(); expect(component.groups().length).toBe(1);
  });
  it('clears all active filters', () => {
    component.searchTerm.set('shirt'); component.selectedSize.set('M'); component.selectedColor.set('Red'); component.departmentFilter.set('men');
    component.clearFilters(); expect(component.hasFilters()).toBeFalse();
  });
  it('filters product types and resets type when switching department', () => {
    component.catalog.set([item(), item({ productSku: 'PANTS', productCode: 'FF-MEN-TRS-002', productType: 'Trouser' })]);
    component.productFilter.set('Trouser');
    expect(component.filteredGroups().map(g => g.type)).toEqual(['Trouser']);
    component.chooseDepartment('women');
    expect(component.productFilter()).toBe('all');
  });
  it('keeps size and color disabled and empty until a type is selected', () => {
    component.catalog.set([item()]);
    expect(component.variantFiltersEnabled()).toBeFalse();
    expect(component.sizes()).toEqual([]);
    expect(component.colors()).toEqual([]);
    component.chooseProductType('Shirt');
    expect(component.variantFiltersEnabled()).toBeTrue();
    expect(component.sizes()).toEqual(['M']);
    expect(component.colors()).toEqual(['Blue']);
  });
  it('limits options to available variants of the selected type and department', () => {
    component.catalog.set([
      item(), item(),
      item({ productSku: 'PANTS', productType: 'Trouser', size: '32', color: 'Black' }),
      item({ productSku: 'WOMEN', productCode: 'FF-WOM-SHT-001', size: 'XS', color: 'Pink' }),
      item({ productSku: 'UNAVAILABLE', available: false, size: 'XL', color: 'Red' })
    ]);
    component.chooseDepartment('men'); component.chooseProductType('Shirt');
    expect(component.sizes()).toEqual(['M']);
    expect(component.colors()).toEqual(['Blue']);
  });
  it('clears dependent selections on type, all types, department, and reset changes', () => {
    for (const change of [() => component.chooseProductType('Trouser'), () => component.chooseProductType('all'), () => component.chooseDepartment('women'), () => component.clearFilters()]) {
      component.chooseProductType('Shirt'); component.selectedSize.set('M'); component.selectedColor.set('Blue'); component.visibleCount.set(48);
      change();
      expect(component.selectedSize()).toBe('all');
      expect(component.selectedColor()).toBe('all');
      expect(component.visibleCount()).toBe(24);
    }
  });
});
