package com.foreignfits.controller;

import com.foreignfits.dto.BarcodeHistoryDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.User;
import com.foreignfits.service.BarcodeHistoryService;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/barcode-history")
@RequiredArgsConstructor
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
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        UserDto user = userService.getUserByEmail(authentication.getName()).orElseThrow();
        // Query parameters cannot widen a non-admin's location scope.
        Long scope = user.getRole() == User.UserRole.ADMIN ? locationId : user.getLocationId();
        if (user.getRole() != User.UserRole.ADMIN && scope == null) {
            return ResponseEntity.status(403).build();
        }
        if (page < 0 || size < 1 || size > 200) return ResponseEntity.badRequest().build();
        try {
            LocalDateTime start = parseDate(startDate);
            LocalDateTime end = parseDate(endDate);
            if (start != null && end != null && start.isAfter(end)) return ResponseEntity.badRequest().build();
            return ResponseEntity.ok(barcodeHistoryService.getHistoryPage(
                    barcodeNumber, eventType, scope, start, end, page, size));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            return OffsetDateTime.parse(value).atZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata")).toLocalDateTime();
        }
    }

    @GetMapping("/barcode/{barcodeNumber}")
    @PreAuthorize("hasAnyAuthority('view:inventory', 'view:products')")
    public ResponseEntity<List<BarcodeHistoryDto>> getHistoryForBarcode(
            Authentication authentication, @PathVariable String barcodeNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return getBarcodeHistory(authentication, barcodeNumber, null, null, null, null, page, size);
    }
}
