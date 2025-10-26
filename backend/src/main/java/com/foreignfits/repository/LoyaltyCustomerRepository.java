package com.foreignfits.repository;

import com.foreignfits.entity.LoyaltyCustomer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyCustomerRepository extends JpaRepository<LoyaltyCustomer, Long> {
    
    Optional<LoyaltyCustomer> findByPhoneAndCountryCode(String phone, String countryCode);
    
    boolean existsByPhoneAndCountryCode(String phone, String countryCode);
}
