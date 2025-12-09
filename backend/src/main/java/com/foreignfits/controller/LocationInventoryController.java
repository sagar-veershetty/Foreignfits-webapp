package com.foreignfits.controller;

import com.foreignfits.dto.LocationInventoryDto;
import com.foreignfits.entity.LocationInventory;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.User;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.service.LocationInventoryService;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class LocationInventoryController {
    
    private final LocationInventoryService inventoryService;
    private final UserService userService;
    private final LocationInventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    
    /**
     * Get all inventory across all locations (Admin only)
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('view:inventory')")
    public ResponseEntity<List<LocationInventoryDto>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }
    
    /**
     * Public endpoint: Get product catalog for marketing/promotional purposes
     * Returns basic product information without sensitive data like cost
     * No authentication required
     */
    @GetMapping("/public/catalog")
    public ResponseEntity<List<Map<String, Object>>> getPublicCatalog() {
        List<LocationInventoryDto> allInventory = inventoryService.getAllInventory();
        
        // Get all unique product IDs
        Map<Long, Product> productCache = new HashMap<>();
        List<Long> productIds = allInventory.stream()
            .map(LocationInventoryDto::getProductId)
            .distinct()
            .toList();
        
        // Fetch all products at once
        productRepository.findAllById(productIds).forEach(p -> productCache.put(p.getId(), p));
        
        // Transform to public catalog format - remove sensitive information
        List<Map<String, Object>> catalog = allInventory.stream()
            .filter(inv -> inv.getQuantity() > 0) // Only show in-stock items
            .map(inv -> {
                Map<String, Object> item = new HashMap<>();
                Product product = productCache.get(inv.getProductId());
                
                item.put("productSku", inv.getProductSku());
                item.put("productName", inv.getProductName());
                item.put("salePrice", inv.getSalePrice());
                item.put("category", product != null ? product.getCategory() : "general");
                item.put("size", product != null ? product.getSize() : "");
                item.put("color", product != null ? product.getColor() : "");
                item.put("available", inv.getQuantity() > 0);
                
                // Include product images if available
                if (product != null && product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
                    item.put("imageUrls", product.getImageUrls());
                }
                
                // Optionally include wholesale pricing if available
                if (inv.getWholesalePrice() != null && inv.getWholesaleMinQuantity() != null) {
                    item.put("wholesalePrice", inv.getWholesalePrice());
                    item.put("wholesaleMinQuantity", inv.getWholesaleMinQuantity());
                }
                return item;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(catalog);
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
     * SALES users can only update pricing for their assigned location
     * ADMIN and WAREHOUSE can update pricing for any location
     */
    @PutMapping("/{id}/pricing")
    @PreAuthorize("hasAuthority('manage:inventory')")
    public ResponseEntity<?> updatePricing(
            @PathVariable Long id,
            @RequestBody Map<String, Object> pricing,
            org.springframework.security.core.Authentication authentication) {
        
        // Check if user has permission to update this inventory location
        String email = authentication.getName();
        User user = userService.getUserEntityByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get the inventory to check its location
        LocationInventory inventory = inventoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Inventory not found"));
        
        // SALES users can only update inventory at their assigned location
        if (user.getRole() == User.UserRole.SALES) {
            if (user.getLocation() == null || !user.getLocation().getId().equals(inventory.getLocation().getId())) {
                return ResponseEntity.status(403)
                    .body(Map.of("error", "You can only update pricing for your assigned location"));
            }
        }
        
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
