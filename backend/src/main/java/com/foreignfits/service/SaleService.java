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
    private final BarcodeService barcodeService;
    
    private static final BigDecimal GST_RATE = new BigDecimal("0.05"); // 5% GST (inclusive)
    
    public List<SaleDto> getAllSales() {
        return saleRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public SaleDto createSale(CreateSaleRequest request, Long soldById) {
        User soldBy = userRepository.findById(soldById)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + soldById));
        
        // Get the location where sale is being made
        Location saleLocation = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
        
        // Get user's assigned location if they are SALES role
        Long userLocationId = null;
        if (soldBy.getRole() == User.UserRole.SALES && soldBy.getLocation() != null) {
            userLocationId = soldBy.getLocation().getId();
            
            // SALES users can only sell at their assigned location
            if (!userLocationId.equals(request.getLocationId())) {
                throw new RuntimeException("You can only make sales at your assigned location: " + 
                    soldBy.getLocation().getName());
            }
        }
        
        // Validate and prepare sale items
        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        
        for (SaleItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemRequest.getProductId()));
            
            // ✅ BARCODE VALIDATION: Validate all provided barcodes
            if (itemRequest.getBarcodeNumbers() == null || itemRequest.getBarcodeNumbers().isEmpty()) {
                throw new RuntimeException("Barcode scanning is required. No barcodes provided for product: " + product.getName());
            }
            
            if (itemRequest.getBarcodeNumbers().size() != itemRequest.getQuantity()) {
                throw new RuntimeException("Barcode count mismatch. Expected " + itemRequest.getQuantity() + 
                    " barcodes but got " + itemRequest.getBarcodeNumbers().size() + " for product: " + product.getName());
            }
            
            // Validate each barcode
            List<com.foreignfits.entity.Barcode> validatedBarcodes = new ArrayList<>();
            for (String barcodeNumber : itemRequest.getBarcodeNumbers()) {
                com.foreignfits.entity.Barcode barcode = barcodeService.findByBarcodeNumber(barcodeNumber);
                
                // Check barcode status
                if (!"ACTIVE".equals(barcode.getStatus())) {
                    throw new RuntimeException("Barcode " + barcodeNumber + " is not available (Status: " + barcode.getStatus() + ")");
                }
                
                // Check barcode location matches sale location
                if (!barcode.getCurrentLocation().getId().equals(saleLocation.getId())) {
                    throw new RuntimeException("Barcode " + barcodeNumber + " is not at this location. Found at: " + 
                        barcode.getCurrentLocation().getName());
                }
                
                // Check barcode product matches requested product
                if (!barcode.getProduct().getSku().equals(product.getSku())) {
                    throw new RuntimeException("Barcode " + barcodeNumber + " belongs to a different product: " + 
                        barcode.getProduct().getName());
                }
                
                validatedBarcodes.add(barcode);
            }
            
            // Products are now organization-wide - no location check needed on product
            // Check inventory at sale location
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(saleLocation.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Product not available at this location"));
            
            // Check stock availability
            if (inventory.getQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                    ". Available: " + inventory.getQuantity() + ", Requested: " + itemRequest.getQuantity());
            }
            
            // Determine price from LocationInventory (wholesale vs retail)
            BigDecimal unitPrice = (inventory.getWholesaleMinQuantity() != null && 
                                   itemRequest.getQuantity() >= inventory.getWholesaleMinQuantity() &&
                                   inventory.getWholesalePrice() != null)
                ? inventory.getWholesalePrice() 
                : inventory.getSalePrice();
            
            BigDecimal itemTotal = unitPrice.multiply(new BigDecimal(itemRequest.getQuantity()));
            
            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setPrice(unitPrice);
            saleItem.setTotal(itemTotal);
            saleItem.setBarcodes(validatedBarcodes); // ✅ Store the actual barcodes used
            
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
            
            // Get inventory at sale location
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(saleLocation.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Product not found in inventory"));
            
            int previousStock = inventory.getQuantity();
            int newStock = previousStock - item.getQuantity();
            
            // Update inventory
            inventory.setQuantity(newStock);
            inventory.setLastSaleDate(LocalDateTime.now());
            locationInventoryRepository.save(inventory);
            
            // ✅ BARCODE INTEGRATION: Mark the specific scanned barcodes as SOLD
            for (com.foreignfits.entity.Barcode barcode : item.getBarcodes()) {
                barcode.setStatus("SOLD");
                barcode.setRemark("Sold in Sale #" + savedSale.getId() + " at " + LocalDateTime.now());
            }
            System.out.println("Marked " + item.getBarcodes().size() + " barcodes as SOLD for product: " + product.getName());
            
            // Get INITIAL location for sale movements (stock goes "out" to customer)
            Location initialLocation = locationRepository.findById(0L)
                    .orElseThrow(() -> new RuntimeException("INITIAL location not found"));
            
            // Create StockTransfer for the sale (stock leaves to customer/INITIAL)
            StockTransfer transfer = new StockTransfer();
            transfer.setProduct(product);
            transfer.setFromLocation(saleLocation); // From store/warehouse
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
    // TODO: These methods need Sale entity to track saleLocationId
    // Products no longer have location, so we can't filter by product.location
    public List<SaleDto> getSalesByLocation(Long locationId) {
        // TEMPORARY: Return all sales (needs proper implementation with Sale.locationId)
        System.err.println("WARNING: getSalesByLocation not properly implemented - returning all sales");
        return getAllSales();
    }
    
    public List<SaleDto> getTodaysSalesByLocation(Long locationId) {
        // TEMPORARY: Return today's sales (needs proper implementation with Sale.locationId)
        System.err.println("WARNING: getTodaysSalesByLocation not properly implemented - returning all today's sales");
        return getTodaysSales();
    }
    
    public BigDecimal getTodaysRevenueByLocation(Long locationId) {
        // TEMPORARY: Return today's revenue (needs proper implementation with Sale.locationId)
        System.err.println("WARNING: getTodaysRevenueByLocation not properly implemented - returning all revenue");
        return getTodaysRevenue();
    }
    
    public List<SaleDto> getSalesBetweenDatesByLocation(LocalDateTime startDate, LocalDateTime endDate, Long locationId) {
        // TEMPORARY: Return all sales in date range (needs proper implementation with Sale.locationId)
        System.err.println("WARNING: getSalesBetweenDatesByLocation not properly implemented - returning all sales in range");
        return saleRepository.findSalesBetweenDates(startDate, endDate).stream()
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
        
        // Map barcodes to list of barcode numbers
        if (item.getBarcodes() != null && !item.getBarcodes().isEmpty()) {
            List<String> barcodeNumbers = item.getBarcodes().stream()
                    .map(Barcode::getBarcodeNumber)
                    .collect(Collectors.toList());
            dto.setBarcodes(barcodeNumbers);
        }
        
        if (item.getProduct() != null) {
            // Convert product manually to avoid circular dependency
            ProductDto productDto = new ProductDto();
            Product product = item.getProduct();
            productDto.setId(product.getId());
            productDto.setName(product.getName());
            productDto.setCategory(product.getCategory());
            productDto.setSize(product.getSize());
            productDto.setColor(product.getColor());
            // Pricing removed from Product - set to null (UI should use sale item price)
            productDto.setPrice(null);
            productDto.setCost(null);
            productDto.setWholesalePrice(null);
            productDto.setWholesaleMinQuantity(null);
            
            // Stock not location-specific
            productDto.setStock(0);
            
            productDto.setMinStock(0); // Use LocationInventory for minStock
            productDto.setSku(product.getSku());
            productDto.setDescription(product.getDescription());
            // barcode removed - use Barcode table
            productDto.setImageUrls(product.getImageUrls());
            productDto.setCreatedAt(product.getCreatedAt());
            productDto.setUpdatedAt(product.getUpdatedAt());
            // Location removed from Product
            productDto.setLocation(null);
            
            dto.setProduct(productDto);
        }
        
        return dto;
    }
}
