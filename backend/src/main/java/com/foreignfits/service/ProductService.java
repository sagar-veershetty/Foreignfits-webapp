package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.request.CreateProductRequest;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    private final StockTransferRepository stockTransferRepository;
    private final UserRepository userRepository;
    
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // User-based filtering:
    // - Admin (cross-location access): sees ALL products from ALL locations
    // - Other users: see products only from their assigned location
    public List<ProductDto> getProductsForUser(User user) {
        // Admin with cross-location access sees ALL products from ALL locations
        if (user.getRole() == User.UserRole.ADMIN) {
            return getAllProducts();
        }
        
        // Non-admin users see products only from their location
        if (user.getLocation() != null) {
            return productRepository.findByLocationId(user.getLocation().getId()).stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        
        // If no location assigned, return empty (should not happen for active users)
        return List.of();
    }
    
    public Optional<ProductDto> getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::convertToDto);
    }
    
    public Optional<ProductDto> getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::convertToDto);
    }
    
    public Optional<ProductDto> getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .map(this::convertToDto);
    }
    
    public List<ProductDto> getProductsByCategory(Product.ProductCategory category) {
        return productRepository.findByCategory(category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> getProductsByLocation(Long locationId) {
        return productRepository.findByLocationId(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> getLowStockProducts() {
        // Low stock is now managed per location in LocationInventory
        // This method returns all products that have low stock in at least one location
        return locationInventoryRepository.findAll().stream()
                .filter(inv -> inv.getMinStock() != null && inv.getQuantity() <= inv.getMinStock())
                .map(inv -> inv.getProduct())
                .distinct()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> searchProducts(String searchTerm) {
        return productRepository.findBySearchTerm(searchTerm).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public ProductDto createProduct(CreateProductRequest request) {
        // Validate SKU uniqueness
        if (productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }
        
        // Validate barcode uniqueness if provided
        if (request.getBarcode() != null && productRepository.existsByBarcode(request.getBarcode())) {
            throw new RuntimeException("Product with barcode " + request.getBarcode() + " already exists");
        }
        
        // Get location
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
        
        // Get created by user from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String createdBy = auth != null ? auth.getName() : "System";
        
        // Check if user is ADMIN creating product at SUPPLIER location (ID=1)
        boolean isAdminAtSupplier = false;
        if (auth != null && request.getLocationId() == 1L) {
            isAdminAtSupplier = auth.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        }
        
        Product product = new Product();
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setWholesaleMinQuantity(request.getWholesaleMinQuantity());
        
        // Stock is now tracked in LocationInventory table (not in Product)
        
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setImageUrls(request.getImageUrls());
        product.setLocation(location);
        product.setCreatedBy(createdBy);
        product.setIsApproved(true); // Product itself is approved immediately
        product.setApprovedBy(createdBy);
        product.setApprovedAt(java.time.LocalDateTime.now());
        
        Product savedProduct = productRepository.save(product);
        
        // Create LocationInventory record for initial stock
        int initialStock = isAdminAtSupplier ? request.getStock() : 0;
        LocationInventory inventory = new LocationInventory();
        inventory.setLocation(location);
        inventory.setProductSku(savedProduct.getSku());
        inventory.setProduct(savedProduct);
        inventory.setQuantity(initialStock);
        inventory.setMinStock(request.getMinStock());
        inventory.setMaxStock(request.getMinStock() * 5); // Default max stock
        inventory.setReorderPoint(request.getMinStock() * 2); // Default reorder point
        locationInventoryRepository.save(inventory);
        
        // Create stock movement for the initial stock
        // Movement is from "INITIAL" (ID=0, external source) to the product's location (e.g., SUPPLIER)
        if (request.getStock() > 0) {
            // Get INITIAL location (ID=0)
            Location initialLocation = locationRepository.findById(0L)
                    .orElseThrow(() -> new RuntimeException("INITIAL location not found"));
            
            // Get the user who is creating the product
            User requestingUser = userRepository.findByEmail(createdBy)
                    .orElseThrow(() -> new RuntimeException("User not found: " + createdBy));
            
            // Create StockTransfer record for the initial stock movement
            StockTransfer transfer = new StockTransfer();
            transfer.setProduct(savedProduct);
            transfer.setFromLocation(initialLocation); // INITIAL location
            transfer.setToLocation(location); // Destination (e.g., SUPPLIER)
            transfer.setQuantity(request.getStock());
            transfer.setReason("Initial stock creation");
            transfer.setReference("INITIAL-" + savedProduct.getId());
            transfer.setStatus(StockTransfer.TransferStatus.COMPLETED); // Auto-completed for initial stock
            transfer.setRequestedAt(java.time.LocalDateTime.now());
            transfer.setRequestedBy(requestingUser); // Set the requesting user
            
            // If ADMIN at SUPPLIER: auto-approve; otherwise requires approval
            if (isAdminAtSupplier) {
                transfer.setApprovedBy(requestingUser);
                transfer.setApprovedAt(java.time.LocalDateTime.now());
                transfer.setCompletedBy(requestingUser);
                transfer.setCompletedAt(java.time.LocalDateTime.now());
            }
            
            StockTransfer savedTransfer = stockTransferRepository.save(transfer);
            
            // Create movement linked to the transfer
            StockMovement movement = new StockMovement();
            movement.setProduct(savedProduct);
            movement.setType(StockMovement.MovementType.RESTOCK);
            movement.setQuantity(request.getStock());
            movement.setPreviousStock(0);
            movement.setNewStock(request.getStock());
            movement.setReason("Initial stock from external source to " + location.getName());
            movement.setReference("INITIAL-TO-" + location.getName().toUpperCase().replace(" ", "-") + "-" + savedProduct.getId());
            movement.setTransfer(savedTransfer); // Link to transfer (provides from/to locations)
            movement.setCreatedBy(createdBy);
            
            // If ADMIN at SUPPLIER: approve immediately; otherwise requires approval
            if (isAdminAtSupplier) {
                movement.setStatus(StockMovement.MovementStatus.APPROVED);
                movement.setApprovedBy(createdBy);
                movement.setApprovedAt(java.time.LocalDateTime.now());
            } else {
                movement.setStatus(StockMovement.MovementStatus.PENDING); // Requires approval
            }
            
            stockMovementRepository.save(movement);
        }
        
        return convertToDto(savedProduct);
    }
    
    public ProductDto updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        // Validate SKU uniqueness (excluding current product)
        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }
        
        // Validate barcode uniqueness if provided (excluding current product)
        if (request.getBarcode() != null && 
            !request.getBarcode().equals(product.getBarcode()) && 
            productRepository.existsByBarcode(request.getBarcode())) {
            throw new RuntimeException("Product with barcode " + request.getBarcode() + " already exists");
        }
        
        // Get location if changed
        if (!product.getLocation().getId().equals(request.getLocationId())) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));
            product.setLocation(location);
        }
        
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setWholesaleMinQuantity(request.getWholesaleMinQuantity());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setImageUrls(request.getImageUrls());
        
        Product savedProduct = productRepository.save(product);
        return convertToDto(savedProduct);
    }
    
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
    
    public ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setSize(product.getSize());
        dto.setColor(product.getColor());
        dto.setPrice(product.getPrice());
        dto.setCost(product.getCost());
        dto.setWholesalePrice(product.getWholesalePrice());
        dto.setWholesaleMinQuantity(product.getWholesaleMinQuantity());
        
        // Get stock from LocationInventory
        LocationInventory inventory = locationInventoryRepository
                .findByLocationIdAndProductSku(product.getLocation().getId(), product.getSku())
                .orElse(null);
        dto.setStock(inventory != null ? inventory.getQuantity() : 0);
        
        dto.setMinStock(product.getMinStock());
        dto.setSku(product.getSku());
        dto.setDescription(product.getDescription());
        dto.setBarcode(product.getBarcode());
        dto.setImageUrls(product.getImageUrls());
        dto.setCreatedBy(product.getCreatedBy());
        dto.setIsApproved(product.getIsApproved());
        dto.setApprovedBy(product.getApprovedBy());
        dto.setApprovedAt(product.getApprovedAt());
        dto.setRejectionReason(product.getRejectionReason());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        
        // Convert location
        if (product.getLocation() != null) {
            LocationDto locationDto = new LocationDto();
            locationDto.setId(product.getLocation().getId());
            locationDto.setName(product.getLocation().getName());
            locationDto.setType(product.getLocation().getType());
            locationDto.setAddress(product.getLocation().getAddress());
            locationDto.setCity(product.getLocation().getCity());
            locationDto.setState(product.getLocation().getState());
            locationDto.setZipCode(product.getLocation().getZipCode());
            locationDto.setPhone(product.getLocation().getPhone());
            locationDto.setManager(product.getLocation().getManager());
            locationDto.setCapacity(product.getLocation().getCapacity());
            locationDto.setIsActive(product.getLocation().getIsActive());
            dto.setLocation(locationDto);
        }
        
        return dto;
    }
}