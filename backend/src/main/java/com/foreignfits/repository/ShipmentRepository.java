package com.foreignfits.repository;

import com.foreignfits.entity.Shipment;
import com.foreignfits.entity.Shipment.PaymentStatus;
import com.foreignfits.entity.Shipment.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    // Find by shipping ID
    Optional<Shipment> findByShippingId(String shippingId);

    // Find by status
    List<Shipment> findByStatus(ShipmentStatus status);

    // Find by payment status
    List<Shipment> findByPaymentStatus(PaymentStatus paymentStatus);

    // Find by created agent
    List<Shipment> findByCreatedByAgent(String agentEmail);

    // Find by received agent
    List<Shipment> findByReceivedByAgent(String agentEmail);

    // Find by date range
    @Query("SELECT s FROM Shipment s WHERE s.createdAt BETWEEN :startDate AND :endDate ORDER BY s.createdAt DESC")
    List<Shipment> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);

    // Find by ETA range
    @Query("SELECT s FROM Shipment s WHERE s.eta BETWEEN :startDate AND :endDate ORDER BY s.eta ASC")
    List<Shipment> findByEtaRange(@Param("startDate") LocalDate startDate, 
                                   @Param("endDate") LocalDate endDate);

    // Complex filter query
    @Query("SELECT s FROM Shipment s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:paymentStatus IS NULL OR s.paymentStatus = :paymentStatus) AND " +
           "(:isBranded IS NULL OR s.isBranded = :isBranded) AND " +
           "(:agentEmail IS NULL OR s.createdByAgent = :agentEmail OR s.receivedByAgent = :agentEmail) AND " +
           "(:startDate IS NULL OR s.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR s.createdAt <= :endDate) " +
           "ORDER BY s.createdAt DESC")
    List<Shipment> findWithFilters(@Param("status") ShipmentStatus status,
                                   @Param("paymentStatus") PaymentStatus paymentStatus,
                                   @Param("isBranded") Boolean isBranded,
                                   @Param("agentEmail") String agentEmail,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);

    // Get shipments for China agent (created by them)
    @Query("SELECT s FROM Shipment s WHERE s.createdByAgent = :agentEmail ORDER BY s.createdAt DESC")
    List<Shipment> findShipmentsForChinaAgent(@Param("agentEmail") String agentEmail);

    // Get all shipments for India agent (they need visibility of all incoming shipments)
    @Query("SELECT s FROM Shipment s ORDER BY s.createdAt DESC")
    List<Shipment> findShipmentsForMumbaiAgent(@Param("agentEmail") String agentEmail);

    // Get all shipments (for admin)
    @Query("SELECT s FROM Shipment s ORDER BY s.createdAt DESC")
    List<Shipment> findAllShipments();

    // Count by status
    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = :status")
    Long countByStatus(@Param("status") ShipmentStatus status);

    // Get pending payments total
    @Query("SELECT COALESCE(SUM(s.pendingAmount), 0) FROM Shipment s WHERE s.paymentStatus != 'PAID'")
    java.math.BigDecimal getTotalPendingPayments();
}
