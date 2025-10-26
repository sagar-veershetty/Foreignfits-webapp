package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
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
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    
    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Cost must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Cost format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal cost;
    
    @NotNull(message = "Wholesale price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Wholesale price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Wholesale price format is invalid")
    @Column(name = "wholesale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal wholesalePrice;
    
    @NotNull(message = "Wholesale minimum quantity is required")
    @Min(value = 1, message = "Wholesale minimum quantity must be at least 1")
    @Column(name = "wholesale_min_quantity", nullable = false)
    private Integer wholesaleMinQuantity;
    
    // Stock is now tracked in LocationInventory table - removed from Product entity
    
    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock cannot be negative")
    @Column(name = "min_stock", nullable = false)
    private Integer minStock;
    
    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String sku;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Size(max = 50, message = "Barcode cannot exceed 50 characters")
    @Column(unique = true, length = 50)
    private String barcode;
    
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;
    
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
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
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
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    
    public BigDecimal getWholesalePrice() { return wholesalePrice; }
    public void setWholesalePrice(BigDecimal wholesalePrice) { this.wholesalePrice = wholesalePrice; }
    
    public Integer getWholesaleMinQuantity() { return wholesaleMinQuantity; }
    public void setWholesaleMinQuantity(Integer wholesaleMinQuantity) { this.wholesaleMinQuantity = wholesaleMinQuantity; }
    
    // Stock getters/setters removed - use LocationInventory instead
    
    public Integer getMinStock() { return minStock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    
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
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}