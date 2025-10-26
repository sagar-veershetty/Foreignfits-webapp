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
    @Column(name = "payment_method", nullable = false)
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sold_by_id", nullable = false)
    private User soldBy;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public enum PaymentMethod {
        CASH, CARD, OTHER
    }
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public List<SaleItem> getItems() { return items; }
    public void setItems(List<SaleItem> items) { this.items = items; }
    
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
    
    public User getSoldBy() { return soldBy; }
    public void setSoldBy(User soldBy) { this.soldBy = soldBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}