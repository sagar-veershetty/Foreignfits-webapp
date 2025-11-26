package com.foreignfits.repository;

import com.foreignfits.entity.Exchange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeRepository extends JpaRepository<Exchange, Long> {
    
    @Query("SELECT e FROM Exchange e WHERE e.originalSale.id = :saleId ORDER BY e.createdAt DESC")
    List<Exchange> findByOriginalSaleId(@Param("saleId") Long saleId);
    
    @Query("SELECT e FROM Exchange e WHERE e.location.id = :locationId ORDER BY e.createdAt DESC")
    List<Exchange> findByLocationId(@Param("locationId") Long locationId);
    
    @Query("SELECT e FROM Exchange e ORDER BY e.createdAt DESC")
    List<Exchange> findAllOrderByCreatedAtDesc();
}
