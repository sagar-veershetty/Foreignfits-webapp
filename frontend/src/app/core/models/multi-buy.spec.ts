import { calculateMultiBuyDiscount, multiBuyOfferLabel } from './multi-buy';

describe('multi-buy offers', () => {
  it('combines quantity tiers to find the lowest bundle total', () => {
    const tiers = [
      { quantity: 2, bundlePrice: 1999 },
      { quantity: 3, bundlePrice: 999 }
    ];

    expect(calculateMultiBuyDiscount([1000, 1000, 1000, 1000, 1000], tiers)).toBe(2002);
  });

  it('uses each barcode price and leaves non-qualifying units at their regular price', () => {
    expect(calculateMultiBuyDiscount([1200, 800, 500], [{ quantity: 2, bundlePrice: 1500 }])).toBe(500);
    expect(calculateMultiBuyDiscount([500], [{ quantity: 2, bundlePrice: 700 }])).toBe(0);
  });

  it('formats the offer for customer-facing product labels', () => {
    expect(multiBuyOfferLabel({
      productCode: 'FF-MEN-TSH-00044',
      productName: "Men's T-Shirt",
      tiers: [{ quantity: 3, bundlePrice: 999 }, { quantity: 2, bundlePrice: 1999 }]
    })).toBe('2 for ₹1,999 · 3 for ₹999');
  });
});
