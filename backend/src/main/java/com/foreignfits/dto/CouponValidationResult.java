package com.foreignfits.dto;

import com.foreignfits.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationResult {
    private boolean valid;
    private String message;
    private Coupon coupon;
    private BigDecimal discountAmount;
    
    public CouponValidationResult(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }
    
    public CouponValidationResult(boolean valid, String message, Coupon coupon) {
        this.valid = valid;
        this.message = message;
        this.coupon = coupon;
        if (coupon != null) {
            this.discountAmount = coupon.getDiscountAmount();
        }
    }
}
