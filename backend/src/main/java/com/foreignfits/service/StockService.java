package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.StockMovementDto;
import com.foreignfits.dto.request.StockAdjustmentRequest;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.LocationInventory;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.StockMovement;
import com.foreignfits.entity.StockTransfer;
import com.foreignfits.entity.User;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.repository.StockMovementRepository;
import com.foreignfits.repository.StockTransferRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    
    public StockMovementDto adjustStock(StockAdjustmentRequest request, String createdBy) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));
        
        // Get current stock from LocationInventory
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Inventory not found for product"));
        
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
        
        // Get the user who is making the adjustment
        User requestingUser = userRepository.findByEmail(createdBy)
                .orElseThrow(() -> new RuntimeException("User not found: " + createdBy));
        
        // Create StockTransfer for the adjustment
        StockTransfer transfer = new StockTransfer();
        transfer.setProduct(product);
        transfer.setFromLocation(initialLocation); // Adjustments come from INITIAL
        transfer.setToLocation(product.getLocation()); // Applied to product's location
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
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Inventory not found for product"));
        
        inventory.setQuantity(movement.getNewStock());
        inventory.setLastMovementId(movement.getId());
        locationInventoryRepository.save(inventory);
        
        // If this is a TRANSFER movement, also update the destination location
        if (movement.getType() == StockMovement.MovementType.TRANSFER && movement.getTransfer() != null) {
            // Get destination location from transfer
            Location toLocation = movement.getTransfer().getToLocation();
            
            // Ensure destination product exists (create if needed)
            Product destinationProduct = productRepository.findByLocationIdAndSku(
                    toLocation.getId(), 
                    product.getSku()
            ).orElseGet(() -> {
                // Create product entry at destination location
                Product newProduct = new Product();
                newProduct.setName(product.getName());
                newProduct.setSku(product.getSku());
                newProduct.setBarcode(null); // Avoid unique constraint violation
                newProduct.setCategory(product.getCategory());
                newProduct.setSize(product.getSize());
                newProduct.setColor(product.getColor());
                newProduct.setPrice(product.getPrice());
                newProduct.setCost(product.getCost());
                newProduct.setWholesalePrice(product.getWholesalePrice());
                newProduct.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
                newProduct.setMinStock(product.getMinStock());
                newProduct.setDescription(product.getDescription());
                if (product.getImageUrls() != null) {
                    newProduct.setImageUrls(new java.util.ArrayList<>(product.getImageUrls()));
                }
                newProduct.setLocation(toLocation);
                newProduct.setCreatedBy(approvedBy);
                newProduct.setIsApproved(true);
                newProduct.setApprovedBy(approvedBy);
                newProduct.setApprovedAt(java.time.LocalDateTime.now());
                return productRepository.save(newProduct);
            });
            
            // Find or create destination inventory
            LocationInventory destInventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(toLocation.getId(), product.getSku())
                    .orElseGet(() -> {
                        LocationInventory newInv = new LocationInventory();
                        newInv.setLocation(toLocation);
                        newInv.setProductSku(product.getSku());
                        newInv.setProduct(destinationProduct);
                        newInv.setQuantity(0);
                        newInv.setMinStock(product.getMinStock());
                        newInv.setMaxStock(product.getMinStock() * 5);
                        newInv.setReorderPoint(product.getMinStock() * 2);
                        return newInv;
                    });
            
            // Add the transferred quantity to destination
            destInventory.setQuantity(destInventory.getQuantity() + movement.getQuantity());
            destInventory.setLastMovementId(movement.getId());
            locationInventoryRepository.save(destInventory);
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
        // ALL users (including admin) follow the same rule:
        // See movements at their location OR created by them
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
        // ALL users (including admin) follow the same rule:
        // See pending movements at their location OR created by them
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
            productDto.setPrice(product.getPrice());
            productDto.setCost(product.getCost());
            productDto.setWholesalePrice(product.getWholesalePrice());
            productDto.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
            
            // Get stock from LocationInventory
            LocationInventory inventory = locationInventoryRepository
                    .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                    .orElse(null);
            productDto.setStock(inventory != null ? inventory.getQuantity() : 0);
            
            productDto.setMinStock(product.getMinStock());
            productDto.setSku(product.getSku());
            productDto.setDescription(product.getDescription());
            productDto.setBarcode(product.getBarcode());
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