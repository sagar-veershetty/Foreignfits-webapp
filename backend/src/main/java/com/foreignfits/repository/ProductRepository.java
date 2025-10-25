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
    
    Optional<Product> findByBarcode(String barcode);
    
    boolean existsBySku(String sku);
    
    boolean existsByBarcode(String barcode);
    
    List<Product> findByCategory(Product.ProductCategory category);
    
    List<Product> findByLocationId(Long locationId);
    
    @Query("SELECT p FROM Product p WHERE p.location.id = :locationId AND p.sku = :sku")
    Optional<Product> findByLocationIdAndSku(@Param("locationId") Long locationId, @Param("sku") String sku);
    
    @Query("SELECT p FROM Product p WHERE p.stock <= p.minStock")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.stock = 0")
    List<Product> findOutOfStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:searchTerm% OR p.sku LIKE %:searchTerm% OR p.barcode LIKE %:searchTerm%")
    List<Product> findBySearchTerm(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT p FROM Product p WHERE p.category = :category AND p.location.id = :locationId")
    List<Product> findByCategoryAndLocation(@Param("category") Product.ProductCategory category, @Param("locationId") Long locationId);
    
    @Query("SELECT p FROM Product p WHERE p.stock > 0")
    List<Product> findAvailableProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= p.minStock")
    Long countLowStockProducts();
    
    @Query("SELECT SUM(p.stock * p.cost) FROM Product p")
    Double getTotalStockValue();
}