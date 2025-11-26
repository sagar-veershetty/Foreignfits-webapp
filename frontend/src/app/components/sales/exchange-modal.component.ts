import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExchangeService, ExchangeRequest, ExchangeItemRequest } from '../../core/services/exchange.service';
import { AppService } from '../../core/services/app.service';
import { Sale, SaleItem, Product } from '../../core/models';

@Component({
  selector: 'app-exchange-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exchange-modal.component.html',
  styleUrls: ['./exchange-modal.component.scss']
})
export class ExchangeModalComponent implements OnInit {
  @Input() sale!: Sale;
  @Output() closed = new EventEmitter<void>();
  @Output() exchangeCreated = new EventEmitter<void>();

  exchangeReason = signal<string>('');
  notes = signal<string>('');
  selectedReturnItems = signal<Map<string, number>>(new Map());
  exchangeItems = signal<{ product: Product; quantity: number; barcode?: string }[]>([]);
  searchBarcode = signal<string>('');
  searchResults = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private exchangeService: ExchangeService,
    private appService: AppService
  ) {}

  ngOnInit() {
    // Initialize with all items selected for return
    const returnMap = new Map<string, number>();
    this.sale.items.forEach(item => {
      returnMap.set(item.product.id, item.quantity);
    });
    this.selectedReturnItems.set(returnMap);
  }

  returnedTotal = computed(() => {
    let total = 0;
    this.sale.items.forEach(item => {
      const returnQty = this.selectedReturnItems().get(item.product.id) || 0;
      total += item.price * returnQty;
    });
    return total;
  });

  exchangedTotal = computed(() => {
    return this.exchangeItems().reduce((sum, item) => {
      // Use the price from location inventory
      return sum + (item.product as any).salePrice * item.quantity;
    }, 0);
  });

  priceDifference = computed(() => {
    return this.exchangedTotal() - this.returnedTotal();
  });

  canSubmit = computed(() => {
    const hasReturnItems = Array.from(this.selectedReturnItems().values()).some(qty => qty > 0);
    const hasExchangeItems = this.exchangeItems().length > 0;
    const hasReason = this.exchangeReason().trim().length > 0;
    return hasReturnItems && hasExchangeItems && hasReason;
  });

  updateReturnQuantity(productId: string, quantity: number, maxQuantity: number) {
    const qty = Math.max(0, Math.min(quantity, maxQuantity));
    const map = new Map(this.selectedReturnItems());
    if (qty > 0) {
      map.set(productId, qty);
    } else {
      map.delete(productId);
    }
    this.selectedReturnItems.set(map);
  }

  searchProduct() {
    const barcode = this.searchBarcode().trim();
    if (!barcode) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.appService.lookupBarcode(barcode).subscribe({
      next: (result: any) => {
        if (result && result.product) {
          // Fetch location inventory to get the price
          const locationId = this.sale.location.id;
          this.appService.getInventoryByLocationAndSku(Number(locationId), result.product.sku).subscribe({
            next: (inventory: any) => {
              if (!inventory) {
                this.errorMessage.set('Product not available at this location');
                this.isLoading.set(false);
                return;
              }
              
              // Convert barcode lookup result to product format with price
              const product: any = {
                id: result.product.id,
                name: result.product.name,
                sku: result.product.sku,
                size: result.product.size,
                color: result.product.color,
                category: result.product.category,
                createdAt: result.product.createdAt || new Date(),
                updatedAt: result.product.updatedAt || new Date(),
                salePrice: inventory.salePrice // Add the sale price from inventory
              };
              this.searchResults.set([product]);
              this.isLoading.set(false);
            },
            error: (error: any) => {
              this.errorMessage.set('Failed to fetch product pricing');
              this.isLoading.set(false);
              console.error('Inventory fetch error:', error);
            }
          });
        } else {
          this.errorMessage.set('No product found with this barcode');
          this.isLoading.set(false);
        }
      },
      error: (error: any) => {
        this.errorMessage.set('Error searching for product');
        this.isLoading.set(false);
        console.error('Search error:', error);
      }
    });
  }

  addExchangeItem(product: Product) {
    const items = [...this.exchangeItems()];
    const existingIndex = items.findIndex(i => i.product.id === product.id);
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity++;
    } else {
      items.push({ product, quantity: 1, barcode: this.searchBarcode() });
    }
    
    this.exchangeItems.set(items);
    this.searchBarcode.set('');
    this.searchResults.set([]);
  }

  removeExchangeItem(index: number) {
    const items = [...this.exchangeItems()];
    items.splice(index, 1);
    this.exchangeItems.set(items);
  }

  updateExchangeQuantity(index: number, quantity: number) {
    const items = [...this.exchangeItems()];
    if (quantity > 0) {
      items[index].quantity = quantity;
    } else {
      items.splice(index, 1);
    }
    this.exchangeItems.set(items);
  }

  submitExchange() {
    if (!this.canSubmit()) return;

    const returnedItems: ExchangeItemRequest[] = [];
    this.selectedReturnItems().forEach((quantity, productId) => {
      if (quantity > 0) {
        const saleItem = this.sale.items.find(i => i.product.id === productId);
        returnedItems.push({
          productId: Number(productId),
          quantity,
          barcode: Array.isArray(saleItem?.barcodes) && saleItem.barcodes.length > 0 
            ? saleItem.barcodes[0] 
            : undefined
        });
      }
    });

    const exchangedItems: ExchangeItemRequest[] = this.exchangeItems().map(item => ({
      productId: Number(item.product.id),
      quantity: item.quantity,
      barcode: item.barcode
    }));

    const request: ExchangeRequest = {
      originalSaleId: Number(this.sale.id),
      locationId: Number(this.sale.location.id),
      exchangeReason: this.exchangeReason(),
      notes: this.notes() || undefined,
      returnedItems,
      exchangedItems
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.exchangeService.createExchange(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.exchangeCreated.emit();
        this.close();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error creating exchange');
        this.isLoading.set(false);
        console.error('Exchange error:', error);
      }
    });
  }

  close() {
    this.closed.emit();
  }
}
