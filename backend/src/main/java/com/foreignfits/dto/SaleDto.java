package com.foreignfits.dto;

import com.foreignfits.entity.Sale;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleDto {
    private Long id;
    private List<SaleItemDto> items;
    private List<SalePaymentDto> payments; // Support for split payments
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private Sale.PaymentMethod paymentMethod; // Keep for backward compatibility
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerCountryCode;
    private Integer pointsEarned;
    private Integer pointsRedeemed;
    private BigDecimal discountFromPoints;
    private String salesPersonName;
    private String couponCode;
    private BigDecimal couponDiscount;
    private String generatedCouponCode;
    private BigDecimal instantDiscountPercent; // Instant discount percentage
    private BigDecimal instantDiscountAmount;  // Instant discount amount
    private Boolean isExchangeSale;
    private Long exchangeId;
    private BigDecimal exchangePriceDifference;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private Sale.PaymentStatus paymentStatus;
    private UserDto soldBy;
    private LocationDto location;
    private LocalDateTime createdAt;
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public List<SaleItemDto> getItems() { return items; }
    public void setItems(List<SaleItemDto> items) { this.items = items; }
    
    public List<SalePaymentDto> getPayments() { return payments; }
    public void setPayments(List<SalePaymentDto> payments) { this.payments = payments; }
    
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    
    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    
    public Sale.PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(Sale.PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    
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

    public Sale.PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(Sale.PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public UserDto getSoldBy() { return soldBy; }
    public void setSoldBy(UserDto soldBy) { this.soldBy = soldBy; }
    
    public LocationDto getLocation() { return location; }
    public void setLocation(LocationDto location) { this.location = location; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}