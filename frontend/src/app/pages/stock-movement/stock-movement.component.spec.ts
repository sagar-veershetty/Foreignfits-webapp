import { StockMovementComponent } from './stock-movement.component';
import { Product } from '../../core/models';

describe('product style stock transfers', () => {
  let component: StockMovementComponent;
  let api: { createStockTransferBatch: jasmine.Spy };
  beforeEach(() => {
    api = { createStockTransferBatch: jasmine.createSpy() };
    component = new StockMovementComponent(api as any, {} as any, {} as any);
    component.products.set([
      { id: '1', name: 'Jeans', productCode: 'JEANS-01', sku: 'SMALL', size: 'S' },
      { id: '2', name: 'Jeans', productCode: 'JEANS-01', sku: 'MEDIUM', size: 'M' },
      { id: '3', name: 'Jeans', productCode: 'JEANS-02', sku: 'OTHER', size: 'L' }
    ] as Product[]);
    component.transferFromLocationInventory.set([
      { productSku: 'SMALL', quantity: 4 }, { productSku: 'MEDIUM', quantity: 6 }, { productSku: 'OTHER', quantity: 0 }
    ]);
  });

  it('searching one SKU selects all in-stock sizes of its style', () => {
    component.transferProductSearch.set('SMALL');
    const styles = component.getTransferStyles();
    expect(styles.length).toBe(1);
    component.selectTransferStyle(styles[0]);
    component.fillTransferQuantities(true);
    expect(component.transferVariants.map(row => row.quantity)).toEqual([4, 6]);
    expect(component.transferTotal).toBe(10);
  });

  it('rejects an overstock quantity before submitting any variants', () => {
    component.selectTransferStyle(component.getTransferStyles()[0]);
    component.transferForm.fromLocationId = '1';
    component.transferForm.toLocationId = '2';
    component.transferForm.reason = 'Restock';
    component.transferVariants[0].quantity = 5;
    component.submitTransfer();
    expect(api.createStockTransferBatch).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('available stock');
  });
});
