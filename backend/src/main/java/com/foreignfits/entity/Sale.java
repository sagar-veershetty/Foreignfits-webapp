package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Sale {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SaleItem> items;
    
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<SalePayment> payments;
    
    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.0", message = "Subtotal cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Subtotal format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
    
    @NotNull(message = "Tax is required")
    @DecimalMin(value = "0.0", message = "Tax cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Tax format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal tax;
    
    @NotNull(message = "Total is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Total format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = true)
    private PaymentMethod paymentMethod;
    
    @Column(name = "customer_name", length = 100)
    private String customerName;
    
    @Column(name = "customer_email", length = 150)
    private String customerEmail;
    
    @Column(name = "customer_phone", length = 15)
    private String customerPhone;
    
    @Column(name = "customer_country_code", length = 5)
    private String customerCountryCode;
    
    @Column(name = "points_earned")
    private Integer pointsEarned;
    
    @Column(name = "points_redeemed")
    private Integer pointsRedeemed;
    
    @Column(name = "discount_from_points", precision = 12, scale = 2)
    private BigDecimal discountFromPoints;
    
    @Column(name = "sales_person_name", length = 100)
    private String salesPersonName;
    
    // Coupon-related fields
    @Column(name = "coupon_code", length = 20)
    private String couponCode;
    
    @Column(name = "coupon_discount", precision = 12, scale = 2)
    private BigDecimal couponDiscount;
    
    @Column(name = "generated_coupon_code", length = 20)
    private String generatedCouponCode;
    
    // Instant discount fields (based on purchase amount)
    @Column(name = "instant_discount_percent", precision = 5, scale = 2)
    private BigDecimal instantDiscountPercent; // e.g., 10.00 for 10%
    
    @Column(name = "instant_discount_amount", precision = 12, scale = 2)
    private BigDecimal instantDiscountAmount; // Actual discount amount
    
    // Exchange-related fields
    @Column(name = "is_exchange_sale")
    private Boolean isExchangeSale = false;
    
    @Column(name = "exchange_id")
    private Long exchangeId;
    
    @Column(name = "exchange_price_difference", precision = 12, scale = 2)
    private BigDecimal exchangePriceDifference; // Amount customer paid/received in exchange

    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "pending_amount", precision = 12, scale = 2)
    private BigDecimal pendingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PAID;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sold_by_id", nullable = false)
    private User soldBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    @NotNull(message = "Location is required")
    private Location location;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum PaymentMethod {
        CASH, CARD, UPI, OTHER // Keep OTHER for backward compatibility with existing data
    }

    public enum PaymentStatus {
        UNPAID, PARTIALLY_PAID, PAID
    }
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public List<SaleItem> getItems() { return items; }
    public void setItems(List<SaleItem> items) { this.items = items; }
    
    public List<SalePayment> getPayments() { return payments; }
    public void setPayments(List<SalePayment> payments) { this.payments = payments; }
    
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    
    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public String getCustomerCountryCode() { return customerCountryCode; }
    public void setCustomerCountryCode(String customerCountryCode) { this.customerCountryCode = customerCountryCode; }
    
    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }
    
    public Integer getPointsRedeemed() { return pointsRedeemed; }
    public void setPointsRedeemed(Integer pointsRedeemed) { this.pointsRedeemed = pointsRedeemed; }
    
    public BigDecimal getDiscountFromPoints() { return discountFromPoints; }
    public void setDiscountFromPoints(BigDecimal discountFromPoints) { this.discountFromPoints = discountFromPoints; }
    
    public String getSalesPersonName() { return salesPersonName; }
    public void setSalesPersonName(String salesPersonName) { this.salesPersonName = salesPersonName; }
    
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    
    public BigDecimal getCouponDiscount() { return couponDiscount; }
    public void setCouponDiscount(BigDecimal couponDiscount) { this.couponDiscount = couponDiscount; }
    
    public String getGeneratedCouponCode() { return generatedCouponCode; }
    public void setGeneratedCouponCode(String generatedCouponCode) { this.generatedCouponCode = generatedCouponCode; }
    
    public BigDecimal getInstantDiscountPercent() { return instantDiscountPercent; }
    public void setInstantDiscountPercent(BigDecimal instantDiscountPercent) { this.instantDiscountPercent = instantDiscountPercent; }
    
    public BigDecimal getInstantDiscountAmount() { return instantDiscountAmount; }
    public void setInstantDiscountAmount(BigDecimal instantDiscountAmount) { this.instantDiscountAmount = instantDiscountAmount; }
    
    public Boolean getIsExchangeSale() { return isExchangeSale; }
    public void setIsExchangeSale(Boolean isExchangeSale) { this.isExchangeSale = isExchangeSale; }
    
    public Long getExchangeId() { return exchangeId; }
    public void setExchangeId(Long exchangeId) { this.exchangeId = exchangeId; }
    
    public BigDecimal getExchangePriceDifference() { return exchangePriceDifference; }
    public void setExchangePriceDifference(BigDecimal exchangePriceDifference) { this.exchangePriceDifference = exchangePriceDifference; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getPendingAmount() { return pendingAmount; }
    public void setPendingAmount(BigDecimal pendingAmount) { this.pendingAmount = pendingAmount; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public User getSoldBy() { return soldBy; }
    public void setSoldBy(User soldBy) { this.soldBy = soldBy; }
    
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}