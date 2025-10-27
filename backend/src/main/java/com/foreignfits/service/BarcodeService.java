package com.foreignfits.service;

import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import com.foreignfits.repository.BarcodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BarcodeService {
    
    @Autowired
    private BarcodeRepository barcodeRepository;
    
    /**
     * Generate unique barcodes for a product at a location
     * @param product The product to generate barcodes for
     * @param location The initial location for the barcodes
     * @param quantity Number of barcodes to generate
     * @return List of generated barcodes
     */
    @Transactional
    public List<Barcode> generateBarcodes(Product product, Location location, int quantity) {
        List<Barcode> barcodes = new ArrayList<>();
        
        for (int i = 0; i < quantity; i++) {
            String barcodeNumber = generateUniqueBarcodeNumber(product);
            Barcode barcode = new Barcode(barcodeNumber, product, location);
            barcodes.add(barcodeRepository.save(barcode));
        }
        
        return barcodes;
    }
    
    /**
     * Generate a unique barcode number for a product
     * Format: SKU-UUID(8 chars)
     */
    private String generateUniqueBarcodeNumber(Product product) {
        String barcodeNumber;
        int attempts = 0;
        
        do {
            // Generate barcode: SKU + 8 random characters
            String uniqueId = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            barcodeNumber = product.getSku() + "-" + uniqueId;
            attempts++;
            
            if (attempts > 100) {
                throw new RuntimeException("Failed to generate unique barcode after 100 attempts");
            }
        } while (barcodeRepository.existsByBarcodeNumber(barcodeNumber));
        
        return barcodeNumber;
    }
    
    /**
     * Get count of barcodes for a product at a location
     */
    public Long getStockCount(Product product, Location location) {
        return barcodeRepository.countByProductAndCurrentLocation(product, location);
    }
    
    /**
     * Transfer barcodes from one location to another
     * @param product The product whose barcodes to transfer
     * @param fromLocation Source location
     * @param toLocation Destination location
     * @param quantity Number of units to transfer
     * @return List of transferred barcodes
     */
    @Transactional
    public List<Barcode> transferBarcodes(Product product, Location fromLocation, Location toLocation, int quantity) {
        // Find barcodes at source location (FIFO - oldest first)
        List<Barcode> availableBarcodes = barcodeRepository.findBarcodesForTransfer(product, fromLocation);
        
        if (availableBarcodes.size() < quantity) {
            throw new RuntimeException(
                String.format("Insufficient stock at %s. Available: %d, Requested: %d", 
                    fromLocation.getName(), availableBarcodes.size(), quantity)
            );
        }
        
        // Transfer the required quantity of barcodes
        List<Barcode> transferredBarcodes = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            Barcode barcode = availableBarcodes.get(i);
            barcode.setCurrentLocation(toLocation);
            transferredBarcodes.add(barcodeRepository.save(barcode));
        }
        
        return transferredBarcodes;
    }
    
    /**
     * Get all barcodes for a product at a location
     */
    public List<Barcode> getBarcodesAtLocation(Product product, Location location) {
        return barcodeRepository.findByProductAndCurrentLocation(product, location);
    }
    
    /**
     * Get all barcodes for a product (by SKU) at a location
     * This works across different product instances with the same SKU
     */
    public List<Barcode> getBarcodesBySkuAtLocation(String sku, Location location) {
        return barcodeRepository.findByProductSkuAndLocation(sku, location);
    }
    
    /**
     * Find a barcode by its number
     */
    public Barcode findByBarcodeNumber(String barcodeNumber) {
        return barcodeRepository.findByBarcodeNumber(barcodeNumber)
            .orElseThrow(() -> new RuntimeException("Barcode not found: " + barcodeNumber));
    }
    
    /**
     * Update barcode status and remark
     */
    @Transactional
    public Barcode updateBarcodeRemark(Long barcodeId, String status, String remark) {
        Barcode barcode = barcodeRepository.findById(barcodeId)
            .orElseThrow(() -> new RuntimeException("Barcode not found with id: " + barcodeId));
        
        if (status != null) {
            barcode.setStatus(status);
        }
        if (remark != null) {
            barcode.setRemark(remark);
        }
        
        return barcodeRepository.save(barcode);
    }
    
    /**
     * Mark N barcodes as SOLD for a product at a location (FIFO order)
     * Called when a sale is completed to track individual barcode status
     * 
     * @param sku Product SKU
     * @param location Location where sale occurred
     * @param quantity Number of barcodes to mark as sold
     * @return List of barcodes that were marked as SOLD
     */
    @Transactional
    public List<Barcode> markBarcodesAsSold(String sku, Location location, int quantity) {
        // Find ACTIVE barcodes at this location (FIFO - oldest first)
        List<Barcode> activeBarcodes = barcodeRepository.findByProductSkuAndLocation(sku, location).stream()
            .filter(b -> "ACTIVE".equals(b.getStatus()))
            .sorted((b1, b2) -> b1.getCreatedAt().compareTo(b2.getCreatedAt())) // FIFO
            .limit(quantity)
            .toList();
        
        if (activeBarcodes.size() < quantity) {
            System.err.println("Warning: Only " + activeBarcodes.size() + " active barcodes found, but " + 
                quantity + " were requested to be marked as SOLD");
        }
        
        // Mark each barcode as SOLD
        List<Barcode> soldBarcodes = new ArrayList<>();
        for (Barcode barcode : activeBarcodes) {
            barcode.setStatus("SOLD");
            barcode.setRemark("Sold - " + java.time.LocalDateTime.now());
            soldBarcodes.add(barcodeRepository.save(barcode));
        }
        
        return soldBarcodes;
    }
}
