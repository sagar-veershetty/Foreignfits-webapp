import { buildMultiBuyProductOptions, filterMultiBuyProductOptions } from './multi-buy-products';

describe('multi-buy product options', () => {
  it('includes in-stock styles from Yamuna and combines locations for duplicate styles', () => {
    const products = buildMultiBuyProductOptions([
      { quantity: 2, locationName: 'Foreign Fits Yamuna', productName: "Men's Jeans 001", product: { productCode: 'FF-MEN-JNS-001', name: "Men's Jeans 001" } },
      { quantity: 1, locationName: 'Main Store', productName: "Men's Jeans 001", product: { productCode: 'FF-MEN-JNS-001', name: "Men's Jeans 001" } },
      { quantity: 0, locationName: 'Foreign Fits Yamuna', productName: 'Out of stock', product: { productCode: 'OUT-001', name: 'Out of stock' } }
    ]);

    expect(products).toEqual([{
      productCode: 'FF-MEN-JNS-001',
      productName: "Men's Jeans 001",
      locations: ['Foreign Fits Yamuna (2)', 'Main Store (1)']
    }]);
  });

  it('searches by product name, code, and store name', () => {
    const products = buildMultiBuyProductOptions([
      { quantity: 2, locationName: 'Foreign Fits Yamuna', product: { productCode: 'FF-MEN-JNS-001', name: "Men's Jeans 001" } },
      { quantity: 1, locationName: 'Main Store', product: { productCode: 'FF-KID-TSH-008', name: "Kids T-Shirt" } }
    ]);

    expect(filterMultiBuyProductOptions(products, 'jeans').map(product => product.productCode)).toEqual(['FF-MEN-JNS-001']);
    expect(filterMultiBuyProductOptions(products, 'FF-KID').map(product => product.productCode)).toEqual(['FF-KID-TSH-008']);
    expect(filterMultiBuyProductOptions(products, 'yamuna').map(product => product.productCode)).toEqual(['FF-MEN-JNS-001']);
  });
});
