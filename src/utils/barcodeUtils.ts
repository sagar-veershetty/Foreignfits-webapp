export function generateBarcode(productId: string, category: string): string {
  // Generate a simple barcode based on product ID and category
  const categoryCode = {
    'shirts': '01',
    'pants': '02', 
    'dresses': '03',
    'jackets': '04',
    'shoes': '05',
    'accessories': '06'
  }[category] || '00';
  
  // Create a 12-digit barcode: category(2) + productId hash(8) + checksum(2)
  const productHash = productId.slice(-8).padStart(8, '0');
  const baseCode = categoryCode + productHash;
  
  // Simple checksum calculation
  const checksum = (parseInt(baseCode) % 97).toString().padStart(2, '0');
  
  return baseCode + checksum;
}

export function validateBarcode(barcode: string): boolean {
  // Basic validation - should be 12 digits
  return /^\d{12}$/.test(barcode);
}

export function parseBarcodeCategory(barcode: string): string | null {
  if (!validateBarcode(barcode)) return null;
  
  const categoryCode = barcode.slice(0, 2);
  const categories = {
    '01': 'shirts',
    '02': 'pants',
    '03': 'dresses', 
    '04': 'jackets',
    '05': 'shoes',
    '06': 'accessories'
  };
  
  return categories[categoryCode as keyof typeof categories] || null;
}