import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SaleItem } from '../../core/models';
import { buildReceiptItems } from './receipt-items';
import { SalesComponent } from './sales.component';
import { PrintReceiptComponent } from './print-receipt.component';

describe('Barcode receipt rows', () => {
  const prices = [699, 599, 749, 299, 399, 275, 699];
  const item = (): SaleItem => ({
    productId: 'jeans', product: { name: "Men's Jeans 001", size: 'M', color: 'Blue' } as SaleItem['product'],
    quantity: 7, price: 3719 / 7, total: 3719,
    barcodes: prices.map((_, i) => `BARCODE-${i}`),
    barcodePrices: Object.fromEntries(prices.map((price, i) => [`BARCODE-${i}`, price]))
  });

  it('prints seven individual barcode prices, not the group average', () => {
    const rows = buildReceiptItems([item()]);
    expect(rows.map(row => row.price)).toEqual(prices);
    expect(rows.map(row => row.barcode)).toEqual(item().barcodes!);
    expect(rows.every(row => row.qty === 1)).toBeTrue();
    expect(rows.reduce((sum, row) => sum + row.qty * row.price, 0)).toBe(3719);
  });

  it('keeps equal-price barcodes separate and preserves zero and decimal prices', () => {
    const source = item();
    source.barcodePrices = Object.fromEntries(source.barcodes!.map((barcode, i) => [barcode, i === 0 ? 0 : 699.50]));
    const rows = buildReceiptItems([source]);
    expect(rows.length).toBe(7);
    expect(rows[0].price).toBe(0);
    expect(rows[1].price).toBe(699.50);
  });

  it('uses recorded map keys if the barcode list is absent', () => {
    const source = item(); source.barcodes = undefined;
    expect(buildReceiptItems([source]).map(row => row.price)).toEqual(prices);
  });

  it('preserves manual quantities and legacy prices when barcode prices were not recorded', () => {
    const source = item(); source.barcodePrices = undefined;
    expect(buildReceiptItems([source]).every(row => row.price === source.price)).toBeTrue();
    source.barcodes = undefined;
    expect(buildReceiptItems([source])).toEqual([{ name: "Men's Jeans 001", details: 'M - Blue', qty: 7, price: source.price }]);
  });

  it('uses barcode rows in the immediate sale-completed receipt', fakeAsync(() => {
    const service = { appState$: of({}), createSale: jasmine.createSpy().and.returnValue(of({ id: 'test-sale' })) };
    const auth = { getCurrentUser: () => ({ role: 'admin', locationId: '1', locationName: 'Foreign Fits Yamuna' }) };
    const component = new SalesComponent(service as any, auth as any, {} as any, {} as any, {} as any);
    component.instantDiscountEnabled = false;
    const state = { currentSale: [item()] } as any;
    component.completeSale(state);
    expect(component.showReceiptModal).toBeTrue();
    expect(component.receiptData!.items.map(row => row.price)).toEqual(prices);
    expect(component.receiptData!.total).toBe(3719);
    tick(3000);
  }));

  it('renders every barcode in the printable receipt and retains decimal amounts', async () => {
    await TestBed.configureTestingModule({ imports: [PrintReceiptComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(PrintReceiptComponent);
    fixture.componentInstance.receipt = {
      items: buildReceiptItems([item()]), subtotal: 3719, total: 3719,
      number: 'TEST', date: '', time: '', customer: 'Test', paymentMethod: 'CASH'
    };
    fixture.detectChanges();
    const paper: HTMLElement = fixture.nativeElement.querySelector('.receipt-paper');
    expect(paper.querySelectorAll('.receipt-item').length).toBe(7);
    for (const barcode of item().barcodes!) expect(paper.textContent).toContain(barcode);
    fixture.componentInstance.receipt.items[0].price = 699.5;
    fixture.detectChanges();
    expect(paper.textContent).toContain('699.50');
    fixture.destroy();
  });
});
