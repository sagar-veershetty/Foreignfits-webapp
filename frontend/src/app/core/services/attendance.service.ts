import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceMonthlySummary, AttendanceRecord, AttendanceStatus, SalesPerson } from '../models';

export interface AttendanceActionRequest {
  employeeId: string | number;
  date?: string;
  remarks?: string;
}

export interface AttendanceEditRequest {
  employeeId?: string | number;
  date?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: AttendanceStatus;
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  getActiveEmployees(locationId?: string | number): Observable<SalesPerson[]> {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    return this.http.get<SalesPerson[]>(`${this.apiUrl}/employees`, { params });
  }

  getAttendanceList(params: {
    date?: string;
    startDate?: string;
    endDate?: string;
    locationId?: string | number;
    employeeId?: string | number;
    status?: AttendanceStatus | 'ALL';
  }): Observable<AttendanceRecord[]> {
    let httpParams = new HttpParams();
    if (params.date) httpParams = httpParams.set('date', params.date);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.locationId) httpParams = httpParams.set('locationId', params.locationId.toString());
    if (params.employeeId) httpParams = httpParams.set('employeeId', params.employeeId.toString());
    if (params.status && params.status !== 'ALL') httpParams = httpParams.set('status', params.status);
    return this.http.get<AttendanceRecord[]>(this.apiUrl, { params: httpParams });
  }

  checkIn(request: AttendanceActionRequest): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/check-in`, request);
  }

  checkOut(request: AttendanceActionRequest): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/check-out`, request);
  }

  markLeave(request: AttendanceActionRequest): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/leave`, request);
  }

  updateAttendance(id: string | number, request: AttendanceEditRequest): Observable<AttendanceRecord> {
    return this.http.put<AttendanceRecord>(`${this.apiUrl}/${id}`, request);
  }

  getMonthlySummary(params: {
    year: number;
    month: number;
    locationId?: string | number;
    employeeId?: string | number;
  }): Observable<AttendanceMonthlySummary[]> {
    let httpParams = new HttpParams()
      .set('year', params.year.toString())
      .set('month', params.month.toString());
    if (params.locationId) httpParams = httpParams.set('locationId', params.locationId.toString());
    if (params.employeeId) httpParams = httpParams.set('employeeId', params.employeeId.toString());
    return this.http.get<AttendanceMonthlySummary[]>(`${this.apiUrl}/summary`, { params: httpParams });
  }
}
