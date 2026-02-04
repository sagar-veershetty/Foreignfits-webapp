package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.SaleDto;
import com.foreignfits.dto.SaleItemDto;
import com.foreignfits.dto.SalePaymentDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.CollectSalePaymentRequest;
import com.foreignfits.dto.request.CreateSaleRequest;
import com.foreignfits.dto.request.SaleItemRequest;
import com.foreignfits.entity.*;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.repository.SaleRepository;
import com.foreignfits.repository.SalePaymentRepository;
import com.foreignfits.repository.StockMovementRepository;
import com.foreignfits.repository.StockTransferRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final SalePaymentRepository salePaymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    private final LocationRepository locationRepository;
    private final StockTransferRepository stockTransferRepository;
    private final BarcodeService barcodeService;
    private final BarcodeHistoryService barcodeHistoryService;
    private final com.foreignfits.repository.ExchangeRepository exchangeRepository;
    private final com.foreignfits.repository.ExchangeItemRepository exchangeItemRepository;
    private final CouponService couponService;
    
    private static final BigDecimal GST_RATE = new BigDecimal("0.05"); // Flat 5% GST (included in price)
    private static final Long GANGA_LOCATION_ID = 3L;
    
    public List<SaleDto> getAllSales() {
        return saleRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public SaleDto getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
        return convertToDto(sale);
    }

    public SaleDto addPaymentToSale(Long saleId, CollectSalePaymentRequest request) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Sale not found with id: " + saleId));

        BigDecimal existingPaid = sale.getPaidAmount();
        if (existingPaid == null) {
            if (sale.getPayments() != null && !sale.getPayments().isEmpty()) {
                existingPaid = sale.getPayments().stream()
                        .map(SalePayment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            } else if (sale.getPaymentMethod() != null) {
                existingPaid = sale.getTotal();
            } else {
                existingPaid = BigDecimal.ZERO;
            }
        }

        BigDecimal pending = sale.getTotal().subtract(existingPaid);
        if (pending.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("This sale has no pending balance");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than 0");
        }

        if (amount.compareTo(pending) > 0) {
            throw new RuntimeException("Payment amount exceeds pending balance (Pending: " + pending + ")");
        }

        SalePayment payment = new SalePayment();
        payment.setSale(sale);
        try {
            payment.setPaymentMethod(SalePayment.PaymentMethod.valueOf(request.getPaymentMethod()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid payment method: " + request.getPaymentMethod() +
                ". Valid values are: CASH, CARD, UPI, OTHER");
        }
        payment.setAmount(amount);
        payment.setReference(request.getReference());
        SalePayment savedPayment = salePaymentRepository.save(payment);

        List<SalePayment> payments = sale.getPayments();
        if (payments == null) {
            payments = new ArrayList<>();
        }
        payments.add(savedPayment);
        sale.setPayments(payments);

        BigDecimal newPaidAmount = existingPaid.add(amount);
        BigDecimal newPendingAmount = sale.getTotal().subtract(newPaidAmount);
        if (newPendingAmount.compareTo(BigDecimal.ZERO) < 0) {
            newPendingAmount = BigDecimal.ZERO;
        }

        sale.setPaidAmount(newPaidAmount);
        sale.setPendingAmount(newPendingAmount);
        sale.setPaymentStatus(newPendingAmount.compareTo(BigDecimal.ZERO) > 0
                ? Sale.PaymentStatus.PARTIALLY_PAID
                : Sale.PaymentStatus.PAID);

        Sale updatedSale = saleRepository.save(sale);
        return convertToDto(updatedSale);
    }
    
    public SaleDto createSale(CreateSaleRequest request, Long soldById) {
        System.out.println("Creating sale with salesPersonName: " + request.getSalesPersonName());
        
        User soldBy = userRepository.findById(soldById)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + soldById));
        
    // Get the location where sale is being made
        Location saleLocation = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));

    String saleLocationName = saleLocation.getName() != null ? saleLocation.getName().toLowerCase() : "";
    boolean isGangaWholesale = saleLocation.getId().equals(GANGA_LOCATION_ID) || saleLocationName.contains("ganga");
        
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
            BigDecimal itemTotal = BigDecimal.ZERO;
            
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
                
                // Use individual barcode price
                if (barcode.getSalePrice() == null || barcode.getSalePrice() <= 0) {
                    throw new RuntimeException("Barcode " + barcodeNumber + " does not have a valid sale price. Please set a price before selling.");
                }
                
                itemTotal = itemTotal.add(BigDecimal.valueOf(barcode.getSalePrice()));
                validatedBarcodes.add(barcode);
            }
            
            // Calculate average unit price for display purposes
            BigDecimal avgUnitPrice = itemTotal.divide(new BigDecimal(itemRequest.getQuantity()), 2, RoundingMode.HALF_UP);
            
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
            
            // Create sale item using individual barcode prices
            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setPrice(avgUnitPrice); // Store average price for display
            saleItem.setTotal(itemTotal); // Use actual sum of individual prices
            saleItem.setBarcodes(validatedBarcodes); // ✅ Store the actual barcodes used
            
            saleItems.add(saleItem);
            subtotal = subtotal.add(itemTotal);
        }
        
    // Start with subtotal (pre-tax, pre-discount)
    BigDecimal total = subtotal;
        
        // Apply coupon if provided
        BigDecimal couponDiscount = BigDecimal.ZERO;
        String validCouponCode = null;
        
        System.out.println("=== COUPON CHECK: request.getCouponCode() = " + request.getCouponCode());

        if (isGangaWholesale && request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            System.out.println("=== GANGA WHOLESALE: Coupon ignored for wholesale sales");
        }

    if (!isGangaWholesale && request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            System.out.println("=== ENTERING COUPON BLOCK...");
            com.foreignfits.dto.CouponValidationResult validation = couponService.validateCoupon(
                request.getCouponCode(), 
                total
            );
            
            if (!validation.isValid()) {
                throw new RuntimeException("Coupon validation failed: " + validation.getMessage());
            }
            
            validCouponCode = request.getCouponCode();
            couponDiscount = validation.getDiscountAmount();
            
            System.out.println("=== BEFORE DISCOUNT: Total = ₹" + total + ", Coupon Discount = ₹" + couponDiscount);
            
            // Apply discount to total
            total = total.subtract(couponDiscount);
            if (total.compareTo(BigDecimal.ZERO) < 0) {
                total = BigDecimal.ZERO;
            }
            
            System.out.println("=== AFTER DISCOUNT: Total = ₹" + total);
        }
        
        // Calculate instant discount based on subtotal (before coupon)
        BigDecimal instantDiscountPercent = BigDecimal.ZERO;
        BigDecimal instantDiscountAmount = BigDecimal.ZERO;
        
        // Check subtotal against thresholds
        if (!isGangaWholesale && subtotal.compareTo(new BigDecimal("10000")) >= 0) {
            instantDiscountPercent = new BigDecimal("15.00");
        } else if (!isGangaWholesale && subtotal.compareTo(new BigDecimal("7500")) >= 0) {
            instantDiscountPercent = new BigDecimal("12.00");
        } else if (!isGangaWholesale && subtotal.compareTo(new BigDecimal("5000")) >= 0) {
            instantDiscountPercent = new BigDecimal("10.00");
        }
        
        // Calculate instant discount amount if applicable
        if (!isGangaWholesale && instantDiscountPercent.compareTo(BigDecimal.ZERO) > 0) {
            instantDiscountAmount = subtotal.multiply(instantDiscountPercent)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            
            // Apply instant discount to total
            total = total.subtract(instantDiscountAmount);
            if (total.compareTo(BigDecimal.ZERO) < 0) {
                total = BigDecimal.ZERO;
            }
            
            System.out.println("=== INSTANT DISCOUNT APPLIED: " + instantDiscountPercent + "% = ₹" + instantDiscountAmount);
        }

        // Calculate GST portion included in the discounted subtotal
    BigDecimal totalDiscount = couponDiscount.add(instantDiscountAmount);
        if (totalDiscount.compareTo(subtotal) > 0) {
            totalDiscount = subtotal;
        }
        BigDecimal tax = calculateGstForSaleItems(saleItems, subtotal, totalDiscount);
        // Total already includes GST (tax is just the included portion)
        
        // Create sale
        Sale sale = new Sale();
        sale.setSubtotal(subtotal);
        sale.setTax(tax);
        
        System.out.println("=== SETTING SALE TOTAL: ₹" + total);
        sale.setTotal(total);
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerEmail(request.getCustomerEmail());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setCustomerCountryCode(request.getCustomerCountryCode());
        sale.setSalesPersonName(request.getSalesPersonName()); // ✅ Set the sales person name
        sale.setCouponCode(validCouponCode);
        sale.setCouponDiscount(couponDiscount.compareTo(BigDecimal.ZERO) > 0 ? couponDiscount : null);
        sale.setInstantDiscountPercent(instantDiscountPercent.compareTo(BigDecimal.ZERO) > 0 ? instantDiscountPercent : null);
        sale.setInstantDiscountAmount(instantDiscountAmount.compareTo(BigDecimal.ZERO) > 0 ? instantDiscountAmount : null);
        sale.setSoldBy(soldBy);
        sale.setLocation(saleLocation); // ✅ Set the location where sale was made
        
        Sale savedSale;
        try {
            savedSale = saleRepository.save(sale);
        } catch (DataIntegrityViolationException ex) {
            Long maxId = saleRepository.findMaxId();
            saleRepository.resetIdentity(maxId + 1);
            savedSale = saleRepository.save(sale);
        }
        
        System.out.println("=== SALE SAVED - ID: " + savedSale.getId() + ", Total: ₹" + savedSale.getTotal() + ", Coupon Discount: ₹" + couponDiscount);
        
        // Redeem coupon if it was applied
        if (validCouponCode != null) {
            couponService.redeemCoupon(validCouponCode, savedSale, soldBy);
        }
        
        
        // Set sale reference in items and save
        for (SaleItem item : saleItems) {
            item.setSale(savedSale);
        }
        savedSale.setItems(saleItems);
        savedSale = saleRepository.save(savedSale);
        
        System.out.println("=== SALE RE-SAVED AFTER ITEMS - ID: " + savedSale.getId() + ", Total: ₹" + savedSale.getTotal());
        
        // ✅ SPLIT PAYMENT SUPPORT: Handle multiple payment methods
    BigDecimal paidAmount = null;
    BigDecimal pendingAmount = null;
    Sale.PaymentStatus paymentStatus = Sale.PaymentStatus.PAID;

    if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            System.out.println("=== VALIDATING PAYMENTS - Sale Total: ₹" + savedSale.getTotal());
            
            // Validate that payment amounts sum to sale total
            BigDecimal paymentSum = request.getPayments().stream()
                    .map(SalePaymentDto::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            System.out.println("=== Payment Sum: ₹" + paymentSum + ", Sale Total: ₹" + savedSale.getTotal());
            
            String locationName = saleLocation.getName() != null ? saleLocation.getName().toLowerCase() : "";
            boolean allowPartialPayment = saleLocation.getId().equals(GANGA_LOCATION_ID)
                || locationName.contains("ganga");

            if (paymentSum.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("At least one valid payment amount is required");
            }

            if (allowPartialPayment) {
                if (paymentSum.compareTo(savedSale.getTotal()) > 0) {
                    throw new RuntimeException("Payment sum (" + paymentSum +
                        ") exceeds sale total (" + savedSale.getTotal() + ")");
                }
            } else if (paymentSum.compareTo(savedSale.getTotal()) != 0) {
                throw new RuntimeException("Payment sum (" + paymentSum + 
                    ") does not match sale total (" + savedSale.getTotal() + ")");
            }
            
            // Save each payment
            List<SalePayment> payments = new ArrayList<>();
            for (SalePaymentDto paymentDto : request.getPayments()) {
                try {
                    SalePayment payment = new SalePayment();
                    payment.setSale(savedSale);
                    payment.setPaymentMethod(SalePayment.PaymentMethod.valueOf(paymentDto.getPaymentMethod()));
                    payment.setAmount(paymentDto.getAmount());
                    payment.setReference(paymentDto.getReference());
                    payments.add(salePaymentRepository.save(payment));
                } catch (IllegalArgumentException e) {
                    throw new RuntimeException("Invalid payment method: " + paymentDto.getPaymentMethod() + 
                        ". Valid values are: CASH, CARD, UPI, OTHER");
                }
            }
            savedSale.setPayments(payments);

            paidAmount = paymentSum;
            pendingAmount = savedSale.getTotal().subtract(paymentSum);
            if (pendingAmount.compareTo(BigDecimal.ZERO) < 0) {
                pendingAmount = BigDecimal.ZERO;
            }

            if (paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
                paymentStatus = Sale.PaymentStatus.UNPAID;
            } else if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                paymentStatus = Sale.PaymentStatus.PARTIALLY_PAID;
            }
            
        } else if (request.getPaymentMethod() != null) {
            // Backward compatibility: Convert single payment method to payment record
            SalePayment payment = new SalePayment();
            payment.setSale(savedSale);
            payment.setPaymentMethod(SalePayment.PaymentMethod.valueOf(request.getPaymentMethod().name()));
            payment.setAmount(savedSale.getTotal());
            payment.setReference(null); // No reference for old format
            SalePayment savedPayment = salePaymentRepository.save(payment);
            savedSale.setPayments(new ArrayList<>(List.of(savedPayment)));

            paidAmount = savedSale.getTotal();
            pendingAmount = BigDecimal.ZERO;
            paymentStatus = Sale.PaymentStatus.PAID;
        } else {
            throw new RuntimeException("Payment method or payments list is required");
        }

        savedSale.setPaidAmount(paidAmount);
        savedSale.setPendingAmount(pendingAmount);
        savedSale.setPaymentStatus(paymentStatus);
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
                // Update barcode status to SOLD
                barcodeService.updateBarcodeRemark(barcode.getId(), "SOLD", "Sold in Sale #" + savedSale.getId() + " at " + LocalDateTime.now());
                
                // Record barcode sale in history
                try {
                    barcodeHistoryService.recordHistory(
                        barcode,
                        "SOLD",
                        saleLocation,
                        saleLocation,
                        null,
                        "SALE",
                        savedSale.getId(),
                        "Sold in Sale #" + savedSale.getId(),
                        soldBy.getEmail()
                    );
                } catch (Exception e) {
                    System.err.println("Failed to record barcode sale history: " + e.getMessage());
                }
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
        
        // TEMPORARILY DISABLED: Process loyalty points - causing FK constraint violation
        // TODO: Fix loyalty points to work with PROPAGATION_REQUIRES_NEW like coupons
        /*
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
                
                // Handle points redemption BEFORE awarding new points
                BigDecimal discount = BigDecimal.ZERO;
                if (request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
                    discount = loyaltyService.redeemPoints(loyaltyCustomer, request.getPointsToRedeem());
                    savedSale.setPointsRedeemed(request.getPointsToRedeem());
                    savedSale.setDiscountFromPoints(discount);
                    
                    // Update sale total after discount
                    BigDecimal newTotal = total.subtract(discount);
                    if (newTotal.compareTo(BigDecimal.ZERO) < 0) {
                        newTotal = BigDecimal.ZERO;
                    }
                    savedSale.setTotal(newTotal);
                }
                
                // Award points for purchase (based on final amount after discount)
                int pointsEarned = loyaltyService.awardPointsForPurchase(loyaltyCustomer, savedSale, savedSale.getTotal());
                savedSale.setPointsEarned(pointsEarned);
                saleRepository.save(savedSale);
                
            } catch (Exception e) {
                // Log error but don't fail the sale
                System.err.println("Error processing loyalty points: " + e.getMessage());
            }
        }
        */
        
        // Generate new coupon if sale qualifies (≥ ₹3000 after all discounts)
        System.out.println("=== COUPON GENERATION: Checking if sale #" + savedSale.getId() + " qualifies. Total: ₹" + savedSale.getTotal());
        try {
            // Pass primitive values instead of entity to avoid transaction conflicts
            com.foreignfits.entity.Coupon newCoupon = couponService.generateCouponForSale(
                savedSale.getId(), 
                savedSale.getTotal(),
                savedSale.getCustomerName(),
                savedSale.getCustomerPhone(),
                savedSale.getCustomerCountryCode()
            );
            if (newCoupon != null) {
                savedSale.setGeneratedCouponCode(newCoupon.getCode());
                System.out.println("=== COUPON GENERATED: " + newCoupon.getCode() + " for sale #" + savedSale.getId());
            } else {
                System.out.println("=== COUPON NOT GENERATED: generateCouponForSale returned null for sale #" + savedSale.getId());
            }
        } catch (Exception e) {
            // Log error but don't fail the sale
            System.err.println("=== COUPON GENERATION ERROR: " + e.getMessage());
            e.printStackTrace();
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
        dto.setSalesPersonName(sale.getSalesPersonName());
        dto.setCouponCode(sale.getCouponCode());
        dto.setCouponDiscount(sale.getCouponDiscount());
        dto.setGeneratedCouponCode(sale.getGeneratedCouponCode());
        dto.setInstantDiscountPercent(sale.getInstantDiscountPercent());
        dto.setInstantDiscountAmount(sale.getInstantDiscountAmount());
        dto.setIsExchangeSale(sale.getIsExchangeSale());
        dto.setExchangeId(sale.getExchangeId());
        dto.setExchangePriceDifference(sale.getExchangePriceDifference());
    dto.setPaidAmount(sale.getPaidAmount());
    dto.setPendingAmount(sale.getPendingAmount());
    dto.setPaymentStatus(sale.getPaymentStatus());
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
        
        // Convert location
        if (sale.getLocation() != null) {
            LocationDto locationDto = new LocationDto();
            locationDto.setId(sale.getLocation().getId());
            locationDto.setName(sale.getLocation().getName());
            locationDto.setType(sale.getLocation().getType());
            dto.setLocation(locationDto);
        }
        
        // Convert sale items
        if (sale.getItems() != null) {
            List<SaleItemDto> itemDtos = sale.getItems().stream()
                    .map(this::convertSaleItemToDto)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        }
        
        // Convert payments (split payment support)
        if (sale.getPayments() != null && !sale.getPayments().isEmpty()) {
            List<SalePaymentDto> paymentDtos = sale.getPayments().stream()
                    .map(this::convertPaymentToDto)
                    .collect(Collectors.toList());
            dto.setPayments(paymentDtos);
        }
        
        return dto;
    }

    private BigDecimal calculateGstForSaleItems(List<SaleItem> items, BigDecimal subtotal, BigDecimal totalDiscount) {
        if (items == null || items.isEmpty() || subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountRatio = BigDecimal.ZERO;
        if (totalDiscount != null && totalDiscount.compareTo(BigDecimal.ZERO) > 0) {
            discountRatio = totalDiscount.divide(subtotal, 6, RoundingMode.HALF_UP);
        }

        BigDecimal taxTotal = BigDecimal.ZERO;
        for (SaleItem item : items) {
            BigDecimal itemTotal = item.getTotal() != null ? item.getTotal() : BigDecimal.ZERO;
            BigDecimal itemDiscount = itemTotal.multiply(discountRatio);
            BigDecimal taxable = itemTotal.subtract(itemDiscount);
            if (taxable.compareTo(BigDecimal.ZERO) < 0) {
                taxable = BigDecimal.ZERO;
            }

            BigDecimal taxPortion = taxable.multiply(GST_RATE)
                .divide(BigDecimal.ONE.add(GST_RATE), 6, RoundingMode.HALF_UP);
            taxTotal = taxTotal.add(taxPortion);
        }

        return taxTotal.setScale(2, RoundingMode.HALF_UP);
    }
    
    private SalePaymentDto convertPaymentToDto(SalePayment payment) {
        SalePaymentDto dto = new SalePaymentDto();
        dto.setId(payment.getId());
        dto.setPaymentMethod(payment.getPaymentMethod().name());
        dto.setAmount(payment.getAmount());
        dto.setReference(payment.getReference());
        return dto;
    }
    
    private SaleItemDto convertSaleItemToDto(SaleItem item) {
        SaleItemDto dto = new SaleItemDto();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setTotal(item.getTotal());
        
        // Map barcodes to list of barcode numbers and create barcodePrices map
        if (item.getBarcodes() != null && !item.getBarcodes().isEmpty()) {
            List<String> barcodeNumbers = item.getBarcodes().stream()
                    .map(Barcode::getBarcodeNumber)
                    .collect(Collectors.toList());
            dto.setBarcodes(barcodeNumbers);
            
            // Create barcodePrices map for exchange calculations
            java.util.Map<String, BigDecimal> barcodePrices = new java.util.HashMap<>();
            for (Barcode barcode : item.getBarcodes()) {
                BigDecimal price = barcode.getSalePrice() != null && barcode.getSalePrice() > 0 
                    ? BigDecimal.valueOf(barcode.getSalePrice())
                    : item.getPrice(); // Fallback to average item price
                barcodePrices.put(barcode.getBarcodeNumber(), price);
            }
            dto.setBarcodePrices(barcodePrices);
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
    /**
     * Delete a sale (ADMIN only)
     * This will delete the sale and all related payments and exchanges
     */
    public void deleteSale(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
        
        // Delete in order of foreign key dependencies:
        // 1. Delete exchange items (references exchanges)
        exchangeItemRepository.deleteByExchangeSaleId(id);
        
        // 2. Delete exchanges (references sale)
        exchangeRepository.deleteBySaleId(id);
        
        // 3. Delete payments (references sale)
        salePaymentRepository.deleteBySaleId(id);
        
        // 4. Now delete the sale itself
        saleRepository.delete(sale);
    }

}
