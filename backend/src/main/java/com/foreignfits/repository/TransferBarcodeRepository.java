package com.foreignfits.repository;

import com.foreignfits.entity.TransferBarcode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferBarcodeRepository extends JpaRepository<TransferBarcode, Long> {
    
    List<TransferBarcode> findByTransferId(Long transferId);
    
    @Query("SELECT tb FROM TransferBarcode tb WHERE tb.barcodeNumber = :barcodeNumber " +
           "AND tb.transfer.status NOT IN ('COMPLETED', 'CANCELLED')")
    Optional<TransferBarcode> findPendingTransferByBarcodeNumber(@Param("barcodeNumber") String barcodeNumber);
    
    @Query("SELECT tb FROM TransferBarcode tb WHERE tb.barcodeNumber IN :barcodeNumbers " +
           "AND tb.transfer.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<TransferBarcode> findPendingTransfersByBarcodeNumbers(@Param("barcodeNumbers") List<String> barcodeNumbers);
}
