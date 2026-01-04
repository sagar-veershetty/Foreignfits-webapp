import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SalesPerson } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SalesPersonService {
  private apiUrl = `${environment.apiUrl}/sales-persons`;

  constructor(private http: HttpClient) {}

  createSalesPerson(salesPerson: SalesPerson): Observable<SalesPerson> {
    return this.http.post<SalesPerson>(this.apiUrl, salesPerson);
  }

  updateSalesPerson(id: number, salesPerson: SalesPerson): Observable<SalesPerson> {
    return this.http.put<SalesPerson>(`${this.apiUrl}/${id}`, salesPerson);
  }

  getSalesPerson(id: number): Observable<SalesPerson> {
    return this.http.get<SalesPerson>(`${this.apiUrl}/${id}`);
  }

  getAllSalesPersons(): Observable<SalesPerson[]> {
    return this.http.get<SalesPerson[]>(this.apiUrl);
  }

  getActiveSalesPersons(): Observable<SalesPerson[]> {
    return this.http.get<SalesPerson[]>(`${this.apiUrl}/active`);
  }

  getSalesPersonsByLocation(locationId: number): Observable<SalesPerson[]> {
    return this.http.get<SalesPerson[]>(`${this.apiUrl}/location/${locationId}`);
  }

  deactivateSalesPerson(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }

  deleteSalesPerson(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
