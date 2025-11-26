package com.foreignfits.controller;

import com.foreignfits.dto.ExchangeDto;
import com.foreignfits.dto.ExchangeRequest;
import com.foreignfits.service.ExchangeService;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exchanges")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExchangeController {

    private final ExchangeService exchangeService;
    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<?> createExchange(
            @RequestBody ExchangeRequest request,
            Authentication authentication) {
        try {
            // Get user from authentication
            String email = authentication.getName();
            Long userId = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            
            ExchangeDto exchange = exchangeService.createExchange(request, userId);
            return ResponseEntity.ok(exchange);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating exchange: " + e.getMessage());
        }
    }

    @GetMapping("/sale/{saleId}")
    public ResponseEntity<?> getExchangesBySale(@PathVariable Long saleId) {
        try {
            List<ExchangeDto> exchanges = exchangeService.getExchangesByOriginalSale(saleId);
            return ResponseEntity.ok(exchanges);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving exchanges: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getExchangeHistory(@RequestParam(required = false) Long locationId) {
        try {
            List<ExchangeDto> exchanges = exchangeService.getExchangeHistory(locationId);
            return ResponseEntity.ok(exchanges);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving exchange history: " + e.getMessage());
        }
    }
}
