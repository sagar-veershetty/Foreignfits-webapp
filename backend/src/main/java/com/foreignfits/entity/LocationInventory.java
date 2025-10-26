package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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
