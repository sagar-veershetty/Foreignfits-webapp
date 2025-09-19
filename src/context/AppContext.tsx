import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, Sale, SaleItem, Location, StockTransfer, StockMovement, StockAdjustment } from '../types';
import { apiClient } from '../services/api';
import { convertApiProductToProduct, convertApiSaleToSale, convertApiStockMovementToStockMovement, convertApiLocationToLocation, convertProductToCreateRequest, convertSaleToCreateRequest, convertStockAdjustmentToRequest } from '../utils/apiConverters';

import { generateMockLocations } from '../utils/mockData';

interface AppState {
  products: Product[];
  sales: Sale[];
  currentSale: SaleItem[];
  stockMovements: StockMovement[];
  locations: Location[];
  stockTransfers: StockTransfer[];
  isLoading: boolean;
  error: string | null;
  dataLoaded: boolean;
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
  | { type: 'COMPLETE_STOCK_TRANSFER'; payload: { transferId: string; completedBy: string; completedById: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_PRODUCTS'; payload: Product[] }
  | { type: 'LOAD_SALES'; payload: Sale[] }
  | { type: 'LOAD_STOCK_MOVEMENTS'; payload: StockMovement[] }
 | { type: 'LOAD_LOCATIONS'; payload: Location[] }
 | { type: 'SET_DATA_LOADED'; payload: boolean };

const initialState: AppState = {
  products: [],
  sales: [],
  currentSale: [],
  stockMovements: [],
  locations: [],
  stockTransfers: [],
  isLoading: false,
  error: null,
 dataLoaded: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadProducts: () => Promise<void>;
  loadSales: () => Promise<void>;
  loadStockMovements: () => Promise<void>;
 loadInitialData: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createSale: (saleData: any, items: any[]) => Promise<void>;
  adjustStock: (adjustment: StockAdjustment) => Promise<void>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
   case 'SET_DATA_LOADED':
     return { ...state, dataLoaded: action.payload };
    case 'LOAD_PRODUCTS':
      return { ...state, products: action.payload };
    case 'LOAD_SALES':
      return { ...state, sales: action.payload };
    case 'LOAD_STOCK_MOVEMENTS':
      return { ...state, stockMovements: action.payload };
    case 'LOAD_LOCATIONS':
      return { ...state, locations: action.payload };
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
      // This will be handled by the API service
      return state;
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
      return {
        ...state,
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

  // Load locations on mount
  React.useEffect(() => {
    const locations = generateMockLocations();
    dispatch({ type: 'LOAD_LOCATIONS', payload: locations });
  }, []);
 
 // Load initial data only once
 const loadInitialData = React.useCallback(async () => {
   if (state.dataLoaded) return;
   
   try {
     dispatch({ type: 'SET_LOADING', payload: true });
     await Promise.all([
       loadProducts(),
       loadSales(),
       loadStockMovements(),
     ]);
     dispatch({ type: 'SET_DATA_LOADED', payload: true });
   } catch (error) {
     console.error('Failed to load initial data:', error);
     dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data' });
   } finally {
     dispatch({ type: 'SET_LOADING', payload: false });
   }
 }, [state.dataLoaded]);
 
  // Load initial data
 const loadProducts = React.useCallback(async () => {
    try {
      try {
        const apiProducts = await apiClient.getProducts();
        const products = apiProducts.map(convertApiProductToProduct);
        dispatch({ type: 'LOAD_PRODUCTS', payload: products });
      } catch (apiError) {
        console.warn('Failed to load products from API, using fallback data:', apiError);
        // Use fallback data if API is not available
        const { generateMockData } = await import('../utils/mockData');
        const fallbackProducts = generateMockData();
        dispatch({ type: 'LOAD_PRODUCTS', payload: fallbackProducts });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load products' });
    }
 }, []);

 const loadSales = React.useCallback(async () => {
    try {
      try {
        const apiSales = await apiClient.getSales();
        const sales = apiSales.map(convertApiSaleToSale);
        dispatch({ type: 'LOAD_SALES', payload: sales });
      } catch (apiError) {
        console.warn('Failed to load sales from API:', apiError);
        // Use fallback data if API is not available
        const { generateMockSales } = await import('../utils/mockData');
        const fallbackSales = generateMockSales();
        dispatch({ type: 'LOAD_SALES', payload: fallbackSales });
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
 }, []);

 const loadStockMovements = React.useCallback(async () => {
    try {
      try {
        const apiMovements = await apiClient.getStockMovements();
        const movements = apiMovements.map(convertApiStockMovementToStockMovement);
        dispatch({ type: 'LOAD_STOCK_MOVEMENTS', payload: movements });
      } catch (apiError) {
        console.warn('Failed to load stock movements from API:', apiError);
        // Use empty array as fallback
        dispatch({ type: 'LOAD_STOCK_MOVEMENTS', payload: [] });
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error);
    }
 }, []);

  const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = convertProductToCreateRequest(product);
      const apiProduct = await apiClient.createProduct(request);
      const newProduct = convertApiProductToProduct(apiProduct);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create product' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = convertProductToCreateRequest(product);
      const apiProduct = await apiClient.updateProduct(product.id, request);
      const updatedProduct = convertApiProductToProduct(apiProduct);
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update product' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiClient.deleteProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete product' });
      throw error;
    }
  };

  const createSale = async (saleData: any, items: any[]) => {
    try {
      const request = convertSaleToCreateRequest(saleData, items);
      const apiSale = await apiClient.createSale(request);
      const sale = convertApiSaleToSale(apiSale);
      dispatch({ type: 'COMPLETE_SALE', payload: sale });
     // Update product stock locally instead of reloading
     items.forEach(item => {
       const product = state.products.find(p => p.id === item.productId);
       if (product) {
         const updatedProduct = { ...product, stock: product.stock - item.quantity };
         dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
       }
     });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create sale' });
      throw error;
    }
  };

  const adjustStock = async (adjustment: StockAdjustment) => {
    try {
      const request = convertStockAdjustmentToRequest(adjustment);
      const apiMovement = await apiClient.adjustStock(request);
      const movement = convertApiStockMovementToStockMovement(apiMovement);
      dispatch({ type: 'ADD_STOCK_MOVEMENT', payload: movement });
     // Update product stock locally
     const product = state.products.find(p => p.id === adjustment.productId);
     if (product) {
       let newStock = product.stock;
       switch (adjustment.adjustmentType) {
         case 'increase':
           newStock = product.stock + adjustment.quantity;
           break;
         case 'decrease':
           newStock = Math.max(0, product.stock - adjustment.quantity);
           break;
         case 'set':
           newStock = adjustment.quantity;
           break;
       }
       const updatedProduct = { ...product, stock: newStock };
       dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
     }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to adjust stock' });
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      loadProducts, 
      loadSales, 
      loadStockMovements, 
     loadInitialData,
      createProduct, 
      updateProduct, 
      deleteProduct, 
      createSale, 
      adjustStock 
    }}>
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