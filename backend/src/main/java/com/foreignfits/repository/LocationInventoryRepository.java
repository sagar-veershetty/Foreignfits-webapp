package com.foreignfits.repository;

import com.foreignfits.entity.LocationInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationInventoryRepository extends JpaRepository<LocationInventory, Long> {
    
    // Find inventory for a specific product at a specific location
    Optional<LocationInventory> findByLocationIdAndProductSku(Long locationId, String productSku);
    
    // Get all inventory at a location
    List<LocationInventory> findByLocationId(Long locationId);
    
    // Get all locations where a product exists
    List<LocationInventory> findByProductSku(String productSku);
    
    // Get all inventory for a specific product (by product ID)
    List<LocationInventory> findByProductId(Long productId);
    
    // Find low stock items at a location
    @Query("SELECT li FROM LocationInventory li WHERE li.location.id = :locationId AND li.quantity <= li.minStock")
    List<LocationInventory> findLowStockByLocation(@Param("locationId") Long locationId);
    
    // Find all low stock items across all locations
    @Query("SELECT li FROM LocationInventory li WHERE li.quantity <= li.minStock")
    List<LocationInventory> findAllLowStock();
    
    // Find items that need reordering at a location
    @Query("SELECT li FROM LocationInventory li WHERE li.location.id = :locationId AND li.quantity <= li.reorderPoint")
    List<LocationInventory> findReorderItemsByLocation(@Param("locationId") Long locationId);
    
    // Find out of stock items at a location
    @Query("SELECT li FROM LocationInventory li WHERE li.location.id = :locationId AND li.quantity = 0")
    List<LocationInventory> findOutOfStockByLocation(@Param("locationId") Long locationId);
    
    // Find overstocked items at a location
    @Query("SELECT li FROM LocationInventory li WHERE li.location.id = :locationId AND li.maxStock IS NOT NULL AND li.quantity >= li.maxStock")
    List<LocationInventory> findOverStockByLocation(@Param("locationId") Long locationId);
    
    // Get total quantity of a product across all locations
    @Query("SELECT SUM(li.quantity) FROM LocationInventory li WHERE li.productSku = :productSku")
    Integer getTotalQuantityByProductSku(@Param("productSku") String productSku);
    
    // Check if product exists at location with sufficient quantity
    @Query("SELECT CASE WHEN COUNT(li) > 0 THEN true ELSE false END FROM LocationInventory li WHERE li.location.id = :locationId AND li.productSku = :productSku AND li.quantity >= :requiredQuantity")
    boolean hasAvailableStock(@Param("locationId") Long locationId, @Param("productSku") String productSku, @Param("requiredQuantity") Integer requiredQuantity);
    
    // Get inventory summary by location
    @Query("SELECT li.location.id, li.location.name, COUNT(li), SUM(li.quantity) FROM LocationInventory li GROUP BY li.location.id, li.location.name")
    List<Object[]> getInventorySummaryByLocation();
}
