package com.foreignfits.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "barcode_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "barcode_number", nullable = false)
    private String barcodeNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barcode_id")
    private Barcode barcode;
    
    @Column(name = "product_sku")
    private String productSku;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "event_type", nullable = false)
    private String eventType; // CREATED, TRANSFERRED_IN, TRANSFERRED_OUT, SOLD, RETURNED, DAMAGED, LOST
    
    @Column(name = "location_id")
    private Long locationId;
    
    @Column(name = "location_name")
    private String locationName;
    
    @Column(name = "from_location_id")
    private Long fromLocationId;
    
    @Column(name = "from_location_name")
    private String fromLocationName;
    
    @Column(name = "to_location_id")
    private Long toLocationId;
    
    @Column(name = "to_location_name")
    private String toLocationName;
    
    @Column(name = "reference_type")
    private String referenceType; // STOCK_MOVEMENT, SALE, MANUAL
    
    @Column(name = "reference_id")
    private Long referenceId;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @Column(name = "performed_by")
    private String performedBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
