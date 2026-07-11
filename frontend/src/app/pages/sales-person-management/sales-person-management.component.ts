import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesPersonService } from '../../core/services/sales-person.service';
import { AuthService } from '../../core/services/auth.service';
import { SalesPerson } from '../../core/models';

@Component({
  selector: 'app-sales-person-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-person-management.component.html',
  styleUrls: ['./sales-person-management.component.css']
})
export class SalesPersonManagementComponent implements OnInit {
  salesPersons: SalesPerson[] = [];
  filteredSalesPersons: SalesPerson[] = [];
  isLoading = false;
  showAddModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  searchTerm = '';
  currentLocationId: number | null = null;
  canManageAllLocations = false;
  
  // Form data
  formData: Partial<SalesPerson> = {
    name: '',
    phone: '',
    email: '',
    isActive: true,
    incentiveRate: 0,
    notes: ''
  };
  
  editingPerson: SalesPerson | null = null;
  deletingPerson: SalesPerson | null = null;
  
  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private salesPersonService: SalesPersonService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentLocationId = currentUser?.locationId != null ? Number(currentUser.locationId) : null;
    this.canManageAllLocations = this.authService.hasCrossLocationAccess();
    this.loadSalesPersons();
  }

  /**
   * Load all sales persons
   */
  loadSalesPersons(): void {
    this.isLoading = true;
    const request$ = this.canManageAllLocations
      ? this.salesPersonService.getAllSalesPersons()
      : (this.currentLocationId
        ? this.salesPersonService.getSalesPersonsByLocation(this.currentLocationId)
        : this.salesPersonService.getAllSalesPersons());

    request$.subscribe({
      next: (persons) => {
        this.salesPersons = persons;
        this.filteredSalesPersons = persons;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales persons:', error);
        this.errorMessage = 'Failed to load sales persons';
        this.isLoading = false;
      }
    });
  }

  /**
   * Filter sales persons by search term
   */
  filterSalesPersons(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredSalesPersons = this.salesPersons;
      return;
    }
    
    this.filteredSalesPersons = this.salesPersons.filter(person =>
      person.name.toLowerCase().includes(term) ||
      (person.phone && person.phone.includes(term)) ||
      (person.email && person.email.toLowerCase().includes(term))
    );
  }

  /**
   * Open add modal
   */
  openAddModal(): void {
    this.formData = {
      name: '',
      phone: '',
      email: '',
      isActive: true,
      incentiveRate: 0,
      notes: '',
      locationId: this.canManageAllLocations ? undefined : this.currentLocationId ?? undefined
    };
    this.showAddModal = true;
    this.clearMessages();
  }

  /**
   * Close add modal
   */
  closeAddModal(): void {
    this.showAddModal = false;
    this.formData = {
      name: '',
      phone: '',
      email: '',
      isActive: true,
      incentiveRate: 0,
      notes: ''
    };
  }

  /**
   * Open edit modal
   */
  openEditModal(person: SalesPerson): void {
    this.editingPerson = person;
    this.formData = {
      name: person.name,
      phone: person.phone,
      email: person.email,
      isActive: person.isActive,
      incentiveRate: person.incentiveRate,
      notes: person.notes,
      locationId: this.canManageAllLocations ? person.locationId : this.currentLocationId ?? person.locationId
    };
    this.showEditModal = true;
    this.clearMessages();
  }

  /**
   * Close edit modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingPerson = null;
    this.formData = {
      name: '',
      phone: '',
      email: '',
      isActive: true,
      incentiveRate: 0,
      notes: ''
    };
  }

  /**
   * Validate form data
   */
  validateForm(): string | null {
    if (!this.formData.name || this.formData.name.trim().length === 0) {
      return 'Name is required';
    }
    
    if (this.formData.name.trim().length > 100) {
      return 'Name must be less than 100 characters';
    }
    
    if (this.formData.phone && this.formData.phone.length > 15) {
      return 'Phone number must be less than 15 characters';
    }
    
    if (this.formData.email && !this.isValidEmail(this.formData.email)) {
      return 'Invalid email format';
    }
    
    if (this.formData.incentiveRate && (this.formData.incentiveRate < 0 || this.formData.incentiveRate > 100)) {
      return 'Incentive rate must be between 0 and 100';
    }
    
    return null;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create new sales person
   */
  createSalesPerson(): void {
    const validationError = this.validateForm();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    if (!this.canManageAllLocations && this.currentLocationId) {
      this.formData.locationId = this.currentLocationId;
    }

    this.salesPersonService.createSalesPerson(this.formData as SalesPerson).subscribe({
      next: (created) => {
        this.successMessage = `Sales person "${created.name}" created successfully!`;
        this.closeAddModal();
        this.loadSalesPersons();
        this.isLoading = false;
        
        // Auto-hide success message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating sales person:', error);
        this.errorMessage = error.error || 'Failed to create sales person. Name may already exist.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Update sales person
   */
  updateSalesPerson(): void {
    if (!this.editingPerson) return;

    const validationError = this.validateForm();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    if (!this.canManageAllLocations && this.currentLocationId) {
      this.formData.locationId = this.currentLocationId;
    } else if (this.canManageAllLocations && this.formData.locationId == null) {
      this.formData.locationId = this.editingPerson.locationId;
    }

    this.salesPersonService.updateSalesPerson(this.editingPerson.id, this.formData as SalesPerson).subscribe({
      next: (updated) => {
        this.successMessage = `Sales person "${updated.name}" updated successfully!`;
        this.closeEditModal();
        this.loadSalesPersons();
        this.isLoading = false;
        
        // Auto-hide success message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating sales person:', error);
        this.errorMessage = error.error || 'Failed to update sales person. Name may already exist.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Open delete confirmation
   */
  openDeleteConfirm(person: SalesPerson): void {
    this.deletingPerson = person;
    this.showDeleteConfirm = true;
    this.clearMessages();
  }

  /**
   * Close delete confirmation
   */
  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.deletingPerson = null;
  }

  /**
   * Delete sales person
   */
  deleteSalesPerson(): void {
    if (!this.deletingPerson) return;

    this.isLoading = true;
    this.clearMessages();

    this.salesPersonService.deleteSalesPerson(this.deletingPerson.id).subscribe({
      next: () => {
        this.successMessage = `Sales person "${this.deletingPerson!.name}" deleted successfully!`;
        this.closeDeleteConfirm();
        this.loadSalesPersons();
        this.isLoading = false;
        
        // Auto-hide success message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting sales person:', error);
        this.errorMessage = error.error || 'Failed to delete sales person.';
        this.isLoading = false;
        this.closeDeleteConfirm();
      }
    });
  }

  /**
   * Toggle active status
   */
  toggleActiveStatus(person: SalesPerson): void {
    const updatedPerson = { ...person, isActive: !person.isActive };
    
    this.salesPersonService.updateSalesPerson(person.id, updatedPerson).subscribe({
      next: () => {
        this.successMessage = `${person.name} is now ${!person.isActive ? 'active' : 'inactive'}`;
        this.loadSalesPersons();
        
        // Auto-hide success message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.errorMessage = 'Failed to update status';
      }
    });
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Get active sales persons count
   */
  getActiveCount(): number {
    return this.salesPersons.filter(p => p.isActive).length;
  }

  /**
   * Get inactive sales persons count
   */
  getInactiveCount(): number {
    return this.salesPersons.filter(p => !p.isActive).length;
  }
}
