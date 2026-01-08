import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Coupon, CouponValidation, CouponStats } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/coupons`;

  constructor(private http: HttpClient) {}

  /**
   * Validate a coupon code for a given purchase amount
   * @param code Coupon code to validate
   * @param purchaseAmount Total purchase amount
   * @returns Observable with validation result
   */
  validateCoupon(code: string, purchaseAmount: number): Observable<CouponValidation> {
    const params = new HttpParams().set('purchaseAmount', purchaseAmount.toString());
    const url = `${this.apiUrl}/validate/${code}`;
    
    console.log('🔍 COUPON VALIDATION DEBUG:');
    console.log('  environment.apiUrl:', environment.apiUrl);
    console.log('  this.apiUrl:', this.apiUrl);
    console.log('  Full URL:', url);
    console.log('  Params:', params.toString());
    
    return this.http.get<CouponValidation>(url, { params })
      .pipe(
        catchError(error => {
          console.error('Error validating coupon:', error);
          return of({
            valid: false,
            message: 'Failed to validate coupon. Please try again.'
          });
        })
      );
  }

  /**
   * Get all active coupons for a customer
   * @param phone Customer phone number
   * @param countryCode Country code (default: +91)
   * @returns Observable with array of coupons
   */
  getCustomerCoupons(phone: string, countryCode: string = '+91'): Observable<Coupon[]> {
    const params = new HttpParams()
      .set('phone', phone)
      .set('countryCode', countryCode);
    
    return this.http.get<Coupon[]>(`${this.apiUrl}/customer`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching customer coupons:', error);
          return of([]);
        })
      );
  }

  /**
   * Get all coupons (admin only)
   * @param status Optional status filter (ACTIVE, USED, EXPIRED, CANCELLED)
   * @returns Observable with array of coupons
   */
  getAllCoupons(status?: string): Observable<Coupon[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<Coupon[]>(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching all coupons:', error);
          return of([]);
        })
      );
  }

  /**
   * Get coupon by code (admin only)
   * @param code Coupon code
   * @returns Observable with coupon details
   */
  getCouponByCode(code: string): Observable<Coupon | null> {
    return this.http.get<Coupon>(`${this.apiUrl}/code/${code}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching coupon by code:', error);
          return of(null);
        })
      );
  }

  /**
   * Get coupon statistics (admin only)
   * @returns Observable with coupon statistics
   */
  getCouponStats(): Observable<CouponStats | null> {
    return this.http.get<CouponStats>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Error fetching coupon stats:', error);
          return of(null);
        })
      );
  }

  /**
   * Cancel a coupon (admin only)
   * @param id Coupon ID
   * @param reason Cancellation reason
   * @returns Observable with cancellation result
   */
  cancelCoupon(id: number, reason?: string): Observable<any> {
    const body = reason ? { reason } : {};
    
    return this.http.put(`${this.apiUrl}/${id}/cancel`, body)
      .pipe(
        catchError(error => {
          console.error('Error cancelling coupon:', error);
          return of({ success: false, message: 'Failed to cancel coupon' });
        })
      );
  }

  /**
   * Get coupons generated within a date range (admin only)
   * @param startDate Start date
   * @param endDate End date
   * @returns Observable with array of coupons
   */
  getCouponsGeneratedBetween(startDate: Date, endDate: Date): Observable<Coupon[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<Coupon[]>(`${this.apiUrl}/generated`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching generated coupons:', error);
          return of([]);
        })
      );
  }

  /**
   * Get coupons redeemed within a date range (admin only)
   * @param startDate Start date
   * @param endDate End date
   * @returns Observable with array of coupons
   */
  getCouponsRedeemedBetween(startDate: Date, endDate: Date): Observable<Coupon[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<Coupon[]>(`${this.apiUrl}/redeemed`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching redeemed coupons:', error);
          return of([]);
        })
      );
  }

  /**
   * Calculate days until expiry for a coupon
   * @param validUntil Expiry date string
   * @returns Number of days until expiry (negative if expired)
   */
  calculateDaysUntilExpiry(validUntil: string): number {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if a coupon is expired
   * @param validUntil Expiry date string
   * @returns True if expired
   */
  isCouponExpired(validUntil: string): boolean {
    return new Date(validUntil) < new Date();
  }

  /**
   * Format coupon code for display (add dashes if needed)
   * @param code Coupon code
   * @returns Formatted code
   */
  formatCouponCode(code: string): string {
    return code.toUpperCase().trim();
  }
}
