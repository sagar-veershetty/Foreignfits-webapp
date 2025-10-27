package com.foreignfits.controller;

import com.foreignfits.dto.LocationInventoryDto;
import com.foreignfits.service.LocationInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class LocationInventoryController {
    
    private final LocationInventoryService inventoryService;
    
    /**
     * Get all inventory across all locations (Admin only)
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }
    
    /**
     * Get all inventory at a specific location
     */
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getLocationInventory(@PathVariable Long locationId) {
        return ResponseEntity.ok(inventoryService.getLocationInventory(locationId));
    }
    
    /**
     * Get inventory for a specific product at a specific location
     */
    @GetMapping("/location/{locationId}/product/{productSku}")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<LocationInventoryDto> getInventory(
            @PathVariable Long locationId,
            @PathVariable String productSku) {
        return ResponseEntity.ok(inventoryService.getInventory(locationId, productSku));
    }
    
    /**
     * Get all locations where a product is available
     */
    @GetMapping("/product/{productSku}/locations")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getProductLocations(@PathVariable String productSku) {
        return ResponseEntity.ok(inventoryService.getProductLocations(productSku));
    }
    
    /**
     * Get low stock items at a location
     */
    @GetMapping("/location/{locationId}/low-stock")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getLowStockItems(@PathVariable Long locationId) {
        return ResponseEntity.ok(inventoryService.getLowStockItems(locationId));
    }
    
    /**
     * Get items that need reordering at a location
     */
    @GetMapping("/location/{locationId}/reorder")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getReorderItems(@PathVariable Long locationId) {
        return ResponseEntity.ok(inventoryService.getReorderItems(locationId));
    }
    
    /**
     * Get total quantity of a product across all locations
     */
    @GetMapping("/product/{productSku}/total")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<Map<String, Integer>> getTotalQuantity(@PathVariable String productSku) {
        Integer total = inventoryService.getTotalQuantity(productSku);
        Map<String, Integer> response = new HashMap<>();
        response.put("totalQuantity", total);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Check stock availability
     */
    @GetMapping("/location/{locationId}/product/{productSku}/available")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @PathVariable Long locationId,
            @PathVariable String productSku,
            @RequestParam Integer quantity) {
        boolean available = inventoryService.hasAvailableStock(locationId, productSku, quantity);
        Map<String, Boolean> response = new HashMap<>();
        response.put("available", available);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update inventory thresholds (min, max, reorder point)
     */
    @PutMapping("/location/{locationId}/product/{productSku}/thresholds")
    @PreAuthorize("hasAuthority('manage:inventory')")
    public ResponseEntity<LocationInventoryDto> setThresholds(
            @PathVariable Long locationId,
            @PathVariable String productSku,
            @RequestBody Map<String, Integer> thresholds) {
        
        Integer minStock = thresholds.get("minStock");
        Integer maxStock = thresholds.get("maxStock");
        Integer reorderPoint = thresholds.get("reorderPoint");
        
        LocationInventoryDto updated = inventoryService.setThresholds(
                locationId, productSku, minStock, maxStock, reorderPoint);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Update location-specific pricing for inventory
     */
    @PutMapping("/{id}/pricing")
    @PreAuthorize("hasAuthority('manage:inventory')")
    public ResponseEntity<LocationInventoryDto> updatePricing(
            @PathVariable Long id,
            @RequestBody Map<String, Object> pricing) {
        
        java.math.BigDecimal cost = pricing.get("cost") != null ? 
            new java.math.BigDecimal(pricing.get("cost").toString()) : null;
        java.math.BigDecimal salePrice = pricing.get("salePrice") != null ? 
            new java.math.BigDecimal(pricing.get("salePrice").toString()) : null;
        java.math.BigDecimal wholesalePrice = pricing.get("wholesalePrice") != null ? 
            new java.math.BigDecimal(pricing.get("wholesalePrice").toString()) : null;
        Integer wholesaleMinQuantity = pricing.get("wholesaleMinQuantity") != null ? 
            (Integer) pricing.get("wholesaleMinQuantity") : null;
        
        LocationInventoryDto updated = inventoryService.updatePricing(
                id, cost, salePrice, wholesalePrice, wholesaleMinQuantity);
        return ResponseEntity.ok(updated);
    }
}
