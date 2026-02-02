package com.foreignfits.dto;

import com.foreignfits.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponDto {
    private Long id;
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal minPurchaseAmount;
    private String status;
    private String customerName;
    private String customerPhone;
    private String customerCountryCode;
    private Long generatedFromSaleId;
    private LocalDateTime generatedAt;
    private LocalDateTime validUntil;
    private LocalDateTime redeemedAt;
    private Long redeemedInSaleId;
    private String redeemedByUsername;
    private String redeemedAtLocationName;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Derived fields
    private boolean isExpired;
    private boolean isValid;
    private long daysUntilExpiry;
    private long daysSinceGeneration;
    
    public static CouponDto fromEntity(Coupon coupon) {
        CouponDto dto = new CouponDto();
        dto.setId(coupon.getId());
        dto.setCode(coupon.getCode());
        dto.setDiscountAmount(coupon.getDiscountAmount());
        dto.setMinPurchaseAmount(coupon.getMinPurchaseAmount());
        dto.setStatus(coupon.getStatus().name());
        dto.setCustomerName(coupon.getCustomerName());
        dto.setCustomerPhone(coupon.getCustomerPhone());
        dto.setCustomerCountryCode(coupon.getCustomerCountryCode());
        
        if (coupon.getGeneratedFromSale() != null) {
            dto.setGeneratedFromSaleId(coupon.getGeneratedFromSale().getId());
        }
        
        dto.setGeneratedAt(coupon.getGeneratedAt());
        dto.setValidUntil(coupon.getValidUntil());
        dto.setRedeemedAt(coupon.getRedeemedAt());
        
        if (coupon.getRedeemedInSale() != null) {
            dto.setRedeemedInSaleId(coupon.getRedeemedInSale().getId());
        }
        
        if (coupon.getRedeemedByUser() != null) {
            dto.setRedeemedByUsername(coupon.getRedeemedByUser().getName());
        }
        
        if (coupon.getRedeemedAtLocation() != null) {
            dto.setRedeemedAtLocationName(coupon.getRedeemedAtLocation().getName());
        }
        
        dto.setNotes(coupon.getNotes());
        dto.setCreatedAt(coupon.getCreatedAt());
        dto.setUpdatedAt(coupon.getUpdatedAt());
        
        // Calculate derived fields
        LocalDateTime now = LocalDateTime.now();
        dto.setExpired(now.isAfter(coupon.getValidUntil()));
        dto.setValid(coupon.getStatus() == Coupon.CouponStatus.ACTIVE && !dto.isExpired());
        
        if (coupon.getValidUntil() != null) {
            long days = java.time.Duration.between(now, coupon.getValidUntil()).toDays();
            dto.setDaysUntilExpiry(days);
        }
        
        if (coupon.getGeneratedAt() != null) {
            long days = java.time.Duration.between(coupon.getGeneratedAt(), now).toDays();
            dto.setDaysSinceGeneration(days);
        }
        
        return dto;
    }
}
