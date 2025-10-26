package com.foreignfits.controller;

import com.foreignfits.dto.response.LoyaltyCustomerDto;
import com.foreignfits.dto.response.LoyaltyTransactionDto;
import com.foreignfits.service.LoyaltyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/loyalty")
@CrossOrigin(origins = "*")
public class LoyaltyController {
    
    private static final Logger logger = LoggerFactory.getLogger(LoyaltyController.class);
    
    @Autowired
    private LoyaltyService loyaltyService;
    
    /**
     * Get loyalty customer details by phone
     */
    @GetMapping("/customer")
    @PreAuthorize("hasAuthority('view:loyalty')")
    public ResponseEntity<?> getCustomerByPhone(
            @RequestParam String phone,
            @RequestParam String countryCode) {
        try {
            LoyaltyCustomerDto customer = loyaltyService.getCustomerDetails(phone, countryCode);
            return ResponseEntity.ok(customer);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("Error fetching loyalty customer", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch customer details");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get transaction history for a customer
     */
    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('view:loyalty')")
    public ResponseEntity<?> getTransactionHistory(
            @RequestParam String phone,
            @RequestParam String countryCode) {
        try {
            List<LoyaltyTransactionDto> transactions = loyaltyService.getTransactionHistory(phone, countryCode);
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("Error fetching transaction history", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch transaction history");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Calculate points for purchase amount
     */
    @GetMapping("/calculate-points")
    @PreAuthorize("hasAuthority('view:loyalty')")
    public ResponseEntity<?> calculatePoints(
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String countryCode) {
        try {
            // Get customer tier if phone provided
            com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier tier = 
                com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier.BRONZE;
            double tierMultiplier = 1.0;
            
            if (phone != null && !phone.isEmpty()) {
                try {
                    LoyaltyCustomerDto customer = loyaltyService.getCustomerDetails(phone, 
                        countryCode != null ? countryCode : "+91");
                    tier = com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier.valueOf(customer.getTier());
                    tierMultiplier = tier.getPointsMultiplier();
                } catch (Exception e) {
                    // Customer not found, use default BRONZE tier
                    logger.debug("Customer not found, using BRONZE tier", e);
                }
            }
            
            int basePoints = (int) (amount.doubleValue() / 100.0 * 10);
            int totalPoints = (int) (basePoints * tierMultiplier);
            
            Map<String, Object> response = new HashMap<>();
            response.put("amount", amount);
            response.put("basePoints", basePoints);
            response.put("tierMultiplier", tierMultiplier);
            response.put("totalPoints", totalPoints);
            response.put("tier", tier.name());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error calculating points", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to calculate points");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Calculate discount for points
     */
    @GetMapping("/calculate-discount")
    @PreAuthorize("hasAuthority('view:loyalty')")
    public ResponseEntity<?> calculateDiscount(@RequestParam int points) {
        try {
            BigDecimal discount = loyaltyService.calculateMaxDiscount(points);
            
            Map<String, Object> response = new HashMap<>();
            response.put("points", points);
            response.put("discountAmount", discount);
            response.put("pointValue", loyaltyService.getPointValue());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error calculating discount", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to calculate discount");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get loyalty program information
     */
    @GetMapping("/program-info")
    public ResponseEntity<?> getProgramInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("pointsPerRupee100", 10);
        info.put("pointValue", loyaltyService.getPointValue());
        info.put("minPointsToRedeem", loyaltyService.getMinPointsToRedeem());
        info.put("signupBonus", 500);
        info.put("birthdayBonus", 1000);
        
        Map<String, Object> tiers = new HashMap<>();
        for (com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier tier : 
             com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier.values()) {
            Map<String, Object> tierInfo = new HashMap<>();
            tierInfo.put("minLifetimePoints", tier.getMinLifetimePoints());
            tierInfo.put("pointsMultiplier", tier.getPointsMultiplier());
            tierInfo.put("benefits", tier.getBenefits());
            tiers.put(tier.name(), tierInfo);
        }
        info.put("tiers", tiers);
        
        return ResponseEntity.ok(info);
    }
}
