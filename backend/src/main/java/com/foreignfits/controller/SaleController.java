package com.foreignfits.controller;

import com.foreignfits.dto.SaleDto;
import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.CreateSaleRequest;
import com.foreignfits.entity.User;
import com.foreignfits.service.SaleService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
public class SaleController {
    
    private final SaleService saleService;
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAuthority('view:sales')")
    public ResponseEntity<List<SaleDto>> getAllSales(Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<SaleDto> sales;
        
        // If user is SALES and has a location assigned, filter by location
        if (currentUser.getRole() == User.UserRole.SALES && currentUser.getLocationId() != null) {
            sales = saleService.getSalesByLocation(currentUser.getLocationId());
        } else {
            // ADMIN can see all sales
            sales = saleService.getAllSales();
        }
        
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('view:sales')")
    public ResponseEntity<SaleDto> getSaleById(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SaleDto sale = saleService.getSaleById(id);
        
        // If user is SALES, verify they have access to this sale's location
        if (currentUser.getRole() == User.UserRole.SALES && currentUser.getLocationId() != null) {
            if (!sale.getLocation().getId().equals(currentUser.getLocationId())) {
                return ResponseEntity.status(403).build(); // Forbidden
            }
        }
        
        return ResponseEntity.ok(sale);
    }
    
    @GetMapping("/today")
    @PreAuthorize("hasAuthority('view:sales')")
    public ResponseEntity<List<SaleDto>> getTodaysSales(Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<SaleDto> sales;
        
        // If user is SALES and has a location assigned, filter by location
        if (currentUser.getRole() == User.UserRole.SALES && currentUser.getLocationId() != null) {
            sales = saleService.getTodaysSalesByLocation(currentUser.getLocationId());
        } else {
            // ADMIN can see all sales
            sales = saleService.getTodaysSales();
        }
        
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/revenue/today")
    @PreAuthorize("hasAuthority('view:sales')")
    public ResponseEntity<BigDecimal> getTodaysRevenue(Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        BigDecimal revenue;
        
        // If user is SALES and has a location assigned, filter by location
        if (currentUser.getRole() == User.UserRole.SALES && currentUser.getLocationId() != null) {
            revenue = saleService.getTodaysRevenueByLocation(currentUser.getLocationId());
        } else {
            // ADMIN can see all revenue
            revenue = saleService.getTodaysRevenue();
        }
        
        return ResponseEntity.ok(revenue);
    }
    
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<List<SaleDto>> getSalesBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        String email = authentication.getName();
        UserDto currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<SaleDto> sales;
        
        // If user is SALES and has a location assigned, filter by location
        if (currentUser.getRole() == User.UserRole.SALES && currentUser.getLocationId() != null) {
            sales = saleService.getSalesBetweenDatesByLocation(startDate, endDate, currentUser.getLocationId());
        } else {
            // ADMIN can see all sales
            sales = saleService.getSalesBetweenDates(startDate, endDate);
        }
        
        return ResponseEntity.ok(sales);
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('create:sale')")
    public ResponseEntity<?> createSale(@Valid @RequestBody CreateSaleRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Long userId = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            
            SaleDto sale = saleService.createSale(request, userId);
            return ResponseEntity.ok(sale);
        } catch (Exception e) {
            // Return detailed error message for debugging
            return ResponseEntity.badRequest().body(
                java.util.Map.of(
                    "error", e.getMessage(),
                    "type", e.getClass().getSimpleName()
                )
            );
        }
    }
}
