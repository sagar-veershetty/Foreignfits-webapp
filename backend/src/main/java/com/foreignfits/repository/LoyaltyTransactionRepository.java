package com.foreignfits.repository;

import com.foreignfits.entity.LoyaltyCustomer;
import com.foreignfits.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    
    List<LoyaltyTransaction> findByCustomerOrderByCreatedAtDesc(LoyaltyCustomer customer);
    
    @Query("SELECT SUM(t.points) FROM LoyaltyTransaction t WHERE t.customer = ?1 AND t.expiresAt < ?2 AND t.points > 0")
    Integer findExpiredPointsForCustomer(LoyaltyCustomer customer, LocalDateTime now);
}
