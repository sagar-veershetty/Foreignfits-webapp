package com.foreignfits.controller;

import com.foreignfits.dto.SaleDto;
import com.foreignfits.dto.request.CreateSaleRequest;
import com.foreignfits.service.SaleService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/sales")
public class SaleController {
    
    @Autowired
    private SaleService saleService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<List<SaleDto>> getAllSales() {
        List<SaleDto> sales = saleService.getAllSales();
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/today")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<List<SaleDto>> getTodaysSales() {
        List<SaleDto> sales = saleService.getTodaysSales();
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/revenue/today")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<BigDecimal> getTodaysRevenue() {
        BigDecimal revenue = saleService.getTodaysRevenue();
        return ResponseEntity.ok(revenue);
    }
    
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<List<SaleDto>> getSalesBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<SaleDto> sales = saleService.getSalesBetweenDates(startDate, endDate);
        return ResponseEntity.ok(sales);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SALES')")
    public ResponseEntity<SaleDto> createSale(@Valid @RequestBody CreateSaleRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Long userId = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            
            SaleDto sale = saleService.createSale(request, userId);
            return ResponseEntity.ok(sale);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
