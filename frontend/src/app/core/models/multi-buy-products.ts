export interface MultiBuyProductOption {
  productCode: string;
  productName: string;
  locations: string[];
}

export function buildMultiBuyProductOptions(inventory: any[]): MultiBuyProductOption[] {
  const products = new Map<string, { productCode: string; productName: string; locations: Set<string> }>();
  for (const item of inventory || []) {
    if (Number(item.quantity) <= 0) continue;
    const product = item.product || {};
    const productCode = String(product.productCode || '').trim();
    if (!productCode) continue;
    const existing = products.get(productCode) || {
      productCode,
      productName: product.name || item.productName || productCode,
      locations: new Set<string>()
    };
    if (item.locationName) existing.locations.add(`${item.locationName} (${item.quantity})`);
    products.set(productCode, existing);
  }
  return [...products.values()]
    .map(product => ({ ...product, locations: [...product.locations].sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}

export function filterMultiBuyProductOptions(products: MultiBuyProductOption[], search: string): MultiBuyProductOption[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return products;
  return products.filter(product =>
    `${product.productName} ${product.productCode} ${product.locations.join(' ')}`.toLocaleLowerCase().includes(query)
  );
}
