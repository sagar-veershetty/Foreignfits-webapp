package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name cannot exceed 200 characters")
    @Column(nullable = false, length = 200)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;
    
    @NotBlank(message = "Size is required")
    @Size(max = 20, message = "Size cannot exceed 20 characters")
    @Column(nullable = false, length = 20)
    private String size;
    
    @NotBlank(message = "Color is required")
    @Size(max = 50, message = "Color cannot exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String color;
    
    // Pricing moved to LocationInventory - each location sets their own costs/prices
    // This follows industry standard (SAP, Oracle, NetSuite) where Product is master data
    
    // Stock tracking is in LocationInventory table
    // Min stock is also location-specific and moved to LocationInventory
    
    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String sku;
    
    @Column(name = "is_manual_sku", nullable = false)
    private Boolean isManualSku = false; // True if SKU was manually entered, false if auto-generated
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls;
    
    // Location removed - Product is now organization-wide master data
    // Location-specific data (inventory, pricing) is in LocationInventory table
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StockMovement> stockMovements;
    
    @NotBlank(message = "Created by is required")
    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;
    
    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false; // Products require approval
    
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Generates a SKU from product attributes: Name(2) + Category(3) + Size + Color(3) + Random(4)
     * Example: "BL-SHI-M-BLU-5729" for "Blue Shirt" M size
     */
    public static String generateSku(String name, ProductCategory category, String size, String color) {
        // Extract 2 chars from name (uppercase, alphanumeric only)
        String nameCode = extractAlphanumeric(name, 2).toUpperCase();
        
        // Extract 3 chars from category
        String categoryCode = category.name().substring(0, Math.min(3, category.name().length())).toUpperCase();
        
        // Size as-is (cleaned)
        String sizeCode = extractAlphanumeric(size, 10).toUpperCase();
        
        // Extract 3 chars from color
        String colorCode = extractAlphanumeric(color, 3).toUpperCase();
        
        // Random 4 digits
        String randomCode = String.format("%04d", (int)(Math.random() * 10000));
        
        return String.format("%s-%s-%s-%s-%s", nameCode, categoryCode, sizeCode, colorCode, randomCode);
    }
    
    /**
     * Helper method to extract alphanumeric characters from a string
     */
    private static String extractAlphanumeric(String input, int maxLength) {
        if (input == null || input.isEmpty()) {
            return "XX"; // Default fallback
        }
        String cleaned = input.replaceAll("[^a-zA-Z0-9]", "");
        if (cleaned.isEmpty()) {
            return "XX";
        }
        return cleaned.substring(0, Math.min(maxLength, cleaned.length()));
    }
    
    public enum ProductCategory {
        SHIRTS, PANTS, DRESSES, JACKETS, SHOES, ACCESSORIES
    }
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public ProductCategory getCategory() { return category; }
    public void setCategory(ProductCategory category) { this.category = category; }
    
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    // Pricing getters/setters removed - use LocationInventory instead
    
    // Stock getters/setters removed - use LocationInventory instead
    
    // minStock removed - use LocationInventory instead
    
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    
    public Boolean getIsManualSku() { return isManualSku; }
    public void setIsManualSku(Boolean isManualSku) { this.isManualSku = isManualSku; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    // barcode removed - use Barcode table instead
    
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    
    // Location getters/setters removed - use LocationInventory to track per-location data
    
    public List<StockMovement> getStockMovements() { return stockMovements; }
    public void setStockMovements(List<StockMovement> stockMovements) { this.stockMovements = stockMovements; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public Boolean getIsApproved() { return isApproved; }
    public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }
    
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    
    // rejectionReason removed
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}