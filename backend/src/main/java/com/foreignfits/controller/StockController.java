package com.foreignfits.controller;

import com.foreignfits.dto.StockMovementDto;
import com.foreignfits.dto.request.StockAdjustmentRequest;
import com.foreignfits.service.StockService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class StockController {
    
    @Autowired
    private StockService stockService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/movements")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE')")
    public ResponseEntity<List<StockMovementDto>> getStockMovements() {
        List<StockMovementDto> movements = stockService.getStockMovements();
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/movements/product/{productId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE')")
    public ResponseEntity<List<StockMovementDto>> getStockMovementsByProduct(@PathVariable Long productId) {
        List<StockMovementDto> movements = stockService.getStockMovementsByProduct(productId);
        return ResponseEntity.ok(movements);
    }
    
    @PostMapping("/adjust")
    @PreAuthorize("hasRole('ADMIN') or hasRole('WAREHOUSE')")
    public ResponseEntity<StockMovementDto> adjustStock(@Valid @RequestBody StockAdjustmentRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            String userName = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getName();
            
            StockMovementDto movement = stockService.adjustStock(request, userName);
            return ResponseEntity.ok(movement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}