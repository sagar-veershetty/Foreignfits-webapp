package com.foreignfits.controller;

import com.foreignfits.dto.StockMovementDto;
import com.foreignfits.dto.request.StockAdjustmentRequest;
import com.foreignfits.entity.User;
import com.foreignfits.service.StockService;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
public class StockController {
    
    private final StockService stockService;
    private final UserService userService;
    
    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('view:stock_movements')")
    public ResponseEntity<List<StockMovementDto>> getStockMovements(Authentication authentication) {
        String email = authentication.getName();
        var user = userService.getUserEntityByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StockMovementDto> movements = stockService.getStockMovementsForUser(user);
        return ResponseEntity.ok(movements);
    }
    
    @GetMapping("/movements/pending")
    @PreAuthorize("hasAuthority('view:stock_movements')")
    public ResponseEntity<List<StockMovementDto>> getPendingStockMovements(Authentication authentication) {
        String email = authentication.getName();
        var user = userService.getUserEntityByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StockMovementDto> movements = stockService.getPendingStockMovementsForUser(user);
        return ResponseEntity.ok(movements);
    }
    
    @PostMapping("/movements/{id}/approve")
    @PreAuthorize("hasAuthority('approve:stock_movement')")
    public ResponseEntity<?> approveStockMovement(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.getUserEntityByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            StockMovementDto movement = stockService.approveStockMovement(id, user.getName(), user);
            return ResponseEntity.ok(movement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/movements/{id}/reject")
    @PreAuthorize("hasAuthority('approve:stock_movement')")
    public ResponseEntity<?> rejectStockMovement(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            String userName = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getName();
            
            String reason = body != null ? body.get("reason") : "No reason provided";
            stockService.rejectStockMovement(id, userName, reason);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/movements/product/{productId}")
    @PreAuthorize("hasAuthority('view:stock_movements')")
    public ResponseEntity<List<StockMovementDto>> getStockMovementsByProduct(@PathVariable Long productId) {
        List<StockMovementDto> movements = stockService.getStockMovementsByProduct(productId);
        return ResponseEntity.ok(movements);
    }
    
    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('adjust:stock')")
    public ResponseEntity<StockMovementDto> adjustStock(@Valid @RequestBody StockAdjustmentRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            
            StockMovementDto movement = stockService.adjustStock(request, email);
            return ResponseEntity.ok(movement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
