package com.foreignfits.service;

import com.foreignfits.dto.ExchangeDto;
import com.foreignfits.dto.ExchangeItemDto;
import com.foreignfits.dto.ExchangeRequest;
import com.foreignfits.entity.*;
import com.foreignfits.entity.Exchange.ExchangeStatus;
import com.foreignfits.entity.ExchangeItem.ExchangeItemType;
import com.foreignfits.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    private final ExchangeRepository exchangeRepository;
    private final ExchangeItemRepository exchangeItemRepository;
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    private final BarcodeHistoryService barcodeHistoryService;
    private final BarcodeRepository barcodeRepository;

    @Transactional
    public ExchangeDto createExchange(ExchangeRequest request, Long userId) {
        // Validate original sale exists
        Sale originalSale = saleRepository.findById(request.getOriginalSaleId())
                .orElseThrow(() -> new RuntimeException("Original sale not found"));

        // Get location
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Calculate totals
        BigDecimal returnedTotal = calculateItemsTotal(request.getReturnedItems(), location);
        BigDecimal exchangedTotal = calculateItemsTotal(request.getExchangedItems(), location);
        BigDecimal priceDifference = exchangedTotal.subtract(returnedTotal);

        // Create new sale for exchanged items (save it first without items)
        Sale newSale = new Sale();
        newSale.setLocation(location);
        newSale.setCustomerName(originalSale.getCustomerName());
        newSale.setCustomerPhone(originalSale.getCustomerPhone());
        newSale.setCustomerEmail(originalSale.getCustomerEmail());
        
        // For the new sale, we need to store the EXCHANGED total (not the difference)
        // The priceDifference tells us if customer pays extra or gets refund
        // But the Sale entity must have positive values for validation
        newSale.setSubtotal(exchangedTotal.divide(new BigDecimal("1.05"), 2, java.math.RoundingMode.HALF_UP)); // Remove GST to get subtotal
        newSale.setTax(exchangedTotal.subtract(newSale.getSubtotal())); // Tax is the difference
        newSale.setTotal(exchangedTotal); // Total is the exchanged items value
        newSale.setPaymentMethod(Sale.PaymentMethod.UPI);
        newSale.setSoldBy(user);
        newSale.setCreatedAt(LocalDateTime.now());
        newSale = saleRepository.save(newSale);

        // Create exchange record
        Exchange exchange = new Exchange();
        exchange.setOriginalSale(originalSale);
        exchange.setNewSale(newSale);
        exchange.setExchangeReason(request.getExchangeReason());
        exchange.setPriceDifference(priceDifference);
        exchange.setStatus(ExchangeStatus.COMPLETED);
        exchange.setExchangedBy(user);
        exchange.setLocation(location);
        exchange.setNotes(request.getNotes());
        exchange.setCreatedAt(LocalDateTime.now());
        exchange = exchangeRepository.save(exchange);
        
        // Mark the new sale as an exchange sale with the difference amount
        newSale.setIsExchangeSale(true);
        newSale.setExchangeId(exchange.getId());
        newSale.setExchangePriceDifference(priceDifference);
        newSale = saleRepository.save(newSale);

        // Process returned items - add back to inventory
        List<ExchangeItem> exchangeItems = new ArrayList<>();
        
        for (ExchangeRequest.ExchangeItemRequest item : request.getReturnedItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

            // Get list of barcodes (support both single barcode and multiple barcodes)
            List<String> barcodes = new ArrayList<>();
            if (item.getBarcodes() != null && !item.getBarcodes().isEmpty()) {
                barcodes.addAll(item.getBarcodes());
            } else if (item.getBarcode() != null) {
                barcodes.add(item.getBarcode());
            }

            ExchangeItem exchangeItem = new ExchangeItem();
            exchangeItem.setExchange(exchange);
            exchangeItem.setProduct(product);
            exchangeItem.setQuantity(item.getQuantity());
            exchangeItem.setItemType(ExchangeItemType.RETURNED);
            // Store the first barcode or all barcodes joined (for backward compatibility)
            exchangeItem.setBarcode(!barcodes.isEmpty() ? barcodes.get(0) : null);
            exchangeItems.add(exchangeItem);

            // Add returned items back to inventory
            addToInventory(product, location, item.getQuantity());
            
            // Update barcode status to ACTIVE and record history for each barcode
            for (String barcodeNumber : barcodes) {
                Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(barcodeNumber);
                if (barcodeOpt.isPresent()) {
                    Barcode barcode = barcodeOpt.get();
                    barcode.setStatus("ACTIVE");
                    barcode.setRemark("Returned via exchange");
                    barcodeRepository.save(barcode);
                    
                    barcodeHistoryService.recordHistory(
                        barcode,
                        "RETURNED",
                        location,
                        null,
                        null,
                        "EXCHANGE",
                        exchange.getId(),
                        "Returned via exchange: " + exchange.getExchangeReason(),
                        user.getName()
                    );
                }
            }
        }

        // Process exchanged items - deduct from inventory and create sale items
        List<SaleItem> saleItems = new ArrayList<>();
        for (ExchangeRequest.ExchangeItemRequest item : request.getExchangedItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

            // Get list of barcodes (support both single barcode and multiple barcodes)
            List<String> barcodeNumbers = new ArrayList<>();
            if (item.getBarcodes() != null && !item.getBarcodes().isEmpty()) {
                barcodeNumbers.addAll(item.getBarcodes());
            } else if (item.getBarcode() != null) {
                barcodeNumbers.add(item.getBarcode());
            }

            ExchangeItem exchangeItem = new ExchangeItem();
            exchangeItem.setExchange(exchange);
            exchangeItem.setProduct(product);
            exchangeItem.setQuantity(item.getQuantity());
            exchangeItem.setItemType(ExchangeItemType.EXCHANGED);
            // Store the first barcode or all barcodes joined (for backward compatibility)
            exchangeItem.setBarcode(!barcodeNumbers.isEmpty() ? barcodeNumbers.get(0) : null);
            exchangeItems.add(exchangeItem);

            // Deduct exchanged items from inventory
            deductFromInventory(product, location, item.getQuantity());

            // Create sale item ONLY for exchanged (new) items with barcode-specific pricing
            LocationInventory inventory = locationInventoryRepository.findByLocationIdAndProductSku(location.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for product at location"));
            
            // Collect barcode entities and calculate total from barcode-specific prices
            List<Barcode> barcodeEntities = new ArrayList<>();
            BigDecimal itemTotal = BigDecimal.ZERO;
            
            for (String barcodeNumber : barcodeNumbers) {
                Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(barcodeNumber);
                if (barcodeOpt.isPresent()) {
                    Barcode barcodeEntity = barcodeOpt.get();
                    barcodeEntities.add(barcodeEntity);
                    // Use barcode-specific sale price, fallback to inventory price
                    BigDecimal barcodePrice = barcodeEntity.getSalePrice() != null && barcodeEntity.getSalePrice() > 0
                            ? BigDecimal.valueOf(barcodeEntity.getSalePrice())
                            : inventory.getSalePrice();
                    itemTotal = itemTotal.add(barcodePrice);
                }
            }
            
            // If no barcodes found, use inventory price * quantity
            if (itemTotal.compareTo(BigDecimal.ZERO) == 0) {
                itemTotal = inventory.getSalePrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            }
            
            SaleItem newSaleItem = new SaleItem();
            newSaleItem.setSale(newSale);
            newSaleItem.setProduct(product);
            newSaleItem.setQuantity(item.getQuantity());
            newSaleItem.setBarcodes(barcodeEntities);
            // Set average price for display
            newSaleItem.setPrice(itemTotal.divide(BigDecimal.valueOf(item.getQuantity()), 2, java.math.RoundingMode.HALF_UP));
            newSaleItem.setTotal(itemTotal);
            saleItems.add(newSaleItem);
            
            // Update barcode status to SOLD and record history for each barcode
            for (String barcodeNumber : barcodeNumbers) {
                Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(barcodeNumber);
                if (barcodeOpt.isPresent()) {
                    Barcode barcode = barcodeOpt.get();
                    barcode.setStatus("SOLD");
                    barcode.setRemark("Sold via exchange to " + newSale.getCustomerName());
                    barcodeRepository.save(barcode);
                    
                    barcodeHistoryService.recordHistory(
                        barcode,
                        "SOLD",
                        location,
                        null,
                        null,
                        "EXCHANGE",
                        exchange.getId(),
                        "Sold via exchange to: " + newSale.getCustomerName(),
                        user.getName()
                    );
                }
            }
        }

        // Save all items
        exchangeItemRepository.saveAll(exchangeItems);
        
        // Set items on the sale and save again to persist the relationship
        newSale.setItems(saleItems);
        saleRepository.save(newSale);

        return convertToDto(exchange, exchangeItems);
    }

    private void addToInventory(Product product, Location location, Integer quantity) {
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(location.getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Inventory not found for product: " + product.getName()));
        
        inventory.setQuantity(inventory.getQuantity() + quantity);
        inventory.setLastRestockDate(LocalDateTime.now());
        locationInventoryRepository.save(inventory);
    }

    private void deductFromInventory(Product product, Location location, Integer quantity) {
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(location.getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Inventory not found for product: " + product.getName()));
        
        if (inventory.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient inventory for product: " + product.getName() + 
                    ". Available: " + inventory.getQuantity() + ", Required: " + quantity);
        }
        
        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventory.setLastSaleDate(LocalDateTime.now());
        locationInventoryRepository.save(inventory);
    }

    private BigDecimal calculateItemsTotal(List<ExchangeRequest.ExchangeItemRequest> items, Location location) {
        BigDecimal total = BigDecimal.ZERO;
        for (ExchangeRequest.ExchangeItemRequest item : items) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));
            
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(location.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for product at location"));
            
            // Get list of barcodes (support both single barcode and multiple barcodes)
            List<String> barcodeNumbers = new ArrayList<>();
            if (item.getBarcodes() != null && !item.getBarcodes().isEmpty()) {
                barcodeNumbers.addAll(item.getBarcodes());
            } else if (item.getBarcode() != null) {
                barcodeNumbers.add(item.getBarcode());
            }
            
            // Calculate total using barcode-specific prices
            BigDecimal itemTotal = BigDecimal.ZERO;
            for (String barcodeNumber : barcodeNumbers) {
                Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(barcodeNumber);
                if (barcodeOpt.isPresent()) {
                    Barcode barcodeEntity = barcodeOpt.get();
                    // Use barcode-specific sale price, fallback to inventory price
                    BigDecimal barcodePrice = barcodeEntity.getSalePrice() != null && barcodeEntity.getSalePrice() > 0
                            ? BigDecimal.valueOf(barcodeEntity.getSalePrice())
                            : inventory.getSalePrice();
                    itemTotal = itemTotal.add(barcodePrice);
                } else {
                    // If barcode not found, use inventory price
                    itemTotal = itemTotal.add(inventory.getSalePrice());
                }
            }
            
            // If no barcodes provided, use inventory price * quantity
            if (itemTotal.compareTo(BigDecimal.ZERO) == 0) {
                itemTotal = inventory.getSalePrice().multiply(new BigDecimal(item.getQuantity()));
            }
            
            total = total.add(itemTotal);
        }
        return total;
    }

    public List<ExchangeDto> getExchangesByOriginalSale(Long saleId) {
        List<Exchange> exchanges = exchangeRepository.findByOriginalSaleId(saleId);
        return exchanges.stream()
                .map(exchange -> {
                    List<ExchangeItem> items = exchangeItemRepository.findByExchangeId(exchange.getId());
                    return convertToDto(exchange, items);
                })
                .collect(Collectors.toList());
    }

    public List<ExchangeDto> getExchangeHistory(Long locationId) {
        List<Exchange> exchanges;
        if (locationId != null) {
            exchanges = exchangeRepository.findByLocationId(locationId);
        } else {
            exchanges = exchangeRepository.findAllOrderByCreatedAtDesc();
        }
        
        return exchanges.stream()
                .map(exchange -> {
                    List<ExchangeItem> items = exchangeItemRepository.findByExchangeId(exchange.getId());
                    return convertToDto(exchange, items);
                })
                .collect(Collectors.toList());
    }

    private ExchangeDto convertToDto(Exchange exchange, List<ExchangeItem> items) {
        ExchangeDto dto = new ExchangeDto();
        dto.setId(exchange.getId());
        dto.setOriginalSaleId(exchange.getOriginalSale().getId());
        dto.setNewSaleId(exchange.getNewSale() != null ? exchange.getNewSale().getId() : null);
        dto.setExchangeReason(exchange.getExchangeReason());
        dto.setPriceDifference(exchange.getPriceDifference());
        dto.setStatus(exchange.getStatus());
        dto.setExchangedByName(exchange.getExchangedBy().getName());
        dto.setLocationName(exchange.getLocation().getName());
        dto.setNotes(exchange.getNotes());
        dto.setCreatedAt(exchange.getCreatedAt());
        
        Sale originalSale = exchange.getOriginalSale();
        Sale newSale = exchange.getNewSale();
        
        List<ExchangeItemDto> itemDtos = items.stream()
                .map(item -> {
                    ExchangeItemDto itemDto = new ExchangeItemDto();
                    itemDto.setId(item.getId());
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setItemType(item.getItemType());
                    itemDto.setBarcode(item.getBarcode());
                    
                    // Get price from the appropriate sale
                    BigDecimal price = BigDecimal.ZERO;
                    if (item.getItemType() == ExchangeItemType.RETURNED && originalSale != null) {
                        // Get price from original sale
                        price = getPriceFromSale(originalSale, item.getBarcode(), item.getProduct());
                    } else if (item.getItemType() == ExchangeItemType.EXCHANGED && newSale != null) {
                        // Get price from new sale
                        price = getPriceFromSale(newSale, item.getBarcode(), item.getProduct());
                    }
                    itemDto.setPrice(price);
                    
                    return itemDto;
                })
                .collect(Collectors.toList());
        
        dto.setItems(itemDtos);
        return dto;
    }
    
    /**
     * Get price for a specific barcode/product from a sale
     */
    private BigDecimal getPriceFromSale(Sale sale, String barcodeNumber, Product product) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        // Find the sale item that contains this barcode or product
        for (SaleItem saleItem : sale.getItems()) {
            if (saleItem.getProduct().getId().equals(product.getId())) {
                // Found the matching product
                
                // If we have a specific barcode, try to find its price
                if (barcodeNumber != null && saleItem.getBarcodes() != null) {
                    for (Barcode barcode : saleItem.getBarcodes()) {
                        if (barcode.getBarcodeNumber().equals(barcodeNumber)) {
                            // Found the exact barcode, use its sale price
                            if (barcode.getSalePrice() != null && barcode.getSalePrice() > 0) {
                                return BigDecimal.valueOf(barcode.getSalePrice());
                            }
                        }
                    }
                }
                
                // Fallback to the sale item's average price
                if (saleItem.getPrice() != null && saleItem.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                    return saleItem.getPrice();
                }
                
                // Fallback to total / quantity
                if (saleItem.getTotal() != null && saleItem.getQuantity() > 0) {
                    return saleItem.getTotal().divide(
                        BigDecimal.valueOf(saleItem.getQuantity()), 
                        2, 
                        java.math.RoundingMode.HALF_UP
                    );
                }
            }
        }
        
        return BigDecimal.ZERO;
    }
}

