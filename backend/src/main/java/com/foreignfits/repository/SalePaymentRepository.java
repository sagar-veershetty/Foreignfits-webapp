package com.foreignfits.repository;

import com.foreignfits.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {
    List<SalePayment> findBySaleId(Long saleId);
}
