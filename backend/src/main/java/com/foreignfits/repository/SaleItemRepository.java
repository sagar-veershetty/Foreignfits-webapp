package com.foreignfits.repository;

import com.foreignfits.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Query("select distinct si.salesPersonName, s.location.id " +
           "from SaleItem si join si.sale s " +
           "where si.salesPersonName is not null " +
           "and trim(si.salesPersonName) <> '' " +
           "and (:locationId is null or s.location.id = :locationId)")
    List<Object[]> findDistinctSalesPersonNamesWithLocation(@Param("locationId") Long locationId);
}