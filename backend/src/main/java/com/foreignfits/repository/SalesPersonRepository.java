package com.foreignfits.repository;

import com.foreignfits.entity.SalesPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesPersonRepository extends JpaRepository<SalesPerson, Long> {
    
    Optional<SalesPerson> findByName(String name);
    
    List<SalesPerson> findByIsActiveTrue();
    
    List<SalesPerson> findByLocationId(Long locationId);
    
    List<SalesPerson> findByIsActiveTrueOrderByNameAsc();
}
