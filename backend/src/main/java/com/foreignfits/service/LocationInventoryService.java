package com.foreignfits.service;

import com.foreignfits.dto.LocationInventoryDto;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.LocationInventory;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.StockMovement;
import com.foreignfits.repository.LocationInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * LocationInventoryService - Manages real-time inventory at each location
 * Replaces the need to calculate stock from movements
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LocationInventoryService {
    
    private final LocationInventoryRepository inventoryRepository;
    
    /**
     * Get inventory for a specific product at a specific location
     */
    public LocationInventoryDto getInventory(Long locationId, String productSku) {
        LocationInventory inventory = inventoryRepository.findByLocationIdAndProductSku(locationId, productSku)
                .orElseThrow(() -> new RuntimeException("Inventory not found for product " + productSku + " at location " + locationId));
        return convertToDto(inventory);
    }
    
    /**
     * Get all inventory across all locations
     */
    public List<LocationInventoryDto> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all inventory at a location
     */
    public List<LocationInventoryDto> getLocationInventory(Long locationId) {
        return inventoryRepository.findByLocationId(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all locations where a product is available
     */
    public List<LocationInventoryDto> getProductLocations(String productSku) {
        return inventoryRepository.findByProductSku(productSku).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Update inventory after a stock movement
     * This is called by StockMovementService after any movement
     */
    public LocationInventory updateInventoryFromMovement(StockMovement movement) {
        if (movement.getTransfer() == null) {
            throw new IllegalArgumentException("All movements must have an associated transfer");
        }
        
        Location location;
        String productSku = movement.getProduct().getSku();
        int quantityDelta = 0;
        
        switch (movement.getType()) {
            case SALE:
            case DAMAGE:
                // Stock decreases - use fromLocation from transfer
                location = movement.getTransfer().getFromLocation();
                quantityDelta = -movement.getQuantity();
                break;
                
            case RETURN:
            case RESTOCK:
            case ADJUSTMENT:
                // Stock increases - use toLocation from transfer
                location = movement.getTransfer().getToLocation();
                quantityDelta = movement.getQuantity();
                break;
                
            case TRANSFER:
                // For unified transfers, this is handled separately by updateInventoryFromTransfer
                throw new IllegalArgumentException("Use updateInventoryFromTransfer() for TRANSFER movements");
                
            default:
                throw new IllegalArgumentException("Unknown movement type: " + movement.getType());
        }
        
        if (location == null) {
            throw new IllegalArgumentException("Location is required for movement type: " + movement.getType());
        }
        
        // Get or create inventory record
        LocationInventory inventory = inventoryRepository
                .findByLocationIdAndProductSku(location.getId(), productSku)
                .orElseGet(() -> createInventoryRecord(location, movement.getProduct()));
        
        // Update quantity
        inventory.setQuantity(inventory.getQuantity() + quantityDelta);
        inventory.setLastMovementId(movement.getId());
        
        // Update last sale/restock dates
        if (movement.getType() == StockMovement.MovementType.SALE) {
            inventory.setLastSaleDate(movement.getCreatedAt());
        } else if (movement.getType() == StockMovement.MovementType.RESTOCK) {
            inventory.setLastRestockDate(movement.getCreatedAt());
        }
        
        return inventoryRepository.save(inventory);
    }
    
    /**
     * Update inventory for unified TRANSFER movements (updates both locations)
     */
    public void updateInventoryFromTransfer(StockMovement transferMovement, Location fromLocation, Location toLocation) {
        if (transferMovement.getType() != StockMovement.MovementType.TRANSFER) {
            throw new IllegalArgumentException("Movement must be of type TRANSFER");
        }
        
        String productSku = transferMovement.getProduct().getSku();
        int quantity = transferMovement.getQuantity();
        
        // Decrease stock at FROM location
        LocationInventory fromInventory = inventoryRepository
                .findByLocationIdAndProductSku(fromLocation.getId(), productSku)
                .orElseThrow(() -> new RuntimeException("Inventory not found at source location"));
        
        fromInventory.setQuantity(fromInventory.getQuantity() - quantity);
        fromInventory.setLastMovementId(transferMovement.getId());
        inventoryRepository.save(fromInventory);
        
        // Increase stock at TO location
        LocationInventory toInventory = inventoryRepository
                .findByLocationIdAndProductSku(toLocation.getId(), productSku)
                .orElseGet(() -> createInventoryRecord(toLocation, transferMovement.getProduct()));
        
        toInventory.setQuantity(toInventory.getQuantity() + quantity);
        toInventory.setLastMovementId(transferMovement.getId());
        toInventory.setLastRestockDate(transferMovement.getCreatedAt());
        inventoryRepository.save(toInventory);
        
        log.info("Updated inventory for transfer: {} units from {} to {}", 
                quantity, fromLocation.getName(), toLocation.getName());
    }
    
    /**
     * Get low stock items at a location
     */
    public List<LocationInventoryDto> getLowStockItems(Long locationId) {
        return inventoryRepository.findLowStockByLocation(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get items that need reordering
     */
    public List<LocationInventoryDto> getReorderItems(Long locationId) {
        return inventoryRepository.findReorderItemsByLocation(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get total quantity of a product across all locations
     */
    public Integer getTotalQuantity(String productSku) {
        Integer total = inventoryRepository.getTotalQuantityByProductSku(productSku);
        return total != null ? total : 0;
    }
    
    /**
     * Check if sufficient stock is available at a location
     */
    public boolean hasAvailableStock(Long locationId, String productSku, Integer requiredQuantity) {
        return inventoryRepository.hasAvailableStock(locationId, productSku, requiredQuantity);
    }
    
    /**
     * Initialize inventory record for a product at a location
     */
    public LocationInventory createInventoryRecord(Location location, Product product) {
        LocationInventory inventory = new LocationInventory();
        inventory.setLocation(location);
        inventory.setProductSku(product.getSku());
        inventory.setProduct(product);
        inventory.setQuantity(0);
        // Use default minStock since Product no longer has it
        inventory.setMinStock(10);
        inventory.setMaxStock(null);
        inventory.setReorderPoint(10);
        return inventoryRepository.save(inventory);
    }
    
    /**
     * Set inventory thresholds (min, max, reorder point)
     */
    public LocationInventoryDto setThresholds(Long locationId, String productSku, 
                                              Integer minStock, Integer maxStock, Integer reorderPoint) {
        LocationInventory inventory = inventoryRepository
                .findByLocationIdAndProductSku(locationId, productSku)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));
        
        if (minStock != null) inventory.setMinStock(minStock);
        if (maxStock != null) inventory.setMaxStock(maxStock);
        if (reorderPoint != null) inventory.setReorderPoint(reorderPoint);
        
        return convertToDto(inventoryRepository.save(inventory));
    }
    
    /**
     * Update location-specific pricing for a product
     * Each location can set their own cost and sale prices
     */
    public LocationInventoryDto updatePricing(Long inventoryId, 
                                             java.math.BigDecimal cost,
                                             java.math.BigDecimal salePrice,
                                             java.math.BigDecimal wholesalePrice,
                                             Integer wholesaleMinQuantity) {
        LocationInventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + inventoryId));
        
        if (cost != null) inventory.setCost(cost);
        if (salePrice != null) inventory.setSalePrice(salePrice);
        if (wholesalePrice != null) inventory.setWholesalePrice(wholesalePrice);
        if (wholesaleMinQuantity != null) inventory.setWholesaleMinQuantity(wholesaleMinQuantity);
        
        return convertToDto(inventoryRepository.save(inventory));
    }
    
    /**
     * Convert entity to DTO
     */
    private LocationInventoryDto convertToDto(LocationInventory inventory) {
        LocationInventoryDto dto = new LocationInventoryDto();
        dto.setId(inventory.getId());
        dto.setLocationId(inventory.getLocation().getId());
        dto.setLocationName(inventory.getLocation().getName());
        dto.setLocationType(inventory.getLocation().getType().toString());
        dto.setProductSku(inventory.getProductSku());
        
        if (inventory.getProduct() != null) {
            dto.setProductId(inventory.getProduct().getId());
            dto.setProductName(inventory.getProduct().getName());
        }
        
        dto.setQuantity(inventory.getQuantity());
        dto.setMinStock(inventory.getMinStock());
        dto.setMaxStock(inventory.getMaxStock());
        dto.setReorderPoint(inventory.getReorderPoint());
        
        // Include pricing fields
        dto.setCost(inventory.getCost());
        dto.setSalePrice(inventory.getSalePrice());
        dto.setWholesalePrice(inventory.getWholesalePrice());
        dto.setWholesaleMinQuantity(inventory.getWholesaleMinQuantity());
        
        dto.setLastRestockDate(inventory.getLastRestockDate());
        dto.setLastSaleDate(inventory.getLastSaleDate());
        dto.setLastMovementId(inventory.getLastMovementId());
        dto.setLowStock(inventory.isLowStock());
        dto.setOverStock(inventory.isOverStock());
        dto.setShouldReorder(inventory.shouldReorder());
        dto.setCreatedAt(inventory.getCreatedAt());
        dto.setUpdatedAt(inventory.getUpdatedAt());
        
        return dto;
    }
}
