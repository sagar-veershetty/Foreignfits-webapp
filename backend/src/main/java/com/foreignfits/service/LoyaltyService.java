package com.foreignfits.service;

import com.foreignfits.dto.response.LoyaltyCustomerDto;
import com.foreignfits.dto.response.LoyaltyTransactionDto;
import com.foreignfits.entity.LoyaltyCustomer;
import com.foreignfits.entity.LoyaltyCustomer.LoyaltyTier;
import com.foreignfits.entity.LoyaltyTransaction;
import com.foreignfits.entity.LoyaltyTransaction.TransactionType;
import com.foreignfits.entity.Sale;
import com.foreignfits.repository.LoyaltyCustomerRepository;
import com.foreignfits.repository.LoyaltyTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LoyaltyService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoyaltyService.class);
    
    // Loyalty program configuration - Best practices for clothing/apparel industry
    private static final int POINTS_PER_100_RUPEES = 10; // 10 points per ₹100 spent
    private static final int SIGNUP_BONUS_POINTS = 500; // Welcome bonus
    private static final int BIRTHDAY_BONUS_POINTS = 1000; // Birthday reward
    private static final BigDecimal POINT_VALUE = new BigDecimal("0.20"); // Each point = ₹0.20
    private static final int MIN_POINTS_TO_REDEEM = 500; // Minimum 500 points to redeem
    
    @Autowired
    private LoyaltyCustomerRepository customerRepository;
    
    @Autowired
    private LoyaltyTransactionRepository transactionRepository;
    
    /**
     * Get or create loyalty customer by phone
     */
    @Transactional
    public LoyaltyCustomer getOrCreateCustomer(String phone, String countryCode, String name, String email) {
        Optional<LoyaltyCustomer> existingCustomer = customerRepository.findByPhoneAndCountryCode(phone, countryCode);
        
        if (existingCustomer.isPresent()) {
            return existingCustomer.get();
        }
        
        // Create new customer with signup bonus
        LoyaltyCustomer customer = new LoyaltyCustomer();
        customer.setPhone(phone);
        customer.setCountryCode(countryCode);
        customer.setName(name);
        customer.setEmail(email);
        customer.setTotalPoints(SIGNUP_BONUS_POINTS);
        customer.setLifetimePoints(SIGNUP_BONUS_POINTS);
        customer.setTier(LoyaltyTier.BRONZE);
        customer.setIsActive(true);
        
        customer = customerRepository.save(customer);
        
        // Record signup bonus transaction
        recordTransaction(customer, TransactionType.EARNED_SIGNUP, SIGNUP_BONUS_POINTS, 
                         null, "Welcome bonus - Thank you for joining!");
        
        logger.info("New loyalty customer created: {} with {} signup bonus points", phone, SIGNUP_BONUS_POINTS);
        
        return customer;
    }
    
    /**
     * Calculate and award points for a purchase
     */
    @Transactional
    public int awardPointsForPurchase(LoyaltyCustomer customer, Sale sale, BigDecimal purchaseAmount) {
        // Calculate base points: 10 points per ₹100
        BigDecimal pointsDecimal = purchaseAmount
            .divide(new BigDecimal("100"), 2, RoundingMode.DOWN)
            .multiply(new BigDecimal(POINTS_PER_100_RUPEES));
        
        // Apply tier multiplier
        double multiplier = customer.getTier().getPointsMultiplier();
        int basePoints = pointsDecimal.intValue();
        int totalPoints = (int) (basePoints * multiplier);
        
        // Update customer points
        customer.setTotalPoints(customer.getTotalPoints() + totalPoints);
        customer.setLifetimePoints(customer.getLifetimePoints() + totalPoints);
        customer.setLastPurchaseAt(LocalDateTime.now());
        
        // Check for tier upgrade
        LoyaltyTier newTier = LoyaltyTier.getTierForPoints(customer.getLifetimePoints());
        if (newTier != customer.getTier()) {
            customer.setTier(newTier);
            logger.info("Customer {} upgraded to tier: {}", customer.getPhone(), newTier);
        }
        
        customerRepository.save(customer);
        
        // Record transaction
        String description = String.format("Purchase of ₹%.2f - %.2fx tier bonus", 
                                         purchaseAmount, multiplier);
        recordTransaction(customer, TransactionType.EARNED_PURCHASE, totalPoints, sale, description);
        
        logger.info("Awarded {} points to customer {} for purchase of ₹{}", 
                   totalPoints, customer.getPhone(), purchaseAmount);
        
        return totalPoints;
    }
    
    /**
     * Redeem points for discount
     */
    @Transactional
    public BigDecimal redeemPoints(LoyaltyCustomer customer, int pointsToRedeem) {
        if (pointsToRedeem < MIN_POINTS_TO_REDEEM) {
            throw new IllegalArgumentException("Minimum " + MIN_POINTS_TO_REDEEM + " points required to redeem");
        }
        
        if (pointsToRedeem > customer.getTotalPoints()) {
            throw new IllegalArgumentException("Insufficient points. Available: " + customer.getTotalPoints());
        }
        
        // Calculate discount amount
        BigDecimal discount = POINT_VALUE.multiply(new BigDecimal(pointsToRedeem));
        
        // Deduct points
        customer.setTotalPoints(customer.getTotalPoints() - pointsToRedeem);
        customerRepository.save(customer);
        
        // Record transaction (negative points)
        String description = String.format("Redeemed %d points for ₹%.2f discount", pointsToRedeem, discount);
        recordTransaction(customer, TransactionType.REDEEMED, -pointsToRedeem, null, description);
        
        logger.info("Customer {} redeemed {} points for ₹{} discount", 
                   customer.getPhone(), pointsToRedeem, discount);
        
        return discount;
    }
    
    /**
     * Award birthday bonus points
     */
    @Transactional
    public void awardBirthdayBonus(LoyaltyCustomer customer) {
        customer.setTotalPoints(customer.getTotalPoints() + BIRTHDAY_BONUS_POINTS);
        customer.setLifetimePoints(customer.getLifetimePoints() + BIRTHDAY_BONUS_POINTS);
        customerRepository.save(customer);
        
        recordTransaction(customer, TransactionType.EARNED_BIRTHDAY, BIRTHDAY_BONUS_POINTS, 
                         null, "Happy Birthday! 🎉");
        
        logger.info("Birthday bonus {} points awarded to customer {}", BIRTHDAY_BONUS_POINTS, customer.getPhone());
    }
    
    /**
     * Get customer loyalty details
     */
    public LoyaltyCustomerDto getCustomerDetails(String phone, String countryCode) {
        LoyaltyCustomer customer = customerRepository.findByPhoneAndCountryCode(phone, countryCode)
            .orElseThrow(() -> new IllegalArgumentException("Loyalty customer not found"));
        
        return convertToDto(customer);
    }
    
    /**
     * Get transaction history
     */
    public List<LoyaltyTransactionDto> getTransactionHistory(String phone, String countryCode) {
        LoyaltyCustomer customer = customerRepository.findByPhoneAndCountryCode(phone, countryCode)
            .orElseThrow(() -> new IllegalArgumentException("Loyalty customer not found"));
        
        List<LoyaltyTransaction> transactions = transactionRepository.findByCustomerOrderByCreatedAtDesc(customer);
        
        return transactions.stream()
            .map(this::convertTransactionToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate maximum redeemable discount
     */
    public BigDecimal calculateMaxDiscount(int availablePoints) {
        if (availablePoints < MIN_POINTS_TO_REDEEM) {
            return BigDecimal.ZERO;
        }
        return POINT_VALUE.multiply(new BigDecimal(availablePoints));
    }
    
    /**
     * Calculate points that will be earned for a purchase amount
     */
    public int calculatePointsForAmount(BigDecimal amount, LoyaltyTier tier) {
        BigDecimal pointsDecimal = amount
            .divide(new BigDecimal("100"), 2, RoundingMode.DOWN)
            .multiply(new BigDecimal(POINTS_PER_100_RUPEES));
        
        double multiplier = tier.getPointsMultiplier();
        return (int) (pointsDecimal.intValue() * multiplier);
    }
    
    // Private helper methods
    
    private void recordTransaction(LoyaltyCustomer customer, TransactionType type, int points, 
                                   Sale sale, String description) {
        LoyaltyTransaction transaction = new LoyaltyTransaction();
        transaction.setCustomer(customer);
        transaction.setType(type);
        transaction.setPoints(points);
        transaction.setBalanceAfter(customer.getTotalPoints());
        transaction.setSale(sale);
        transaction.setDescription(description);
        
        transactionRepository.save(transaction);
    }
    
    private LoyaltyCustomerDto convertToDto(LoyaltyCustomer customer) {
        LoyaltyCustomerDto dto = new LoyaltyCustomerDto();
        dto.setId(customer.getId());
        dto.setPhone(customer.getPhone());
        dto.setCountryCode(customer.getCountryCode());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setDateOfBirth(customer.getDateOfBirth() != null ? customer.getDateOfBirth().toString() : null);
        dto.setTotalPoints(customer.getTotalPoints());
        dto.setLifetimePoints(customer.getLifetimePoints());
        dto.setTier(customer.getTier().name());
        dto.setTierBenefits(customer.getTier().getBenefits());
        dto.setTierMultiplier(customer.getTier().getPointsMultiplier());
        
        // Calculate points to next tier
        LoyaltyTier currentTier = customer.getTier();
        if (currentTier != LoyaltyTier.PLATINUM) {
            LoyaltyTier[] tiers = LoyaltyTier.values();
            for (int i = 0; i < tiers.length; i++) {
                if (tiers[i] == currentTier && i < tiers.length - 1) {
                    LoyaltyTier nextTier = tiers[i + 1];
                    dto.setNextTier(nextTier.name());
                    dto.setPointsToNextTier(nextTier.getMinLifetimePoints() - customer.getLifetimePoints());
                    break;
                }
            }
        } else {
            dto.setNextTier(null);
            dto.setPointsToNextTier(0);
        }
        
        dto.setJoinedAt(customer.getJoinedAt() != null ? customer.getJoinedAt().toString() : null);
        dto.setLastPurchaseAt(customer.getLastPurchaseAt() != null ? customer.getLastPurchaseAt().toString() : null);
        dto.setIsActive(customer.getIsActive());
        
        return dto;
    }
    
    private LoyaltyTransactionDto convertTransactionToDto(LoyaltyTransaction transaction) {
        LoyaltyTransactionDto dto = new LoyaltyTransactionDto();
        dto.setId(transaction.getId());
        dto.setType(transaction.getType().name());
        dto.setTypeDescription(transaction.getType().getDescription());
        dto.setPoints(transaction.getPoints());
        dto.setBalanceAfter(transaction.getBalanceAfter());
        dto.setSaleId(transaction.getSale() != null ? transaction.getSale().getId().toString() : null);
        dto.setDescription(transaction.getDescription());
        dto.setCreatedAt(transaction.getCreatedAt() != null ? transaction.getCreatedAt().toString() : null);
        dto.setExpiresAt(transaction.getExpiresAt() != null ? transaction.getExpiresAt().toString() : null);
        
        return dto;
    }
    
    public int getMinPointsToRedeem() {
        return MIN_POINTS_TO_REDEEM;
    }
    
    public BigDecimal getPointValue() {
        return POINT_VALUE;
    }
}
