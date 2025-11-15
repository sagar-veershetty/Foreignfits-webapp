package com.foreignfits.service;

import com.foreignfits.dto.PaymentRequest;
import com.foreignfits.dto.ShipmentRequest;
import com.foreignfits.dto.ShipmentResponse;
import com.foreignfits.entity.Shipment;
import com.foreignfits.entity.Shipment.PaymentStatus;
import com.foreignfits.entity.Shipment.ShipmentStatus;
import com.foreignfits.entity.User;
import com.foreignfits.repository.ShipmentRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    /**
     * Helper method to check if user is admin
     */
    private boolean isAdmin(User user) {
        return user.getRole() == User.UserRole.ADMIN;
    }

    /**
     * Helper method to check if user is China shipping agent
     */
    private boolean isChinaAgent(User user) {
        return user.getRole() == User.UserRole.SHIPPING_AGENT_CHINA;
    }

    /**
     * Helper method to check if user is India shipping agent
     */
    private boolean isIndiaAgent(User user) {
        return user.getRole() == User.UserRole.SHIPPING_AGENT_INDIA;
    }

    /**
     * Get user by email
     */
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    /**
     * Create a new shipment (China agent or Admin)
     */
    @Transactional
    public ShipmentResponse createShipment(ShipmentRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        // Only China agent or Admin can create shipments
        if (!isChinaAgent(user) && !isAdmin(user)) {
            throw new RuntimeException("Access denied: Only China agents and Admins can create shipments");
        }

        // Validate shipping ID uniqueness
        if (shipmentRepository.findByShippingId(request.getShippingId()).isPresent()) {
            throw new RuntimeException("Shipping ID already exists: " + request.getShippingId());
        }

        Shipment shipment = Shipment.builder()
                .shippingId(request.getShippingId())
                .totalCost(request.getTotalCost())
                .totalPackages(request.getTotalPackages())
                .totalCbm(request.getTotalCbm())
                .isBranded(request.getIsBranded())
                .perCbmRate(request.getPerCbmRate())
                .etd(request.getEtd())
                .eta(request.getEta())
                .trackingUrl(request.getTrackingUrl())
                .status(ShipmentStatus.CREATED)
                .remarks(request.getRemarks())
                .originLocation(request.getOriginLocation() != null ? request.getOriginLocation() : "China")
                .destinationLocation(request.getDestinationLocation() != null ? request.getDestinationLocation() : "Mumbai, India")
                .indiaWarehouseAddress(request.getIndiaWarehouseAddress())
                .indiaContactPhone(request.getIndiaContactPhone())
                .indiaContactEmail(request.getIndiaContactEmail())
                .createdByAgent(userEmail)
                .paidAmount(BigDecimal.ZERO)
                .pendingAmount(request.getTotalCost())
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        Shipment saved = shipmentRepository.save(shipment);
        return mapToResponse(saved);
    }

    /**
     * Get shipment by ID with role-based access
     */
    public ShipmentResponse getShipmentById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + id));

        // Check access rights
        if (!canAccessShipment(user, shipment)) {
            throw new RuntimeException("Access denied: You don't have permission to view this shipment");
        }

        return mapToResponse(shipment);
    }

    /**
     * Get all shipments based on user role
     */
    public List<ShipmentResponse> getAllShipments(String userEmail) {
        User user = getUserByEmail(userEmail);

        List<Shipment> shipments;
        if (isAdmin(user)) {
            shipments = shipmentRepository.findAllShipments();
        } else if (isChinaAgent(user)) {
            shipments = shipmentRepository.findShipmentsForChinaAgent(userEmail);
        } else if (isIndiaAgent(user)) {
            shipments = shipmentRepository.findShipmentsForMumbaiAgent(userEmail);
        } else {
            throw new RuntimeException("Access denied: You don't have permission to view shipments");
        }

        return shipments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update shipment (Admin or creating agent)
     */
    @Transactional
    public ShipmentResponse updateShipment(Long id, ShipmentRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + id));

        // Only admin or the creating agent can update shipment details
        if (!isAdmin(user) && !shipment.getCreatedByAgent().equals(userEmail)) {
            throw new RuntimeException("Access denied: You can only update shipments you created");
        }

        // Update fields
        if (request.getTotalCost() != null) {
            BigDecimal costDiff = request.getTotalCost().subtract(shipment.getTotalCost());
            shipment.setTotalCost(request.getTotalCost());
            shipment.setPendingAmount(shipment.getPendingAmount().add(costDiff));
        }
        if (request.getTotalPackages() != null) shipment.setTotalPackages(request.getTotalPackages());
        if (request.getTotalCbm() != null) shipment.setTotalCbm(request.getTotalCbm());
        if (request.getIsBranded() != null) shipment.setIsBranded(request.getIsBranded());
        if (request.getPerCbmRate() != null) shipment.setPerCbmRate(request.getPerCbmRate());
        if (request.getEtd() != null) shipment.setEtd(request.getEtd());
        if (request.getEta() != null) shipment.setEta(request.getEta());
        if (request.getTrackingUrl() != null) shipment.setTrackingUrl(request.getTrackingUrl());
        if (request.getRemarks() != null) shipment.setRemarks(request.getRemarks());
        if (request.getLocalLogisticProvider() != null) shipment.setLocalLogisticProvider(request.getLocalLogisticProvider());
        if (request.getLocalTrackingNumber() != null) shipment.setLocalTrackingNumber(request.getLocalTrackingNumber());
        if (request.getIndiaWarehouseAddress() != null) shipment.setIndiaWarehouseAddress(request.getIndiaWarehouseAddress());
        if (request.getIndiaContactPhone() != null) shipment.setIndiaContactPhone(request.getIndiaContactPhone());
        if (request.getIndiaContactEmail() != null) shipment.setIndiaContactEmail(request.getIndiaContactEmail());
        
        // Allow status update through this method too
        if (request.getStatus() != null) {
            validateStatusTransition(user, shipment, request.getStatus());
            shipment.setStatus(request.getStatus());
        }

        Shipment updated = shipmentRepository.save(shipment);
        return mapToResponse(updated);
    }

    /**
     * Update shipment status
     */
    @Transactional
    public ShipmentResponse updateShipmentStatus(Long id, ShipmentStatus newStatus, String userEmail) {
        User user = getUserByEmail(userEmail);
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + id));

        // Validate status transition based on user role
        validateStatusTransition(user, shipment, newStatus);

        shipment.setStatus(newStatus);

        // Update timestamps based on status
        switch (newStatus) {
            case CREATED:
            case IN_TRANSIT:
            case ARRIVED_MUMBAI:
            case IN_CUSTOM_CLEARANCE:
            case DELIVERED_TO_WAREHOUSE:
                // No special timestamp updates needed
                break;
            case RECEIVED:
                shipment.setReceivedByAgent(userEmail);
                shipment.setReceivedAt(LocalDateTime.now());
                break;
            case OUT_FOR_DELIVERY:
                // No special timestamp updates needed
                break;
            case DELIVERED:
                shipment.setDeliveredAt(LocalDateTime.now());
                break;
            case COMPLETED:
                shipment.setCompletedByAdmin(userEmail);
                shipment.setCompletedAt(LocalDateTime.now());
                break;
        }

        Shipment updated = shipmentRepository.save(shipment);
        return mapToResponse(updated);
    }

    /**
     * Add payment to shipment
     */
    @Transactional
    public ShipmentResponse addPayment(Long id, PaymentRequest paymentRequest, String userEmail) {
        User user = getUserByEmail(userEmail);
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + id));

        // Check access
        if (!canAccessShipment(user, shipment)) {
            throw new RuntimeException("Access denied: You don't have permission to add payment to this shipment");
        }

        BigDecimal paymentAmount = paymentRequest.getAmount();
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than zero");
        }

        if (paymentAmount.compareTo(shipment.getPendingAmount()) > 0) {
            throw new RuntimeException("Payment amount cannot exceed pending amount");
        }

        // Update payment amounts
        shipment.setPaidAmount(shipment.getPaidAmount().add(paymentAmount));
        shipment.setPendingAmount(shipment.getPendingAmount().subtract(paymentAmount));

        // Update payment status
        if (shipment.getPendingAmount().compareTo(BigDecimal.ZERO) == 0) {
            shipment.setPaymentStatus(PaymentStatus.PAID);
        } else if (shipment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            shipment.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        // Append payment note to remarks
        String paymentNote = String.format("\n[Payment %s] Amount: %s, By: %s, Note: %s",
                LocalDateTime.now(), paymentAmount, userEmail, paymentRequest.getRemarks());
        shipment.setRemarks(shipment.getRemarks() != null ?
                shipment.getRemarks() + paymentNote : paymentNote);

        Shipment updated = shipmentRepository.save(shipment);
        return mapToResponse(updated);
    }

    /**
     * Delete shipment (Admin only)
     */
    @Transactional
    public void deleteShipment(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);

        if (!isAdmin(user)) {
            throw new RuntimeException("Access denied: Only admins can delete shipments");
        }

        shipmentRepository.deleteById(id);
    }

    /**
     * Get shipments with filters
     */
    public List<ShipmentResponse> getShipmentsWithFilters(
            ShipmentStatus status,
            PaymentStatus paymentStatus,
            Boolean isBranded,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String userEmail) {

        User user = getUserByEmail(userEmail);
        String agentEmail = null;

        // For non-admin users, filter by their email
        if (!isAdmin(user)) {
            agentEmail = userEmail;
        }

        List<Shipment> shipments = shipmentRepository.findWithFilters(
                status, paymentStatus, isBranded, agentEmail, startDate, endDate);

        return shipments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Check if user can access a shipment
     */
    private boolean canAccessShipment(User user, Shipment shipment) {
        if (isAdmin(user)) {
            return true;
        }
        if (isChinaAgent(user) && shipment.getCreatedByAgent().equals(user.getEmail())) {
            return true;
        }
        // India agents can access all shipments for visibility and planning
        if (isIndiaAgent(user)) {
            return true;
        }
        return false;
    }

    /**
     * Validate status transition
     */
    private void validateStatusTransition(User user, Shipment shipment, ShipmentStatus newStatus) {
        ShipmentStatus currentStatus = shipment.getStatus();

        // Admin can change to any status
        if (isAdmin(user)) {
            return;
        }

        // China agent can update to IN_TRANSIT, ARRIVED_MUMBAI, IN_CUSTOM_CLEARANCE, DELIVERED_TO_WAREHOUSE
        if (isChinaAgent(user)) {
            if (shipment.getCreatedByAgent().equals(user.getEmail()) &&
                    (newStatus == ShipmentStatus.IN_TRANSIT || 
                     newStatus == ShipmentStatus.ARRIVED_MUMBAI ||
                     newStatus == ShipmentStatus.IN_CUSTOM_CLEARANCE ||
                     newStatus == ShipmentStatus.DELIVERED_TO_WAREHOUSE)) {
                return;
            }
            throw new RuntimeException("Access denied: Invalid status transition for China agent");
        }

        // India agent can update from DELIVERED_TO_WAREHOUSE onwards
        if (isIndiaAgent(user)) {
            if ((currentStatus == ShipmentStatus.DELIVERED_TO_WAREHOUSE && newStatus == ShipmentStatus.RECEIVED) ||
                (currentStatus == ShipmentStatus.RECEIVED && newStatus == ShipmentStatus.OUT_FOR_DELIVERY) ||
                (currentStatus == ShipmentStatus.OUT_FOR_DELIVERY && newStatus == ShipmentStatus.DELIVERED)) {
                return;
            }
            throw new RuntimeException("Access denied: Invalid status transition for India agent");
        }

        throw new RuntimeException("Access denied: You don't have permission to change shipment status");
    }

    /**
     * Map Shipment entity to ShipmentResponse DTO
     */
    private ShipmentResponse mapToResponse(Shipment shipment) {
        return ShipmentResponse.builder()
                .id(shipment.getId())
                .shippingId(shipment.getShippingId())
                .totalCost(shipment.getTotalCost())
                .totalPackages(shipment.getTotalPackages())
                .totalCbm(shipment.getTotalCbm())
                .isBranded(shipment.getIsBranded())
                .perCbmRate(shipment.getPerCbmRate())
                .etd(shipment.getEtd())
                .eta(shipment.getEta())
                .trackingUrl(shipment.getTrackingUrl())
                .status(shipment.getStatus())
                .remarks(shipment.getRemarks())
                .originLocation(shipment.getOriginLocation())
                .destinationLocation(shipment.getDestinationLocation())
                .createdByAgent(shipment.getCreatedByAgent())
                .receivedByAgent(shipment.getReceivedByAgent())
                .completedByAdmin(shipment.getCompletedByAdmin())
                .createdAt(shipment.getCreatedAt())
                .receivedAt(shipment.getReceivedAt())
                .deliveredAt(shipment.getDeliveredAt())
                .completedAt(shipment.getCompletedAt())
                .updatedAt(shipment.getUpdatedAt())
                .paidAmount(shipment.getPaidAmount())
                .pendingAmount(shipment.getPendingAmount())
                .paymentStatus(shipment.getPaymentStatus())
                .localLogisticProvider(shipment.getLocalLogisticProvider())
                .localTrackingNumber(shipment.getLocalTrackingNumber())
                .indiaWarehouseAddress(shipment.getIndiaWarehouseAddress())
                .indiaContactPhone(shipment.getIndiaContactPhone())
                .indiaContactEmail(shipment.getIndiaContactEmail())
                .build();
    }
}
