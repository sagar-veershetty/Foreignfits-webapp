import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExchangeItemRequest {
  productId: number;
  quantity: number;
  barcode?: string; // Single barcode for backward compatibility
  barcodes?: string[]; // Multiple barcodes for batch returns/exchanges
}

export interface ExchangeRequest {
  originalSaleId: number;
  locationId: number;
  exchangeReason: string;
  notes?: string;
  returnedItems: ExchangeItemRequest[];
  exchangedItems: ExchangeItemRequest[];
}

export interface ExchangeItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  itemType: 'RETURNED' | 'EXCHANGED';
  barcode?: string;
}

export interface Exchange {
  id: number;
  originalSaleId: number;
  newSaleId: number;
  exchangeReason: string;
  priceDifference: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  exchangedByName: string;
  locationName: string;
  notes?: string;
  createdAt: string;
  items: ExchangeItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {
  private apiUrl = `${environment.apiUrl}/exchanges`;

  constructor(private http: HttpClient) {}

  createExchange(request: ExchangeRequest): Observable<Exchange> {
    return this.http.post<Exchange>(`${this.apiUrl}/create`, request);
  }

  getExchangesBySale(saleId: number): Observable<Exchange[]> {
    return this.http.get<Exchange[]>(`${this.apiUrl}/sale/${saleId}`);
  }

  getExchangeHistory(locationId?: number): Observable<Exchange[]> {
    let url = `${this.apiUrl}/history`;
    if (locationId) {
      url += `?locationId=${locationId}`;
    }
    return this.http.get<Exchange[]>(url);
  }
}
