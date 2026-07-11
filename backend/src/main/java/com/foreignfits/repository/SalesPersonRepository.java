package com.foreignfits.repository;

import com.foreignfits.entity.SalesPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesPersonRepository extends JpaRepository<SalesPerson, Long> {
    
    Optional<SalesPerson> findByName(String name);

    Optional<SalesPerson> findByNameIgnoreCase(String name);

    @Query("select sp from SalesPerson sp " +
        "where lower(sp.name) = lower(:name) " +
        "and (sp.isDeleted = false or sp.isDeleted is null)")
    Optional<SalesPerson> findByNameIgnoreCaseAndNotDeleted(@Param("name") String name);

    @Query("select sp from SalesPerson sp " +
        "where sp.isActive = true " +
        "and (sp.isDeleted = false or sp.isDeleted is null) " +
        "order by sp.name asc")
    List<SalesPerson> findActiveNotDeletedOrderByNameAsc();

    @Query("select sp from SalesPerson sp " +
        "where (sp.isDeleted = false or sp.isDeleted is null) " +
        "and (sp.location.id = :locationId or sp.location is null) " +
        "order by sp.name asc")
    List<SalesPerson> findByLocationIdOrLocationIsNullNotDeletedOrderByNameAsc(@Param("locationId") Long locationId);

    @Query("select sp from SalesPerson sp " +
        "where (sp.isDeleted = false or sp.isDeleted is null) " +
        "order by sp.name asc")
    List<SalesPerson> findNotDeletedOrderByNameAsc();
}
