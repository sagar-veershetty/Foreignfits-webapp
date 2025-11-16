package com.foreignfits.repository;

import com.foreignfits.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);
    
    boolean existsBySku(String sku);
    
    List<Product> findByCategory(Product.ProductCategory category);
    
    // Location-based queries removed - products are now organization-wide
    // Use LocationInventory to find products available at specific locations
    
    List<Product> findByIsApprovedFalse();
    
    // Low stock and out-of-stock queries moved to LocationInventoryRepository
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:searchTerm% OR p.sku LIKE %:searchTerm%")
    List<Product> findBySearchTerm(@Param("searchTerm") String searchTerm);
    
    // Following queries removed - stock is now in LocationInventory table
    // findAvailableProducts() - use LocationInventoryRepository.hasAvailableStock()
    // countLowStockProducts() - use LocationInventoryRepository.findLowStockByLocation()
    // getTotalStockValue() - calculate from LocationInventory.quantity * Product.cost
}