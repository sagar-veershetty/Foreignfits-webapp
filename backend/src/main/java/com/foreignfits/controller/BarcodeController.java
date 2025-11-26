package com.foreignfits.controller;

import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import com.foreignfits.repository.BarcodeRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.service.BarcodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/barcodes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BarcodeController {
    
    private final BarcodeService barcodeService;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final BarcodeRepository barcodeRepository;
    
    /**
     * Get all barcodes for a product at a specific location
     */
    @GetMapping("/product/{productId}/location/{locationId}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<List<Map<String, Object>>> getBarcodesForProductAtLocation(
            @PathVariable Long productId,
            @PathVariable Long locationId
    ) {
        System.out.println("====== Barcode endpoint called: productId=" + productId + ", locationId=" + locationId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    System.out.println("====== Product not found: " + productId);
                    return new RuntimeException("Product not found");
                });
        
        System.out.println("====== Product found: " + product.getSku());
        
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> {
                    System.out.println("====== Location not found: " + locationId);
                    return new RuntimeException("Location not found");
                });
        
        System.out.println("====== Location found: " + location.getName());
        
        // Use SKU-based query to find barcodes (works across different product instances)
        // Filter to only return ACTIVE barcodes for printing
        List<Barcode> barcodes = barcodeService.getBarcodesBySkuAtLocation(product.getSku(), location);
        System.out.println("====== Total barcodes found: " + barcodes.size());
        
        // Filter for ACTIVE status only (exclude SOLD, DAMAGED, LOST, etc.)
        List<Barcode> activeBarcodes = barcodes.stream()
                .filter(b -> "ACTIVE".equals(b.getStatus()))
                .collect(Collectors.toList());
        System.out.println("====== Active barcodes found: " + activeBarcodes.size());
        
        List<Map<String, Object>> barcodeData = activeBarcodes.stream().map(barcode -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", barcode.getId());
            data.put("barcodeNumber", barcode.getBarcodeNumber());
            data.put("productSku", product.getSku());
            data.put("productName", product.getName());
            data.put("locationName", location.getName());
            data.put("status", barcode.getStatus());
            data.put("remark", barcode.getRemark());
            data.put("createdAt", barcode.getCreatedAt());
            return data;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(barcodeData);
    }
    
    /**
     * Get stock count via barcodes for a product at a location
     */
    @GetMapping("/count/product/{productId}/location/{locationId}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<Map<String, Object>> getBarcodeCount(
            @PathVariable Long productId,
            @PathVariable Long locationId
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        
        Long count = barcodeService.getStockCount(product, location);
        
        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId);
        response.put("locationId", locationId);
        response.put("count", count);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Find a barcode by its number
     */
    @GetMapping("/lookup/{barcodeNumber}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products', 'create:sales')")
    public ResponseEntity<Map<String, Object>> lookupBarcode(@PathVariable String barcodeNumber) {
        Barcode barcode = barcodeService.findByBarcodeNumber(barcodeNumber);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", barcode.getId());
        data.put("barcodeNumber", barcode.getBarcodeNumber());
        data.put("status", barcode.getStatus());
        data.put("remark", barcode.getRemark());
        data.put("product", Map.of(
            "id", barcode.getProduct().getId(),
            "name", barcode.getProduct().getName(),
            "sku", barcode.getProduct().getSku(),
            "size", barcode.getProduct().getSize() != null ? barcode.getProduct().getSize() : "",
            "color", barcode.getProduct().getColor() != null ? barcode.getProduct().getColor() : ""
        ));
        data.put("currentLocation", Map.of(
            "id", barcode.getCurrentLocation().getId(),
            "name", barcode.getCurrentLocation().getName(),
            "type", barcode.getCurrentLocation().getType()
        ));
        data.put("createdAt", barcode.getCreatedAt());
        
        return ResponseEntity.ok(data);
    }
    
    /**
     * Update barcode status and remark (for marking damaged, lost, etc.)
     */
    @PatchMapping("/{barcodeId}")
    @PreAuthorize("hasAnyAuthority('edit:inventory', 'manage:inventory')")
    public ResponseEntity<Map<String, Object>> updateBarcodeRemark(
            @PathVariable Long barcodeId,
            @RequestBody Map<String, String> updates
    ) {
        String status = updates.get("status");
        String remark = updates.get("remark");
        
        Barcode barcode = barcodeService.updateBarcodeRemark(barcodeId, status, remark);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("barcodeNumber", barcode.getBarcodeNumber());
        response.put("status", barcode.getStatus());
        response.put("remark", barcode.getRemark());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get transfer status for barcodes of a product at a location
     */
    @GetMapping("/transfer-status/product/{productId}/location/{locationId}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<?> getBarcodeTransferStatus(
            @PathVariable Long productId,
            @PathVariable Long locationId
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        
        // Get all barcodes for this product at this location
        List<Barcode> barcodes = barcodeRepository.findByProductAndCurrentLocation(product, location);
        
        List<String> barcodeNumbers = barcodes.stream()
                .map(Barcode::getBarcodeNumber)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(barcodeService.getTransferStatusForBarcodes(barcodeNumbers));
    }
    
    /**
     * Reset barcode status to ACTIVE (for admin/debugging purposes)
     * Use this to fix barcodes that were incorrectly marked as SOLD
     */
    @PatchMapping("/reset/{barcodeNumber}")
    @PreAuthorize("hasAuthority('manage:inventory')")
    public ResponseEntity<Map<String, Object>> resetBarcodeStatus(@PathVariable String barcodeNumber) {
        Barcode barcode = barcodeService.findByBarcodeNumber(barcodeNumber);
        
        barcode.setStatus("ACTIVE");
        barcode.setRemark("Reset to ACTIVE by admin - " + java.time.LocalDateTime.now());
        
        barcodeRepository.save(barcode);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Barcode status reset to ACTIVE");
        response.put("barcodeNumber", barcode.getBarcodeNumber());
        response.put("status", barcode.getStatus());
        response.put("remark", barcode.getRemark());
        
        return ResponseEntity.ok(response);
    }
}
