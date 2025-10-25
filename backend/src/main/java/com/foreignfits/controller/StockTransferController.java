package com.foreignfits.controller;

import com.foreignfits.dto.StockTransferDto;
import com.foreignfits.dto.request.CreateStockTransferRequest;
import com.foreignfits.entity.StockTransfer;
import com.foreignfits.security.JwtTokenProvider;
import com.foreignfits.service.StockTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-transfers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockTransferController {
    
    private final StockTransferService stockTransferService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * Create a new stock transfer request
     * Accessible by: Admin, Warehouse
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<?> createTransfer(
            @Valid @RequestBody CreateStockTransferRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            // For immediate transfer, use createAndCompleteTransfer which auto-approves and completes
            StockTransferDto transfer = stockTransferService.createAndCompleteTransfer(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Approve a pending transfer
     * Accessible by: Admin, Warehouse
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<?> approveTransfer(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            StockTransferDto transfer = stockTransferService.approveTransfer(id, userId);
            return ResponseEntity.ok(transfer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Complete a transfer (move stock)
     * Accessible by: Admin, Warehouse
     */
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<?> completeTransfer(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            StockTransferDto transfer = stockTransferService.completeTransfer(id, userId);
            return ResponseEntity.ok(transfer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Cancel a transfer
     * Accessible by: Admin, Warehouse
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<?> cancelTransfer(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            StockTransferDto transfer = stockTransferService.cancelTransfer(id, userId);
            return ResponseEntity.ok(transfer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Get all transfers
     * Accessible by: Admin, Warehouse
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<List<StockTransferDto>> getAllTransfers() {
        List<StockTransferDto> transfers = stockTransferService.getAllTransfers();
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get pending transfers
     * Accessible by: Admin, Warehouse
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<List<StockTransferDto>> getPendingTransfers() {
        List<StockTransferDto> transfers = stockTransferService.getPendingTransfers();
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get transfers by location
     * Accessible by: Admin, Warehouse
     */
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<List<StockTransferDto>> getTransfersByLocation(@PathVariable Long locationId) {
        List<StockTransferDto> transfers = stockTransferService.getTransfersByLocation(locationId);
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get transfers by status
     * Accessible by: Admin, Warehouse
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<List<StockTransferDto>> getTransfersByStatus(@PathVariable String status) {
        try {
            StockTransfer.TransferStatus transferStatus = StockTransfer.TransferStatus.valueOf(status.toUpperCase());
            List<StockTransferDto> transfers = stockTransferService.getTransfersByStatus(transferStatus);
            return ResponseEntity.ok(transfers);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
