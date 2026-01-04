import { Component, Input, Output, EventEmitter, signal, computed, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class ExchangeModalComponent implements OnInit, AfterViewInit {
  @Input() sale!: Sale;
  @Input() scannedBarcodes: string[] = []; // Barcodes that were scanned for exchange
  @Output() closed = new EventEmitter<void>();
  @Output() exchangeCreated = new EventEmitter<any>(); // Changed to emit exchange data
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;

  exchangeReason = signal<string>('');
  notes = signal<string>('');
  selectedReturnItems = signal<Map<string, number>>(new Map());
  selectedReturnBarcodes = signal<Map<string, string[]>>(new Map()); // Track barcodes for each product
  exchangeItems = signal<{ product: Product; quantity: number; barcode?: string }[]>([]);
  searchBarcode = signal<string>('');
  searchResults = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>(''); // Add success message for user feedback

  constructor(
    private exchangeService: ExchangeService,
    private appService: AppService
  ) {}

  ngOnInit() {
    // Initialize with only the scanned barcodes for return
    const returnMap = new Map<string, number>();
    const barcodeMap = new Map<string, string[]>();
    
    console.log('Exchange Modal - Scanned Barcodes:', this.scannedBarcodes);
    console.log('Exchange Modal - Sale Items:', this.sale.items);
    
    if (this.scannedBarcodes && this.scannedBarcodes.length > 0) {
      // Convert scanned barcodes to strings for comparison
      const scannedBarcodesStr = this.scannedBarcodes.map(b => String(b));
      console.log('Scanned barcodes as strings:', scannedBarcodesStr);
      
      // Check if sale items have barcode information
      const hasBarcodeData = this.sale.items.some(item => 
        item.barcodes && item.barcodes.length > 0
      );
      
      if (hasBarcodeData) {
        // Barcode-level matching (for new sales with barcode tracking)
        this.sale.items.forEach(item => {
          console.log(`Checking item ${item.product.name}, barcodes:`, item.barcodes);
          
          // Find which barcodes from this item were scanned (use string comparison)
          const scannedBarcodesForItem = item.barcodes?.filter(barcode => 
            scannedBarcodesStr.includes(String(barcode))
          ) || [];
          
          console.log(`Matched barcodes for ${item.product.name}:`, scannedBarcodesForItem);
          
          if (scannedBarcodesForItem.length > 0) {
            // Set return quantity to the number of scanned barcodes
            returnMap.set(item.product.id, scannedBarcodesForItem.length);
            barcodeMap.set(item.product.id, scannedBarcodesForItem);
            console.log(`Set returnMap for ${item.product.id}:`, scannedBarcodesForItem.length);
          }
        });
      } else {
        // Fallback: Product-level matching (for old sales without barcode tracking)
        // We need to lookup which products the scanned barcodes belong to
        console.log('Sale has no barcode data, using product-level matching');
        
        // Don't set the signals yet - wait for async lookups to complete
        let lookupsCompleted = 0;
        const totalLookups = this.scannedBarcodes.length;
        
        // Lookup each barcode to find its product
        this.scannedBarcodes.forEach(barcode => {
          this.appService.lookupBarcode(barcode).subscribe({
            next: (barcodeData) => {
              const productId = barcodeData.product.id;
              console.log(`Barcode ${barcode} belongs to product ${productId} (${barcodeData.product.name})`);
              console.log('Sale items:', this.sale.items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                idType: typeof item.product.id
              })));
              console.log('Looking for productId:', productId, 'type:', typeof productId);
              
              // Find this product in sale items
              const saleItem = this.sale.items.find(item => {
                const matches = item.product.id === productId || item.product.id.toString() === productId.toString();
                console.log(`Comparing ${item.product.id} (${typeof item.product.id}) with ${productId} (${typeof productId}): ${matches}`);
                return matches;
              });
              
              if (saleItem) {
                console.log(`Found matching sale item for ${barcodeData.product.name}`);
                
                // Use string keys for consistency with sale item product IDs
                const productIdKey = saleItem.product.id;
                
                // Update the maps
                const currentBarcodes = barcodeMap.get(productIdKey) || [];
                currentBarcodes.push(barcode);
                barcodeMap.set(productIdKey, currentBarcodes);
                returnMap.set(productIdKey, currentBarcodes.length);
                
                console.log(`Updated returnMap for ${productIdKey}:`, returnMap.get(productIdKey));
              } else {
                console.log(`No matching sale item found for product ${barcodeData.product.name}`);
              }
              
              // Check if all lookups are complete
              lookupsCompleted++;
              if (lookupsCompleted === totalLookups) {
                console.log('All lookups completed. Final Return Map:', returnMap);
                console.log('All lookups completed. Final Barcode Map:', barcodeMap);
                // Now update the signals
                this.selectedReturnItems.set(new Map(returnMap));
                this.selectedReturnBarcodes.set(new Map(barcodeMap));
              }
            },
            error: (error) => {
              console.error(`Failed to lookup barcode ${barcode}:`, error);
              lookupsCompleted++;
              if (lookupsCompleted === totalLookups) {
                // Update signals even if some lookups failed
                this.selectedReturnItems.set(new Map(returnMap));
                this.selectedReturnBarcodes.set(new Map(barcodeMap));
              }
            }
          });
        });
        
        // Return early - don't set signals at the bottom
        return;
      }
      
      console.log('Final Return Map before setting signal:', returnMap);
      console.log('Final Barcode Map before setting signal:', barcodeMap);
    } else {
      // Fallback: Initialize with all items and their barcodes selected for return
      this.sale.items.forEach(item => {
        returnMap.set(item.product.id, item.quantity);
        // Track the barcodes for this item
        if (item.barcodes && item.barcodes.length > 0) {
          barcodeMap.set(item.product.id, [...item.barcodes]);
        }
      });
    }
    
    this.selectedReturnItems.set(returnMap);
    this.selectedReturnBarcodes.set(barcodeMap);
    
    console.log('Final selectedReturnItems after set:', this.selectedReturnItems());
    console.log('Final selectedReturnBarcodes after set:', this.selectedReturnBarcodes());
  }

  ngAfterViewInit() {
    // Auto-focus the barcode input when modal opens
    setTimeout(() => {
      if (this.barcodeInput?.nativeElement) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  private focusBarcodeInput() {
    setTimeout(() => {
      if (this.barcodeInput?.nativeElement) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  returnedTotal = computed(() => {
    const returnItems = this.selectedReturnItems();
    const selectedBarcodes = this.selectedReturnBarcodes();
    console.log('Computing returnedTotal, selectedReturnItems:', returnItems);
    console.log('Computing returnedTotal, selectedBarcodes:', selectedBarcodes);
    let total = 0;
    
    this.sale.items.forEach(item => {
      const returnQty = returnItems.get(item.product.id) || 0;
      if (returnQty === 0) return;
      
      // Get the specific barcodes being returned
      const barcodesToReturn = selectedBarcodes.get(item.product.id) || [];
      console.log(`Item ${item.product.name}: returnQty=${returnQty}, barcodes to return:`, barcodesToReturn);
      console.log(`Item barcodePrices:`, item.barcodePrices);
      
      // Calculate total using barcode-specific prices
      if (barcodesToReturn.length > 0 && item.barcodePrices) {
        // Sum up the prices for each specific barcode being returned
        const barcodeTotal = barcodesToReturn.reduce((sum, barcode) => {
          const barcodePrice = item.barcodePrices?.[barcode];
          const price = barcodePrice != null ? Number(barcodePrice) : 0;
          console.log(`  Barcode ${barcode} price: ${price}`);
          return sum + price;
        }, 0);
        total += barcodeTotal;
        console.log(`  Barcode-specific total: ${barcodeTotal}`);
      } else {
        // Fallback: use item.price * returnQty if no barcode-specific data
        const fallbackTotal = item.price * returnQty;
        total += fallbackTotal;
        console.log(`  Using fallback (item.price * qty): ${fallbackTotal}`);
      }
    });
    
    console.log('Final returnedTotal:', total);
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
    const barcodeMap = new Map(this.selectedReturnBarcodes());
    
    if (qty > 0) {
      map.set(productId, qty);
      // Adjust barcodes array to match quantity
      const saleItem = this.sale.items.find(i => i.product.id === productId);
      if (saleItem && saleItem.barcodes) {
        const barcodes = saleItem.barcodes.slice(0, qty);
        barcodeMap.set(productId, barcodes);
      }
    } else {
      map.delete(productId);
      barcodeMap.delete(productId);
    }
    
    this.selectedReturnItems.set(map);
    this.selectedReturnBarcodes.set(barcodeMap);
  }
  
  removeReturnBarcode(productId: string, barcode: string) {
    const barcodeMap = new Map(this.selectedReturnBarcodes());
    const quantityMap = new Map(this.selectedReturnItems());
    
    const barcodes = barcodeMap.get(productId) || [];
    const updatedBarcodes = barcodes.filter(b => b !== barcode);
    
    if (updatedBarcodes.length > 0) {
      barcodeMap.set(productId, updatedBarcodes);
      quantityMap.set(productId, updatedBarcodes.length);
    } else {
      barcodeMap.delete(productId);
      quantityMap.delete(productId);
    }
    
    this.selectedReturnBarcodes.set(barcodeMap);
    this.selectedReturnItems.set(quantityMap);
  }
  
  getReturnBarcodes(productId: string): string[] {
    return this.selectedReturnBarcodes().get(productId) || [];
  }
  
  /**
   * Get the display price for an item to return.
   * If specific barcodes are selected, show average of those barcode prices.
   * Otherwise show item.price.
   */
  getReturnItemDisplayPrice(item: any): number {
    const selectedBarcodes = this.getReturnBarcodes(item.product.id);
    
    // If specific barcodes are selected and we have barcode prices, calculate average
    if (selectedBarcodes.length > 0 && item.barcodePrices) {
      const barcodePricesSum = selectedBarcodes.reduce((sum, barcode) => {
        const price = item.barcodePrices[barcode];
        return sum + (price != null ? Number(price) : 0);
      }, 0);
      return selectedBarcodes.length > 0 ? barcodePricesSum / selectedBarcodes.length : item.price;
    }
    
    // Fallback to item.price (average)
    return item.price;
  }
  
  /**
   * Get the subtotal for an item to return (barcode-specific prices × quantity)
   */
  getReturnItemSubtotal(item: any): number {
    const selectedBarcodes = this.getReturnBarcodes(item.product.id);
    
    // If specific barcodes are selected and we have barcode prices, sum them up
    if (selectedBarcodes.length > 0 && item.barcodePrices) {
      return selectedBarcodes.reduce((sum, barcode) => {
        const price = item.barcodePrices[barcode];
        return sum + (price != null ? Number(price) : 0);
      }, 0);
    }
    
    // Fallback to item.price * quantity
    const returnQty = this.selectedReturnItems().get(item.product.id) || 0;
    return item.price * returnQty;
  }

  searchProduct() {
    const barcode = this.searchBarcode().trim();
    if (!barcode) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.appService.lookupBarcode(barcode).subscribe({
      next: (result: any) => {
        if (result && result.product) {
          // Use the barcode-specific price (salePrice from the barcode entity)
          const barcodePrice = result.salePrice;
          
          if (barcodePrice != null && barcodePrice > 0) {
            // We have the barcode-specific price, use it directly
            const product: any = {
              id: result.product.id,
              name: result.product.name,
              sku: result.product.sku,
              size: result.product.size,
              color: result.product.color,
              category: result.product.category,
              createdAt: result.product.createdAt || new Date(),
              updatedAt: result.product.updatedAt || new Date(),
              salePrice: barcodePrice // Use barcode-specific price
            };
            
            // Automatically add the product to exchange items
            this.addExchangeItemDirectly(product);
            this.isLoading.set(false);
          } else {
            // Fallback: Fetch location inventory to get the price
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
                
                // Automatically add the product to exchange items
                this.addExchangeItemDirectly(product);
                this.isLoading.set(false);
              },
              error: (error: any) => {
                this.errorMessage.set('Failed to fetch product pricing');
                this.isLoading.set(false);
                console.error('Inventory fetch error:', error);
              }
            });
          }
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

  // Directly add item after barcode scan without showing search results
  addExchangeItemDirectly(product: Product) {
    const items = [...this.exchangeItems()];
    const existingIndex = items.findIndex(i => i.product.id === product.id);
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity++;
      this.successMessage.set(`✓ Increased quantity: ${product.name} (Qty: ${items[existingIndex].quantity})`);
    } else {
      items.push({ product, quantity: 1, barcode: this.searchBarcode() });
      this.successMessage.set(`✓ Added: ${product.name}`);
    }
    
    this.exchangeItems.set(items);
    this.searchBarcode.set(''); // Clear the barcode input for next scan
    this.searchResults.set([]);
    this.errorMessage.set(''); // Clear any previous errors
    
    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      this.successMessage.set('');
    }, 2000);
    
    // Refocus the input for next scan
    this.focusBarcodeInput();
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
        const selectedBarcodes = this.selectedReturnBarcodes().get(productId) || [];
        
        returnedItems.push({
          productId: Number(productId),
          quantity,
          barcodes: selectedBarcodes.length > 0 ? selectedBarcodes : undefined,
          barcode: selectedBarcodes.length > 0 ? selectedBarcodes[0] : undefined // Keep for backward compatibility
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
      next: (exchange) => {
        this.isLoading.set(false);
        this.exchangeCreated.emit(exchange); // Emit the exchange object with newSaleId and priceDifference
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
