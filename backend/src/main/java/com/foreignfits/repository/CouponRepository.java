package com.foreignfits.repository;

import com.foreignfits.entity.Coupon;
import com.foreignfits.entity.Coupon.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    /**
     * Find coupon by its unique code
     */
    Optional<Coupon> findByCode(String code);
    
    /**
     * Find all coupons for a specific customer
     */
    List<Coupon> findByCustomerPhoneAndCustomerCountryCode(String phone, String countryCode);
    
    /**
     * Find coupons by status
     */
    List<Coupon> findByStatus(CouponStatus status);
    
    /**
     * Find active coupons for a specific customer
     */
    List<Coupon> findByCustomerPhoneAndCustomerCountryCodeAndStatus(
        String phone, 
        String countryCode, 
        CouponStatus status
    );
    
    /**
     * Find expired coupons (ACTIVE status but validUntil has passed)
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' AND c.validUntil < :date")
    List<Coupon> findExpiredCoupons(@Param("date") LocalDateTime date);
    
    /**
     * Count coupons by status
     */
    long countByStatus(CouponStatus status);
    
    /**
     * Get total amount of redeemed coupons
     */
    @Query("SELECT COALESCE(SUM(c.discountAmount), 0) FROM Coupon c WHERE c.status = 'USED'")
    BigDecimal getTotalRedeemedAmount();
    
    /**
     * Find coupons generated from a specific sale
     */
    List<Coupon> findByGeneratedFromSaleId(Long saleId);
    
    /**
     * Find coupons redeemed in a specific sale
     */
    Optional<Coupon> findByRedeemedInSaleId(Long saleId);
    
    /**
     * Find all active coupons for statistics
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' AND c.validUntil >= :currentDate")
    List<Coupon> findAllActiveCoupons(@Param("currentDate") LocalDateTime currentDate);
    
    /**
     * Find coupons expiring soon (within specified days)
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' " +
           "AND c.validUntil >= :currentDate " +
           "AND c.validUntil <= :expiryDate")
    List<Coupon> findCouponsExpiringSoon(
        @Param("currentDate") LocalDateTime currentDate,
        @Param("expiryDate") LocalDateTime expiryDate
    );
    
    /**
     * Get coupon statistics
     */
    @Query("SELECT " +
           "COUNT(c) as totalGenerated, " +
           "SUM(CASE WHEN c.status = 'USED' THEN 1 ELSE 0 END) as totalRedeemed, " +
           "SUM(CASE WHEN c.status = 'EXPIRED' THEN 1 ELSE 0 END) as totalExpired, " +
           "SUM(CASE WHEN c.status = 'ACTIVE' THEN 1 ELSE 0 END) as totalActive " +
           "FROM Coupon c")
    Object[] getCouponStatistics();
    
    /**
     * Find coupons generated within date range
     */
    @Query("SELECT c FROM Coupon c WHERE c.generatedAt BETWEEN :startDate AND :endDate ORDER BY c.generatedAt DESC")
    List<Coupon> findByGeneratedAtBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Find coupons redeemed within date range
     */
    @Query("SELECT c FROM Coupon c WHERE c.status = 'USED' " +
           "AND c.redeemedAt BETWEEN :startDate AND :endDate ORDER BY c.redeemedAt DESC")
    List<Coupon> findRedeemedCouponsBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
