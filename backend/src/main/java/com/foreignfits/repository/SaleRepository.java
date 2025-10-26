package com.foreignfits.repository;

import com.foreignfits.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    
    List<Sale> findBySoldById(Long soldById);
    
    List<Sale> findByIsActive(Boolean isActive);
    
    List<Sale> findByPaymentMethod(Sale.PaymentMethod paymentMethod);
    
    @Query("SELECT s FROM Sale s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    List<Sale> findSalesBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s FROM Sale s WHERE s.customerName LIKE %:customerName%")
    List<Sale> findByCustomerNameContaining(@Param("customerName") String customerName);
    
    @Query("SELECT SUM(s.total) FROM Sale s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    Long getSalesCountBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT AVG(s.total) FROM Sale s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    Double getAverageOrderValueBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s FROM Sale s WHERE s.createdAt = CURRENT_DATE")
    List<Sale> findTodaysSales();
    
    @Query("SELECT SUM(s.total) FROM Sale s WHERE s.createdAt = CURRENT_DATE")
    BigDecimal getTodaysRevenue();
}