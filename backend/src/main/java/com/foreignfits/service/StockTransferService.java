package com.foreignfits.service;

import com.foreignfits.dto.*;
import com.foreignfits.dto.request.CreateStockTransferRequest;
import com.foreignfits.entity.*;
import com.foreignfits.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
        
        // Check if product belongs to fromLocation and has sufficient stock
        if (!product.getLocation().getId().equals(fromLocation.getId())) {
            throw new RuntimeException("Product does not belong to the source location");
        }
        
        if (product.getStock() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock at source location. Available: " + product.getStock());
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
        
        // Eagerly initialize all lazy relationships before converting to DTO
        savedTransfer.getProduct().getLocation().getName();
        if (savedTransfer.getProduct().getImageUrls() != null) {
            savedTransfer.getProduct().getImageUrls().size();
        }
        savedTransfer.getFromLocation().getName();
        savedTransfer.getToLocation().getName();
        savedTransfer.getRequestedBy().getName();
        
        return convertToDto(savedTransfer);
    }
    
    /**
     * Approve a pending transfer (changes status to IN_TRANSIT)
     */
    public StockTransferDto approveTransfer(Long transferId, Long approvedById) {
        User approvedBy = userRepository.findById(approvedById)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));
        
        if (transfer.getStatus() != StockTransfer.TransferStatus.PENDING) {
            throw new RuntimeException("Only pending transfers can be approved");
        }
        
        transfer.setStatus(StockTransfer.TransferStatus.IN_TRANSIT);
        transfer.setApprovedBy(approvedBy);
        transfer.setApprovedAt(LocalDateTime.now());
        
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);
        
        // Eagerly initialize all lazy relationships before converting to DTO
        savedTransfer.getProduct().getLocation().getName();
        if (savedTransfer.getProduct().getImageUrls() != null) {
            savedTransfer.getProduct().getImageUrls().size();
        }
        savedTransfer.getFromLocation().getName();
        savedTransfer.getToLocation().getName();
        savedTransfer.getRequestedBy().getName();
        if (savedTransfer.getApprovedBy() != null) {
            savedTransfer.getApprovedBy().getName();
        }
        
        return convertToDto(savedTransfer);
    }
    
    /**
     * Complete a transfer (moves stock and creates stock movements)
     */
    public StockTransferDto completeTransfer(Long transferId, Long completedById) {
        User completedBy = userRepository.findById(completedById)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));
        
        if (transfer.getStatus() == StockTransfer.TransferStatus.COMPLETED) {
            throw new RuntimeException("Transfer is already completed");
        }
        
        if (transfer.getStatus() == StockTransfer.TransferStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled transfer");
        }
        
        Product product = transfer.getProduct();
        
        // Check if product still has sufficient stock at source
        if (product.getStock() < transfer.getQuantity()) {
            throw new RuntimeException("Insufficient stock at source location. Available: " + product.getStock());
        }
        
        // Deduct stock from source location
        int previousStock = product.getStock();
        int newStock = previousStock - transfer.getQuantity();
        product.setStock(newStock);
        productRepository.save(product);
        
        // Create stock movement for source (deduction)
        StockMovement outMovement = new StockMovement();
        outMovement.setProduct(product);
        outMovement.setType(StockMovement.MovementType.TRANSFER_OUT);
        outMovement.setQuantity(-transfer.getQuantity());
        outMovement.setPreviousStock(previousStock);
        outMovement.setNewStock(newStock);
        outMovement.setReason("Transfer to " + transfer.getToLocation().getName() + ": " + transfer.getReason());
        outMovement.setReference("TRANSFER-" + transfer.getId());
        outMovement.setLocation(transfer.getFromLocation());
        outMovement.setCreatedBy(completedBy.getName());
        stockMovementRepository.save(outMovement);
        
        // Check if product exists at destination location
        Product destinationProduct = productRepository.findByLocationIdAndSku(
                transfer.getToLocation().getId(), 
                product.getSku()
        ).orElse(null);
        
        if (destinationProduct == null) {
            // Create new product entry at destination location
            destinationProduct = new Product();
            destinationProduct.setName(product.getName());
            destinationProduct.setSku(product.getSku());
            // Note: Barcode is set to NULL to avoid unique constraint violation
            // Each location maintains separate product records with unique barcodes
            destinationProduct.setBarcode(null);
            destinationProduct.setCategory(product.getCategory());
            destinationProduct.setSize(product.getSize());
            destinationProduct.setColor(product.getColor());
            destinationProduct.setPrice(product.getPrice());
            destinationProduct.setCost(product.getCost());
            destinationProduct.setWholesalePrice(product.getWholesalePrice());
            destinationProduct.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
            destinationProduct.setStock(transfer.getQuantity());
            destinationProduct.setMinStock(product.getMinStock());
            destinationProduct.setDescription(product.getDescription());
            // Create a new copy of imageUrls to avoid shared collection references
            if (product.getImageUrls() != null) {
                destinationProduct.setImageUrls(new ArrayList<>(product.getImageUrls()));
            }
            destinationProduct.setLocation(transfer.getToLocation());
            destinationProduct = productRepository.save(destinationProduct);
            
            // Create stock movement for new product at destination
            StockMovement inMovement = new StockMovement();
            inMovement.setProduct(destinationProduct);
            inMovement.setType(StockMovement.MovementType.TRANSFER_IN);
            inMovement.setQuantity(transfer.getQuantity());
            inMovement.setPreviousStock(0);
            inMovement.setNewStock(transfer.getQuantity());
            inMovement.setReason("Transfer from " + transfer.getFromLocation().getName() + ": " + transfer.getReason());
            inMovement.setReference("TRANSFER-" + transfer.getId());
            inMovement.setLocation(transfer.getToLocation());
            inMovement.setCreatedBy(completedBy.getName());
            stockMovementRepository.save(inMovement);
        } else {
            // Add stock to existing product at destination
            int destPreviousStock = destinationProduct.getStock();
            int destNewStock = destPreviousStock + transfer.getQuantity();
            destinationProduct.setStock(destNewStock);
            productRepository.save(destinationProduct);
            
            // Create stock movement for destination (addition)
            StockMovement inMovement = new StockMovement();
            inMovement.setProduct(destinationProduct);
            inMovement.setType(StockMovement.MovementType.TRANSFER_IN);
            inMovement.setQuantity(transfer.getQuantity());
            inMovement.setPreviousStock(destPreviousStock);
            inMovement.setNewStock(destNewStock);
            inMovement.setReason("Transfer from " + transfer.getFromLocation().getName() + ": " + transfer.getReason());
            inMovement.setReference("TRANSFER-" + transfer.getId());
            inMovement.setLocation(transfer.getToLocation());
            inMovement.setCreatedBy(completedBy.getName());
            stockMovementRepository.save(inMovement);
        }
        
        // Update transfer status
        transfer.setStatus(StockTransfer.TransferStatus.COMPLETED);
        transfer.setCompletedBy(completedBy);
        transfer.setCompletedAt(LocalDateTime.now());
        
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);
        
        // Eagerly initialize all lazy relationships before converting to DTO
        savedTransfer.getProduct().getLocation().getName(); // Force load
        if (savedTransfer.getProduct().getImageUrls() != null) {
            savedTransfer.getProduct().getImageUrls().size(); // Force load
        }
        savedTransfer.getFromLocation().getName();
        savedTransfer.getToLocation().getName();
        savedTransfer.getRequestedBy().getName();
        if (savedTransfer.getApprovedBy() != null) {
            savedTransfer.getApprovedBy().getName();
        }
        if (savedTransfer.getCompletedBy() != null) {
            savedTransfer.getCompletedBy().getName();
        }
        
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
     * Create and immediately complete a transfer (simplified workflow for admin)
     * This combines create, approve, and complete into one operation
     */
    @Transactional
    public StockTransferDto createAndCompleteTransfer(CreateStockTransferRequest request, Long userId) {
        // Create the transfer
        StockTransferDto transferDto = createTransfer(request, userId);
        
        // Approve it
        transferDto = approveTransfer(transferDto.getId(), userId);
        
        // Complete it (moves the stock)
        transferDto = completeTransfer(transferDto.getId(), userId);
        
        // Reload the transfer with all relationships to avoid serialization issues
        StockTransfer reloadedTransfer = stockTransferRepository.findById(transferDto.getId())
                .orElseThrow(() -> new RuntimeException("Transfer not found"));
        
        // Eagerly initialize all lazy relationships
        reloadedTransfer.getProduct().getLocation().getName();
        if (reloadedTransfer.getProduct().getImageUrls() != null) {
            reloadedTransfer.getProduct().getImageUrls().size();
        }
        reloadedTransfer.getFromLocation().getName();
        reloadedTransfer.getToLocation().getName();
        reloadedTransfer.getRequestedBy().getName();
        if (reloadedTransfer.getApprovedBy() != null) {
            reloadedTransfer.getApprovedBy().getName();
        }
        if (reloadedTransfer.getCompletedBy() != null) {
            reloadedTransfer.getCompletedBy().getName();
        }
        
        return convertToDto(reloadedTransfer);
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
            productDto.setBarcode(product.getBarcode());
            productDto.setCategory(product.getCategory());
            productDto.setSize(product.getSize());
            productDto.setColor(product.getColor());
            productDto.setPrice(product.getPrice());
            productDto.setCost(product.getCost());
            productDto.setWholesalePrice(product.getWholesalePrice());
            productDto.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
            productDto.setStock(product.getStock());
            productDto.setMinStock(product.getMinStock());
            productDto.setDescription(product.getDescription());
            productDto.setCreatedAt(product.getCreatedAt());
            productDto.setUpdatedAt(product.getUpdatedAt());
            
            // Safely handle lazy-loaded collections and relationships
            try {
                productDto.setImageUrls(product.getImageUrls());
            } catch (Exception e) {
                productDto.setImageUrls(null);
            }
            
            // Convert product location
            if (product.getLocation() != null) {
                productDto.setLocation(convertLocationToDto(product.getLocation()));
            }
            
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
