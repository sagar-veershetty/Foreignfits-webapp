package com.foreignfits.dto.response;

public class LoyaltyCustomerDto {
    private Long id;
    private String phone;
    private String countryCode;
    private String name;
    private String email;
    private String dateOfBirth;
    private Integer totalPoints;
    private Integer lifetimePoints;
    private String tier;
    private String tierBenefits;
    private Double tierMultiplier;
    private Integer pointsToNextTier;
    private String nextTier;
    private String joinedAt;
    private String lastPurchaseAt;
    private Boolean isActive;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getLifetimePoints() {
        return lifetimePoints;
    }

    public void setLifetimePoints(Integer lifetimePoints) {
        this.lifetimePoints = lifetimePoints;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getTierBenefits() {
        return tierBenefits;
    }

    public void setTierBenefits(String tierBenefits) {
        this.tierBenefits = tierBenefits;
    }

    public Double getTierMultiplier() {
        return tierMultiplier;
    }

    public void setTierMultiplier(Double tierMultiplier) {
        this.tierMultiplier = tierMultiplier;
    }

    public Integer getPointsToNextTier() {
        return pointsToNextTier;
    }

    public void setPointsToNextTier(Integer pointsToNextTier) {
        this.pointsToNextTier = pointsToNextTier;
    }

    public String getNextTier() {
        return nextTier;
    }

    public void setNextTier(String nextTier) {
        this.nextTier = nextTier;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public String getLastPurchaseAt() {
        return lastPurchaseAt;
    }

    public void setLastPurchaseAt(String lastPurchaseAt) {
        this.lastPurchaseAt = lastPurchaseAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
