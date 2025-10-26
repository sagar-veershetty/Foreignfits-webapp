package com.foreignfits.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transactions")
public class LoyaltyTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private LoyaltyCustomer customer;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType type;
    
    @Column(nullable = false)
    private Integer points;
    
    @Column(nullable = false)
    private Integer balanceAfter;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;
    
    @Column(length = 255)
    private String description;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime expiresAt;

    public enum TransactionType {
        EARNED_PURCHASE("Points earned from purchase"),
        EARNED_BONUS("Bonus points awarded"),
        EARNED_BIRTHDAY("Birthday reward points"),
        EARNED_SIGNUP("Welcome bonus points"),
        REDEEMED("Points redeemed for discount"),
        EXPIRED("Points expired"),
        ADJUSTED("Manual adjustment by admin");
        
        private final String description;
        
        TransactionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // Points expire after 12 months for apparel industry standard
        if (type == TransactionType.EARNED_PURCHASE || 
            type == TransactionType.EARNED_BONUS ||
            type == TransactionType.EARNED_BIRTHDAY) {
            expiresAt = LocalDateTime.now().plusMonths(12);
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LoyaltyCustomer getCustomer() {
        return customer;
    }

    public void setCustomer(LoyaltyCustomer customer) {
        this.customer = customer;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Integer getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(Integer balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
