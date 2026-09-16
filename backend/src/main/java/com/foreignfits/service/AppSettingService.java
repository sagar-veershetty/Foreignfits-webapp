package com.foreignfits.service;

import com.foreignfits.entity.AppSetting;
import com.foreignfits.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private static final String DISCOUNT_ENABLED_KEY = "instant_discount_enabled";
    private static final String DISCOUNT_PERCENT_KEY = "instant_discount_percent";
    private static final BigDecimal DEFAULT_DISCOUNT_PERCENT = new BigDecimal("10.00");

    private final AppSettingRepository appSettingRepository;

    public boolean isDiscountEnabled() {
        return appSettingRepository.findById(DISCOUNT_ENABLED_KEY)
                .map(s -> "true".equalsIgnoreCase(s.getValue()))
                .orElse(true); // default: enabled
    }

    public void setDiscountEnabled(boolean enabled) {
        AppSetting setting = appSettingRepository.findById(DISCOUNT_ENABLED_KEY)
                .orElse(new AppSetting(DISCOUNT_ENABLED_KEY, "true"));
        setting.setValue(enabled ? "true" : "false");
        appSettingRepository.save(setting);
    }

    public BigDecimal getDiscountPercent() {
        return appSettingRepository.findById(DISCOUNT_PERCENT_KEY)
                .map(AppSetting::getValue)
                .map(this::parseDiscountPercent)
                .orElse(DEFAULT_DISCOUNT_PERCENT);
    }

    public void setDiscountPercent(BigDecimal percent) {
        if (percent == null) {
            throw new IllegalArgumentException("Discount percentage is required");
        }

        BigDecimal normalized = percent.setScale(2, java.math.RoundingMode.HALF_UP);
        if (normalized.compareTo(BigDecimal.ZERO) < 0 || normalized.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }

        AppSetting setting = appSettingRepository.findById(DISCOUNT_PERCENT_KEY)
                .orElse(new AppSetting(DISCOUNT_PERCENT_KEY, DEFAULT_DISCOUNT_PERCENT.toPlainString()));
        setting.setValue(normalized.toPlainString());
        appSettingRepository.save(setting);
    }

    public DiscountConfig getDiscountConfig() {
        return new DiscountConfig(isDiscountEnabled(), getDiscountPercent());
    }

    private BigDecimal parseDiscountPercent(String raw) {
        try {
            BigDecimal parsed = new BigDecimal(raw).setScale(2, java.math.RoundingMode.HALF_UP);
            if (parsed.compareTo(BigDecimal.ZERO) < 0 || parsed.compareTo(new BigDecimal("100")) > 0) {
                return DEFAULT_DISCOUNT_PERCENT;
            }
            return parsed;
        } catch (Exception ex) {
            return DEFAULT_DISCOUNT_PERCENT;
        }
    }

    public static class DiscountConfig {
        private final boolean enabled;
        private final BigDecimal percentage;

        public DiscountConfig(boolean enabled, BigDecimal percentage) {
            this.enabled = enabled;
            this.percentage = percentage;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public BigDecimal getPercentage() {
            return percentage;
        }
    }
}
