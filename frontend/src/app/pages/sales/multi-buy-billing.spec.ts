import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { SalesComponent } from './sales.component';

describe('scanned multi-buy billing', () => {
  it('matches scanned shirts to a refreshed two-for-1500 offer', fakeAsync(() => {
    const state = new BehaviorSubject<any>({ products: [], currentSale: [] });
    const offers = [{ productCode: 'FF-MEN-SHT-00078', productName: "Men's Shirt", tiers: [{ quantity: 2, bundlePrice: 1500 }] }];
    const service = {
      appState$: state.asObservable(), appStateBehaviorSubject: state,
      getInventoryByLocationAndSku: () => of({ salePrice: 1199, product: { productCode: 'FF-MEN-SHT-00078' } }),
      getMultiBuyOffers: jasmine.createSpy().and.returnValue(of(offers)),
      addToSale: (item: any) => state.next({ ...state.value, currentSale: [...state.value.currentSale, item] })
    };
    const auth = { getCurrentUser: () => ({ locationId: '2', locationName: 'Foreign Fits Yamuna' }) };
    const component = new SalesComponent(service as any, auth as any, {} as any, {} as any, {} as any);
    spyOn(component, 'isGangaStore').and.returnValue(false);
    component.instantDiscountEnabled = false;
    for (const barcodeNumber of ['MESHAE6D1', 'MESH9CC87']) {
      component.pendingBarcodeInfo = { barcodeNumber, salePrice: 1199, product: { id: '1', name: "Men's Shirt", sku: 'MESHI38BLU3726', size: '38', color: 'Blue' } } as any;
      (component as any).proceedToAddToCart();
      flushMicrotasks();
    }
    expect(state.value.currentSale[0].product.productCode).toBe('FF-MEN-SHT-00078');
    expect(service.getMultiBuyOffers).toHaveBeenCalledTimes(2);
    expect(component.getSubtotal(state.value)).toBe(2398);
    expect(component.getMultiBuyDiscount(state.value)).toBe(898);
    tick(2000);
  }));
});
