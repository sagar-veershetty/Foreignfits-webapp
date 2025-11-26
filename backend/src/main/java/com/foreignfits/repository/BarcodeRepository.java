package com.foreignfits.repository;

import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BarcodeRepository extends JpaRepository<Barcode, Long> {
    
    /**
     * Find a barcode by its unique barcode number
     */
    Optional<Barcode> findByBarcodeNumber(String barcodeNumber);
    
    /**
     * Find all barcodes for a specific product
     */
    List<Barcode> findByProduct(Product product);
    
    /**
     * Find all barcodes currently at a specific location
     */
    List<Barcode> findByCurrentLocation(Location location);
    
    /**
     * Find barcodes for a specific product at a specific location
     */
    List<Barcode> findByProductAndCurrentLocation(Product product, Location location);
    
    /**
     * Count barcodes for a specific product at a specific location
     */
    @Query("SELECT COUNT(b) FROM Barcode b WHERE b.product = :product AND b.currentLocation = :location")
    Long countByProductAndCurrentLocation(@Param("product") Product product, @Param("location") Location location);
    
    /**
     * Check if a barcode number already exists
     */
    boolean existsByBarcodeNumber(String barcodeNumber);
    
    /**
     * Find N barcodes for a product at a location (for transfer operations)
     */
    @Query("SELECT b FROM Barcode b WHERE b.product = :product AND b.currentLocation = :location ORDER BY b.createdAt ASC")
    List<Barcode> findBarcodesForTransfer(@Param("product") Product product, @Param("location") Location location);
    
    /**
     * Find barcodes by product SKU and location (across different product instances)
     */
    @Query("SELECT b FROM Barcode b JOIN b.product p WHERE p.sku = :sku AND b.currentLocation = :location")
    List<Barcode> findByProductSkuAndLocation(@Param("sku") String sku, @Param("location") Location location);
    
    /**
     * Find ACTIVE barcodes by product SKU and location (for printing)
     */
    @Query("SELECT b FROM Barcode b JOIN b.product p WHERE p.sku = :sku AND b.currentLocation = :location AND b.status = 'ACTIVE'")
    List<Barcode> findActiveBarcodesByProductSkuAndLocation(@Param("sku") String sku, @Param("location") Location location);
    
    /**
     * Count ACTIVE barcodes for a specific product at a specific location
     */
    @Query("SELECT COUNT(b) FROM Barcode b WHERE b.product = :product AND b.currentLocation = :location AND b.status = 'ACTIVE'")
    Long countActiveByProductAndCurrentLocation(@Param("product") Product product, @Param("location") Location location);
}
