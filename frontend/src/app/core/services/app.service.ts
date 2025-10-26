import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, forkJoin, of, interval, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Product, Sale, StockMovement, Location, SaleItem, StockAdjustment } from '../models';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {
    // Locations will be loaded from API in loadInitialData
  }

  loadInitialData(): Observable<any> {
    // If already loaded AND locations exist, skip reload
    if (this._appStateSubject.value.dataLoaded && this._appStateSubject.value.locations.length > 0) {
      console.log('Data already loaded, skipping reload');
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    console.log('Loading initial data...');
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    return forkJoin({
      products: this.loadProducts(),
      sales: this.loadSales(),
      stockMovements: this.loadStockMovements(),
      locations: this.loadLocations()
    }).pipe(
      tap((data) => {
        console.log('Initial data loaded:', data);
        this.updateAppState({
          ...this._appStateSubject.value,
          dataLoaded: true,
          isLoading: false
        });
      }),
      catchError(error => {
        console.error('Failed to load initial data:', error);
        this.updateAppState({
          ...this._appStateSubject.value,
          isLoading: false,
          error: 'Failed to load initial data'
        });
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
          console.warn('Failed to load products from API, using fallback data:', error);
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
          console.warn('Failed to load sales from API (keeping existing list):', error);
          // Keep existing sales to avoid wiping dashboard stats
          return new Observable<Sale[]>(observer => observer.next(this._appStateSubject.value.sales));
        })
      );
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
            console.warn('Failed to load stock movements from API:', error);
          }

          this.updateAppState({
            ...this._appStateSubject.value,
            stockMovements: []
          });
          return new Observable<StockMovement[]>(observer => observer.next([]));
        })
      );
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
          console.log('Locations loaded:', locations);
          this.updateAppState({
            ...this._appStateSubject.value,
            locations
          });
        }),
        catchError(error => {
          console.error('Failed to load all locations, trying transfer-destinations:', error);
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
                console.warn('Using transfer-destinations (SUPPLIER may be missing)');
                this.updateAppState({
                  ...this._appStateSubject.value,
                  locations
                });
              }),
              catchError(innerError => {
                console.error('Failed to load from both endpoints:', innerError);
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
          console.error('Failed to load transfer destinations:', error);
          return of([]);
        })
      );
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    const request = this.convertProductToCreateRequest(product);
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

  updateProduct(id: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    this.updateAppState({ ...this._appStateSubject.value, isLoading: true });

    const request = this.convertProductToCreateRequest(product);
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

  createSale(saleData: any, items: SaleItem[]): Observable<Sale> {
    const request = this.convertSaleToCreateRequest(saleData, items);
    return this.http.post<Sale>(`${this.API_BASE_URL}/sales`, request)
      .pipe(
        tap(apiSale => {
          const sale = this.convertApiSaleToSale(apiSale);
          const currentState = this._appStateSubject.value;
          
          // Update products stock locally
          const updatedProducts = currentState.products.map(product => {
            const saleItem = items.find(item => item.productId === product.id);
            if (saleItem) {
              return { ...product, stock: product.stock - saleItem.quantity };
            }
            return product;
          });

          this.updateAppState({
            ...currentState,
            sales: [...currentState.sales, sale],
            currentSale: [],
            products: updatedProducts
          });

          // Refresh sales from backend to ensure dashboard stats are up-to-date
          this.loadSales().subscribe();
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

  // Auto-refresh utilities (for live-updating dashboards)
  startAutoRefresh(intervalMs: number = 15000): void {
    this.stopAutoRefresh();
    this.autoRefreshSub = interval(intervalMs).subscribe(() => {
      // Light-weight refresh: sales only (stats depend on it)
      this.loadSales().subscribe();
    });
  }

  stopAutoRefresh(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
      this.autoRefreshSub = undefined;
    }
  }

  // Stock Transfer API
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
          console.error('Stock transfer failed:', error);
          return throwError(() => error);
        })
      );
  }

  // Stock Adjustment API
  adjustStock(adjustment: StockAdjustment): Observable<any> {
    const request = {
      productId: parseInt(adjustment.productId),
      adjustmentType: adjustment.adjustmentType,
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      reference: adjustment.reference || ''
    };

    return this.http.post<any>(`${this.API_BASE_URL}/stock/adjustments`, request)
      .pipe(
        tap(() => {
          // Refresh products and stock movements after adjustment
          this.loadProducts().subscribe();
          this.loadStockMovements().subscribe();
        }),
        catchError(error => {
          console.error('Stock adjustment failed:', error);
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
      price: apiProduct.price / 100,
      cost: apiProduct.cost / 100,
      wholesalePrice: apiProduct.wholesalePrice / 100,
      wholesaleMinQuantity: apiProduct.wholesaleMinQuantity,
      stock: apiProduct.stock,
      minStock: apiProduct.minStock,
      sku: apiProduct.sku,
      description: apiProduct.description,
      barcode: apiProduct.barcode,
      imageUrls: apiProduct.imageUrls || [],
      locationId: apiProduct.location?.id.toString() || '',
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
      } : undefined,
      createdAt: new Date(apiProduct.createdAt),
      updatedAt: new Date(apiProduct.updatedAt),
    };
  }

  private convertApiSaleToSale(apiSale: any): Sale {
    return {
      id: apiSale.id.toString(),
      items: (apiSale.items || []).map((item: any) => ({
        productId: item.product.id.toString(),
        product: this.convertApiProductToProduct(item.product),
        quantity: item.quantity,
        price: item.price / 100,
        total: item.total / 100,
      })),
      subtotal: apiSale.subtotal / 100,
      tax: apiSale.tax / 100,
      total: apiSale.total / 100,
      paymentMethod: apiSale.paymentMethod.toLowerCase(),
      customerName: apiSale.customerName,
      customerEmail: apiSale.customerEmail,
      customerPhone: apiSale.customerPhone,
      customerCountryCode: apiSale.customerCountryCode,
      soldBy: apiSale.soldBy.name,
      soldById: apiSale.soldBy.id.toString(),
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
      rejectionReason: apiMovement.rejectionReason,
    };
  }

  private convertProductToCreateRequest(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      name: product.name,
      category: product.category.toUpperCase(),
      size: product.size,
      color: product.color,
      price: Math.round(product.price * 100),
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

  private convertSaleToCreateRequest(saleData: any, items: SaleItem[]): any {
    return {
      items: items.map(item => ({
        productId: parseInt(item.productId),
        quantity: item.quantity,
      })),
      paymentMethod: saleData.paymentMethod.toUpperCase(),
      customerName: saleData.customerName,
      customerEmail: saleData.customerEmail,
      customerPhone: saleData.customerPhone,
      customerCountryCode: saleData.customerCountryCode,
      pointsRedeemed: saleData.pointsRedeemed,
      discountFromPoints: saleData.discountFromPoints,
    };
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
        ],
        barcode: '011234567890'
      }
    ];
  }

  // Stock Movement Approval Methods
  getPendingStockMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.API_BASE_URL}/stock/movements/pending`)
      .pipe(
        map(apiMovements => apiMovements.map(m => this.convertApiStockMovementToStockMovement(m))),
        catchError(error => {
          console.error('Failed to load pending stock movements:', error);
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
          console.error('Failed to approve stock movement:', error);
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
          console.error('Failed to reject stock movement:', error);
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
          console.error('Failed to load pending products:', error);
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
          console.error('Failed to approve product:', error);
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
          console.error('Failed to reject product:', error);
          return throwError(() => error);
        })
      );
  }
}

