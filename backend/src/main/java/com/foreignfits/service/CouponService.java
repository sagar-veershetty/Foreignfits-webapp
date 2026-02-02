package com.foreignfits.service;

import com.foreignfits.dto.CouponStatsDto;
import com.foreignfits.dto.CouponValidationResult;
import com.foreignfits.entity.Coupon;
import com.foreignfits.entity.Coupon.CouponStatus;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Sale;
import com.foreignfits.entity.User;
import com.foreignfits.repository.CouponRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {
    
    private static final Logger logger = LoggerFactory.getLogger(CouponService.class);
    
    // Configuration constants
    private static final BigDecimal MINIMUM_SALE_AMOUNT_FOR_GENERATION = new BigDecimal("3000");
    private static final BigDecimal DEFAULT_COUPON_AMOUNT = new BigDecimal("500");
    private static final BigDecimal DEFAULT_MIN_PURCHASE_AMOUNT = new BigDecimal("2000");
    private static final int COUPON_VALIDITY_DAYS = 30;
    private static final String COUPON_PREFIX = "FF-";
    private static final int COUPON_CODE_LENGTH = 6;
    private static final String COUPON_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars
    
    @Autowired
    private CouponRepository couponRepository;
    
    private final SecureRandom random = new SecureRandom();
    
    /**
     * Generate coupon for a qualifying sale (₹3000+)
     * Uses REQUIRES_NEW to run in separate transaction from sale
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Coupon generateCouponForSale(Sale sale) {
        try {
            // Check if sale qualifies (≥ ₹3000)
            if (sale.getTotal().compareTo(MINIMUM_SALE_AMOUNT_FOR_GENERATION) < 0) {
                logger.debug("Sale {} does not qualify for coupon generation. Amount: {}", 
                    sale.getId(), sale.getTotal());
                return null;
            }
            
            // Generate unique code
            String code = generateUniqueCouponCode();
            
            // Create coupon
            Coupon coupon = new Coupon();
            coupon.setCode(code);
            coupon.setDiscountAmount(DEFAULT_COUPON_AMOUNT);
            coupon.setMinPurchaseAmount(DEFAULT_MIN_PURCHASE_AMOUNT);
            coupon.setStatus(CouponStatus.ACTIVE);
            
            // Customer info
            coupon.setCustomerName(sale.getCustomerName());
            coupon.setCustomerPhone(sale.getCustomerPhone());
            coupon.setCustomerCountryCode(sale.getCustomerCountryCode());
            
            // Generation details
            coupon.setGeneratedFromSale(sale);
            coupon.setGeneratedAt(LocalDateTime.now());
            coupon.setValidUntil(LocalDateTime.now().plusDays(COUPON_VALIDITY_DAYS));
            
            Coupon savedCoupon = couponRepository.save(coupon);
            
            logger.info("Generated coupon {} for sale {}. Customer: {}, Valid until: {}", 
                code, sale.getId(), sale.getCustomerName(), coupon.getValidUntil());
            
            return savedCoupon;
            
        } catch (Exception e) {
            logger.error("Error generating coupon for sale {}: {}", sale.getId(), e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Validate coupon for redemption
     */
    @Transactional(readOnly = true)
    public CouponValidationResult validateCoupon(String code, BigDecimal purchaseAmount) {
        try {
            // Normalize code
            String normalizedCode = code.toUpperCase().trim();
            
            Optional<Coupon> couponOpt = couponRepository.findByCode(normalizedCode);
            
            if (!couponOpt.isPresent()) {
                logger.warn("Coupon validation failed: Invalid code {}", normalizedCode);
                return new CouponValidationResult(false, "Invalid coupon code");
            }
            
            Coupon coupon = couponOpt.get();
            
            // Check status
            if (coupon.getStatus() != CouponStatus.ACTIVE) {
                String statusMessage = getStatusMessage(coupon.getStatus());
                logger.warn("Coupon {} validation failed: {}", normalizedCode, statusMessage);
                return new CouponValidationResult(false, statusMessage);
            }
            
            // Check expiry
            if (LocalDateTime.now().isAfter(coupon.getValidUntil())) {
                logger.warn("Coupon {} has expired. Valid until: {}", normalizedCode, coupon.getValidUntil());
                return new CouponValidationResult(false, "Coupon has expired");
            }
            
            // Check minimum purchase
            if (purchaseAmount.compareTo(coupon.getMinPurchaseAmount()) < 0) {
                String message = String.format("Minimum purchase of ₹%.2f required to use this coupon", 
                    coupon.getMinPurchaseAmount());
                logger.warn("Coupon {} validation failed: Purchase amount {} is less than minimum {}", 
                    normalizedCode, purchaseAmount, coupon.getMinPurchaseAmount());
                return new CouponValidationResult(false, message);
            }
            
            // Check if discount exceeds purchase amount (shouldn't happen, but safety check)
            if (coupon.getDiscountAmount().compareTo(purchaseAmount) >= 0) {
                logger.warn("Coupon {} discount {} exceeds or equals purchase amount {}", 
                    normalizedCode, coupon.getDiscountAmount(), purchaseAmount);
                return new CouponValidationResult(false, "Coupon discount cannot exceed purchase amount");
            }
            
            logger.info("Coupon {} validated successfully. Discount: ₹{}", normalizedCode, coupon.getDiscountAmount());
            return new CouponValidationResult(true, "Coupon is valid", coupon);
            
        } catch (Exception e) {
            logger.error("Error validating coupon {}: {}", code, e.getMessage(), e);
            return new CouponValidationResult(false, "Error validating coupon. Please try again.");
        }
    }
    
    /**
     * Redeem coupon
     * Uses REQUIRES_NEW to run in separate transaction from sale
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void redeemCoupon(String couponCode, Sale sale, User user) {
        try {
            // Fetch coupon fresh in this transaction to avoid conflicts
            String normalizedCode = couponCode.toUpperCase().trim();
            Coupon coupon = couponRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Coupon not found: " + normalizedCode));
            
            coupon.setStatus(CouponStatus.USED);
            coupon.setRedeemedAt(LocalDateTime.now());
            coupon.setRedeemedInSale(sale);
            coupon.setRedeemedByUser(user);
            coupon.setRedeemedAtLocation(sale.getLocation());
            
            couponRepository.save(coupon);
            
            logger.info("Coupon {} redeemed in sale {}. Amount saved: ₹{}. Redeemed by: {}", 
                coupon.getCode(), sale.getId(), coupon.getDiscountAmount(), user.getName());
                
        } catch (Exception e) {
            logger.error("Error redeeming coupon {} in sale {}: {}", 
                couponCode, sale.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to redeem coupon", e);
        }
    }
    
    /**
     * Generate unique coupon code (Format: FF-XXXXXX)
     */
    private String generateUniqueCouponCode() {
        int maxAttempts = 10;
        int attempts = 0;
        
        while (attempts < maxAttempts) {
            StringBuilder codeBuilder = new StringBuilder(COUPON_PREFIX);
            
            for (int i = 0; i < COUPON_CODE_LENGTH; i++) {
                int index = random.nextInt(COUPON_CHARS.length());
                codeBuilder.append(COUPON_CHARS.charAt(index));
            }
            
            String code = codeBuilder.toString();
            
            // Check if code already exists
            if (!couponRepository.findByCode(code).isPresent()) {
                return code;
            }
            
            attempts++;
        }
        
        throw new RuntimeException("Failed to generate unique coupon code after " + maxAttempts + " attempts");
    }
    
    /**
     * Get customer's active coupons
     */
    @Transactional(readOnly = true)
    public List<Coupon> getCustomerActiveCoupons(String phone, String countryCode) {
        try {
            List<Coupon> coupons = couponRepository.findByCustomerPhoneAndCustomerCountryCodeAndStatus(
                phone, countryCode, CouponStatus.ACTIVE
            );
            
            // Filter out expired ones
            LocalDateTime now = LocalDateTime.now();
            return coupons.stream()
                .filter(c -> c.getValidUntil().isAfter(now))
                .toList();
                
        } catch (Exception e) {
            logger.error("Error fetching active coupons for customer {}/{}: {}", 
                countryCode, phone, e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Get all coupons (admin)
     */
    @Transactional(readOnly = true)
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }
    
    /**
     * Get coupons by status
     */
    @Transactional(readOnly = true)
    public List<Coupon> getCouponsByStatus(CouponStatus status) {
        return couponRepository.findByStatus(status);
    }
    
    /**
     * Get coupon by code (admin)
     */
    @Transactional(readOnly = true)
    public Optional<Coupon> getCouponByCode(String code) {
        return couponRepository.findByCode(code.toUpperCase().trim());
    }
    
    /**
     * Cancel coupon (admin)
     */
    @Transactional
    public boolean cancelCoupon(Long id, String reason) {
        try {
            Optional<Coupon> couponOpt = couponRepository.findById(id);
            if (couponOpt.isPresent()) {
                Coupon coupon = couponOpt.get();
                if (coupon.getStatus() == CouponStatus.ACTIVE) {
                    coupon.setStatus(CouponStatus.CANCELLED);
                    coupon.setNotes(reason != null ? reason : "Cancelled by admin");
                    couponRepository.save(coupon);
                    logger.info("Coupon {} cancelled. Reason: {}", coupon.getCode(), reason);
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            logger.error("Error cancelling coupon {}: {}", id, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get coupon statistics
     */
    @Transactional(readOnly = true)
    public CouponStatsDto getCouponStatistics() {
        try {
            CouponStatsDto stats = new CouponStatsDto();
            
            // Basic counts
            long totalGenerated = couponRepository.count();
            long totalActive = couponRepository.countByStatus(CouponStatus.ACTIVE);
            long totalUsed = couponRepository.countByStatus(CouponStatus.USED);
            long totalExpired = couponRepository.countByStatus(CouponStatus.EXPIRED);
            long totalCancelled = couponRepository.countByStatus(CouponStatus.CANCELLED);
            
            stats.setTotalGenerated(totalGenerated);
            stats.setTotalActive(totalActive);
            stats.setTotalUsed(totalUsed);
            stats.setTotalExpired(totalExpired);
            stats.setTotalCancelled(totalCancelled);
            
            // Total discount given
            BigDecimal totalDiscountGiven = couponRepository.getTotalRedeemedAmount();
            stats.setTotalDiscountGiven(totalDiscountGiven);
            
            // Average discount
            if (totalUsed > 0) {
                BigDecimal avgDiscount = totalDiscountGiven.divide(
                    BigDecimal.valueOf(totalUsed), 2, RoundingMode.HALF_UP
                );
                stats.setAverageDiscountAmount(avgDiscount);
            } else {
                stats.setAverageDiscountAmount(BigDecimal.ZERO);
            }
            
            // Rates
            if (totalGenerated > 0) {
                double redemptionRate = (totalUsed * 100.0) / totalGenerated;
                double expiryRate = (totalExpired * 100.0) / totalGenerated;
                stats.setRedemptionRate(Math.round(redemptionRate * 100.0) / 100.0);
                stats.setExpiryRate(Math.round(expiryRate * 100.0) / 100.0);
            }
            
            // Expiring soon (next 7 days)
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime sevenDaysLater = now.plusDays(7);
            List<Coupon> expiringSoon = couponRepository.findCouponsExpiringSoon(now, sevenDaysLater);
            stats.setExpiringSoon(expiringSoon.size());
            
            // Potential revenue from active coupons
            List<Coupon> activeCoupons = couponRepository.findAllActiveCoupons(now);
            BigDecimal potentialRevenue = activeCoupons.stream()
                .map(Coupon::getMinPurchaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            stats.setPotentialRevenue(potentialRevenue);
            
            return stats;
            
        } catch (Exception e) {
            logger.error("Error calculating coupon statistics: {}", e.getMessage(), e);
            return new CouponStatsDto();
        }
    }
    
    /**
     * Scheduled task to auto-expire coupons
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void expireOldCoupons() {
        try {
            List<Coupon> expiredCoupons = couponRepository.findExpiredCoupons(LocalDateTime.now());
            
            if (!expiredCoupons.isEmpty()) {
                expiredCoupons.forEach(coupon -> {
                    coupon.setStatus(CouponStatus.EXPIRED);
                    logger.debug("Auto-expired coupon: {}", coupon.getCode());
                });
                
                couponRepository.saveAll(expiredCoupons);
                logger.info("Auto-expired {} coupons", expiredCoupons.size());
            } else {
                logger.debug("No coupons to auto-expire");
            }
            
        } catch (Exception e) {
            logger.error("Error in scheduled coupon expiry task: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Get status message for UI display
     */
    private String getStatusMessage(CouponStatus status) {
        return switch (status) {
            case USED -> "This coupon has already been used";
            case EXPIRED -> "This coupon has expired";
            case CANCELLED -> "This coupon has been cancelled";
            default -> "Coupon is not valid";
        };
    }
    
    /**
     * Get coupons generated within date range
     */
    @Transactional(readOnly = true)
    public List<Coupon> getCouponsGeneratedBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return couponRepository.findByGeneratedAtBetween(startDate, endDate);
    }
    
    /**
     * Get coupons redeemed within date range
     */
    @Transactional(readOnly = true)
    public List<Coupon> getCouponsRedeemedBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return couponRepository.findRedeemedCouponsBetween(startDate, endDate);
    }
}
