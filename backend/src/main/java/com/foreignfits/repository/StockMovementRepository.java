package com.foreignfits.repository;

import com.foreignfits.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    
    List<StockMovement> findByProductId(Long productId);
    
    List<StockMovement> findByType(StockMovement.MovementType type);
    
    // Removed findByLocationId - use queries with transfer.fromLocation and transfer.toLocation instead
    
    @Query("SELECT sm FROM StockMovement sm WHERE sm.createdAt BETWEEN :startDate AND :endDate")
    List<StockMovement> findMovementsBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT sm FROM StockMovement sm WHERE sm.product.id = :productId ORDER BY sm.createdAt DESC")
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);
    
    @Query("SELECT sm FROM StockMovement sm WHERE sm.createdBy = :createdBy")
    List<StockMovement> findByCreatedBy(@Param("createdBy") String createdBy);
    
    List<StockMovement> findByReference(String reference);
    
    @Query("SELECT sm FROM StockMovement sm WHERE sm.status = 'PENDING' ORDER BY sm.createdAt DESC")
    List<StockMovement> findByStatusPendingOrderByCreatedAtDesc();
    
    @Query("SELECT sm FROM StockMovement sm ORDER BY sm.createdAt DESC")
    List<StockMovement> findAllOrderByCreatedAtDesc();
    
    // User-based filtering: movements at user's location OR created by user
    // All movements now have transfers, so check fromLocation or toLocation
    // FETCH transfer and its locations eagerly to avoid lazy loading issues
    @Query("SELECT DISTINCT sm FROM StockMovement sm " +
           "LEFT JOIN FETCH sm.transfer t " +
           "LEFT JOIN FETCH t.fromLocation " +
           "LEFT JOIN FETCH t.toLocation " +
           "WHERE t IS NOT NULL AND (t.fromLocation.id = :locationId OR t.toLocation.id = :locationId OR sm.createdBy = :createdBy) " +
           "ORDER BY sm.createdAt DESC")
    List<StockMovement> findByLocationIdOrCreatedByOrderByCreatedAtDesc(@Param("locationId") Long locationId, @Param("createdBy") String createdBy);
    
    // Pending movements for user: status PENDING AND movements at their location OR created by them
    // Check fromLocation or toLocation from transfer
    // FETCH transfer and its locations eagerly to avoid lazy loading issues
    @Query("SELECT DISTINCT sm FROM StockMovement sm " +
           "LEFT JOIN FETCH sm.transfer t " +
           "LEFT JOIN FETCH t.fromLocation " +
           "LEFT JOIN FETCH t.toLocation " +
           "WHERE sm.status = 'PENDING' AND t IS NOT NULL AND (t.fromLocation.id = :locationId OR t.toLocation.id = :locationId OR sm.createdBy = :createdBy) " +
           "ORDER BY sm.createdAt DESC")
    List<StockMovement> findPendingByLocationIdOrCreatedByOrderByCreatedAtDesc(@Param("locationId") Long locationId, @Param("createdBy") String createdBy);
}