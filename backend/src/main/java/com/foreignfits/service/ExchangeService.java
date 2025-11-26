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
        newSale.setSubtotal(exchangedTotal);
        newSale.setTax(BigDecimal.ZERO);
        newSale.setTotal(exchangedTotal);
        newSale.setPaymentMethod(Sale.PaymentMethod.OTHER);
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

        // Process returned items - add back to inventory
        List<ExchangeItem> exchangeItems = new ArrayList<>();
        
        for (ExchangeRequest.ExchangeItemRequest item : request.getReturnedItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

            ExchangeItem exchangeItem = new ExchangeItem();
            exchangeItem.setExchange(exchange);
            exchangeItem.setProduct(product);
            exchangeItem.setQuantity(item.getQuantity());
            exchangeItem.setItemType(ExchangeItemType.RETURNED);
            exchangeItem.setBarcode(item.getBarcode());
            exchangeItems.add(exchangeItem);

            // Add returned items back to inventory
            addToInventory(product, location, item.getQuantity());
            
            // Update barcode status to ACTIVE and record history
            Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(item.getBarcode());
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

        // Process exchanged items - deduct from inventory and create sale items
        List<SaleItem> saleItems = new ArrayList<>();
        for (ExchangeRequest.ExchangeItemRequest item : request.getExchangedItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProductId()));

            ExchangeItem exchangeItem = new ExchangeItem();
            exchangeItem.setExchange(exchange);
            exchangeItem.setProduct(product);
            exchangeItem.setQuantity(item.getQuantity());
            exchangeItem.setItemType(ExchangeItemType.EXCHANGED);
            exchangeItem.setBarcode(item.getBarcode());
            exchangeItems.add(exchangeItem);

            // Deduct exchanged items from inventory
            deductFromInventory(product, location, item.getQuantity());

            // Create sale item ONLY for exchanged (new) items
            LocationInventory inventory = locationInventoryRepository.findByLocationIdAndProductSku(location.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for product at location"));
            
            SaleItem newSaleItem = new SaleItem();
            newSaleItem.setSale(newSale);
            newSaleItem.setProduct(product);
            newSaleItem.setQuantity(item.getQuantity());
            newSaleItem.setPrice(inventory.getSalePrice());
            newSaleItem.setTotal(inventory.getSalePrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            saleItems.add(newSaleItem);
            
            // Update barcode status to SOLD and record history
            Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(item.getBarcode());
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
            
            total = total.add(inventory.getSalePrice().multiply(new BigDecimal(item.getQuantity())));
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
        
        List<ExchangeItemDto> itemDtos = items.stream()
                .map(item -> {
                    ExchangeItemDto itemDto = new ExchangeItemDto();
                    itemDto.setId(item.getId());
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setItemType(item.getItemType());
                    itemDto.setBarcode(item.getBarcode());
                    return itemDto;
                })
                .collect(Collectors.toList());
        
        dto.setItems(itemDtos);
        return dto;
    }
}
