package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class StockMovement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;
    
    @NotNull(message = "Quantity is required")
    @Column(nullable = false)
    private Integer quantity;
    
    @NotNull(message = "Previous stock is required")
    @Column(name = "previous_stock", nullable = false)
    private Integer previousStock;
    
    @NotNull(message = "New stock is required")
    @Column(name = "new_stock", nullable = false)
    private Integer newStock;
    
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    @Column(length = 255)
    private String reason;
    
    @Size(max = 100, message = "Reference cannot exceed 100 characters")
    @Column(length = 100)
    private String reference;
    
    // Location removed - use transfer.fromLocation and transfer.toLocation instead
    // For all movement types, a StockTransfer record is created with from/to locations
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id")
    private StockTransfer transfer;
    
    @NotBlank(message = "Created by is required")
    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementStatus status = MovementStatus.PENDING; // Status: PENDING, APPROVED, REJECTED
    
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum MovementType {
        ADJUSTMENT, SALE, RETURN, DAMAGE, TRANSFER, RESTOCK
    }
    
    public enum MovementStatus {
        PENDING, APPROVED, REJECTED
    }
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    
    public MovementType getType() { return type; }
    public void setType(MovementType type) { this.type = type; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public Integer getPreviousStock() { return previousStock; }
    public void setPreviousStock(Integer previousStock) { this.previousStock = previousStock; }
    
    public Integer getNewStock() { return newStock; }
    public void setNewStock(Integer newStock) { this.newStock = newStock; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    
    public StockTransfer getTransfer() { return transfer; }
    public void setTransfer(StockTransfer transfer) { this.transfer = transfer; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public MovementStatus getStatus() { return status; }
    public void setStatus(MovementStatus status) { this.status = status; }
    
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}