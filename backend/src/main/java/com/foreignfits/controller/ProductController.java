package com.foreignfits.controller;

import com.foreignfits.dto.ProductDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.CreateProductRequest;
import com.foreignfits.entity.Product;
import com.foreignfits.entity.User;
import com.foreignfits.service.ProductService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAuthority('view:products')")
    public ResponseEntity<List<ProductDto>> getAllProducts(Authentication authentication) {
        // Get current user entity from authentication
        String email = authentication.getName();
        var user = userService.getUserEntityByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Use user-based filtering
        List<ProductDto> products = productService.getProductsForUser(user);
        
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('view:products')")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/sku/{sku}")
    @PreAuthorize("hasAuthority('view:products')")
    public ResponseEntity<ProductDto> getProductBySku(@PathVariable String sku) {
        return productService.getProductBySku(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/barcode/{barcode}")
    @PreAuthorize("hasAuthority('view:products')")
    public ResponseEntity<ProductDto> getProductByBarcode(@PathVariable String barcode) {
        return productService.getProductByBarcode(barcode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@PathVariable Product.ProductCategory category) {
        List<ProductDto> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAuthority('cross:location_access')")
    public ResponseEntity<List<ProductDto>> getProductsByLocation(@PathVariable Long locationId, Authentication authentication) {
        // Only ADMIN can query products by specific location
        // SALES and WAREHOUSE users should use the default getAllProducts() which filters automatically
        List<ProductDto> products = productService.getProductsByLocation(locationId);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductDto>> getLowStockProducts() {
        List<ProductDto> products = productService.getLowStockProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam String q) {
        List<ProductDto> products = productService.searchProducts(q);
        return ResponseEntity.ok(products);
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('add:product')")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody CreateProductRequest request) {
        try {
            ProductDto product = productService.createProduct(request);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('edit:product')")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @Valid @RequestBody CreateProductRequest request) {
        try {
            ProductDto product = productService.updateProduct(id, request);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('delete:product')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
