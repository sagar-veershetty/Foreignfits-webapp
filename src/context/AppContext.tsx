import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, Sale, SaleItem, Location, StockTransfer, StockMovement, StockAdjustment } from '../types';
import { generateMockData, generateMockSales, generateMockLocations, generateId } from '../utils/mockData';
import { useAuth } from './AuthContext';

interface AppState {
  products: Product[];
  sales: Sale[];
  currentSale: SaleItem[];
  stockMovements: StockMovement[];
  locations: Location[];
  stockTransfers: StockTransfer[];
}

type AppAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADJUST_STOCK'; payload: StockAdjustment }
  | { type: 'ADD_STOCK_MOVEMENT'; payload: StockMovement }
  | { type: 'ADD_TO_SALE'; payload: SaleItem }
  | { type: 'REMOVE_FROM_SALE'; payload: string }
  | { type: 'UPDATE_SALE_QUANTITY'; payload: { productId: string; quantity: number; price?: number } }
  | { type: 'COMPLETE_SALE'; payload: Sale }
  | { type: 'CLEAR_CURRENT_SALE' }
  | { type: 'CREATE_STOCK_TRANSFER'; payload: StockTransfer }
  | { type: 'APPROVE_STOCK_TRANSFER'; payload: { transferId: string; approvedBy: string; approvedById: string } }
  | { type: 'COMPLETE_STOCK_TRANSFER'; payload: { transferId: string; completedBy: string; completedById: string } };

