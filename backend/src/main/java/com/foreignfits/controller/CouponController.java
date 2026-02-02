package com.foreignfits.controller;

import com.foreignfits.dto.CouponDto;
import com.foreignfits.dto.CouponStatsDto;
import com.foreignfits.dto.CouponValidationResult;
import com.foreignfits.entity.Coupon;
import com.foreignfits.entity.Coupon.CouponStatus;
import com.foreignfits.service.CouponService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
public class CouponController {
    
    private static final Logger logger = LoggerFactory.getLogger(CouponController.class);
    
    @Autowired
    private CouponService couponService;
    
    /**
     * Validate coupon code
     * Public endpoint - can be called during checkout
     */
    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCoupon(
            @PathVariable String code,
            @RequestParam BigDecimal purchaseAmount) {
        try {
            logger.info("Validating coupon: {} for purchase amount: {}", code, purchaseAmount);
            
            CouponValidationResult result = couponService.validateCoupon(code, purchaseAmount);
            
            if (result.isValid()) {
                return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "message", result.getMessage(),
                    "discountAmount", result.getDiscountAmount(),
                    "code", result.getCoupon().getCode()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", result.getMessage()
                ));
            }
            
        } catch (Exception e) {
            logger.error("Error validating coupon {}: {}", code, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("valid", false, "message", "Error validating coupon"));
        }
    }
    
    /**
     * Get customer's active coupons
     * Public endpoint - customer can check their coupons
     */
    @GetMapping("/customer")
    public ResponseEntity<List<CouponDto>> getCustomerCoupons(
            @RequestParam String phone,
            @RequestParam(defaultValue = "+91") String countryCode) {
        try {
            logger.info("Fetching active coupons for customer: {}/{}", countryCode, phone);
            
            List<Coupon> coupons = couponService.getCustomerActiveCoupons(phone, countryCode);
            List<CouponDto> couponDtos = coupons.stream()
                .map(CouponDto::fromEntity)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(couponDtos);
            
        } catch (Exception e) {
            logger.error("Error fetching customer coupons for {}/{}: {}", 
                countryCode, phone, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get coupon by code (with details)
     * Admin endpoint
     */
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<?> getCouponByCode(@PathVariable String code) {
        try {
            Optional<Coupon> couponOpt = couponService.getCouponByCode(code);
            
            if (couponOpt.isPresent()) {
                CouponDto dto = CouponDto.fromEntity(couponOpt.get());
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Coupon not found"));
            }
            
        } catch (Exception e) {
            logger.error("Error fetching coupon by code {}: {}", code, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get all coupons (with optional status filter)
     * Admin endpoint
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<List<CouponDto>> getAllCoupons(
            @RequestParam(required = false) String status) {
        try {
            List<Coupon> coupons;
            
            if (status != null && !status.isEmpty()) {
                CouponStatus couponStatus = CouponStatus.valueOf(status.toUpperCase());
                coupons = couponService.getCouponsByStatus(couponStatus);
                logger.info("Fetching coupons with status: {}", status);
            } else {
                coupons = couponService.getAllCoupons();
                logger.info("Fetching all coupons");
            }
            
            List<CouponDto> couponDtos = coupons.stream()
                .map(CouponDto::fromEntity)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(couponDtos);
            
        } catch (IllegalArgumentException e) {
            logger.error("Invalid coupon status: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error fetching coupons: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get coupon statistics
     * Admin endpoint
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<CouponStatsDto> getCouponStats() {
        try {
            logger.info("Fetching coupon statistics");
            CouponStatsDto stats = couponService.getCouponStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching coupon stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Cancel coupon
     * Admin endpoint
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelCoupon(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            String reason = request != null ? request.get("reason") : null;
            boolean cancelled = couponService.cancelCoupon(id, reason);
            
            if (cancelled) {
                logger.info("Coupon {} cancelled successfully", id);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Coupon cancelled successfully"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "success", false,
                        "message", "Coupon cannot be cancelled (not found or already used/expired)"
                    ));
            }
            
        } catch (Exception e) {
            logger.error("Error cancelling coupon {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error cancelling coupon"));
        }
    }
    
    /**
     * Get coupons generated within date range
     * Admin endpoint for reports
     */
    @GetMapping("/generated")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<List<CouponDto>> getCouponsGeneratedBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            logger.info("Fetching coupons generated between {} and {}", startDate, endDate);
            
            List<Coupon> coupons = couponService.getCouponsGeneratedBetween(startDate, endDate);
            List<CouponDto> couponDtos = coupons.stream()
                .map(CouponDto::fromEntity)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(couponDtos);
            
        } catch (Exception e) {
            logger.error("Error fetching coupons generated between dates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get coupons redeemed within date range
     * Admin endpoint for reports
     */
    @GetMapping("/redeemed")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_MANAGER')")
    public ResponseEntity<List<CouponDto>> getCouponsRedeemedBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            logger.info("Fetching coupons redeemed between {} and {}", startDate, endDate);
            
            List<Coupon> coupons = couponService.getCouponsRedeemedBetween(startDate, endDate);
            List<CouponDto> couponDtos = coupons.stream()
                .map(CouponDto::fromEntity)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(couponDtos);
            
        } catch (Exception e) {
            logger.error("Error fetching coupons redeemed between dates: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
