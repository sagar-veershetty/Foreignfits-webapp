package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * LocationInventory - Maintains real-time inventory levels for each product at each location
 * This eliminates the need to calculate stock from movements and provides O(1) lookups
 */
@Entity
@Table(name = "location_inventory", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"location_id", "product_sku"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class LocationInventory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    @NotNull(message = "Location is required")
    private Location location;
    
    @NotNull(message = "Product SKU is required")
    @Column(name = "product_sku", nullable = false, length = 100)
    private String productSku;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product; // Reference to product for details
    
    @NotNull(message = "Quantity is required")
    @Column(nullable = false)
    private Integer quantity = 0;
    
    @Column(name = "min_stock")
    private Integer minStock = 0;
    
    @Column(name = "max_stock")
    private Integer maxStock;
    
    @Column(name = "reorder_point")
    private Integer reorderPoint;
    
    // Location-specific pricing - each location can set their own costs and prices
    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.0", message = "Cost must be greater than or equal to 0")
    @Digits(integer = 10, fraction = 2, message = "Cost must have at most 10 integer digits and 2 decimal places")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal cost;
    
    @NotNull(message = "Sale price is required")
    @DecimalMin(value = "0.0", message = "Sale price must be greater than or equal to 0")
    @Digits(integer = 10, fraction = 2, message = "Sale price must have at most 10 integer digits and 2 decimal places")
    @Column(name = "sale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal salePrice;
    
    @DecimalMin(value = "0.0", message = "Wholesale price must be greater than or equal to 0")
    @Digits(integer = 10, fraction = 2, message = "Wholesale price must have at most 10 integer digits and 2 decimal places")
    @Column(name = "wholesale_price", precision = 12, scale = 2)
    private BigDecimal wholesalePrice;
    
    @Column(name = "wholesale_min_quantity")
    private Integer wholesaleMinQuantity;
    
    @Column(name = "last_restock_date")
    private LocalDateTime lastRestockDate;
    
    @Column(name = "last_sale_date")
    private LocalDateTime lastSaleDate;
    
    @Column(name = "last_movement_id")
    private Long lastMovementId; // Reference to last movement that updated this inventory
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Computed field - is stock below minimum?
    @Transient
    public boolean isLowStock() {
        return quantity != null && minStock != null && quantity <= minStock;
    }
    
    // Computed field - is stock above maximum?
    @Transient
    public boolean isOverStock() {
        return quantity != null && maxStock != null && quantity >= maxStock;
    }
    
    // Computed field - should reorder?
    @Transient
    public boolean shouldReorder() {
        return quantity != null && reorderPoint != null && quantity <= reorderPoint;
    }
}
