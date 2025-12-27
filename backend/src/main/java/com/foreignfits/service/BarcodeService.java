package com.foreignfits.service;

import com.foreignfits.dto.BarcodeTransferStatusDto;
import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.TransferBarcode;
import com.foreignfits.repository.BarcodeRepository;
import com.foreignfits.repository.TransferBarcodeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class BarcodeService {
    
    @Autowired
    private BarcodeRepository barcodeRepository;
    
    @Autowired
    private TransferBarcodeRepository transferBarcodeRepository;
    
    @Autowired
    @Lazy
    private BarcodeHistoryService barcodeHistoryService;
    
    /**
     * Generate unique barcodes for a product at a location (legacy method - uses null prices)
     * @param product The product to generate barcodes for
     * @param location The initial location for the barcodes
     * @param quantity Number of barcodes to generate
     * @return List of generated barcodes
     */
    @Transactional
    public List<Barcode> generateBarcodes(Product product, Location location, int quantity) {
        return generateBarcodes(product, location, quantity, null, null);
    }
    
    /**
     * Generate unique barcodes for a product at a location with individual pricing
     * @param product The product to generate barcodes for
     * @param location The initial location for the barcodes
     * @param quantity Number of barcodes to generate
     * @param purchasePrice Individual purchase price for each barcode (can be null)
     * @param salePrice Individual sale price for each barcode (can be null)
     * @return List of generated barcodes
     */
    @Transactional
    public List<Barcode> generateBarcodes(Product product, Location location, int quantity, 
                                          Double purchasePrice, Double salePrice) {
        List<Barcode> barcodes = new ArrayList<>();
        
        for (int i = 0; i < quantity; i++) {
            String barcodeNumber = generateUniqueBarcodeNumber(product);
            Barcode barcode = new Barcode(barcodeNumber, product, location, purchasePrice, salePrice);
            Barcode savedBarcode = barcodeRepository.save(barcode);
            barcodes.add(savedBarcode);
            
            // Record barcode creation in history
            try {
                barcodeHistoryService.recordHistory(
                    savedBarcode,
                    "CREATED",
                    location,
                    null,
                    null,
                    "MANUAL",
                    null,
                    "Barcode created for product " + product.getName(),
                    "System"
                );
            } catch (Exception e) {
                log.error("Failed to record barcode history for creation", e);
            }
        }
        
        return barcodes;
    }
    
    /**
     * Generate a unique barcode number for a product
     * Format: SKU(4 chars)-UUID(5 chars) = 10 chars total
     */
    private String generateUniqueBarcodeNumber(Product product) {
        String barcodeNumber;
        int attempts = 0;
        
        do {
            // Generate barcode: First 4 chars of SKU + 5 random characters = 10 chars total
            String skuPrefix = product.getSku().length() >= 4 ? 
                product.getSku().substring(0, 4).toUpperCase() : 
                String.format("%-4s", product.getSku()).replace(' ', 'X').toUpperCase();
            String uniqueId = UUID.randomUUID().toString().replace("-", "").substring(0, 5).toUpperCase();
            barcodeNumber = skuPrefix + uniqueId;
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
            Barcode savedBarcode = barcodeRepository.save(barcode);
            transferredBarcodes.add(savedBarcode);
            
            // Record barcode transfer in history
            try {
                barcodeHistoryService.recordHistory(
                    savedBarcode,
                    "TRANSFERRED",
                    toLocation,
                    fromLocation,
                    toLocation,
                    "STOCK_MOVEMENT",
                    null,
                    String.format("Transferred from %s to %s", fromLocation.getName(), toLocation.getName()),
                    "System"
                );
            } catch (Exception e) {
                log.error("Failed to record barcode history for transfer", e);
            }
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
     * Update individual barcode price
     * @param barcodeId The barcode ID to update
     * @param purchasePrice New purchase price (null to keep existing)
     * @param salePrice New sale price (null to keep existing)
     * @return Updated barcode
     */
    @Transactional
    public Barcode updateBarcodePrice(Long barcodeId, Double purchasePrice, Double salePrice, Double originalPrice) {
        Barcode barcode = barcodeRepository.findById(barcodeId)
            .orElseThrow(() -> new RuntimeException("Barcode not found with id: " + barcodeId));
        
        if (purchasePrice != null) {
            barcode.setPurchasePrice(purchasePrice);
        }
        if (salePrice != null) {
            barcode.setSalePrice(salePrice);
        }
        if (originalPrice != null) {
            barcode.setOriginalPrice(originalPrice);
        }
        
        return barcodeRepository.save(barcode);
    }
    
    // Overloaded method for backward compatibility
    @Transactional
    public Barcode updateBarcodePrice(Long barcodeId, Double purchasePrice, Double salePrice) {
        return updateBarcodePrice(barcodeId, purchasePrice, salePrice, null);
    }
    
    /**
     * Update multiple barcode prices at once
     * @param barcodeIds List of barcode IDs to update
     * @param purchasePrice Purchase price to apply to all (null to skip)
     * @param salePrice Sale price to apply to all (null to skip)
     * @return List of updated barcodes
     */
    @Transactional
    public List<Barcode> updateBarcodePricesBulk(List<Long> barcodeIds, Double purchasePrice, Double salePrice) {
        List<Barcode> updatedBarcodes = new ArrayList<>();
        
        for (Long barcodeId : barcodeIds) {
            try {
                Barcode updated = updateBarcodePrice(barcodeId, purchasePrice, salePrice);
                updatedBarcodes.add(updated);
            } catch (Exception e) {
                log.error("Failed to update price for barcode ID: " + barcodeId, e);
            }
        }
        
        return updatedBarcodes;
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
    
    public List<BarcodeTransferStatusDto> getTransferStatusForBarcodes(List<String> barcodeNumbers) {
        List<BarcodeTransferStatusDto> statuses = new ArrayList<>();
        
        for (String barcodeNumber : barcodeNumbers) {
            Optional<Barcode> barcodeOpt = barcodeRepository.findByBarcodeNumber(barcodeNumber);
            
            if (barcodeOpt.isEmpty()) {
                continue; // Skip non-existent barcodes
            }
            
            Barcode barcode = barcodeOpt.get();
            BarcodeTransferStatusDto dto = new BarcodeTransferStatusDto();
            dto.setBarcodeNumber(barcodeNumber);
            dto.setCurrentLocation(barcode.getCurrentLocation() != null ? 
                barcode.getCurrentLocation().getName() : null);
            
            // Check if barcode is SOLD
            if ("SOLD".equals(barcode.getStatus())) {
                dto.setStatus("SOLD");
                statuses.add(dto);
                continue;
            }
            
            // Check if barcode is in a pending transfer
            Optional<TransferBarcode> pendingTransferOpt = 
                transferBarcodeRepository.findPendingTransferByBarcodeNumber(barcodeNumber);
            
            if (pendingTransferOpt.isPresent()) {
                TransferBarcode transferBarcode = pendingTransferOpt.get();
                dto.setStatus("PENDING_TRANSFER");
                dto.setPendingTransferId(transferBarcode.getTransfer().getId());
                dto.setPendingTransferFrom(transferBarcode.getTransfer().getFromLocation().getName());
                dto.setPendingTransferTo(transferBarcode.getTransfer().getToLocation().getName());
            } else if ("ACTIVE".equals(barcode.getStatus())) {
                dto.setStatus("AVAILABLE");
            } else {
                dto.setStatus("TRANSFERRED"); // For any other status
            }
            
            statuses.add(dto);
        }
        
        return statuses;
    }
}