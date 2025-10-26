package com.foreignfits.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_customers")
public class LoyaltyCustomer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    
    @Column(nullable = false, length = 5)
    private String countryCode;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 150)
    private String email;
    
    private LocalDate dateOfBirth;
    
    @Column(nullable = false)
    private Integer totalPoints = 0;
    
    @Column(nullable = false)
    private Integer lifetimePoints = 0;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private LoyaltyTier tier = LoyaltyTier.BRONZE;
    
    @Column(nullable = false)
    private LocalDateTime joinedAt;
    
    private LocalDateTime lastPurchaseAt;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    private LocalDateTime updatedAt;

    public enum LoyaltyTier {
        BRONZE(0, 1.0, "Welcome tier"),
        SILVER(5000, 1.25, "5% bonus points + Birthday reward"),
        GOLD(15000, 1.5, "10% bonus points + Birthday reward + Early access"),
        PLATINUM(30000, 2.0, "20% bonus points + Birthday reward + Early access + Exclusive events");
        
        private final int minLifetimePoints;
        private final double pointsMultiplier;
        private final String benefits;
        
        LoyaltyTier(int minLifetimePoints, double pointsMultiplier, String benefits) {
            this.minLifetimePoints = minLifetimePoints;
            this.pointsMultiplier = pointsMultiplier;
            this.benefits = benefits;
        }
        
        public int getMinLifetimePoints() { return minLifetimePoints; }
        public double getPointsMultiplier() { return pointsMultiplier; }
        public String getBenefits() { return benefits; }
        
        public static LoyaltyTier getTierForPoints(int lifetimePoints) {
            if (lifetimePoints >= PLATINUM.minLifetimePoints) return PLATINUM;
            if (lifetimePoints >= GOLD.minLifetimePoints) return GOLD;
            if (lifetimePoints >= SILVER.minLifetimePoints) return SILVER;
            return BRONZE;
        }
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getLifetimePoints() {
        return lifetimePoints;
    }

    public void setLifetimePoints(Integer lifetimePoints) {
        this.lifetimePoints = lifetimePoints;
    }

    public LoyaltyTier getTier() {
        return tier;
    }

    public void setTier(LoyaltyTier tier) {
        this.tier = tier;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public LocalDateTime getLastPurchaseAt() {
        return lastPurchaseAt;
    }

    public void setLastPurchaseAt(LocalDateTime lastPurchaseAt) {
        this.lastPurchaseAt = lastPurchaseAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
