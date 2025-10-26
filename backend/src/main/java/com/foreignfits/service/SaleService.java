package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.SaleDto;
import com.foreignfits.dto.SaleItemDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.CreateSaleRequest;
import com.foreignfits.dto.request.SaleItemRequest;
import com.foreignfits.entity.*;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.repository.SaleRepository;
import com.foreignfits.repository.StockMovementRepository;
import com.foreignfits.repository.StockTransferRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class SaleService {
    
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LoyaltyService loyaltyService;
    private final LocationInventoryRepository locationInventoryRepository;
    private final LocationRepository locationRepository;
    private final StockTransferRepository stockTransferRepository;
    
    private static final BigDecimal GST_RATE = new BigDecimal("0.05"); // 5% GST (inclusive)
    
    public List<SaleDto> getAllSales() {
        return saleRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public SaleDto createSale(CreateSaleRequest request, Long soldById) {
        User soldBy = userRepository.findById(soldById)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + soldById));
        
        // Get user's assigned location if they are SALES role
        Long userLocationId = null;
        if (soldBy.getRole() == User.UserRole.SALES && soldBy.getLocation() != null) {
            userLocationId = soldBy.getLocation().getId();
        }
        
        // Validate and prepare sale items
        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        
        for (SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemRequest.getProductId()));
            
            // Security check: SALES users can only sell products from their assigned location
            if (userLocationId != null) {
                if (product.getLocation() == null || !product.getLocation().getId().equals(userLocationId)) {
                    throw new RuntimeException("You can only sell products from your assigned location: " + 
                        soldBy.getLocation().getName());
                }
            }
            
            // Check inventory at product location
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Product not found in inventory"));
            
            // Check stock availability
            if (inventory.getQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                    ". Available: " + inventory.getQuantity() + ", Requested: " + itemRequest.getQuantity());
            }
            
            // Determine price (wholesale vs retail)
            BigDecimal unitPrice = itemRequest.getQuantity() >= product.getWholesaleMinQuantity() 
                ? product.getWholesalePrice() 
                : product.getPrice();
            
            BigDecimal itemTotal = unitPrice.multiply(new BigDecimal(itemRequest.getQuantity()));
            
            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setPrice(unitPrice);
            saleItem.setTotal(itemTotal);
            
            saleItems.add(saleItem);
            subtotal = subtotal.add(itemTotal);
        }
        
        // Calculate tax and total (GST is inclusive - already in product prices)
        // Total = Subtotal (customer doesn't pay extra for GST)
        // But we show the GST amount separately for record-keeping
        BigDecimal total = subtotal; // Customer pays only the product prices
        BigDecimal tax = subtotal.multiply(GST_RATE).divide(BigDecimal.ONE.add(GST_RATE), 2, RoundingMode.HALF_UP);
        
        // Create sale
        Sale sale = new Sale();
        sale.setSubtotal(subtotal);
        sale.setTax(tax);
        sale.setTotal(total);
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerEmail(request.getCustomerEmail());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setCustomerCountryCode(request.getCustomerCountryCode());
        sale.setSoldBy(soldBy);
        
        Sale savedSale = saleRepository.save(sale);
        
        // Set sale reference in items and save
        for (SaleItem item : saleItems) {
            item.setSale(savedSale);
        }
        savedSale.setItems(saleItems);
        savedSale = saleRepository.save(savedSale);
        
        // Update inventory and create stock movements
        for (SaleItem item : saleItems) {
            Product product = item.getProduct();
            
            // Get inventory
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Product not found in inventory"));
            
            int previousStock = inventory.getQuantity();
            int newStock = previousStock - item.getQuantity();
            
            // Update inventory
            inventory.setQuantity(newStock);
            inventory.setLastSaleDate(LocalDateTime.now());
            locationInventoryRepository.save(inventory);
            
            // Get INITIAL location for sale movements (stock goes "out" to customer)
            Location initialLocation = locationRepository.findById(0L)
                    .orElseThrow(() -> new RuntimeException("INITIAL location not found"));
            
            // Create StockTransfer for the sale (stock leaves to customer/INITIAL)
            StockTransfer transfer = new StockTransfer();
            transfer.setProduct(product);
            transfer.setFromLocation(product.getLocation()); // From store/warehouse
            transfer.setToLocation(initialLocation); // To customer (represented by INITIAL)
            transfer.setQuantity(item.getQuantity());
            transfer.setReason("Sale #" + savedSale.getId());
            transfer.setReference(savedSale.getId().toString());
            transfer.setStatus(StockTransfer.TransferStatus.COMPLETED); // Auto-completed for sales
            transfer.setRequestedAt(savedSale.getCreatedAt());
            transfer.setRequestedBy(soldBy); // Set the user making the sale
            transfer.setApprovedBy(soldBy); // Auto-approved for sales
            transfer.setApprovedAt(savedSale.getCreatedAt());
            transfer.setCompletedBy(soldBy); // Auto-completed for sales
            transfer.setCompletedAt(savedSale.getCreatedAt());
            StockTransfer savedTransfer = stockTransferRepository.save(transfer);
            
            // Create stock movement
            StockMovement movement = new StockMovement();
            movement.setProduct(product);
            movement.setType(StockMovement.MovementType.SALE);
            movement.setQuantity(-item.getQuantity());
            movement.setPreviousStock(previousStock);
            movement.setNewStock(newStock);
            movement.setReason("Sale #" + savedSale.getId());
            movement.setReference(savedSale.getId().toString());
            movement.setTransfer(savedTransfer); // Link to transfer for from/to locations
            movement.setCreatedBy(soldBy.getName());
            movement.setStatus(StockMovement.MovementStatus.APPROVED); // Sales are auto-approved
            movement.setApprovedBy(soldBy.getEmail());
            movement.setApprovedAt(savedSale.getCreatedAt());
            
            stockMovementRepository.save(movement);
        }
        
        // Process loyalty points if customer phone is provided
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isEmpty() &&
            request.getCustomerCountryCode() != null && !request.getCustomerCountryCode().isEmpty()) {
            try {
                // Get or create loyalty customer
                LoyaltyCustomer loyaltyCustomer = loyaltyService.getOrCreateCustomer(
                    request.getCustomerPhone(),
                    request.getCustomerCountryCode(),
                    request.getCustomerName() != null ? request.getCustomerName() : "Customer",
                    request.getCustomerEmail()
                );
                
                // Award points for purchase
                int pointsEarned = loyaltyService.awardPointsForPurchase(loyaltyCustomer, savedSale, total);
                savedSale.setPointsEarned(pointsEarned);
                saleRepository.save(savedSale);
                
            } catch (Exception e) {
                // Log error but don't fail the sale
                System.err.println("Error processing loyalty points: " + e.getMessage());
            }
        }
        
        return convertToDto(savedSale);
    }
    
    public List<SaleDto> getSalesBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return saleRepository.findSalesBetweenDates(startDate, endDate).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<SaleDto> getTodaysSales() {
        return saleRepository.findTodaysSales().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public BigDecimal getTodaysRevenue() {
        BigDecimal revenue = saleRepository.getTodaysRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }
    
    // Location-based filtering methods for SALES users
    public List<SaleDto> getSalesByLocation(Long locationId) {
        return saleRepository.findAll().stream()
                .filter(sale -> sale.getItems().stream()
                        .anyMatch(item -> item.getProduct().getLocation() != null && 
                                item.getProduct().getLocation().getId().equals(locationId)))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<SaleDto> getTodaysSalesByLocation(Long locationId) {
        return saleRepository.findTodaysSales().stream()
                .filter(sale -> sale.getItems().stream()
                        .anyMatch(item -> item.getProduct().getLocation() != null && 
                                item.getProduct().getLocation().getId().equals(locationId)))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public BigDecimal getTodaysRevenueByLocation(Long locationId) {
        List<Sale> todaysSales = saleRepository.findTodaysSales().stream()
                .filter(sale -> sale.getItems().stream()
                        .anyMatch(item -> item.getProduct().getLocation() != null && 
                                item.getProduct().getLocation().getId().equals(locationId)))
                .collect(Collectors.toList());
        
        return todaysSales.stream()
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public List<SaleDto> getSalesBetweenDatesByLocation(LocalDateTime startDate, LocalDateTime endDate, Long locationId) {
        return saleRepository.findSalesBetweenDates(startDate, endDate).stream()
                .filter(sale -> sale.getItems().stream()
                        .anyMatch(item -> item.getProduct().getLocation() != null && 
                                item.getProduct().getLocation().getId().equals(locationId)))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private SaleDto convertToDto(Sale sale) {
        SaleDto dto = new SaleDto();
        dto.setId(sale.getId());
        dto.setSubtotal(sale.getSubtotal());
        dto.setTax(sale.getTax());
        dto.setTotal(sale.getTotal());
        dto.setPaymentMethod(sale.getPaymentMethod());
        dto.setCustomerName(sale.getCustomerName());
        dto.setCustomerEmail(sale.getCustomerEmail());
        dto.setCustomerPhone(sale.getCustomerPhone());
        dto.setCustomerCountryCode(sale.getCustomerCountryCode());
        dto.setPointsEarned(sale.getPointsEarned());
        dto.setPointsRedeemed(sale.getPointsRedeemed());
        dto.setDiscountFromPoints(sale.getDiscountFromPoints());
        dto.setCreatedAt(sale.getCreatedAt());
        
        // Convert sold by user
        if (sale.getSoldBy() != null) {
            UserDto userDto = new UserDto();
            userDto.setId(sale.getSoldBy().getId());
            userDto.setName(sale.getSoldBy().getName());
            userDto.setEmail(sale.getSoldBy().getEmail());
            userDto.setRole(sale.getSoldBy().getRole());
            dto.setSoldBy(userDto);
        }
        
        // Convert sale items
        if (sale.getItems() != null) {
            List<SaleItemDto> itemDtos = sale.getItems().stream()
                    .map(this::convertSaleItemToDto)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }
        
        return dto;
    }
    
    private SaleItemDto convertSaleItemToDto(SaleItem item) {
        SaleItemDto dto = new SaleItemDto();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setTotal(item.getTotal());
        
        if (item.getProduct() != null) {
            // Convert product manually to avoid circular dependency
            ProductDto productDto = new ProductDto();
            Product product = item.getProduct();
            productDto.setId(product.getId());
            productDto.setName(product.getName());
            productDto.setCategory(product.getCategory());
            productDto.setSize(product.getSize());
            productDto.setColor(product.getColor());
            productDto.setPrice(product.getPrice());
            productDto.setCost(product.getCost());
            productDto.setWholesalePrice(product.getWholesalePrice());
            productDto.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
            
            // Get stock from inventory
            if (product.getLocation() != null) {
                LocationInventory inventory = locationInventoryRepository
                        .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                        .orElse(null);
                productDto.setStock(inventory != null ? inventory.getQuantity() : 0);
            } else {
                productDto.setStock(0);
            }
            
            productDto.setMinStock(product.getMinStock());
            productDto.setSku(product.getSku());
            productDto.setDescription(product.getDescription());
            productDto.setBarcode(product.getBarcode());
            productDto.setImageUrls(product.getImageUrls());
            productDto.setCreatedAt(product.getCreatedAt());
            productDto.setUpdatedAt(product.getUpdatedAt());
            // Include location details to match ProductDto shape used by frontend
            if (product.getLocation() != null) {
                Location location = product.getLocation();
                LocationDto locationDto = new LocationDto();
                locationDto.setId(location.getId());
                locationDto.setName(location.getName());
                locationDto.setType(location.getType());
                locationDto.setAddress(location.getAddress());
                locationDto.setCity(location.getCity());
                locationDto.setState(location.getState());
                locationDto.setZipCode(location.getZipCode());
                locationDto.setPhone(location.getPhone());
                locationDto.setManager(location.getManager());
                locationDto.setCapacity(location.getCapacity());
                locationDto.setIsActive(location.getIsActive());
                productDto.setLocation(locationDto);
            }
            dto.setProduct(productDto);
        }
        
        return dto;
    }
}
