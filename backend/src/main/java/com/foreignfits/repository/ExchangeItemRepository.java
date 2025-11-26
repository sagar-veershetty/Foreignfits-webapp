package com.foreignfits.repository;

import com.foreignfits.entity.ExchangeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeItemRepository extends JpaRepository<ExchangeItem, Long> {
    
    @Query("SELECT ei FROM ExchangeItem ei WHERE ei.exchange.id = :exchangeId")
    List<ExchangeItem> findByExchangeId(@Param("exchangeId") Long exchangeId);
}
