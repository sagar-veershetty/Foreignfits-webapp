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

@Entity
@Table(name = "coupons", indexes = {
    @Index(name = "idx_coupon_code", columnList = "code", unique = true),
    @Index(name = "idx_coupon_customer_phone", columnList = "customer_phone,customer_country_code"),
    @Index(name = "idx_coupon_status", columnList = "status"),
    @Index(name = "idx_coupon_valid_until", columnList = "valid_until"),
    @Index(name = "idx_coupon_generated_from_sale", columnList = "generated_from_sale_id"),
    @Index(name = "idx_coupon_redeemed_in_sale", columnList = "redeemed_in_sale_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Coupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Coupon code is required")
    @Column(unique = true, nullable = false, length = 20)
    private String code;
    
    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Discount amount format is invalid")
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;
    
    @NotNull(message = "Minimum purchase amount is required")
    @DecimalMin(value = "0.0", message = "Minimum purchase amount cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Minimum purchase amount format is invalid")
    @Column(name = "min_purchase_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal minPurchaseAmount;
    
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponStatus status;
    
    // Customer information
    @Column(name = "customer_name", length = 255)
    private String customerName;
    
    @Column(name = "customer_phone", length = 50)
    private String customerPhone;
    
    @Column(name = "customer_country_code", length = 10)
    private String customerCountryCode;
    
    // Generation details
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_from_sale_id")
    private Sale generatedFromSale;
    
    @NotNull(message = "Generation date is required")
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
    
    @NotNull(message = "Valid until date is required")
    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;
    
    // Redemption details
    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redeemed_in_sale_id")
    private Sale redeemedInSale;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redeemed_by_user_id")
    private User redeemedByUser;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redeemed_at_location_id")
    private Location redeemedAtLocation;
    
    // Metadata
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum CouponStatus {
        ACTIVE,
        USED,
        EXPIRED,
        CANCELLED
    }
    
    // Manual getters and setters for better control
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    
    public BigDecimal getMinPurchaseAmount() { return minPurchaseAmount; }
    public void setMinPurchaseAmount(BigDecimal minPurchaseAmount) { this.minPurchaseAmount = minPurchaseAmount; }
    
    public CouponStatus getStatus() { return status; }
    public void setStatus(CouponStatus status) { this.status = status; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public String getCustomerCountryCode() { return customerCountryCode; }
    public void setCustomerCountryCode(String customerCountryCode) { this.customerCountryCode = customerCountryCode; }
    
    public Sale getGeneratedFromSale() { return generatedFromSale; }
    public void setGeneratedFromSale(Sale generatedFromSale) { this.generatedFromSale = generatedFromSale; }
    
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    
    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }
    
    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }
    
    public Sale getRedeemedInSale() { return redeemedInSale; }
    public void setRedeemedInSale(Sale redeemedInSale) { this.redeemedInSale = redeemedInSale; }
    
    public User getRedeemedByUser() { return redeemedByUser; }
    public void setRedeemedByUser(User redeemedByUser) { this.redeemedByUser = redeemedByUser; }
    
    public Location getRedeemedAtLocation() { return redeemedAtLocation; }
    public void setRedeemedAtLocation(Location redeemedAtLocation) { this.redeemedAtLocation = redeemedAtLocation; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
