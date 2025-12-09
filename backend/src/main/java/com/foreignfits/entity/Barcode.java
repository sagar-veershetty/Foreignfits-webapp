package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Barcode entity represents a single physical unit of a product.
 * Each barcode is unique and exists at exactly one location at a time.
 * When stock is transferred, barcodes move from source to destination location.
 */
@Entity
@Table(name = "barcodes", indexes = {
    @Index(name = "idx_barcode_number", columnList = "barcode_number", unique = true),
    @Index(name = "idx_barcode_product", columnList = "product_id"),
    @Index(name = "idx_barcode_location", columnList = "current_location_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Barcode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Barcode number is required")
    @Size(max = 50, message = "Barcode number cannot exceed 50 characters")
    @Column(name = "barcode_number", nullable = false, unique = true, length = 50)
    private String barcodeNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_location_id", nullable = false)
    private Location currentLocation;
    
    @Column(name = "status", length = 50)
    private String status = "ACTIVE"; // ACTIVE, DAMAGED, LOST, SOLD, etc.
    
    @Column(name = "remark", length = 255)
    private String remark; // Additional notes: "Damaged - small tear", "Customer return", etc.
    
    @Column(name = "purchase_price")
    private Double purchasePrice; // Individual purchase/cost price for this specific barcode
    
    @Column(name = "sale_price")
    private Double salePrice; // Individual sale price for this specific barcode
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Constructor for creating a new barcode for a product at a location
     */
    public Barcode(String barcodeNumber, Product product, Location location) {
        this.barcodeNumber = barcodeNumber;
        this.product = product;
        this.currentLocation = location;
    }
    
    /**
     * Constructor for creating a new barcode with individual prices
     */
    public Barcode(String barcodeNumber, Product product, Location location, Double purchasePrice, Double salePrice) {
        this.barcodeNumber = barcodeNumber;
        this.product = product;
        this.currentLocation = location;
        this.purchasePrice = purchasePrice;
        this.salePrice = salePrice;
    }
}
