import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Shipment, 
  ShipmentRequest, 
  ShipmentResponse, 
  PaymentRequest,
  ShipmentStatus,
  PaymentStatus 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/shipments`;

  /**
   * Create a new shipment (China agent or Admin)
   */
  createShipment(request: ShipmentRequest): Observable<ShipmentResponse> {
    return this.http.post<ShipmentResponse>(this.apiUrl, request);
  }

  /**
   * Get all shipments (role-based filtering)
   */
  getAllShipments(): Observable<ShipmentResponse[]> {
    return this.http.get<ShipmentResponse[]>(this.apiUrl);
  }

  /**
   * Get shipment by ID
   */
  getShipmentById(id: string): Observable<ShipmentResponse> {
    return this.http.get<ShipmentResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update shipment details
   */
  updateShipment(id: string, request: ShipmentRequest): Observable<ShipmentResponse> {
    return this.http.put<ShipmentResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Update shipment status
   */
  updateShipmentStatus(id: string, status: ShipmentStatus): Observable<ShipmentResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<ShipmentResponse>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  /**
   * Add payment to shipment
   */
  addPayment(id: string, payment: PaymentRequest): Observable<ShipmentResponse> {
    return this.http.post<ShipmentResponse>(`${this.apiUrl}/${id}/payment`, payment);
  }

  /**
   * Delete shipment (Admin only)
   */
  deleteShipment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search shipments with filters
   */
  searchShipments(filters: {
    status?: ShipmentStatus;
    paymentStatus?: PaymentStatus;
    isBranded?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Observable<ShipmentResponse[]> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.paymentStatus) {
      params = params.set('paymentStatus', filters.paymentStatus);
    }
    if (filters.isBranded !== undefined) {
      params = params.set('isBranded', filters.isBranded.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<ShipmentResponse[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Helper method to get status badge color
   */
  getStatusColor(status: ShipmentStatus): string {
    const colors: { [key in ShipmentStatus]: string } = {
      'CREATED': 'bg-gray-100 text-gray-800',
      'IN_TRANSIT': 'bg-blue-100 text-blue-800',
      'ARRIVED_MUMBAI': 'bg-yellow-100 text-yellow-800',
      'IN_CUSTOM_CLEARANCE': 'bg-orange-100 text-orange-800',
      'DELIVERED_TO_WAREHOUSE': 'bg-cyan-100 text-cyan-800',
      'RECEIVED': 'bg-purple-100 text-purple-800',
      'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800'
    };
    return colors[status];
  }

  /**
   * Helper method to get payment status badge color
   */
  getPaymentStatusColor(status: PaymentStatus): string {
    const colors: { [key in PaymentStatus]: string } = {
      'UNPAID': 'bg-red-100 text-red-800',
      'PARTIALLY_PAID': 'bg-orange-100 text-orange-800',
      'PAID': 'bg-green-100 text-green-800'
    };
    return colors[status];
  }

  /**
   * Helper method to format status for display
   */
  formatStatus(status: ShipmentStatus): string {
    // Custom mappings for specific statuses
    const customLabels: { [key in ShipmentStatus]?: string } = {
      'ARRIVED_MUMBAI': 'Arrived Indian Port',
      'DELIVERED_TO_WAREHOUSE': 'Delivered to Domestic Warehouse',
      'RECEIVED': 'Received by Indian Agent'
    };
    
    if (customLabels[status]) {
      return customLabels[status]!;
    }
    
    return status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Helper method to format payment status for display
   */
  formatPaymentStatus(status: PaymentStatus): string {
    return status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
