import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError, forkJoin, of, interval, Subscription } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Product, Sale, StockMovement, Location, SaleItem, StockAdjustment, BarcodeHistory } from '../models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Barcode } from '../models';

export interface AppState {
  products: Product[];
  sales: Sale[];
  currentSale: SaleItem[];
  stockMovements: StockMovement[];
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  dataLoaded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private readonly API_BASE_URL = environment.apiUrl;
  private autoRefreshSub?: Subscription;
  private isLoadingData = false; // Prevent concurrent loads
  
  private _appStateSubject = new BehaviorSubject<AppState>({
    products: [],
    sales: [],
    currentSale: [],
    stockMovements: [],
    locations: [],
    isLoading: false,
    error: null,
    dataLoaded: false
  });

  public appState$ = this._appStateSubject.asObservable();
  
  public get appStateBehaviorSubject() {
    return this._appStateSubject;
  }

  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    // Locations will be loaded from API in loadInitialData
  }

  /**
   * Reset the dataLoaded flag to force a fresh data load.
   * Called when a new user logs in to ensure role-specific data is loaded.
   */
  resetDataLoadedFlag(): void {
    this.updateAppState({
      ...this._appStateSubject.value,
      dataLoaded: false,
      products: [],
      sales: [],
      stockMovements: [],
      locations: []
    });
  }

  loadInitialData(): Observable<any> {
    const currentState = this._appStateSubject.value;
    
    // Prevent concurrent loads
    if (this.isLoadingData) {
      console.log('[AppService] Already loading data, skipping duplicate request');
      return of(true);
    }
    
    // If already loaded AND have data, skip reload
    if (currentState.dataLoaded && 
        currentState.locations.length > 0 && 
        currentState.products.length > 0) {
      console.log('[AppService] Data already loaded, skipping reload', {
        dataLoaded: currentState.dataLoaded,
        locations: currentState.locations.length,
        products: currentState.products.length,
        sales: currentState.sales.length
      });
      return of(true);
    }

    console.log('[AppService] Loading initial data...', {
      dataLoaded: currentState.dataLoaded,
      locations: currentState.locations.length,
      products: currentState.products.length
    });
    
    this.isLoadingData = true;
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role?.toLowerCase();
    
    // Determine what data to load based on user role
    const dataToLoad: any = {
      products: this.loadProducts(),
      locations: this.loadLocations()
    };
    
    // Sales data is only needed for SALES and ADMIN roles (not for WAREHOUSE)
    if (userRole === 'sales' || userRole === 'admin') {
      dataToLoad.sales = this.loadSales();
    }
    
    // Stock movements are needed for all roles
    dataToLoad.stockMovements = this.loadStockMovements();

    return forkJoin(dataToLoad).pipe(
      tap(() => {
        this.updateAppState({
          ...this._appStateSubject.value,
          dataLoaded: true,
          isLoading: false
        });
        this.isLoadingData = false;
        console.log('[AppService] Initial data loaded successfully');
      }),
      catchError(error => {
        this.updateAppState({
          ...this._appStateSubject.value,
          isLoading: false,
          error: 'Failed to load initial data'
        });
        this.isLoadingData = false;
        console.error('[AppService] Failed to load initial data:', error);
        return throwError(() => error);
      })
    );
  }

  private loadProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_BASE_URL}/products`)
      .pipe(
        tap(apiProducts => {
          const products = apiProducts.map(this.convertApiProductToProduct);
          this.updateAppState({
            ...this._appStateSubject.value,
            products
          });
        }),
        catchError(error => {
          const fallbackProducts = this.generateMockProducts();
          this.updateAppState({
            ...this._appStateSubject.value,
            products: fallbackProducts
          });
          return new Observable<Product[]>(observer => observer.next(fallbackProducts));
        })
      );
  }

  // Availability checks
  productExistsBySku(sku: string): Observable<boolean> {
    if (!sku?.trim()) return of(false);
    return this.http.get<any>(`${this.API_BASE_URL}/products/sku/${encodeURIComponent(sku)}`, { observe: 'response' })
      .pipe(
        map(res => !!res),
        catchError(err => err.status === 404 ? of(false) : throwError(() => err))
      );
  }

  productExistsByBarcode(barcode: string): Observable<boolean> {
    if (!barcode?.trim()) return of(false);
    return this.http.get<any>(`${this.API_BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`, { observe: 'response' })
      .pipe(
        map(res => !!res),
        catchError(err => err.status === 404 ? of(false) : throwError(() => err))
      );
  }

  private loadSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.API_BASE_URL}/sales`)
      .pipe(
        tap(apiSales => {
          const sales = apiSales.map(s => this.convertApiSaleToSale(s));
          this.updateAppState({
            ...this._appStateSubject.value,
            sales
          });
        }),
        catchError(error => {
          // Keep existing sales list if API fails
          return new Observable<Sale[]>(observer => observer.next([]));
        })
      );
  }

  /**
   * Force refresh sales data (useful for sales history page)
   */
  refreshSales(): Observable<Sale[]> {
    console.log('[AppService] Refreshing sales data...');
    return this.loadSales();
  }

  private loadStockMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.API_BASE_URL}/stock/movements`)
      .pipe(
        tap(apiMovements => {
          const movements = apiMovements.map(m => this.convertApiStockMovementToStockMovement(m));
          this.updateAppState({
            ...this._appStateSubject.value,
            stockMovements: movements
          });
        }),
        catchError(error => {
          // 403 is expected for SALES users - they don't have access to stock movements
          if (error.status !== 403) {
            // Silent fail for stock movements
          }

          this.updateAppState({
            ...this._appStateSubject.value,
            stockMovements: []
          });
          return new Observable<StockMovement[]>(observer => observer.next([]));
        })
      );
  }

  // Barcode methods
  getBarcodesForProduct(productId: string, locationId: string): Observable<Barcode[]> {
    return this.http.get<Barcode[]>(`${this.API_BASE_URL}/barcodes/product/${productId}/location/${locationId}`);
  }

  getBarcodeCount(productId: string, locationId: string): Observable<number> {
    return this.http.get<{count: number}>(`${this.API_BASE_URL}/barcodes/count/product/${productId}/location/${locationId}`)
      .pipe(map(res => res.count));
  }

  updateBarcodeRemark(barcodeId: string, status: string, remark: string): Observable<any> {
    return this.http.patch(`${this.API_BASE_URL}/barcodes/${barcodeId}`, { status, remark });
  }

  updateBarcodePrice(barcodeId: number, purchasePrice: number, salePrice: number): Observable<any> {
    return this.http.patch(`${this.API_BASE_URL}/barcodes/${barcodeId}/price`, { 
      purchasePrice, 
      salePrice 
    });
  }

  // Barcode History Methods
  getBarcodeHistory(params?: {
    barcodeNumber?: string;
    locationId?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<BarcodeHistory[]> {
    let queryParams = new HttpParams();
    if (params?.barcodeNumber) {
      queryParams = queryParams.set('barcodeNumber', params.barcodeNumber);
    }
    if (params?.locationId) {
      queryParams = queryParams.set('locationId', params.locationId.toString());
    }
    if (params?.startDate) {
      queryParams = queryParams.set('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams = queryParams.set('endDate', params.endDate);
    }
    
    return this.http.get<BarcodeHistory[]>(`${this.API_BASE_URL}/barcode-history`, { params: queryParams });
  }

  getBarcodeHistoryForBarcode(barcodeNumber: string): Observable<BarcodeHistory[]> {
    return this.http.get<BarcodeHistory[]>(`${this.API_BASE_URL}/barcode-history/barcode/${barcodeNumber}`);
  }

  private loadLocations(): Observable<Location[]> {
    // Use /locations endpoint to get ALL locations (including SUPPLIER)
    return this.http.get<any[]>(`${this.API_BASE_URL}/locations`)
      .pipe(
        tap(apiLocations => {
          const locations: Location[] = apiLocations.map(loc => ({
            id: loc.id?.toString() || '',
            name: loc.name || '',
            type: loc.type?.toLowerCase() || 'store',
            address: loc.address || '',
            city: loc.city || '',
            state: loc.state || '',
            zipCode: loc.zipCode || '',
            phone: loc.phone || '',
            manager: loc.manager || '',
            capacity: loc.capacity || 0,
            isActive: loc.isActive !== false,
            createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
          }));
          this.updateAppState({
            ...this._appStateSubject.value,
            locations
          });
        }),
        catchError(error => {
          // Fallback to transfer-destinations if /locations fails (permission issue)
          return this.http.get<any[]>(`${this.API_BASE_URL}/locations/transfer-destinations`)
            .pipe(
              tap(apiLocations => {
                const locations: Location[] = apiLocations.map(loc => ({
                  id: loc.id?.toString() || '',
                  name: loc.name || '',
                  type: loc.type?.toLowerCase() || 'store',
                  address: loc.address || '',
                  city: loc.city || '',
                  state: loc.state || '',
                  zipCode: loc.zipCode || '',
                  phone: loc.phone || '',
                  manager: loc.manager || '',
                  capacity: loc.capacity || 0,
                  isActive: loc.isActive !== false,
                  createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
                }));
                this.updateAppState({
                  ...this._appStateSubject.value,
                  locations
                });
              }),
              catchError(innerError => {
                this.updateAppState({
                  ...this._appStateSubject.value,
                  locations: []
                });
                return new Observable<Location[]>(observer => observer.next([]));
              })
            );
        })
      );
  }

  // Load transfer destination locations (all except user's own) - public method
  loadTransferDestinations(): Observable<Location[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/locations/transfer-destinations`)
      .pipe(
        map(apiLocations => apiLocations.map(loc => ({
          id: loc.id?.toString() || '',
          name: loc.name || '',
          type: loc.type?.toLowerCase() || 'store',
          address: loc.address || '',
          city: loc.city || '',
          state: loc.state || '',
          zipCode: loc.zipCode || '',
          phone: loc.phone || '',
          manager: loc.manager || '',
          capacity: loc.capacity || 0,
          isActive: loc.isActive !== false,
          createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
        }))),
        catchError(error => {
          return of([]);
        })
      );
  }

  /**
   * Create a new product (organization-wide master data)
   * Also creates initial LocationInventory with provided pricing
   */
  createProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    locationId: number,
    pricing: { cost: number; salePrice: number; wholesalePrice?: number; wholesaleMinQuantity?: number },
    applyPriceToBarcode?: boolean
  ): Observable<Product> {
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    const request = this.convertProductToCreateRequest(product, locationId, pricing, applyPriceToBarcode);
    return this.http.post<Product>(`${this.API_BASE_URL}/products`, request)
      .pipe(
        tap(apiProduct => {
          const newProduct = this.convertApiProductToProduct(apiProduct);
          const currentState = this._appStateSubject.value;
          this.updateAppState({
            ...currentState,
            products: [...currentState.products, newProduct],
            isLoading: false
          });
        }),
        catchError(error => {
          this.updateAppState({
            ...this._appStateSubject.value,
            isLoading: false,
            error: 'Failed to create product'
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * Update product master data (name, category, size, color, description, etc)
   * NOTE: Does NOT update pricing - use updateLocationInventoryPricing() instead
   */
  updateProduct(id: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    // For updates, send only product master data (no pricing)
    const request = {
      name: product.name,
      category: product.category.toUpperCase(),
      size: product.size,
      color: product.color,
      sku: product.sku,
      bagNumber: product.bagNumber, // Include bag number
      description: product.description,
      imageUrls: product.imageUrls,
    };
    
    return this.http.put<Product>(`${this.API_BASE_URL}/products/${parseInt(id)}`, request)
      .pipe(
        tap(apiProduct => {
          const updated = this.convertApiProductToProduct(apiProduct);
          const currentState = this._appStateSubject.value;
          const products = currentState.products.map(p => p.id === id ? updated : p);
          this.updateAppState({ ...currentState, products, isLoading: false });
        }),
        catchError(error => {
          this.updateAppState({ ...this._appStateSubject.value, isLoading: false, error: 'Failed to update product' });
          return throwError(() => error);
        })
      );
  }

  addToSale(saleItem: SaleItem): void {
    const currentState = this._appStateSubject.value;
    const existingItem = currentState.currentSale.find(item => item.productId === saleItem.productId);
    
    let updatedSale: SaleItem[];
    if (existingItem) {
      updatedSale = currentState.currentSale.map(item =>
        item.productId === saleItem.productId
          ? { ...item, quantity: item.quantity + saleItem.quantity, total: (item.quantity + saleItem.quantity) * item.price }
          : item
      );
    } else {
      updatedSale = [...currentState.currentSale, saleItem];
    }

    this.updateAppState({
      ...currentState,
      currentSale: updatedSale
    });
  }

  removeFromSale(productId: string): void {
    const currentState = this._appStateSubject.value;
    this.updateAppState({
      ...currentState,
      currentSale: currentState.currentSale.filter(item => item.productId !== productId)
    });
  }

  updateSaleQuantity(productId: string, quantity: number, price?: number): void {
    const currentState = this._appStateSubject.value;
    this.updateAppState({
      ...currentState,
      currentSale: currentState.currentSale.map(item =>
        item.productId === productId
          ? { 
              ...item, 
              quantity, 
              price: price || item.price,
              total: quantity * (price || item.price) 
            }
          : item
      )
    });
  }

  // Barcode lookup
  lookupBarcode(barcodeNumber: string): Observable<any> {
    return this.http.get<any>(`${this.API_BASE_URL}/barcodes/lookup/${barcodeNumber}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  createSale(saleData: any, items: SaleItem[]): Observable<Sale> {
    const request = this.convertSaleToCreateRequest(saleData, items);
    return this.http.post<Sale>(`${this.API_BASE_URL}/sales`, request)
      .pipe(
        tap(apiSale => {
          const sale = this.convertApiSaleToSale(apiSale);
          const currentState = this._appStateSubject.value;
          
          // NOTE: Product.stock is deprecated (backend returns null)
          // Inventory is now tracked in LocationInventory table
          // No need for local stock updates - backend handles it

          this.updateAppState({
            ...currentState,
            sales: [...currentState.sales, sale],
            currentSale: [],
          });

          // Refresh sales from backend to ensure dashboard stats are up-to-date
          // Only refresh if user role needs sales data
          const currentUser = this.authService.getCurrentUser();
          const userRole = currentUser?.role?.toLowerCase();
          if (userRole === 'sales' || userRole === 'admin') {
            this.loadSales().subscribe();
          }
        }),
        catchError(error => {
          this.updateAppState({
            ...this._appStateSubject.value,
            error: 'Failed to create sale'
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * Fetch a single sale by ID
   */
  getSaleById(saleId: string): Observable<Sale> {
    return this.http.get<any>(`${this.API_BASE_URL}/sales/${saleId}`)
      .pipe(
        map(apiSale => this.convertApiSaleToSale(apiSale)),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  // Auto-refresh utilities (for live-updating dashboards)
  startAutoRefresh(intervalMs: number = 15000): void {
    this.stopAutoRefresh();
    
    // Only auto-refresh sales data for users who need it (admin and sales roles)
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role?.toLowerCase();
    
    if (userRole === 'sales' || userRole === 'admin') {
      this.autoRefreshSub = interval(intervalMs).subscribe(() => {
        // Light-weight refresh: sales only (stats depend on it)
        this.loadSales().subscribe();
      });
    }
  }

  stopAutoRefresh(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
      this.autoRefreshSub = undefined;
    }
  }

  // Stock Transfer API (Admin - quantity-based)
  createStockTransfer(transferRequest: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    reason: string;
    reference?: string;
    notes?: string;
  }): Observable<any> {
    const request = {
      productId: parseInt(transferRequest.productId),
      fromLocationId: parseInt(transferRequest.fromLocationId),
      toLocationId: parseInt(transferRequest.toLocationId),
      quantity: transferRequest.quantity,
      reason: transferRequest.reason,
      reference: transferRequest.reference || '',
      notes: transferRequest.notes || ''
    };

    return this.http.post<any>(`${this.API_BASE_URL}/stock-transfers`, request)
      .pipe(
        tap(() => {
          // Refresh products and stock movements after transfer
          this.loadProducts().subscribe();
          this.loadStockMovements().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  
  // Validate a single barcode before adding to transfer list
  validateBarcodeForTransfer(barcodeNumber: string, fromLocationId: number): Observable<any> {
    return this.http.get<any>(`${this.API_BASE_URL}/stock-transfers/validate-barcode`, {
      params: {
        barcodeNumber: barcodeNumber,
        fromLocationId: fromLocationId.toString()
      }
    });
  }

  // Barcode Stock Transfer API (Warehouse/Store - barcode-based)
  createBarcodeStockTransfer(transferRequest: {
    fromLocationId: number;
    toLocationId: number;
    barcodeNumbers: string[];
    reason: string;
    reference?: string;
    notes?: string;
  }): Observable<any> {
    const request = {
      fromLocationId: transferRequest.fromLocationId,
      toLocationId: transferRequest.toLocationId,
      barcodeNumbers: transferRequest.barcodeNumbers,
      reason: transferRequest.reason,
      reference: transferRequest.reference || '',
      notes: transferRequest.notes || ''
    };

    return this.http.post<any>(`${this.API_BASE_URL}/stock-transfers/barcodes`, request)
      .pipe(
        tap(() => {
          // Refresh products and stock movements after transfer
          this.loadProducts().subscribe();
          this.loadStockMovements().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getBarcodeTransferStatus(productId: number, locationId: number): Observable<any> {
    return this.http.get<any>(
      `${this.API_BASE_URL}/barcodes/transfer-status/product/${productId}/location/${locationId}`
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Stock Adjustment API
  adjustStock(adjustment: StockAdjustment): Observable<any> {
    const request = {
      productId: parseInt(adjustment.productId),
      adjustmentType: adjustment.adjustmentType.toUpperCase(), // Convert to uppercase for backend
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      reference: adjustment.reference || ''
    };

    return this.http.post<any>(`${this.API_BASE_URL}/stock/adjust`, request)
      .pipe(
        tap(() => {
          // Refresh products and stock movements after adjustment
          this.loadProducts().subscribe();
          this.loadStockMovements().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  private updateAppState(newState: AppState): void {
    this._appStateSubject.next(newState);
  }

  private convertApiProductToProduct(apiProduct: any): Product {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.name,
      category: apiProduct.category.toLowerCase(),
      size: apiProduct.size,
      color: apiProduct.color,
      sku: apiProduct.sku,
      bagNumber: apiProduct.bagNumber, // Include bag number
      description: apiProduct.description,
      imageUrls: apiProduct.imageUrls || [],
      createdAt: new Date(apiProduct.createdAt),
      updatedAt: new Date(apiProduct.updatedAt),
      
      // DEPRECATED - Backend returns null, kept for backward compatibility
      // For pricing/inventory, fetch LocationInventory data instead
      price: apiProduct.price ? apiProduct.price / 100 : null,
      cost: apiProduct.cost ? apiProduct.cost / 100 : null,
      wholesalePrice: apiProduct.wholesalePrice ? apiProduct.wholesalePrice / 100 : null,
      wholesaleMinQuantity: apiProduct.wholesaleMinQuantity || null,
      stock: apiProduct.stock || null,
      minStock: apiProduct.minStock || null,
      locationId: apiProduct.location?.id.toString() || null,
      location: apiProduct.location ? {
        id: apiProduct.location.id.toString(),
        name: apiProduct.location.name,
        type: apiProduct.location.type.toLowerCase(),
        address: apiProduct.location.address,
        city: apiProduct.location.city,
        state: apiProduct.location.state,
        zipCode: apiProduct.location.zipCode,
        phone: apiProduct.location.phone,
        manager: apiProduct.location.manager,
        capacity: apiProduct.location.capacity,
        isActive: apiProduct.location.isActive,
        createdAt: new Date(apiProduct.location.createdAt),
      } : null,
    };
  }

  private convertApiSaleToSale(apiSale: any): Sale {
    // Handle payment method - could be single payment or split payments
    let paymentMethod = 'cash'; // default
    if (apiSale.paymentMethod) {
      // Old format: single paymentMethod field
      paymentMethod = apiSale.paymentMethod.toLowerCase();
    } else if (apiSale.payments && apiSale.payments.length > 0) {
      // New format: multiple payments array
      // Use the first payment method or 'card' if multiple
      paymentMethod = apiSale.payments.length === 1 
        ? apiSale.payments[0].paymentMethod.toLowerCase() 
        : 'card'; // Default to 'card' for split payments
    }

    return {
      id: apiSale.id.toString(),
      items: (apiSale.items || []).map((item: any) => ({
        productId: item.product.id.toString(),
        product: this.convertApiProductToProduct(item.product),
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        barcodes: item.barcodes || []
      })),
      subtotal: apiSale.subtotal,
      tax: apiSale.tax,
      total: apiSale.total,
      paymentMethod: paymentMethod as 'cash' | 'card' | 'upi' | 'other',
      payments: apiSale.payments ? apiSale.payments.map((p: any) => ({
        id: p.id?.toString(),
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        reference: p.reference
      })) : undefined,
      customerName: apiSale.customerName,
      customerEmail: apiSale.customerEmail,
      customerPhone: apiSale.customerPhone,
      customerCountryCode: apiSale.customerCountryCode,
      salesPersonName: apiSale.salesPersonName,
      soldBy: apiSale.soldBy.name,
      soldById: apiSale.soldBy.id.toString(),
      location: {
        id: apiSale.location.id.toString(),
        name: apiSale.location.name,
        type: apiSale.location.type.toLowerCase(),
        address: apiSale.location.address || '',
        city: apiSale.location.city || '',
        state: apiSale.location.state || '',
        zipCode: apiSale.location.zipCode || '',
        phone: apiSale.location.phone,
        manager: apiSale.location.manager,
        capacity: apiSale.location.capacity,
        isActive: apiSale.location.isActive !== false,
        createdAt: apiSale.location.createdAt ? new Date(apiSale.location.createdAt) : new Date()
      },
      pointsRedeemed: apiSale.pointsRedeemed,
      discountFromPoints: apiSale.discountFromPoints,
      createdAt: apiSale.createdAt ? new Date(apiSale.createdAt) : new Date(),
    };
  }

  private convertApiStockMovementToStockMovement(apiMovement: any): StockMovement {
    return {
      id: apiMovement.id.toString(),
      productId: apiMovement.product.id.toString(),
      product: this.convertApiProductToProduct(apiMovement.product),
      type: apiMovement.type.toLowerCase(),
      quantity: apiMovement.quantity,
      previousStock: apiMovement.previousStock,
      newStock: apiMovement.newStock,
      reason: apiMovement.reason,
      reference: apiMovement.reference,
      // location and locationId fields removed - use fromLocation and toLocation
      transferId: apiMovement.transfer?.id?.toString(),
      fromLocation: apiMovement.fromLocation ? {
        id: apiMovement.fromLocation.id.toString(),
        name: apiMovement.fromLocation.name,
        type: apiMovement.fromLocation.type.toLowerCase(),
        address: apiMovement.fromLocation.address,
        city: apiMovement.fromLocation.city,
        state: apiMovement.fromLocation.state,
        zipCode: apiMovement.fromLocation.zipCode,
        isActive: apiMovement.fromLocation.isActive,
        createdAt: new Date(apiMovement.fromLocation.createdAt),
      } : undefined,
      toLocation: apiMovement.toLocation ? {
        id: apiMovement.toLocation.id.toString(),
        name: apiMovement.toLocation.name,
        type: apiMovement.toLocation.type.toLowerCase(),
        address: apiMovement.toLocation.address,
        city: apiMovement.toLocation.city,
        state: apiMovement.toLocation.state,
        zipCode: apiMovement.toLocation.zipCode,
        isActive: apiMovement.toLocation.isActive,
        createdAt: new Date(apiMovement.toLocation.createdAt),
      } : undefined,
      createdBy: apiMovement.createdBy,
      createdAt: new Date(apiMovement.createdAt),
      status: apiMovement.status || 'PENDING', // Map status field
      approvedBy: apiMovement.approvedBy,
      approvedAt: apiMovement.approvedAt ? new Date(apiMovement.approvedAt) : undefined,
    };
  }

  /**
   * Convert product form data to create request
   * NOTE: Now requires separate locationId and pricing parameters
   * Product itself no longer contains location or pricing (organization-wide master)
   */
  private convertProductToCreateRequest(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    locationId: number,
    pricing: { cost: number; salePrice: number; wholesalePrice?: number; wholesaleMinQuantity?: number },
    applyPriceToBarcode?: boolean
  ): any {
    return {
      name: product.name,
      category: product.category.toUpperCase(),
      size: product.size,
      color: product.color,
      sku: product.sku,
      bagNumber: product.bagNumber, // Include bag number
      description: product.description,
      imageUrls: product.imageUrls,
      locationId: locationId,
      // Backend expects BigDecimal in rupees format, no need to multiply by 100
      cost: pricing.cost,
      salePrice: pricing.salePrice,
      wholesalePrice: pricing.wholesalePrice || null,
      wholesaleMinQuantity: pricing.wholesaleMinQuantity || null,
      // Initial stock for first location
      stock: product.stock || 0,
      minStock: product.minStock || 0,
      // Barcode pricing (optional)
      applyPriceToBarcode: applyPriceToBarcode !== false, // Default to true
    };
  }

  private convertSaleToCreateRequest(saleData: any, items: SaleItem[]): any {
    const request: any = {
      items: items.map(item => ({
        productId: parseInt(item.productId),
        quantity: item.quantity,
        barcodeNumbers: item.barcodes || [] // Send scanned barcode numbers
      })),
      locationId: saleData.locationId,
      customerName: saleData.customerName,
      customerEmail: saleData.customerEmail,
      customerPhone: saleData.customerPhone,
      customerCountryCode: saleData.customerCountryCode,
      pointsRedeemed: saleData.pointsRedeemed,
      discountFromPoints: saleData.discountFromPoints,
    };

    // Add payment information - either single payment or split payments
    if (saleData.payments) {
      // Split payment mode
      request.payments = saleData.payments;
    } else if (saleData.paymentMethod) {
      // Single payment mode (backward compatibility)
      request.paymentMethod = saleData.paymentMethod.toUpperCase();
    }

    // Add salesPersonName if provided
    if (saleData.salesPersonName) {
      request.salesPersonName = saleData.salesPersonName;
    }

    return request;
  }

  private generateMockProducts(): Product[] {
    const locations = this._appStateSubject.value.locations;
    return [
      {
        id: '1',
        name: 'Classic Cotton T-Shirt',
        category: 'shirts',
        size: 'M',
        color: 'White',
        price: 24.99,
        cost: 12.50,
        wholesalePrice: 19.99,
        wholesaleMinQuantity: 100,
        stock: 45,
        minStock: 10,
        sku: 'TSH-WHT-M-001',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        locationId: '1',
        location: locations[0],
        imageUrls: [
          'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400'
        ]
      }
    ];
  }

  // Stock Movement Approval Methods
  getPendingStockMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.API_BASE_URL}/stock/movements/pending`)
      .pipe(
        map(apiMovements => apiMovements.map(m => this.convertApiStockMovementToStockMovement(m))),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  approveStockMovement(movementId: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/stock/movements/${movementId}/approve`, {})
      .pipe(
        tap(() => {
          // Refresh stock movements and products after approval
          this.loadStockMovements().subscribe();
          this.loadProducts().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  rejectStockMovement(movementId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/stock/movements/${movementId}/reject`, { reason })
      .pipe(
        tap(() => {
          // Refresh stock movements after rejection
          this.loadStockMovements().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  // Product Approval Methods
  getPendingProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_BASE_URL}/products/pending`)
      .pipe(
        map(apiProducts => apiProducts.map(p => this.convertApiProductToProduct(p))),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  approveProduct(productId: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/products/${productId}/approve`, {})
      .pipe(
        tap(() => {
          // Refresh products after approval
          this.loadProducts().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  rejectProduct(productId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/products/${productId}/reject`, { reason })
      .pipe(
        tap(() => {
          // Refresh products after rejection
          this.loadProducts().subscribe();
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  // ==================== LocationInventory API ====================
  
  /**
   * Get all inventory across all locations (Admin only)
   */
  getAllLocationInventory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/inventory/all`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Get public product catalog (no authentication required)
   * Returns products without sensitive information like cost
   */
  getPublicCatalog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/inventory/public/catalog`)
      .pipe(
        catchError(error => {
          console.error('Failed to load public catalog:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Get all location inventory records for a specific location
   */
  getLocationInventory(locationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/inventory/location/${locationId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get inventory for a specific product SKU across all locations
   */
  getInventoryByProductSku(sku: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/inventory/product/${sku}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Get inventory for specific location and product SKU
   */
  getInventoryByLocationAndSku(locationId: number, sku: string): Observable<any> {
    return this.http.get<any>(`${this.API_BASE_URL}/inventory/location/${locationId}/product/${sku}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Update location-specific pricing
   * Each location can set their own cost, salePrice, wholesalePrice, wholesaleMinQuantity
   */
  updateInventoryPricing(
    inventoryId: number,
    pricing: {
      cost: number;
      salePrice: number;
      wholesalePrice?: number;
      wholesaleMinQuantity?: number;
    }
  ): Observable<any> {
    // Backend expects BigDecimal in rupees format, no need to multiply by 100
    const request = {
      cost: pricing.cost,
      salePrice: pricing.salePrice,
      wholesalePrice: pricing.wholesalePrice || null,
      wholesaleMinQuantity: pricing.wholesaleMinQuantity || null,
    };

    return this.http.put<any>(`${this.API_BASE_URL}/inventory/${inventoryId}/pricing`, request)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Helper to convert LocationInventory API response
   */
  private convertApiLocationInventoryToDto(apiInv: any): any {
    return {
      id: apiInv.id.toString(),
      locationId: apiInv.locationId.toString(),
      locationName: apiInv.locationName,
      productSku: apiInv.productSku,
      productName: apiInv.productName,
      quantity: apiInv.quantity,
      minStock: apiInv.minStock,
      maxStock: apiInv.maxStock,
      reorderPoint: apiInv.reorderPoint,
      // Backend sends BigDecimal in rupees format, no need to divide by 100
      cost: apiInv.cost || 0,
      salePrice: apiInv.salePrice || 0,
      wholesalePrice: apiInv.wholesalePrice || null,
      wholesaleMinQuantity: apiInv.wholesaleMinQuantity || null,
      createdAt: new Date(apiInv.createdAt),
      updatedAt: new Date(apiInv.updatedAt),
    };
  }
}