const initialState: AppState = {
  products: generateMockData(),
  sales: generateMockSales(),
  currentSale: [],
  stockMovements: [],
  locations: generateMockLocations(),
  stockTransfers: [],
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  const getCurrentUser = () => {
    const savedUser = localStorage.getItem('foreignfits_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        return { name: 'Unknown User' };
      }
    }
    return { name: 'Unknown User' };
  };

  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'ADJUST_STOCK':
      const product = state.products.find(p => p.id === action.payload.productId);
      if (!product) return state;
      
      let newStock: number;
      switch (action.payload.adjustmentType) {
        case 'increase':
          newStock = product.stock + action.payload.quantity;
          break;
        case 'decrease':
          newStock = Math.max(0, product.stock - action.payload.quantity);
          break;
        case 'set':
          newStock = Math.max(0, action.payload.quantity);
          break;
        default:
          return state;
      }
      
      const updatedProduct = { ...product, stock: newStock, updatedAt: new Date() };
      
      // Create stock movement record
      const stockMovement: StockMovement = {
        id: generateId(),
        productId: product.id,
        product: updatedProduct,
        type: 'adjustment',
        quantity: action.payload.adjustmentType === 'set' 
          ? newStock - product.stock 
          : action.payload.adjustmentType === 'increase' 
            ? action.payload.quantity 
            : -action.payload.quantity,
        previousStock: product.stock,
        newStock,
        reason: action.payload.reason,
        reference: action.payload.reference,
        createdBy: getCurrentUser().name,
        createdAt: new Date(),
      };
      
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.productId ? updatedProduct : p),
        stockMovements: [stockMovement, ...state.stockMovements],
      };
    case 'ADD_STOCK_MOVEMENT':
      return {
        ...state,
        stockMovements: [action.payload, ...state.stockMovements],
      };
    case 'CREATE_STOCK_TRANSFER':
      // If admin completes immediately, also update stock
      if (action.payload.status === 'completed') {
        const fromProduct = state.products.find(p => p.id === action.payload.productId);
        if (fromProduct) {
          const updatedFromProduct = {
            ...fromProduct,
            stock: fromProduct.stock - action.payload.quantity,
            updatedAt: new Date()
          };
          
          // Create stock movements for both locations
          const outMovement: StockMovement = {
            id: generateId(),
            productId: action.payload.productId,
            product: updatedFromProduct,
            type: 'transfer_out',
            quantity: -action.payload.quantity,
            previousStock: fromProduct.stock,
            newStock: updatedFromProduct.stock,
            reason: `Transfer to ${action.payload.toLocation.name}`,
            reference: action.payload.id,
            locationId: action.payload.fromLocationId,
            location: action.payload.fromLocation,
            transferId: action.payload.id,
            createdBy: getCurrentUser().name,
            createdAt: new Date(),
          };
          
          return {
            ...state,
            products: state.products.map(p => p.id === action.payload.productId ? updatedFromProduct : p),
            stockTransfers: [action.payload, ...state.stockTransfers],
            stockMovements: [outMovement, ...state.stockMovements],
          };
        }
      }
      
      return {
        ...state,
        stockTransfers: [action.payload, ...state.stockTransfers],
      };
    case 'APPROVE_STOCK_TRANSFER':
      return {
        ...state,
        stockTransfers: state.stockTransfers.map(transfer =>
          transfer.id === action.payload.transferId
            ? {
                ...transfer,
                status: 'in_transit' as const,
                approvedBy: action.payload.approvedBy,
                approvedById: action.payload.approvedById,
                approvedAt: new Date(),
              }
            : transfer
        ),
      };
    case 'COMPLETE_STOCK_TRANSFER':
      const transfer = state.stockTransfers.find(t => t.id === action.payload.transferId);
      if (!transfer) return state;
      
      const transferProduct = state.products.find(p => p.id === transfer.productId);
      if (!transferProduct) return state;
      
      const updatedTransferProduct = {
        ...transferProduct,
        stock: transferProduct.stock - transfer.quantity,
        locationId: transfer.toLocationId,
        location: transfer.toLocation,
        updatedAt: new Date()
      };
      
      // Create stock movements
      const outMovement: StockMovement = {
        id: generateId(),
        productId: transfer.productId,
        product: transferProduct,
        type: 'transfer_out',
        quantity: -transfer.quantity,
        previousStock: transferProduct.stock,
        newStock: transferProduct.stock - transfer.quantity,
        reason: `Transfer to ${transfer.toLocation.name}`,
        reference: transfer.id,
        locationId: transfer.fromLocationId,
        location: transfer.fromLocation,
        transferId: transfer.id,
        createdBy: action.payload.completedBy,
        createdAt: new Date(),
      };
      
      const inMovement: StockMovement = {
        id: generateId(),
        productId: transfer.productId,
        product: updatedTransferProduct,
        type: 'transfer_in',
        quantity: transfer.quantity,
        previousStock: 0, // New location
        newStock: transfer.quantity,
        reason: `Transfer from ${transfer.fromLocation.name}`,
        reference: transfer.id,
        locationId: transfer.toLocationId,
        location: transfer.toLocation,
        transferId: transfer.id,
        createdBy: action.payload.completedBy,
        createdAt: new Date(),
      };
      
      return {
        ...state,
        products: state.products.map(p => p.id === transfer.productId ? updatedTransferProduct : p),
        stockTransfers: state.stockTransfers.map(t =>
          t.id === action.payload.transferId
            ? {
                ...t,
                status: 'completed' as const,
                completedBy: action.payload.completedBy,
                completedById: action.payload.completedById,
                completedAt: new Date(),
              }
            : t
        ),
        stockMovements: [inMovement, outMovement, ...state.stockMovements],
      };
    case 'ADD_TO_SALE':
      const existingItem = state.currentSale.find(item => item.productId === action.payload.productId);
      if (existingItem) {
        return {
          ...state,
          currentSale: state.currentSale.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity, total: (item.quantity + action.payload.quantity) * item.price }
              : item
          ),
        };
      }
      return {
        ...state,
        currentSale: [...state.currentSale, action.payload],
      };
    case 'REMOVE_FROM_SALE':
      return {
        ...state,
        currentSale: state.currentSale.filter(item => item.productId !== action.payload),
      };
    case 'UPDATE_SALE_QUANTITY':
      return {
        ...state,
        currentSale: state.currentSale.map(item =>
          item.productId === action.payload.productId
            ? { 
                ...item, 
                quantity: action.payload.quantity, 
                price: action.payload.price || item.price,
                total: action.payload.quantity * (action.payload.price || item.price) 
              }
            : item
        ),
      };
    case 'COMPLETE_SALE':
      // Update product stock
      const updatedProducts = state.products.map(product => {
        const saleItem = action.payload.items.find(item => item.productId === product.id);
        if (saleItem) {
          const newStock = product.stock - saleItem.quantity;
          
          // Create stock movement for sale
          const saleMovement: StockMovement = {
            id: generateId(),
            productId: product.id,
            product: { ...product, stock: newStock },
            type: 'sale',
            quantity: -saleItem.quantity,
            previousStock: product.stock,
            newStock,
            reference: action.payload.id,
            createdBy: getCurrentUser().name,
            createdAt: new Date(),
          };
          
          // Add to stock movements
          state.stockMovements.unshift(saleMovement);
          
          return { ...product, stock: newStock };
        }
        return product;
      });
      
      return {
        ...state,
        products: updatedProducts,
        sales: [...state.sales, action.payload],
        currentSale: [],
      };
    case 'CLEAR_CURRENT_SALE':
      return {
        ...state,
        currentSale: [],
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}