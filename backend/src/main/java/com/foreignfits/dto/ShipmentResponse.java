package com.foreignfits.dto;

import com.foreignfits.entity.Shipment.PaymentStatus;
import com.foreignfits.entity.Shipment.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    
    private Long id;
    private String shippingId;
    private BigDecimal totalCost;
    private Integer totalPackages;
    private BigDecimal totalCbm;
    private Boolean isBranded;
    private BigDecimal perCbmRate;
    private LocalDate etd;
    private LocalDate eta;
    private String trackingUrl;
    private ShipmentStatus status;
    private String remarks;
    private String originLocation;
    private String destinationLocation;
    
    private String createdByAgent;
    private String receivedByAgent;
    private String completedByAdmin;
    
    private LocalDateTime createdAt;
    private LocalDateTime receivedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;
    
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private PaymentStatus paymentStatus;
    
    private String localLogisticProvider;
    private String localTrackingNumber;
    
    private String indiaWarehouseAddress;
    private String indiaContactPhone;
    private String indiaContactEmail;
}
