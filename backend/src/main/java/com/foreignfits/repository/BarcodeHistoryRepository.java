package com.foreignfits.repository;

import com.foreignfits.entity.BarcodeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BarcodeHistoryRepository extends JpaRepository<BarcodeHistory, Long> {
    
    // Find all history for a specific barcode number
    List<BarcodeHistory> findByBarcodeNumberOrderByCreatedAtDesc(String barcodeNumber);
    
    // Find all history for a specific barcode ID
    List<BarcodeHistory> findByBarcodeIdOrderByCreatedAtDesc(Long barcodeId);
    
    // Find history for a specific location (for warehouse/store users)
    @Query("SELECT bh FROM BarcodeHistory bh WHERE " +
           "bh.locationId = :locationId OR " +
           "bh.fromLocationId = :locationId OR " +
           "bh.toLocationId = :locationId " +
           "ORDER BY bh.createdAt DESC")
    List<BarcodeHistory> findByAnyLocationId(@Param("locationId") Long locationId);
    
    // Find history for a specific barcode at a specific location
    @Query("SELECT bh FROM BarcodeHistory bh WHERE " +
           "bh.barcodeNumber = :barcodeNumber AND " +
           "(bh.locationId = :locationId OR " +
           "bh.fromLocationId = :locationId OR " +
           "bh.toLocationId = :locationId) " +
           "ORDER BY bh.createdAt DESC")
    List<BarcodeHistory> findByBarcodeNumberAndLocationId(
        @Param("barcodeNumber") String barcodeNumber,
        @Param("locationId") Long locationId
    );
    
    // Find all history (for admin)
    List<BarcodeHistory> findAllByOrderByCreatedAtDesc();
    
    // Find history within date range
    @Query("SELECT bh FROM BarcodeHistory bh WHERE " +
           "bh.createdAt >= :startDate AND bh.createdAt <= :endDate " +
           "ORDER BY bh.createdAt DESC")
    List<BarcodeHistory> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Find history for location within date range
    @Query("SELECT bh FROM BarcodeHistory bh WHERE " +
           "(bh.locationId = :locationId OR " +
           "bh.fromLocationId = :locationId OR " +
           "bh.toLocationId = :locationId) AND " +
           "bh.createdAt >= :startDate AND bh.createdAt <= :endDate " +
           "ORDER BY bh.createdAt DESC")
    List<BarcodeHistory> findByLocationIdAndDateRange(
        @Param("locationId") Long locationId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
