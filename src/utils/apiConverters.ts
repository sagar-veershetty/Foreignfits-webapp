import { Product, User, Sale, StockMovement, Location } from '../types';
import { ApiProduct, ApiUser, ApiSale, ApiStockMovement, ApiLocation } from '../types/api';

// Convert API responses to frontend types
export function convertApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id.toString(),
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role.toLowerCase() as 'admin' | 'sales' | 'warehouse',
    avatar: apiUser.avatar,
    createdAt: new Date(apiUser.createdAt),
    lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin) : undefined,
  };
}

export function convertApiLocationToLocation(apiLocation: ApiLocation): Location {
  return {
    id: apiLocation.id.toString(),
    name: apiLocation.name,
    type: apiLocation.type.toLowerCase() as 'warehouse' | 'store',
    address: apiLocation.address,
    city: apiLocation.city,
    state: apiLocation.state,
    zipCode: apiLocation.zipCode,
    phone: apiLocation.phone,
    manager: apiLocation.manager,
    capacity: apiLocation.capacity,
    isActive: apiLocation.isActive,
    createdAt: new Date(apiLocation.createdAt),
  };
}

export function convertApiProductToProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    category: apiProduct.category.toLowerCase() as Product['category'],
    size: apiProduct.size,
    color: apiProduct.color,
    price: apiProduct.price / 100, // Convert from paise to rupees
    cost: apiProduct.cost / 100,
    wholesalePrice: apiProduct.wholesalePrice / 100,
    wholesaleMinQuantity: apiProduct.wholesaleMinQuantity,
    stock: apiProduct.stock,
    minStock: apiProduct.minStock,
    sku: apiProduct.sku,
    description: apiProduct.description,
    barcode: apiProduct.barcode,
    imageUrls: apiProduct.imageUrls || [],
    locationId: apiProduct.location.id.toString(),
    location: convertApiLocationToLocation(apiProduct.location),
    createdAt: new Date(apiProduct.createdAt),
    updatedAt: new Date(apiProduct.updatedAt),
  };
}

export function convertApiSaleToSale(apiSale: ApiSale): Sale {
  return {
    id: apiSale.id.toString(),
    items: apiSale.items.map(item => ({
      productId: item.product.id.toString(),
      product: convertApiProductToProduct(item.product),
      quantity: item.quantity,
      price: item.price / 100,
      total: item.total / 100,
    })),
    subtotal: apiSale.subtotal / 100,
    tax: apiSale.tax / 100,
    total: apiSale.total / 100,
    paymentMethod: apiSale.paymentMethod.toLowerCase() as 'cash' | 'card' | 'other',
    customerName: apiSale.customerName,
    customerEmail: apiSale.customerEmail,
    soldBy: apiSale.soldBy.name,
    soldById: apiSale.soldBy.id.toString(),
    createdAt: new Date(apiSale.createdAt),
  };
}

export function convertApiStockMovementToStockMovement(apiMovement: ApiStockMovement): StockMovement {
  return {
    id: apiMovement.id.toString(),
    productId: apiMovement.product.id.toString(),
    product: convertApiProductToProduct(apiMovement.product),
    type: apiMovement.type.toLowerCase().replace('_', '_') as StockMovement['type'],
    quantity: apiMovement.quantity,
    previousStock: apiMovement.previousStock,
    newStock: apiMovement.newStock,
    reason: apiMovement.reason,
    reference: apiMovement.reference,
    locationId: apiMovement.location?.id.toString(),
    location: apiMovement.location ? convertApiLocationToLocation(apiMovement.location) : undefined,
    createdBy: apiMovement.createdBy,
    createdAt: new Date(apiMovement.createdAt),
  };
}

// Convert frontend types to API requests
export function convertProductToCreateRequest(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): any {
  return {
    name: product.name,
    category: product.category.toUpperCase(),
    size: product.size,
    color: product.color,
    price: Math.round(product.price * 100), // Convert to paise
    cost: Math.round(product.cost * 100),
    wholesalePrice: Math.round(product.wholesalePrice * 100),
    wholesaleMinQuantity: product.wholesaleMinQuantity,
    stock: product.stock,
    minStock: product.minStock,
    sku: product.sku,
    description: product.description,
    barcode: product.barcode,
    imageUrls: product.imageUrls,
    locationId: parseInt(product.locationId),
  };
}

export function convertSaleToCreateRequest(sale: any, items: any[]): any {
  return {
    items: items.map(item => ({
      productId: parseInt(item.productId),
      quantity: item.quantity,
    })),
    paymentMethod: sale.paymentMethod.toUpperCase(),
    customerName: sale.customerName,
    customerEmail: sale.customerEmail,
  };
}

export function convertStockAdjustmentToRequest(adjustment: any): any {
  return {
    productId: parseInt(adjustment.productId),
    adjustmentType: adjustment.adjustmentType.toUpperCase(),
    quantity: adjustment.quantity,
    reason: adjustment.reason,
    reference: adjustment.reference,
  };
}