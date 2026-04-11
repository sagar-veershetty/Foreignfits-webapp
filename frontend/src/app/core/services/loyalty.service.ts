import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoyaltyCustomer,
  LoyaltyTransaction,
  LoyaltyProgramInfo,
  PointsCalculation,
  DiscountCalculation
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private readonly apiUrl = `${environment.apiUrl}/loyalty`;

  constructor(private http: HttpClient) {}

  /**
   * Get or create a loyalty customer by phone number
   */
  getCustomerByPhone(phone: string, countryCode: string = '+91'): Observable<LoyaltyCustomer | null> {
    const params = new HttpParams()
      .set('phone', phone)
      .set('countryCode', countryCode);

    return this.http.get<LoyaltyCustomer>(`${this.apiUrl}/customer`, { params }).pipe(
      map((customer: any) => ({
        ...customer,
        customerName: customer.customerName || customer.name || '',
        currentPoints: customer.currentPoints ?? customer.totalPoints ?? 0,
        joinDate: customer.joinDate ? new Date(customer.joinDate) : (customer.joinedAt ? new Date(customer.joinedAt) : new Date()),
        lastPurchaseDate: customer.lastPurchaseDate
          ? new Date(customer.lastPurchaseDate)
          : (customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt) : undefined),
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : undefined,
        tierExpiryDate: customer.tierExpiryDate ? new Date(customer.tierExpiryDate) : undefined
      } as LoyaltyCustomer)),
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Get customer's transaction history
   */
  getCustomerTransactions(phone: string, countryCode: string = '+91'): Observable<LoyaltyTransaction[]> {
    const params = new HttpParams()
      .set('phone', phone)
      .set('countryCode', countryCode);

    return this.http.get<LoyaltyTransaction[]>(`${this.apiUrl}/transactions`, { params }).pipe(
      map(transactions => transactions.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        expiryDate: t.expiryDate ? new Date(t.expiryDate) : undefined
      }))),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Calculate points that would be earned for a given amount
   */
  calculatePoints(amount: number, phone?: string, countryCode: string = '+91'): Observable<PointsCalculation | null> {
    let params = new HttpParams().set('amount', amount.toString());
    
    if (phone) {
      params = params.set('phone', phone).set('countryCode', countryCode);
    }

    return this.http.get<PointsCalculation>(`${this.apiUrl}/calculate-points`, { params }).pipe(
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Calculate discount amount for given points
   */
  calculateDiscount(points: number): Observable<DiscountCalculation | null> {
    const params = new HttpParams().set('points', points.toString());

    return this.http.get<DiscountCalculation>(`${this.apiUrl}/calculate-discount`, { params }).pipe(
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Get loyalty program information (rules, tiers, etc.)
   */
  getProgramInfo(): Observable<LoyaltyProgramInfo | null> {
    return this.http.get<LoyaltyProgramInfo>(`${this.apiUrl}/program-info`).pipe(
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Helper method to format tier name for display
   */
  formatTierName(tier: string): string {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
  }

  /**
   * Helper method to get tier color for UI
   */
  getTierColor(tier: string): string {
    switch (tier) {
      case 'BRONZE': return 'text-amber-700';
      case 'SILVER': return 'text-gray-400';
      case 'GOLD': return 'text-yellow-500';
      case 'PLATINUM': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Helper method to get tier badge color
   */
  getTierBadgeColor(tier: string): string {
    switch (tier) {
      case 'BRONZE': return 'bg-amber-100 text-amber-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Helper method to get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    switch (type) {
      case 'EARNED_PURCHASE': return 'Purchase';
      case 'REDEEMED': return 'Redeemed';
      case 'EXPIRED': return 'Expired';
      case 'ADJUSTED': return 'Adjusted';
      case 'BONUS_SIGNUP': return 'Welcome Bonus';
      case 'BONUS_BIRTHDAY': return 'Birthday Bonus';
      case 'BONUS_TIER_UPGRADE': return 'Tier Upgrade Bonus';
      default: return type;
    }
  }

  /**
   * Helper method to get transaction type color
   */
  getTransactionTypeColor(type: string): string {
    switch (type) {
      case 'EARNED_PURCHASE':
      case 'BONUS_SIGNUP':
      case 'BONUS_BIRTHDAY':
      case 'BONUS_TIER_UPGRADE':
        return 'text-green-600';
      case 'REDEEMED':
        return 'text-blue-600';
      case 'EXPIRED':
        return 'text-red-600';
      case 'ADJUSTED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }
}
