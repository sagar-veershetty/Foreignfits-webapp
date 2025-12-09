import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppService } from '../../core/services/app.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ProductCatalogItem {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  salePrice: number;
  category: string;
  size: string;
  color: string;
  product?: {
    imageUrls?: string[];
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;
  
  // Product catalog state
  allProducts = signal<ProductCatalogItem[]>([]);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  isLoading = signal<boolean>(false);

  // Filtered products based on search and category
  filteredProducts = computed(() => {
    const products = this.allProducts();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    
    return products.filter(item => {
      // Category filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }
      
      // Search filter
      if (query) {
        const searchIn = `${item.productName} ${item.productSku} ${item.size} ${item.color}`.toLowerCase();
        return searchIn.includes(query);
      }
      
      return true;
    });
  });

  // Get unique categories
  categories = computed(() => {
    const products = this.allProducts();
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  });

  constructor(
    private authService: AuthService,
    private appService: AppService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.authState$.pipe(
      map(state => state.isAuthenticated)
    );
  }

  ngOnInit(): void {
    // Load catalog for all users (public endpoint)
    this.loadProductCatalog();
  }

  loadProductCatalog(): void {
    this.isLoading.set(true);
    
    // Use public catalog endpoint - no authentication required
    this.appService.getPublicCatalog().subscribe({
      next: (catalog: any[]) => {
        // Aggregate by SKU (in case there are multiple locations with same product)
        const productMap = new Map<string, ProductCatalogItem>();
        
        catalog.forEach(item => {
          const existing = productMap.get(item.productSku);
          if (existing) {
            // Product already exists, just mark it as available
            existing.quantity = 1; // Just mark as available, don't expose exact quantity
          } else {
            productMap.set(item.productSku, {
              id: item.productSku,
              productSku: item.productSku,
              productName: item.productName,
              quantity: 1, // Don't expose exact inventory count in public catalog
              salePrice: item.salePrice || 0,
              category: item.category || 'general',
              size: item.size || '',
              color: item.color || '',
              product: {
                imageUrls: item.imageUrls || []
              }
            });
          }
        });
        
        // Sort by name
        const catalogItems = Array.from(productMap.values())
          .sort((a, b) => a.productName.localeCompare(b.productName));
        
        this.allProducts.set(catalogItems);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load product catalog:', error);
        this.allProducts.set([]);
        this.isLoading.set(false);
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Getters for template
  get catalogProducts() {
    return this.filteredProducts();
  }

  get availableCategories() {
    return this.categories();
  }

  get currentSearchQuery() {
    return this.searchQuery();
  }

  set currentSearchQuery(value: string) {
    this.searchQuery.set(value);
  }

  get currentSelectedCategory() {
    return this.selectedCategory();
  }

  set currentSelectedCategory(value: string) {
    this.selectedCategory.set(value);
  }

  get isLoadingProducts() {
    return this.isLoading();
  }
}
