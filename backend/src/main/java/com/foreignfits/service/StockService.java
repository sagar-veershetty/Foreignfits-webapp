package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.StockMovementDto;
import com.foreignfits.dto.request.StockAdjustmentRequest;
import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.LocationInventory;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.StockMovement;
import com.foreignfits.entity.StockTransfer;
import com.foreignfits.entity.TransferBarcode;
import com.foreignfits.entity.User;
import com.foreignfits.repository.BarcodeRepository;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.repository.StockMovementRepository;
import com.foreignfits.repository.StockTransferRepository;
import com.foreignfits.repository.TransferBarcodeRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class StockService {
    
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    private final LocationRepository locationRepository;
    private final StockTransferRepository stockTransferRepository;
    private final UserRepository userRepository;
    private final BarcodeService barcodeService;
    private final TransferBarcodeRepository transferBarcodeRepository;
    private final BarcodeRepository barcodeRepository;
    private final BarcodeHistoryService barcodeHistoryService;
    
    public StockMovementDto adjustStock(StockAdjustmentRequest request, String createdBy) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));
        
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
        
        // Get the user who is making the adjustment
        User requestingUser = userRepository.findByEmail(createdBy)
                .orElseThrow(() -> new RuntimeException("User not found: " + createdBy));
        
        // Validate location access: Only ADMIN can adjust stock at any location
        // Other roles can only adjust stock at their own location
        if (requestingUser.getRole() != User.UserRole.ADMIN) {
            if (requestingUser.getLocation() == null) {
                throw new RuntimeException("User must be assigned to a location to make stock adjustments");
            }
            if (!requestingUser.getLocation().getId().equals(location.getId())) {
                throw new RuntimeException("You can only adjust stock at your own location: " + requestingUser.getLocation().getName());
            }
        }
        
        // Get current stock from LocationInventory
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(location.getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Inventory not found for product at this location"));
        
        int previousStock = inventory.getQuantity();
        int newStock = calculateNewStock(previousStock, request);
        
        // Validate new stock
        if (newStock < 0) {
            throw new RuntimeException("Stock cannot be negative");
        }
        
        // DO NOT update product stock yet - wait for approval
        // product.setStock(newStock);
        // productRepository.save(product);
        
        // Get INITIAL location (ID=0) for adjustments
        Location initialLocation = locationRepository.findById(0L)
                .orElseThrow(() -> new RuntimeException("INITIAL location not found"));
        
        // Create StockTransfer for the adjustment
        StockTransfer transfer = new StockTransfer();
        transfer.setProduct(product);
        transfer.setFromLocation(initialLocation); // Adjustments come from INITIAL
        transfer.setToLocation(location); // Applied to specified location
        transfer.setQuantity(Math.abs(calculateQuantityChange(previousStock, newStock, request.getAdjustmentType())));
        transfer.setReason(request.getReason());
        transfer.setReference(request.getReference());
        transfer.setStatus(StockTransfer.TransferStatus.PENDING);
        transfer.setRequestedAt(java.time.LocalDateTime.now());
        transfer.setRequestedBy(requestingUser); // Set the requesting user
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);
        
        // Create stock movement record (pending approval)
        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setType(StockMovement.MovementType.ADJUSTMENT);
        movement.setQuantity(calculateQuantityChange(previousStock, newStock, request.getAdjustmentType()));
        movement.setPreviousStock(previousStock);
        movement.setNewStock(newStock);
        movement.setReason(request.getReason());
        movement.setReference(request.getReference());
        movement.setTransfer(savedTransfer); // Link to transfer for from/to locations
        movement.setCreatedBy(createdBy);
        movement.setStatus(StockMovement.MovementStatus.PENDING); // Requires approval
        
        StockMovement savedMovement = stockMovementRepository.save(movement);
        return convertToDto(savedMovement);
    }
    
    @Transactional
    public StockMovementDto approveStockMovement(Long movementId, String approvedBy, User approvingUser) {
        StockMovement movement = stockMovementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Stock movement not found with id: " + movementId));
        
        if (movement.getStatus() == StockMovement.MovementStatus.APPROVED) {
            throw new RuntimeException("Stock movement already approved");
        }
        
        // For TRANSFER movements, only the destination location can approve
        if (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) {
            Location toLocation = movement.getTransfer().getToLocation();
            Location userLocation = approvingUser.getLocation();
            
            if (userLocation == null || !userLocation.getId().equals(toLocation.getId())) {
                throw new RuntimeException("Only the destination location can approve this transfer. Please contact the destination location to approve.");
            }
        }
        
        // Update LocationInventory NOW that it's approved
        Product product = movement.getProduct();
        
        // For TRANSFER movements, get from/to locations upfront
        final Location fromLocation = (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) 
            ? movement.getTransfer().getFromLocation() : null;
        final Location toLocation = (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) 
            ? movement.getTransfer().getToLocation() : null;
        
        // For TRANSFER movements, decrease source location inventory
        if (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) {
            if (fromLocation == null || toLocation == null) {
                throw new RuntimeException("Transfer locations not properly initialized");
            }
            
            LocationInventory sourceInventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(fromLocation.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Source inventory not found for product"));
            
            // Decrease source inventory by transfer quantity (use current quantity, not stale newStock)
            int currentSourceQty = sourceInventory.getQuantity();
            int transferQty = movement.getQuantity();
            
            if (currentSourceQty < transferQty) {
                throw new RuntimeException("Insufficient stock at source location. Available: " + currentSourceQty + ", Required: " + transferQty);
            }
            
            sourceInventory.setQuantity(currentSourceQty - transferQty);
            sourceInventory.setLastMovementId(movement.getId());
            locationInventoryRepository.save(sourceInventory);
        } else {
            // For non-transfer movements (ADJUSTMENT, SALE, etc.), get inventory at the location
            // Since products don't have location, we need to find which location this applies to
            // For adjustments, use the transfer's toLocation
            Location adjustmentLocation = movement.getTransfer() != null ? 
                movement.getTransfer().getToLocation() : null;
            
            if (adjustmentLocation == null) {
                throw new RuntimeException("Cannot determine location for stock adjustment");
            }
            
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(adjustmentLocation.getId(), product.getSku())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for product at location"));
            
            inventory.setQuantity(movement.getNewStock());
            inventory.setLastMovementId(movement.getId());
            locationInventoryRepository.save(inventory);
        }
        
        // If this is a TRANSFER movement, also update the destination location
        if (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) {
            if (toLocation == null) {
                throw new RuntimeException("Destination location not properly initialized");
            }
            
            // NO LONGER CREATE DUPLICATE PRODUCT - Products are organization-wide
            // Just ensure destination inventory exists with initial pricing from source
            LocationInventory destInventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(toLocation.getId(), product.getSku())
                    .orElseGet(() -> {
                        // Get source inventory for pricing reference (fromLocation should not be null here)
                        LocationInventory sourceInv = null;
                        if (fromLocation != null) {
                            sourceInv = locationInventoryRepository
                                    .findByLocationIdAndProductSku(fromLocation.getId(), product.getSku())
                                    .orElse(null);
                        }
                        
                        LocationInventory newInv = new LocationInventory();
                        newInv.setLocation(toLocation);
                        newInv.setProductSku(product.getSku());
                        newInv.setProduct(product); // Reference to the SAME product (not duplicate)
                        newInv.setQuantity(0);
                        // Use default minStock since Product no longer has it
                        newInv.setMinStock(10);
                        newInv.setMaxStock(50);
                        newInv.setReorderPoint(20);
                        
                        // Copy pricing from source location if available, otherwise set defaults
                        if (sourceInv != null) {
                            newInv.setCost(sourceInv.getCost());
                            newInv.setSalePrice(sourceInv.getSalePrice());
                            newInv.setWholesalePrice(sourceInv.getWholesalePrice());
                            newInv.setWholesaleMinQuantity(sourceInv.getWholesaleMinQuantity());
                        } else {
                            // Fallback defaults if no source pricing found
                            newInv.setCost(new java.math.BigDecimal("0.00"));
                            newInv.setSalePrice(new java.math.BigDecimal("0.00"));
                            newInv.setWholesalePrice(null);
                            newInv.setWholesaleMinQuantity(null);
                        }
                        return newInv;
                    });
            
            // Add the transferred quantity to destination
            destInventory.setQuantity(destInventory.getQuantity() + movement.getQuantity());
            destInventory.setLastMovementId(movement.getId());
            locationInventoryRepository.save(destInventory);
            
            // Transfer barcodes from source to destination location
            try {
                if (fromLocation != null && toLocation != null) {
                    List<Barcode> transferredBarcodes;
                    
                    // Check if this is a barcode-based transfer (has specific barcodes in TransferBarcode table)
                    List<TransferBarcode> specificBarcodes = transferBarcodeRepository
                            .findByTransferId(movement.getTransfer().getId());
                    
                    if (!specificBarcodes.isEmpty()) {
                        // Transfer the SPECIFIC barcodes that were scanned
                        transferredBarcodes = new ArrayList<>();
                        for (TransferBarcode tb : specificBarcodes) {
                            Barcode barcode = tb.getBarcode();
                            barcode.setCurrentLocation(toLocation);
                            barcodeRepository.save(barcode);
                            transferredBarcodes.add(barcode);
                            
                            // Record barcode history for transfer
                            try {
                                barcodeHistoryService.recordHistory(
                                    barcode,
                                    "TRANSFERRED",
                                    null,
                                    fromLocation,
                                    toLocation,
                                    "TRANSFER",
                                    movement.getTransfer().getId(),
                                    "Barcode-based transfer approved",
                                    approvedBy
                                );
                            } catch (Exception e) {
                                System.err.println("Warning: Failed to record barcode history: " + e.getMessage());
                            }
                        }
                        System.out.println("Transferred " + transferredBarcodes.size() + " SPECIFIC barcodes from " + 
                            fromLocation.getName() + " to " + toLocation.getName());
                    } else {
                        // Regular quantity-based transfer - transfer any active barcodes
                        transferredBarcodes = barcodeService.transferBarcodes(
                            product,
                            fromLocation,
                            toLocation,
                            movement.getQuantity()
                        );
                        System.out.println("Transferred " + transferredBarcodes.size() + " barcodes (quantity-based) from " + 
                            fromLocation.getName() + " to " + toLocation.getName());
                    }
                    
                    // Associate the transferred barcodes with this movement
                    movement.setBarcodes(transferredBarcodes);
                }
            } catch (Exception e) {
                System.err.println("Warning: Barcode transfer failed: " + e.getMessage());
                // Continue with approval even if barcode transfer fails
                // This handles cases where barcodes don't exist yet (old products)
            }
        }
        
        // Mark movement as approved
        movement.setStatus(StockMovement.MovementStatus.APPROVED);
        movement.setApprovedBy(approvedBy);
        movement.setApprovedAt(java.time.LocalDateTime.now());
        
        StockMovement savedMovement = stockMovementRepository.save(movement);
        
        return convertToDto(savedMovement);
    }
    
    @Transactional
    public void rejectStockMovement(Long movementId, String rejectedBy, String rejectionReason) {
        StockMovement movement = stockMovementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Stock movement not found with id: " + movementId));
        
        if (movement.getStatus() == StockMovement.MovementStatus.APPROVED) {
            throw new RuntimeException("Cannot reject already approved stock movement");
        }
        
        // Mark as rejected
        movement.setStatus(StockMovement.MovementStatus.REJECTED);
        movement.setRejectionReason(rejectionReason);
        movement.setApprovedBy(rejectedBy); // Track who rejected it
        stockMovementRepository.save(movement);
        
        // If this movement has an associated transfer, mark it as CANCELLED
        // This allows the barcodes to be used in new transfers
        if (movement.getTransfer() != null) {
            StockTransfer transfer = movement.getTransfer();
            transfer.setStatus(StockTransfer.TransferStatus.CANCELLED);
            stockTransferRepository.save(transfer);
        }
        
        // Note: Stock is NOT updated for rejected movements
    }
    
    public List<StockMovementDto> getPendingStockMovements() {
        return stockMovementRepository.findByStatusPendingOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<StockMovementDto> getStockMovements() {
        return stockMovementRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // User-based filtering methods - returns only movements user has access to
    public List<StockMovementDto> getStockMovementsForUser(User user) {
        // ADMIN can see ALL stock movements across all locations
        if (user.getRole() == User.UserRole.ADMIN) {
            return stockMovementRepository.findAllByOrderByCreatedAtDesc()
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        
        // Other users (SALES, WAREHOUSE) see movements at their location OR created by them
        if (user.getLocation() != null) {
            return stockMovementRepository.findByLocationIdOrCreatedByOrderByCreatedAtDesc(
                    user.getLocation().getId(),
                    user.getEmail()
            ).stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        
        // If no location assigned, return empty (should not happen for active users)
        return List.of();
    }
    
    public List<StockMovementDto> getPendingStockMovementsForUser(User user) {
        // ADMIN can see ALL pending stock movements across all locations
        if (user.getRole() == User.UserRole.ADMIN) {
            return stockMovementRepository.findPendingOrderByCreatedAtDesc()
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        
        // Other users (SALES, WAREHOUSE) see pending movements at their location OR created by them
        if (user.getLocation() != null) {
            return stockMovementRepository.findPendingByLocationIdOrCreatedByOrderByCreatedAtDesc(
                    user.getLocation().getId(),
                    user.getEmail()
            ).stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        
        // If no location assigned, return empty (should not happen for active users)
        return List.of();
    }
    
    public List<StockMovementDto> getStockMovementsByProduct(Long productId) {
        return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private int calculateNewStock(int currentStock, StockAdjustmentRequest request) {
        return switch (request.getAdjustmentType()) {
            case INCREASE -> currentStock + request.getQuantity();
            case DECREASE -> Math.max(0, currentStock - request.getQuantity());
            case SET -> Math.max(0, request.getQuantity());
        };
    }
    
    private int calculateQuantityChange(int previousStock, int newStock, StockAdjustmentRequest.AdjustmentType type) {
        return switch (type) {
            case INCREASE -> newStock - previousStock;
            case DECREASE -> -(previousStock - newStock);
            case SET -> newStock - previousStock;
        };
    }
    
    private StockMovementDto convertToDto(StockMovement movement) {
        StockMovementDto dto = new StockMovementDto();
        dto.setId(movement.getId());
        
        // Convert product manually to avoid circular dependency
        if (movement.getProduct() != null) {
            ProductDto productDto = new ProductDto();
            Product product = movement.getProduct();
            productDto.setId(product.getId());
            productDto.setName(product.getName());
            productDto.setCategory(product.getCategory());
            productDto.setSize(product.getSize());
            productDto.setColor(product.getColor());
            // Pricing removed from Product - set to null
            productDto.setPrice(null);
            productDto.setCost(null);
            productDto.setWholesalePrice(null);
            productDto.setWholesaleMinQuantity(null);
            
            // Stock not location-specific - set to 0
            productDto.setStock(0);
            
            productDto.setMinStock(0); // Use LocationInventory for minStock
            productDto.setSku(product.getSku());
            productDto.setDescription(product.getDescription());
            // barcode removed - use Barcode table
            productDto.setImageUrls(product.getImageUrls());
            productDto.setCreatedAt(product.getCreatedAt());
            productDto.setUpdatedAt(product.getUpdatedAt());
            dto.setProduct(productDto);
        }
        
        dto.setType(movement.getType());
        dto.setQuantity(movement.getQuantity());
        dto.setPreviousStock(movement.getPreviousStock());
        dto.setNewStock(movement.getNewStock());
        dto.setReason(movement.getReason());
        dto.setReference(movement.getReference());
        dto.setCreatedBy(movement.getCreatedBy());
        dto.setCreatedAt(movement.getCreatedAt());
        dto.setStatus(movement.getStatus()); // Map status field
        dto.setApprovedBy(movement.getApprovedBy());
        dto.setApprovedAt(movement.getApprovedAt());
        dto.setRejectionReason(movement.getRejectionReason());
        
        // Location field removed - always use transfer.fromLocation and transfer.toLocation
        // Include transfer information (required for all movements now)
        if (movement.getTransfer() != null) {
            dto.setTransferId(movement.getTransfer().getId());
            
            if (movement.getTransfer().getFromLocation() != null) {
                LocationDto fromLocationDto = new LocationDto();
                fromLocationDto.setId(movement.getTransfer().getFromLocation().getId());
                fromLocationDto.setName(movement.getTransfer().getFromLocation().getName());
                fromLocationDto.setType(movement.getTransfer().getFromLocation().getType());
                dto.setFromLocation(fromLocationDto);
            }
            
            if (movement.getTransfer().getToLocation() != null) {
                LocationDto toLocationDto = new LocationDto();
                toLocationDto.setId(movement.getTransfer().getToLocation().getId());
                toLocationDto.setName(movement.getTransfer().getToLocation().getName());
                toLocationDto.setType(movement.getTransfer().getToLocation().getType());
                dto.setToLocation(toLocationDto);
            }
        }
        
        return dto;
    }
}