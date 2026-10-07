export interface MultiBuyTier {
  quantity: number;
  bundlePrice: number;
}

export interface MultiBuyOffer {
  productCode: string;
  productName: string;
  tiers: MultiBuyTier[];
}

export interface MultiBuyConfig {
  enabled: boolean;
  offers: MultiBuyOffer[];
}

export function multiBuyOfferLabel(offer?: MultiBuyOffer): string {
  if (!offer?.tiers?.length) return '';
  return offer.tiers.slice().sort((a, b) => a.quantity - b.quantity)
    .map(tier => `${tier.quantity} for ₹${Number(tier.bundlePrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`)
    .join(' · ');
}

export function calculateMultiBuyDiscount(prices: number[], tiers: MultiBuyTier[]): number {
  if (!prices.length || !tiers.length) return 0;
  const units = [...prices].sort((a, b) => b - a);
  const cheapest: number[] = [0];
  for (let count = 1; count <= units.length; count++) {
    cheapest[count] = cheapest[count - 1] + units[count - 1];
    for (const tier of tiers) {
      if (tier.quantity <= count) cheapest[count] = Math.min(cheapest[count], cheapest[count - tier.quantity] + tier.bundlePrice);
    }
  }
  return Number(Math.max(0, units.reduce((sum, price) => sum + price, 0) - cheapest[units.length]).toFixed(2));
}
