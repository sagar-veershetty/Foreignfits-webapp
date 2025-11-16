import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { AppService } from '../../core/services/app.service';
import { AuthService } from '../../core/services/auth.service';
import { Expense, ExpenseRequest, ExpenseSummary, ExpenseType, ExpenseStatus, PaymentMethod, Location } from '../../core/models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  // Signals
  expenses = signal<Expense[]>([]);
  locations = signal<Location[]>([]);
  availableLocations = signal<Location[]>([]); // Filtered locations based on user role
  summary = signal<ExpenseSummary | null>(null);
  isLoading = signal(false);
  isModalOpen = signal(false);
  isAddingExpense = signal(false);
  currentUser = signal<any>(null);
  isAdmin = signal(false);

  // Filter signals
  filterStartDate = signal<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  filterEndDate = signal<Date>(new Date());
  filterLocation = signal<string>('');
  filterType = signal<ExpenseType | ''>('');
  filterStatus = signal<ExpenseStatus | ''>('');
  dateRangePreset = signal<string>('last30'); // 'today', 'thisWeek', 'thisMonth', 'custom', 'last30'

  // Form signals
  expenseForm = signal<ExpenseRequest>({
    type: 'DAILY_MAINTENANCE',
    amount: 0,
    description: '',
    expenseDate: new Date(),
    locationId: '',
    paymentMethod: 'CASH',
    receiptUrl: '',
    notes: ''
  });

  currentEditingExpense = signal<Expense | null>(null);

  // Enums for templates
  expenseTypes: ExpenseType[] = [
    'DAILY_MAINTENANCE', 'SALARY', 'RENT', 'ELECTRICITY', 'WATER', 'INTERNET',
    'INVENTORY_PURCHASE', 'MARKETING', 'TRANSPORTATION', 'EQUIPMENT',
    'CLEANING', 'SECURITY', 'OFFICE_SUPPLIES', 'MISCELLANEOUS'
  ];

  paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

  expenseStatuses: ExpenseStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];

  // Computed values
  // Note: Backend already filters expenses, so we just return them as-is
  filteredExpenses = computed(() => {
    return this.expenses();
  });

  totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((sum, exp) => sum + exp.amount, 0);
  });

  pendingExpensesCount = computed(() => {
    return this.expenses().filter(e => e.status === 'PENDING').length;
  });

  averageExpense = computed(() => {
    const summary = this.summary();
    if (!summary || this.expenses().length === 0) return 0;
    return summary.totalExpenses / this.expenses().length;
  });

  constructor(
    private expenseService: ExpenseService,
    public appService: AppService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get current user
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    this.isAdmin.set(user?.role === 'admin');
    
    // Set initial location filter for non-admin users
    if (user && user.role !== 'admin' && user.locationId) {
      this.filterLocation.set(user.locationId.toString());
    }
    
    this.loadLocations();
    this.loadExpenses();
    this.loadSummary();
  }

  loadLocations() {
    // Get locations from AppService state
    this.appService.appState$.subscribe({
      next: (state) => {
        const activeLocations = state.locations.filter((l: Location) => l.isActive);
        this.locations.set(activeLocations);
        
        // Filter available locations based on user role
        const user = this.currentUser();
        if (user?.role === 'admin') {
          // Admin can see all locations
          this.availableLocations.set(activeLocations);
        } else {
          // Non-admin users can only see their own location
          if (user?.locationId) {
            const userLocation = activeLocations.find((l: Location) => l.id === user.locationId);
            this.availableLocations.set(userLocation ? [userLocation] : []);
          } else {
            this.availableLocations.set([]);
          }
        }
      },
      error: (err: any) => console.error('Error loading locations:', err)
    });
  }

  loadExpenses() {
    this.isLoading.set(true);
    this.expenseService.getExpensesWithFilters(
      this.filterStartDate(),
      this.filterEndDate(),
      this.filterLocation() || undefined,
      this.filterType() || undefined,
      this.filterStatus() || undefined
    ).subscribe({
      next: (data: Expense[]) => {
        this.expenses.set(data);
        this.isLoading.set(false);
        // Force change detection to ensure UI updates
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading expenses:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadSummary() {
    this.expenseService.getExpenseSummary(
      this.filterStartDate(),
      this.filterEndDate(),
      this.filterLocation() || undefined
    ).subscribe({
      next: (data: ExpenseSummary) => {
        this.summary.set(data);
        // Force change detection to ensure UI updates
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading summary:', err)
    });
  }

  applyFilters() {
    this.loadExpenses();
    this.loadSummary();
  }

  // Date range preset filters
  setDateRangeToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    this.filterStartDate.set(today);
    this.filterEndDate.set(endOfDay);
    this.dateRangePreset.set('today');
    this.applyFilters();
  }

  setDateRangeThisWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek)); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    this.filterStartDate.set(startOfWeek);
    this.filterEndDate.set(endOfWeek);
    this.dateRangePreset.set('thisWeek');
    this.applyFilters();
  }

  setDateRangeThisMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    this.filterStartDate.set(startOfMonth);
    this.filterEndDate.set(endOfMonth);
    this.dateRangePreset.set('thisMonth');
    this.applyFilters();
  }

  setDateRangeLast30Days() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    
    this.filterStartDate.set(thirtyDaysAgo);
    this.filterEndDate.set(today);
    this.dateRangePreset.set('last30');
    this.applyFilters();
  }

  setCustomDateRange() {
    this.dateRangePreset.set('custom');
    // Don't auto-apply filters for custom range, let user set dates first
  }

  onStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.filterStartDate.set(new Date(target.value));
    this.onDateRangeChange();
  }

  onEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.filterEndDate.set(new Date(target.value));
    this.onDateRangeChange();
  }

  onDateRangeChange() {
    if (this.dateRangePreset() === 'custom') {
      this.applyFilters();
    }
  }

  openAddModal() {
    this.currentEditingExpense.set(null);
    
    // Set default location based on user role
    const user = this.currentUser();
    const defaultLocationId = user?.role === 'admin' 
      ? (this.availableLocations()[0]?.id || '') 
      : (user?.locationId || '');
    
    this.expenseForm.set({
      type: 'DAILY_MAINTENANCE',
      amount: 0,
      description: '',
      expenseDate: new Date(),
      locationId: defaultLocationId,
      paymentMethod: 'CASH',
      receiptUrl: '',
      notes: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(expense: Expense) {
    this.currentEditingExpense.set(expense);
    this.expenseForm.set({
      type: expense.type,
      amount: expense.amount,
      description: expense.description,
      expenseDate: new Date(expense.expenseDate),
      locationId: expense.locationId,
      paymentMethod: expense.paymentMethod,
      receiptUrl: expense.receiptUrl,
      notes: expense.notes
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.currentEditingExpense.set(null);
  }

  updateFormField(field: keyof ExpenseRequest, value: any) {
    const currentForm = this.expenseForm();
    this.expenseForm.set({ ...currentForm, [field]: value });
  }

  saveExpense() {
    if (this.isAddingExpense()) return;

    this.isAddingExpense.set(true);
    const expense = this.currentEditingExpense();

    const request: ExpenseRequest = {
      ...this.expenseForm(),
      locationId: Number(this.expenseForm().locationId),  // Convert to number
      expenseDate: new Date(this.expenseForm().expenseDate)
    };

    const operation = expense
      ? this.expenseService.updateExpense(expense.id, request)
      : this.expenseService.createExpense(request);

    operation.subscribe({
      next: () => {
        this.isAddingExpense.set(false);
        this.closeModal();
        
        // Force refresh by calling applyFilters which reloads both expenses and summary
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error saving expense:', err);
        alert('Failed to save expense: ' + (err.error?.message || err.message));
        this.isAddingExpense.set(false);
      }
    });
  }

  deleteExpense(expense: Expense) {
    if (!confirm(`Are you sure you want to delete this expense: ${expense.description}?`)) {
      return;
    }

    this.expenseService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense');
      }
    });
  }

  approveExpense(expense: Expense) {
    this.expenseService.approveExpense(expense.id).subscribe({
      next: () => this.applyFilters(),
      error: (err) => {
        console.error('Error approving expense:', err);
        alert('Failed to approve expense');
      }
    });
  }

  rejectExpense(expense: Expense) {
    this.expenseService.rejectExpense(expense.id).subscribe({
      next: () => this.applyFilters(),
      error: (err) => {
        console.error('Error rejecting expense:', err);
        alert('Failed to reject expense');
      }
    });
  }

  // Helper methods
  formatExpenseType(type: ExpenseType): string {
    return this.expenseService.formatExpenseType(type);
  }

  getExpenseTypeColor(type: ExpenseType): string {
    return this.expenseService.getExpenseTypeColor(type);
  }

  getStatusColor(status: ExpenseStatus): string {
    return this.expenseService.getStatusColor(status);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getLocationName(locationId: string): string {
    return this.locations().find(l => l.id === locationId)?.name || 'Unknown';
  }

  getSummaryByTypeEntries(): [string, number][] {
    const summary = this.summary();
    if (!summary) return [];
    return Object.entries(summary.expensesByType).sort((a, b) => b[1] - a[1]);
  }

  // Event handlers for filters
  onFilterLocationChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterLocation.set(value);
    this.applyFilters();
  }

  onFilterTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterType.set(value as any);
    this.applyFilters();
  }

  onFilterStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value as any);
    this.applyFilters();
  }

  // Event handler for form fields
  onFormFieldChange(field: keyof ExpenseRequest, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    let value: any = target.value;
    
    if (field === 'amount') {
      value = parseFloat(value) || 0;
    }
    
    const currentForm = this.expenseForm();
    this.expenseForm.set({ ...currentForm, [field]: value });
  }

  getStatusClass(status: ExpenseStatus): string {
    const classes = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
