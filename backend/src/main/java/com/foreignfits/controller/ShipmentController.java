package com.foreignfits.controller;

import com.foreignfits.dto.PaymentRequest;
import com.foreignfits.dto.ShipmentRequest;
import com.foreignfits.dto.ShipmentResponse;
import com.foreignfits.entity.Shipment.PaymentStatus;
import com.foreignfits.entity.Shipment.ShipmentStatus;
import com.foreignfits.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/shipments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShipmentController {

    private final ShipmentService shipmentService;

    /**
     * Create a new shipment (China agent or Admin)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('create:shipment')")
    public ResponseEntity<ShipmentResponse> createShipment(
            @RequestBody ShipmentRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ShipmentResponse response = shipmentService.createShipment(request, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all shipments (role-based filtering)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('view:shipments')")
    public ResponseEntity<List<ShipmentResponse>> getAllShipments(Authentication authentication) {
        String userEmail = authentication.getName();
        List<ShipmentResponse> shipments = shipmentService.getAllShipments(userEmail);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipment by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('view:shipments')")
    public ResponseEntity<ShipmentResponse> getShipmentById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ShipmentResponse response = shipmentService.getShipmentById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Update shipment details
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('edit:shipment')")
    public ResponseEntity<ShipmentResponse> updateShipment(
            @PathVariable Long id,
            @RequestBody ShipmentRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ShipmentResponse response = shipmentService.updateShipment(id, request, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Update shipment status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('update:shipment_status')")
    public ResponseEntity<ShipmentResponse> updateShipmentStatus(
            @PathVariable Long id,
            @RequestParam ShipmentStatus status,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ShipmentResponse response = shipmentService.updateShipmentStatus(id, status, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Add payment to shipment
     */
    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAuthority('add:payment')")
    public ResponseEntity<ShipmentResponse> addPayment(
            @PathVariable Long id,
            @RequestBody PaymentRequest paymentRequest,
            Authentication authentication) {
        String userEmail = authentication.getName();
        ShipmentResponse response = shipmentService.addPayment(id, paymentRequest, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete shipment (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('delete:shipment')")
    public ResponseEntity<Void> deleteShipment(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        shipmentService.deleteShipment(id, userEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * Get shipments with filters
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('view:shipments')")
    public ResponseEntity<List<ShipmentResponse>> searchShipments(
            @RequestParam(required = false) ShipmentStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) Boolean isBranded,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<ShipmentResponse> shipments = shipmentService.getShipmentsWithFilters(
                status, paymentStatus, isBranded, startDate, endDate, userEmail);
        return ResponseEntity.ok(shipments);
    }
}
