package com.foreignfits.controller;

import com.foreignfits.dto.StockTransferDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.CreateStockTransferRequest;
import com.foreignfits.entity.StockTransfer;
import com.foreignfits.entity.User;
import com.foreignfits.security.JwtTokenProvider;
import com.foreignfits.service.StockTransferService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-transfers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockTransferController {
    
    private final StockTransferService stockTransferService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    
    /**
     * Create a new stock transfer request
     * Accessible by: Admin, Warehouse
     */
    @PostMapping
    @PreAuthorize("hasAuthority('request:stock_transfer')")
    public ResponseEntity<?> createTransfer(
            @Valid @RequestBody CreateStockTransferRequest request,
            @RequestHeader("Authorization") String token,
            Authentication authentication) {
        try {
            String jwt = token.substring(7);
            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            // Get current user to check location restrictions
            String email = authentication.getName();
            UserDto currentUser = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // WAREHOUSE users can only transfer FROM their assigned location
            if (currentUser.getRole() == User.UserRole.WAREHOUSE && currentUser.getLocationId() != null) {
                if (!request.getFromLocationId().equals(currentUser.getLocationId())) {
                    return ResponseEntity.badRequest()
                            .body("Warehouse users can only transfer products FROM their assigned location: " + 
                                  currentUser.getLocationName());
                }
            }
            
            // Create PENDING transfer with TRANSFER movement (requires destination approval)
            StockTransferDto transfer = stockTransferService.createTransfer(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Cancel a transfer
     * Accessible by: Admin, Warehouse
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('cancel:stock_transfer')")
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
    @PreAuthorize("hasAuthority('view:stock_transfers')")
    public ResponseEntity<List<StockTransferDto>> getAllTransfers(Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StockTransferDto> transfers;
        
        // WAREHOUSE users can only see transfers from/to their location
        if (currentUser.getRole() == User.UserRole.WAREHOUSE && currentUser.getLocationId() != null) {
            transfers = stockTransferService.getTransfersByLocation(currentUser.getLocationId());
        } else {
            // ADMIN can see all transfers
            transfers = stockTransferService.getAllTransfers();
        }
        
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get pending transfers
     * Accessible by: Admin, Warehouse
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('view:stock_transfers')")
    public ResponseEntity<List<StockTransferDto>> getPendingTransfers() {
        List<StockTransferDto> transfers = stockTransferService.getPendingTransfers();
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get transfers by location
     * Accessible by: Admin only (WAREHOUSE users should use getAllTransfers which filters automatically)
     */
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAuthority('cross:location_access')")
    public ResponseEntity<List<StockTransferDto>> getTransfersByLocation(@PathVariable Long locationId, Authentication authentication) {
        // Only ADMIN can query transfers by specific location
        // WAREHOUSE users should use getAllTransfers() which filters automatically
        List<StockTransferDto> transfers = stockTransferService.getTransfersByLocation(locationId);
        return ResponseEntity.ok(transfers);
    }
    
    /**
     * Get transfers by status
     * Accessible by: Admin, Warehouse
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('view:stock_transfers')")
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
