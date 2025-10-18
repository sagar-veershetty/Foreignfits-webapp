package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.StockMovementDto;
import com.foreignfits.dto.request.StockAdjustmentRequest;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.StockMovement;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.repository.StockMovementRepository;
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
    
    public StockMovementDto adjustStock(StockAdjustmentRequest request, String createdBy) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));
        
        int previousStock = product.getStock();
        int newStock = calculateNewStock(previousStock, request);
        
        // Validate new stock
        if (newStock < 0) {
            throw new RuntimeException("Stock cannot be negative");
        }
        
        // Update product stock
        product.setStock(newStock);
        productRepository.save(product);
        
        // Create stock movement record
        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setType(StockMovement.MovementType.ADJUSTMENT);
        movement.setQuantity(calculateQuantityChange(previousStock, newStock, request.getAdjustmentType()));
        movement.setPreviousStock(previousStock);
        movement.setNewStock(newStock);
        movement.setReason(request.getReason());
        movement.setReference(request.getReference());
        movement.setLocation(product.getLocation());
        movement.setCreatedBy(createdBy);
        
        StockMovement savedMovement = stockMovementRepository.save(movement);
        return convertToDto(savedMovement);
    }
    
    public List<StockMovementDto> getStockMovements() {
        return stockMovementRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
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
            productDto.setStock(product.getStock());
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
        
        if (movement.getLocation() != null) {
            LocationDto locationDto = new LocationDto();
            locationDto.setId(movement.getLocation().getId());
            locationDto.setName(movement.getLocation().getName());
            locationDto.setType(movement.getLocation().getType());
            dto.setLocation(locationDto);
        }
        
        return dto;
    }
}