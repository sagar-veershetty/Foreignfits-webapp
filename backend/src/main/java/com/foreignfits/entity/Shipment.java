package com.foreignfits.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String shippingId; // Custom tracking ID like "SHP-2025-001"

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false)
    private Integer totalPackages;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal totalCbm; // Cubic Meter

    @Column(nullable = false)
    private Boolean isBranded; // true = branded, false = non-branded

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal perCbmRate; // Cost per CBM

    @Column(nullable = false)
    private LocalDate etd; // Estimated Time of Departure

    @Column(nullable = false)
    private LocalDate eta; // Estimated Time of Arrival

    @Column(length = 500)
    private String trackingUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    @Column(length = 1000)
    private String remarks;

    // Origin and destination
    @Column(nullable = false, length = 100)
    private String originLocation; // e.g., "China"

    @Column(nullable = false, length = 100)
    private String destinationLocation; // e.g., "Mumbai, India"

    // Agent information
    @Column(nullable = false, length = 150)
    private String createdByAgent; // Email of China agent who created

    @Column(length = 150)
    private String receivedByAgent; // Email of Mumbai agent who received

    @Column(length = 150)
    private String completedByAdmin; // Email of admin who completed

    // Dates
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime receivedAt; // When Mumbai agent accepted

    @Column
    private LocalDateTime deliveredAt; // When finally delivered

    @Column
    private LocalDateTime completedAt; // When admin marked complete

    @Column
    private LocalDateTime updatedAt;

    // Payment tracking
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pendingAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    // Local logistics info (for Mumbai to final destination)
    @Column(length = 200)
    private String localLogisticProvider;

    @Column(length = 200)
    private String localTrackingNumber;

    // India warehouse/agent details
    @Column(length = 500)
    private String indiaWarehouseAddress;

    @Column(length = 15)
    private String indiaContactPhone;

    @Column(length = 150)
    private String indiaContactEmail;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }
        if (pendingAmount == null) {
            pendingAmount = totalCost;
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.UNPAID;
        }
        if (status == null) {
            status = ShipmentStatus.CREATED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ShipmentStatus {
        CREATED("Created by China agent"),
        IN_TRANSIT("In transit to India"),
        ARRIVED_MUMBAI("Arrived at Indian port"),
        IN_CUSTOM_CLEARANCE("In custom clearance"),
        DELIVERED_TO_WAREHOUSE("Delivered to domestic warehouse"),
        RECEIVED("Received by India agent"),
        OUT_FOR_DELIVERY("Out for delivery with local logistics"),
        DELIVERED("Delivered to final destination"),
        COMPLETED("Completed by admin");

        private final String description;

        ShipmentStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum PaymentStatus {
        UNPAID("Not paid"),
        PARTIALLY_PAID("Partially paid"),
        PAID("Fully paid");

        private final String description;

        PaymentStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
