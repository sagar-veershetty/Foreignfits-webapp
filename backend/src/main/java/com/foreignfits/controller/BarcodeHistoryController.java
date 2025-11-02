package com.foreignfits.controller;

import com.foreignfits.dto.BarcodeHistoryDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.User;
import com.foreignfits.service.BarcodeHistoryService;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/barcode-history")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BarcodeHistoryController {
    
    private final BarcodeHistoryService barcodeHistoryService;
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<List<BarcodeHistoryDto>> getBarcodeHistory(
        Authentication authentication,
        @RequestParam(required = false) String barcodeNumber,
        @RequestParam(required = false) Long locationId,
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate
    ) {
        try {
            String email = authentication.getName();
            UserDto currentUser = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            User.UserRole role = currentUser.getRole();
            Long userLocationId = currentUser.getLocationId();
            
            log.info("Get barcode history - User: {}, Role: {}, LocationId: {}", email, role, userLocationId);
            
            List<BarcodeHistoryDto> history;
            
            // If specific barcode number is requested
            if (barcodeNumber != null && !barcodeNumber.trim().isEmpty()) {
                if (role == User.UserRole.ADMIN) {
                    history = barcodeHistoryService.getHistoryByBarcodeNumber(barcodeNumber);
                } else {
                    // Warehouse/Store can only see history if barcode was at their location
                    Long filterLocationId = locationId != null ? locationId : userLocationId;
                    history = barcodeHistoryService.getHistoryByBarcodeNumberAndLocation(barcodeNumber, filterLocationId);
                }
            }
            // If date range is specified
            else if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDateTime.parse(startDate);
                LocalDateTime end = LocalDateTime.parse(endDate);
                
                if (role == User.UserRole.ADMIN) {
                    history = barcodeHistoryService.getHistoryByDateRange(start, end);
                } else {
                    Long filterLocationId = locationId != null ? locationId : userLocationId;
                    history = barcodeHistoryService.getHistoryByLocationAndDateRange(filterLocationId, start, end);
                }
            }
            // Default: get all history based on role
            else {
                if (role == User.UserRole.ADMIN) {
                    history = barcodeHistoryService.getAllHistory();
                } else {
                    // Warehouse/Store see only their location's history
                    Long filterLocationId = locationId != null ? locationId : userLocationId;
                    history = barcodeHistoryService.getHistoryByLocation(filterLocationId);
                }
            }
            
            log.info("Returning {} barcode history records", history.size());
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Error fetching barcode history", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/barcode/{barcodeNumber}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<List<BarcodeHistoryDto>> getHistoryForBarcode(
        Authentication authentication,
        @PathVariable String barcodeNumber
    ) {
        try {
            String email = authentication.getName();
            UserDto currentUser = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            User.UserRole role = currentUser.getRole();
            Long userLocationId = currentUser.getLocationId();
            
            List<BarcodeHistoryDto> history;
            
            if (role == User.UserRole.ADMIN) {
                history = barcodeHistoryService.getHistoryByBarcodeNumber(barcodeNumber);
            } else {
                history = barcodeHistoryService.getHistoryByBarcodeNumberAndLocation(barcodeNumber, userLocationId);
            }
            
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Error fetching barcode history for: {}", barcodeNumber, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
