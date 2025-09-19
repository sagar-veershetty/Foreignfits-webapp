package com.foreignfits.repository;

import com.foreignfits.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    
    List<Location> findByIsActiveTrue();
    
    List<Location> findByType(Location.LocationType type);
    
    List<Location> findByTypeAndIsActiveTrue(Location.LocationType type);
    
    @Query("SELECT l FROM Location l WHERE l.isActive = true AND l.type = :type")
    List<Location> findActiveLocationsByType(@Param("type") Location.LocationType type);
    
    @Query("SELECT l FROM Location l WHERE l.city = :city AND l.isActive = true")
    List<Location> findActiveLocationsByCity(@Param("city") String city);
    
    @Query("SELECT l FROM Location l WHERE l.state = :state AND l.isActive = true")
    List<Location> findActiveLocationsByState(@Param("state") String state);
}