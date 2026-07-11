import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AttendanceService, AttendanceActionRequest, AttendanceEditRequest } from '../../core/services/attendance.service';
import { AppService, AppState } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceMonthlySummary, AttendanceRecord, AttendanceStatus, SalesPerson } from '../../core/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html'
})
export class AttendanceComponent implements OnInit {
  appState$: Observable<AppState>;

  filterMode: 'date' | 'week' | 'month' | 'range' = 'date';
  selectedDate: string = this.formatDateInput(new Date());
  fromDate: string = this.formatDateInput(new Date());
  toDate: string = this.formatDateInput(new Date());
  locationFilter: string = 'all';
  employeeFilter: string = 'all';
  statusFilter: AttendanceStatus | 'ALL' = 'ALL';

  employees: SalesPerson[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  monthlySummary: AttendanceMonthlySummary[] = [];

  summaryMonth: string = this.formatMonthInput(new Date());

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  editingRecord: AttendanceRecord | null = null;
  editCheckIn = '';
  editCheckOut = '';
  editStatus: AttendanceStatus | '' = '';
  editRemarks = '';

  actionInProgress: string | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private appService: AppService,
    private authService: AuthService
  ) {
    this.appState$ = this.appService.appState$;
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!this.hasCrossLocationAccess() && currentUser?.locationId) {
      this.locationFilter = currentUser.locationId.toString();
    }
    this.appService.loadInitialData().subscribe();
    this.loadEmployees();
    this.loadAttendance();
    this.loadMonthlySummary();
  }

  hasCrossLocationAccess(): boolean {
    return this.authService.hasCrossLocationAccess();
  }

  private getScopedLocationId(): string | undefined {
    if (this.hasCrossLocationAccess()) {
      return this.locationFilter !== 'all' ? this.locationFilter : undefined;
    }
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.locationId ? currentUser.locationId.toString() : undefined;
  }

  loadEmployees(): void {
    const locationId = this.getScopedLocationId();
    this.attendanceService.getActiveEmployees(locationId).subscribe({
      next: (employees) => {
        this.employees = employees || [];
      },
      error: () => {
        this.employees = [];
      }
    });
  }

  applyFilters(): void {
    if (!this.hasCrossLocationAccess()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.locationId) {
        this.locationFilter = currentUser.locationId.toString();
      }
    }
    if (this.employeeFilter !== 'all' && !this.employees.some(emp => emp.id?.toString() === this.employeeFilter)) {
      this.employeeFilter = 'all';
    }
    this.loadEmployees();
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { startDate, endDate } = this.getDateRange();
    const locationId = this.getScopedLocationId();

    this.attendanceService.getAttendanceList({
      date: this.filterMode === 'date' ? this.selectedDate : undefined,
      startDate: this.filterMode !== 'date' ? startDate : undefined,
      endDate: this.filterMode !== 'date' ? endDate : undefined,
      locationId,
      employeeId: this.employeeFilter !== 'all' ? this.employeeFilter : undefined,
      status: this.statusFilter
    }).subscribe({
      next: (records) => {
        this.attendanceRecords = (records || []).map(record => ({
          ...record,
          attendanceDate: new Date(record.attendanceDate),
          checkInTime: record.checkInTime ? new Date(record.checkInTime) : null,
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.error?.message || 'Failed to load attendance.';
        this.isLoading = false;
      }
    });
  }

  loadMonthlySummary(): void {
    const [year, month] = this.summaryMonth.split('-').map(value => Number(value));
    const locationId = this.getScopedLocationId();
    this.attendanceService.getMonthlySummary({
      year,
      month,
      locationId,
      employeeId: this.employeeFilter !== 'all' ? this.employeeFilter : undefined
    }).subscribe({
      next: (summary) => {
        this.monthlySummary = summary || [];
      },
      error: () => {
        this.monthlySummary = [];
      }
    });
  }

  refreshSummary(): void {
    this.loadMonthlySummary();
  }

  getDateRange(): { startDate: string; endDate: string } {
    if (this.filterMode === 'week') {
      const date = new Date(this.selectedDate);
      const day = date.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      const monday = new Date(date);
      monday.setDate(date.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: this.formatDateInput(monday),
        endDate: this.formatDateInput(sunday)
      };
    }

    if (this.filterMode === 'month') {
      const date = new Date(this.selectedDate);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return {
        startDate: this.formatDateInput(start),
        endDate: this.formatDateInput(end)
      };
    }

    if (this.filterMode === 'range') {
      return { startDate: this.fromDate, endDate: this.toDate };
    }

    return { startDate: this.selectedDate, endDate: this.selectedDate };
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatMonthInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  formatTime(date?: Date | null): string {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatHours(hours?: number | null): string {
    if (hours == null) return '—';
    return hours.toFixed(2);
  }

  statusBadgeClass(status: AttendanceStatus): string {
    switch (status) {
      case 'FULL_DAY':
        return 'bg-green-100 text-green-700';
      case 'HALF_DAY':
        return 'bg-yellow-100 text-yellow-700';
      case 'LEAVE':
        return 'bg-purple-100 text-purple-700';
      case 'MISSING_CHECKOUT':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  }

  canActOn(record: AttendanceRecord): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id !== record.employeeId;
  }

  checkIn(record: AttendanceRecord): void {
    if (!this.canActOn(record)) {
      return;
    }
    const payload: AttendanceActionRequest = {
      employeeId: record.employeeId,
      date: this.filterMode === 'date' ? this.selectedDate : this.formatDateInput(record.attendanceDate)
    };
    this.actionInProgress = `check-in-${record.employeeId}-${record.attendanceDate}`;
    this.attendanceService.checkIn(payload).subscribe({
      next: () => {
        this.successMessage = 'Check-in recorded.';
        this.actionInProgress = null;
        this.loadAttendance();
        this.loadMonthlySummary();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.error?.message || 'Failed to check in.';
        this.actionInProgress = null;
      }
    });
  }

  checkOut(record: AttendanceRecord): void {
    if (!this.canActOn(record)) {
      return;
    }
    const payload: AttendanceActionRequest = {
      employeeId: record.employeeId,
      date: this.filterMode === 'date' ? this.selectedDate : this.formatDateInput(record.attendanceDate)
    };
    this.actionInProgress = `check-out-${record.employeeId}-${record.attendanceDate}`;
    this.attendanceService.checkOut(payload).subscribe({
      next: () => {
        this.successMessage = 'Check-out recorded.';
        this.actionInProgress = null;
        this.loadAttendance();
        this.loadMonthlySummary();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.error?.message || 'Failed to check out.';
        this.actionInProgress = null;
      }
    });
  }

  markLeave(record: AttendanceRecord): void {
    if (!this.canActOn(record)) {
      return;
    }
    const payload: AttendanceActionRequest = {
      employeeId: record.employeeId,
      date: this.filterMode === 'date' ? this.selectedDate : this.formatDateInput(record.attendanceDate)
    };
    this.actionInProgress = `leave-${record.employeeId}-${record.attendanceDate}`;
    this.attendanceService.markLeave(payload).subscribe({
      next: () => {
        this.successMessage = 'Leave marked.';
        this.actionInProgress = null;
        this.loadAttendance();
        this.loadMonthlySummary();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.error?.message || 'Failed to mark leave.';
        this.actionInProgress = null;
      }
    });
  }

  openEdit(record: AttendanceRecord): void {
    if (!record.id) {
      return;
    }
    this.editingRecord = record;
    this.editCheckIn = record.checkInTime ? this.formatDateTimeInput(record.checkInTime) : '';
    this.editCheckOut = record.checkOutTime ? this.formatDateTimeInput(record.checkOutTime) : '';
    this.editStatus = record.status;
    this.editRemarks = record.remarks || '';
  }

  closeEdit(): void {
    this.editingRecord = null;
    this.editCheckIn = '';
    this.editCheckOut = '';
    this.editStatus = '';
    this.editRemarks = '';
  }

  saveEdit(): void {
    if (!this.editingRecord || !this.editingRecord.id) {
      return;
    }
    const payload: AttendanceEditRequest = {
      checkInTime: this.editCheckIn ? new Date(this.editCheckIn).toISOString() : null,
      checkOutTime: this.editCheckOut ? new Date(this.editCheckOut).toISOString() : null,
      status: this.editStatus || undefined,
      remarks: this.editRemarks
    };
    this.attendanceService.updateAttendance(this.editingRecord.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Attendance updated.';
        this.closeEdit();
        this.loadAttendance();
        this.loadMonthlySummary();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.error?.message || 'Failed to update attendance.';
      }
    });
  }

  formatDateTimeInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  trackRecord(_: number, record: AttendanceRecord): string {
    return `${record.employeeId}-${record.attendanceDate.toISOString()}`;
  }

  canShowCheckIn(record: AttendanceRecord): boolean {
    return record.status === 'ABSENT' || record.status === 'LEAVE';
  }

  canShowCheckOut(record: AttendanceRecord): boolean {
    return record.status === 'MISSING_CHECKOUT';
  }

  canShowLeave(record: AttendanceRecord): boolean {
    return record.status === 'ABSENT';
  }

  getStatusOptions(): AttendanceStatus[] {
    return ['FULL_DAY', 'HALF_DAY', 'ABSENT', 'LEAVE', 'MISSING_CHECKOUT'];
  }
}
