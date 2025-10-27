package com.foreignfits.service;

import com.foreignfits.dto.LocationDto;
import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.request.CreateProductRequest;
import com.foreignfits.entity.Barcode;
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
    private final BarcodeService barcodeService;
    
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // User-based filtering:
    // Products are now organization-wide master data (no location_id on Product)
    // All users see all products, but LocationInventory shows what's available at their location
    public List<ProductDto> getProductsForUser(User user) {
        // All users see all products (organization-wide)
        // UI can filter to show products with stock at user's location using LocationInventory
        return getAllProducts();
    }
    
    public Optional<ProductDto> getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::convertToDto);
    }
    
    public Optional<ProductDto> getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::convertToDto);
    }
    
    public List<ProductDto> getProductsByCategory(Product.ProductCategory category) {
        return productRepository.findByCategory(category).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProductDto> getProductsByLocation(Long locationId) {
        // Products are organization-wide - get products with inventory at this location
        return locationInventoryRepository.findByLocationId(locationId).stream()
                .map(inv -> inv.getProduct())
                .distinct()
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
        // Pricing removed from Product - now in LocationInventory
        
        // Stock is now tracked in LocationInventory table (not in Product)
        // Min stock is also location-specific and stored in LocationInventory
        
        product.setSku(request.getSku());
        product.setIsManualSku(request.getIsManualSku() != null ? request.getIsManualSku() : false);
        product.setDescription(request.getDescription());
        product.setImageUrls(request.getImageUrls());
        // Location removed from Product - it's organization-wide master data
        product.setCreatedBy(createdBy);
        product.setIsApproved(true); // Product itself is approved immediately
        product.setApprovedBy(createdBy);
        product.setApprovedAt(java.time.LocalDateTime.now());
        
        Product savedProduct = productRepository.save(product);
        
        // Create LocationInventory record for initial stock WITH PRICING
        int initialStock = isAdminAtSupplier ? request.getStock() : 0;
        LocationInventory inventory = new LocationInventory();
        inventory.setLocation(location);
        inventory.setProductSku(savedProduct.getSku());
        inventory.setProduct(savedProduct);
        inventory.setQuantity(initialStock);
        inventory.setMinStock(request.getMinStock());
        inventory.setMaxStock(request.getMinStock() * 5); // Default max stock
        inventory.setReorderPoint(request.getMinStock() * 2); // Default reorder point
        // Set location-specific pricing
        inventory.setCost(request.getCost());
        inventory.setSalePrice(request.getPrice());
        inventory.setWholesalePrice(request.getWholesalePrice());
        inventory.setWholesaleMinQuantity(request.getWholesaleMinQuantity());
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
            
            // Generate unique barcodes for each unit of initial stock
            if (isAdminAtSupplier) {
                List<Barcode> generatedBarcodes = barcodeService.generateBarcodes(
                    savedProduct, 
                    location, 
                    request.getStock()
                );
                System.out.println("Generated " + generatedBarcodes.size() + " barcodes for product " + savedProduct.getSku());
            }
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
        
        // barcode validation removed - use Barcode table instead
        
        // Location removed from Product - update not needed
        // Pricing should be updated via LocationInventory endpoint instead
        
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        // Pricing removed from Product - use LocationInventory
        // minStock removed - use LocationInventory
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        // barcode removed - use Barcode table
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
        // Pricing removed from Product - now in LocationInventory
        // NOTE: UI should fetch pricing from LocationInventory based on user's location
        dto.setPrice(null); // Deprecated - use LocationInventory
        dto.setCost(null); // Deprecated - use LocationInventory
        dto.setWholesalePrice(null); // Deprecated - use LocationInventory
        dto.setWholesaleMinQuantity(null); // Deprecated - use LocationInventory
        
        // Stock removed - get from LocationInventory for specific location
        dto.setStock(0); // Deprecated - use LocationInventory for location-specific stock
        
        // Min stock removed - now location-specific in LocationInventory
        dto.setMinStock(0); // Deprecated - use LocationInventory for location-specific min stock
        
        dto.setSku(product.getSku());
        dto.setDescription(product.getDescription());
        dto.setImageUrls(product.getImageUrls());
        dto.setCreatedBy(product.getCreatedBy());
        dto.setIsApproved(product.getIsApproved());
        dto.setApprovedBy(product.getApprovedBy());
        dto.setApprovedAt(product.getApprovedAt());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        
        // Location removed from Product - no longer location-specific
        dto.setLocation(null); // Deprecated - products are organization-wide
        
        return dto;
    }
}