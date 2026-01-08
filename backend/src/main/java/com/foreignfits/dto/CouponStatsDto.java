package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponStatsDto {
    private long totalGenerated;
    private long totalActive;
    private long totalUsed;
    private long totalExpired;
    private long totalCancelled;
    private BigDecimal totalDiscountGiven;
    private BigDecimal averageDiscountAmount;
    private double redemptionRate; // percentage
    private double expiryRate; // percentage
    private long expiringSoon; // expiring in next 7 days
    private BigDecimal potentialRevenue; // from active coupons
}
