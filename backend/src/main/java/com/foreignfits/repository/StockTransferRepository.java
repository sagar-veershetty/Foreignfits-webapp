package com.foreignfits.repository;

import com.foreignfits.entity.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    
    List<StockTransfer> findByStatus(StockTransfer.TransferStatus status);
    
    List<StockTransfer> findByFromLocationId(Long fromLocationId);
    
    List<StockTransfer> findByToLocationId(Long toLocationId);
    
    List<StockTransfer> findByRequestedById(Long requestedById);
    
    @Query("SELECT st FROM StockTransfer st WHERE st.requestedAt BETWEEN :startDate AND :endDate")
    List<StockTransfer> findTransfersBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT st FROM StockTransfer st WHERE st.fromLocation.id = :locationId OR st.toLocation.id = :locationId")
    List<StockTransfer> findByLocationId(@Param("locationId") Long locationId);
    
    @Query("SELECT st FROM StockTransfer st WHERE st.status = 'PENDING' ORDER BY st.requestedAt ASC")
    List<StockTransfer> findPendingTransfersOrderByRequestedAt();
    
    @Query("SELECT st FROM StockTransfer st ORDER BY st.requestedAt DESC")
    List<StockTransfer> findAllOrderByRequestedAtDesc();
}