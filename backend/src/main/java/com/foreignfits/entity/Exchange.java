package com.foreignfits.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchanges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Exchange {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_sale_id", nullable = false)
    private Sale originalSale;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_sale_id", nullable = true)
    private Sale newSale;
    
    @Column(name = "exchange_reason", length = 500)
    private String exchangeReason;
    
    @Column(name = "price_difference", precision = 12, scale = 2)
    private BigDecimal priceDifference; // Positive if customer needs to pay more, negative if refund
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExchangeStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchanged_by_id", nullable = false)
    private User exchangedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum ExchangeStatus {
        PENDING,      // Exchange initiated but not completed
        COMPLETED,    // Exchange successfully completed
        CANCELLED     // Exchange cancelled
    }
    
    // Manual getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Sale getOriginalSale() { return originalSale; }
    public void setOriginalSale(Sale originalSale) { this.originalSale = originalSale; }
    
    public Sale getNewSale() { return newSale; }
    public void setNewSale(Sale newSale) { this.newSale = newSale; }
    
    public String getExchangeReason() { return exchangeReason; }
    public void setExchangeReason(String exchangeReason) { this.exchangeReason = exchangeReason; }
    
    public BigDecimal getPriceDifference() { return priceDifference; }
    public void setPriceDifference(BigDecimal priceDifference) { this.priceDifference = priceDifference; }
    
    public ExchangeStatus getStatus() { return status; }
    public void setStatus(ExchangeStatus status) { this.status = status; }
    
    public User getExchangedBy() { return exchangedBy; }
    public void setExchangedBy(User exchangedBy) { this.exchangedBy = exchangedBy; }
    
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
