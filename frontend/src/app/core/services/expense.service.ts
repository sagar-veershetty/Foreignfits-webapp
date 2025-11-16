import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, ExpenseRequest, ExpenseSummary, ExpenseType, ExpenseStatus } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  // Create a new expense
  createExpense(request: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, request);
  }

  // Update an existing expense
  updateExpense(id: string, request: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, request);
  }

  // Delete an expense
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get expense by ID
  getExpenseById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  // Get all expenses
  getAllExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl);
  }

  // Get expenses by location
  getExpensesByLocation(locationId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/location/${locationId}`);
  }

  // Get expenses by type
  getExpensesByType(type: ExpenseType): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/type/${type}`);
  }

  // Get expenses with filters
  getExpensesWithFilters(
    startDate: Date,
    endDate: Date,
    locationId?: string,
    type?: ExpenseType,
    status?: ExpenseStatus
  ): Observable<Expense[]> {
    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    if (locationId) {
      params = params.set('locationId', locationId);
    }
    if (type) {
      params = params.set('type', type);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Expense[]>(`${this.apiUrl}/filter`, { params });
  }

  // Get expense summary
  getExpenseSummary(startDate: Date, endDate: Date, locationId?: string): Observable<ExpenseSummary> {
    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    if (locationId) {
      params = params.set('locationId', locationId);
    }

    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`, { params });
  }

  // Get total expenses by location
  getTotalExpensesByLocation(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Observable<number> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<number>(`${this.apiUrl}/total/location/${locationId}`, { params });
  }

  // Get total expenses by type
  getTotalExpensesByType(
    type: ExpenseType,
    startDate: Date,
    endDate: Date
  ): Observable<number> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<number>(`${this.apiUrl}/total/type/${type}`, { params });
  }

  // Approve an expense
  approveExpense(id: string): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Reject an expense
  rejectExpense(id: string): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/${id}/reject`, {});
  }

  // Get pending expenses
  getPendingExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/pending`);
  }

  // Helper method to format expense type for display
  formatExpenseType(type: ExpenseType): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // Helper method to get expense type color for UI
  getExpenseTypeColor(type: ExpenseType): string {
    const colors: { [key in ExpenseType]: string } = {
      DAILY_MAINTENANCE: 'bg-blue-100 text-blue-800',
      SALARY: 'bg-green-100 text-green-800',
      RENT: 'bg-purple-100 text-purple-800',
      ELECTRICITY: 'bg-yellow-100 text-yellow-800',
      WATER: 'bg-cyan-100 text-cyan-800',
      INTERNET: 'bg-indigo-100 text-indigo-800',
      INVENTORY_PURCHASE: 'bg-pink-100 text-pink-800',
      MARKETING: 'bg-orange-100 text-orange-800',
      TRANSPORTATION: 'bg-teal-100 text-teal-800',
      EQUIPMENT: 'bg-gray-100 text-gray-800',
      CLEANING: 'bg-lime-100 text-lime-800',
      SECURITY: 'bg-red-100 text-red-800',
      OFFICE_SUPPLIES: 'bg-violet-100 text-violet-800',
      MISCELLANEOUS: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  // Helper method to get status color
  getStatusColor(status: ExpenseStatus): string {
    const colors: { [key in ExpenseStatus]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}
