package com.foreignfits.service;

import com.foreignfits.dto.*;
import com.foreignfits.dto.request.CreateStockTransferRequest;
import com.foreignfits.entity.*;
import com.foreignfits.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class StockTransferService {
    
    private final StockTransferRepository stockTransferRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    
    /**
     * Create a new stock transfer request
     */
    public StockTransferDto createTransfer(CreateStockTransferRequest request, Long requestedById) {
        // Validate user
        User requestedBy = userRepository.findById(requestedById)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Validate locations
        Location fromLocation = locationRepository.findById(request.getFromLocationId())
                .orElseThrow(() -> new RuntimeException("From location not found"));
        
        Location toLocation = locationRepository.findById(request.getToLocationId())
                .orElseThrow(() -> new RuntimeException("To location not found"));
        
        // Validate transfer is between different locations
        if (fromLocation.getId().equals(toLocation.getId())) {
            throw new RuntimeException("Cannot transfer to the same location");
        }
        
        // Products are now organization-wide - check inventory at source location instead
        // Check inventory at source location
        LocationInventory sourceInventory = locationInventoryRepository
                .findByLocationIdAndProductSku(fromLocation.getId(), product.getSku())
                .orElseThrow(() -> new RuntimeException("Product not found in source location inventory"));
        
        if (sourceInventory.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock at source location. Available: " + sourceInventory.getQuantity());
        }
        
        // Create transfer
        StockTransfer transfer = new StockTransfer();
        transfer.setProduct(product);
        transfer.setFromLocation(fromLocation);
        transfer.setToLocation(toLocation);
        transfer.setQuantity(request.getQuantity());
        transfer.setReason(request.getReason());
        transfer.setReference(request.getReference());
        transfer.setNotes(request.getNotes());
        transfer.setRequestedBy(requestedBy);
        transfer.setStatus(StockTransfer.TransferStatus.PENDING);
        
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);
        
        // Create a SINGLE TRANSFER movement (simplified approach)
        // This one movement will update both locations when approved
        
        // Create TRANSFER movement (PENDING) - will be visible to destination only
        StockMovement transferMovement = new StockMovement();
        transferMovement.setProduct(product);
        transferMovement.setType(StockMovement.MovementType.TRANSFER);
        transferMovement.setQuantity(request.getQuantity());
        transferMovement.setPreviousStock(sourceInventory.getQuantity());
        transferMovement.setNewStock(sourceInventory.getQuantity() - request.getQuantity());
        transferMovement.setReason("Transfer from " + fromLocation.getName() + " to " + toLocation.getName() + ": " + request.getReason());
        transferMovement.setReference("TRANSFER-" + savedTransfer.getId());
        transferMovement.setTransfer(savedTransfer); // Links to transfer with from/to locations
        transferMovement.setCreatedBy(requestedBy.getEmail());
        transferMovement.setStatus(StockMovement.MovementStatus.PENDING); // Requires approval from destination
        stockMovementRepository.save(transferMovement);
        
        // NOTE: Product and inventory at destination will be created ONLY when transfer is approved
        // This prevents showing products with 0 stock at warehouse before approval
        
        // Eagerly initialize all lazy relationships before converting to DTO
        // Product no longer has location - skip that initialization
        if (savedTransfer.getProduct().getImageUrls() != null) {
            savedTransfer.getProduct().getImageUrls().size();
        }
        savedTransfer.getFromLocation().getName();
        savedTransfer.getToLocation().getName();
        savedTransfer.getRequestedBy().getName();
        
        return convertToDto(savedTransfer);
    }
    
    /**
     * Cancel a transfer
     */
    public StockTransferDto cancelTransfer(Long transferId, Long cancelledById) {
        userRepository.findById(cancelledById)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));
        
        if (transfer.getStatus() == StockTransfer.TransferStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed transfer");
        }
        
        if (transfer.getStatus() == StockTransfer.TransferStatus.CANCELLED) {
            throw new RuntimeException("Transfer is already cancelled");
        }
        
        transfer.setStatus(StockTransfer.TransferStatus.CANCELLED);
        
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);
        
        return convertToDto(savedTransfer);
    }
    
    /**
     * Get all transfers
     */
    public List<StockTransferDto> getAllTransfers() {
        return stockTransferRepository.findAllOrderByRequestedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get pending transfers
     */
    public List<StockTransferDto> getPendingTransfers() {
        return stockTransferRepository.findPendingTransfersOrderByRequestedAt().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get transfers by location
     */
    public List<StockTransferDto> getTransfersByLocation(Long locationId) {
        return stockTransferRepository.findByLocationId(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get transfers by status
     */
    public List<StockTransferDto> getTransfersByStatus(StockTransfer.TransferStatus status) {
        return stockTransferRepository.findByStatus(status).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert entity to DTO
     */
    private StockTransferDto convertToDto(StockTransfer transfer) {
        StockTransferDto dto = new StockTransferDto();
        dto.setId(transfer.getId());
        dto.setQuantity(transfer.getQuantity());
        dto.setReason(transfer.getReason());
        dto.setReference(transfer.getReference());
        dto.setStatus(transfer.getStatus());
        dto.setRequestedAt(transfer.getRequestedAt());
        dto.setApprovedAt(transfer.getApprovedAt());
        dto.setCompletedAt(transfer.getCompletedAt());
        dto.setNotes(transfer.getNotes());
        dto.setUpdatedAt(transfer.getUpdatedAt());
        
        // Convert product
        if (transfer.getProduct() != null) {
            ProductDto productDto = new ProductDto();
            Product product = transfer.getProduct();
            productDto.setId(product.getId());
            productDto.setName(product.getName());
            productDto.setSku(product.getSku());
            // barcode removed - use Barcode table
            productDto.setCategory(product.getCategory());
            productDto.setSize(product.getSize());
            productDto.setColor(product.getColor());
            // Pricing moved to LocationInventory
            productDto.setPrice(null);
            productDto.setCost(null);
            productDto.setWholesalePrice(null);
            productDto.setWholesaleMinQuantity(null);
            
            // Stock not location-specific anymore - set to 0 (UI should query LocationInventory)
            productDto.setStock(0);
            
            productDto.setMinStock(0); // Use LocationInventory for minStock
            productDto.setDescription(product.getDescription());
            productDto.setCreatedAt(product.getCreatedAt());
            productDto.setUpdatedAt(product.getUpdatedAt());
            
            // Safely handle lazy-loaded collections and relationships
            try {
                productDto.setImageUrls(product.getImageUrls());
            } catch (Exception e) {
                productDto.setImageUrls(null);
            }
            
            // Product no longer has location
            productDto.setLocation(null);
            
            dto.setProduct(productDto);
        }
        
        // Convert locations
        if (transfer.getFromLocation() != null) {
            dto.setFromLocation(convertLocationToDto(transfer.getFromLocation()));
        }
        if (transfer.getToLocation() != null) {
            dto.setToLocation(convertLocationToDto(transfer.getToLocation()));
        }
        
        // Convert users
        if (transfer.getRequestedBy() != null) {
            dto.setRequestedBy(convertUserToDto(transfer.getRequestedBy()));
        }
        if (transfer.getApprovedBy() != null) {
            dto.setApprovedBy(convertUserToDto(transfer.getApprovedBy()));
        }
        if (transfer.getCompletedBy() != null) {
            dto.setCompletedBy(convertUserToDto(transfer.getCompletedBy()));
        }
        
        return dto;
    }
    
    private LocationDto convertLocationToDto(Location location) {
        LocationDto dto = new LocationDto();
        dto.setId(location.getId());
        dto.setName(location.getName());
        dto.setType(location.getType());
        dto.setAddress(location.getAddress());
        dto.setCity(location.getCity());
        dto.setState(location.getState());
        dto.setZipCode(location.getZipCode());
        dto.setPhone(location.getPhone());
        dto.setManager(location.getManager());
        dto.setCapacity(location.getCapacity());
        dto.setIsActive(location.getIsActive());
        return dto;
    }
    
    private UserDto convertUserToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }
}
