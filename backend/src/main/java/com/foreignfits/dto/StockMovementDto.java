package com.foreignfits.dto;

import com.foreignfits.entity.StockMovement;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private Long id;
    private ProductDto product;
    private StockMovement.MovementType type;
    private Integer quantity;
    private Integer previousStock;
    private Integer newStock;
    private String reason;
    private String reference;
    private LocationDto location;
    private String createdBy;
    private LocalDateTime createdAt;
    private StockMovement.MovementStatus status; // Movement status (PENDING, APPROVED, REJECTED)
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    
    // Transfer-specific fields
    private Long transferId;
    private LocationDto fromLocation;
    private LocationDto toLocation;
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public ProductDto getProduct() { return product; }
    public void setProduct(ProductDto product) { this.product = product; }
    
    public StockMovement.MovementType getType() { return type; }
    public void setType(StockMovement.MovementType type) { this.type = type; }
    
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
    
    public LocationDto getLocation() { return location; }
    public void setLocation(LocationDto location) { this.location = location; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public StockMovement.MovementStatus getStatus() { return status; }
    public void setStatus(StockMovement.MovementStatus status) { this.status = status; }
    
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    public Long getTransferId() { return transferId; }
    public void setTransferId(Long transferId) { this.transferId = transferId; }
    
    public LocationDto getFromLocation() { return fromLocation; }
    public void setFromLocation(LocationDto fromLocation) { this.fromLocation = fromLocation; }
    
    public LocationDto getToLocation() { return toLocation; }
    public void setToLocation(LocationDto toLocation) { this.toLocation = toLocation; }
}