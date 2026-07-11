package com.foreignfits.service;

import com.foreignfits.entity.AppSetting;
import com.foreignfits.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private static final String DISCOUNT_ENABLED_KEY = "instant_discount_enabled";

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
}
