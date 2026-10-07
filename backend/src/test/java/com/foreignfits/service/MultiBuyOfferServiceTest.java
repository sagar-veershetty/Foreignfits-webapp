package com.foreignfits.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foreignfits.entity.AppSetting;
import com.foreignfits.repository.AppSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MultiBuyOfferServiceTest {
    private AppSettingRepository settings;
    private MultiBuyOfferService service;

    @BeforeEach
    void setUp() {
        settings = mock(AppSettingRepository.class);
        service = new MultiBuyOfferService(settings, new ObjectMapper());
    }

    @Test
    void appliesBestCombinationAcrossProductTiers() {
        configure("""
                {"enabled":true,"offers":[{"productCode":"FF-MEN-TSH-00044","productName":"Men's T-Shirt","tiers":[{"quantity":2,"bundlePrice":1999},{"quantity":3,"bundlePrice":999}]}]}
                """);

        BigDecimal discount = service.calculateDiscount("FF-MEN-TSH-00044", List.of(
                new BigDecimal("1000"), new BigDecimal("1000"), new BigDecimal("1000"),
                new BigDecimal("1000"), new BigDecimal("1000")));

        assertEquals(new BigDecimal("2002.00"), discount);
    }

    @Test
    void returnsNoSavingsWhenOffersAreDisabledOrProductDoesNotMatch() {
        configure("""
                {"enabled":false,"offers":[{"productCode":"FF-MEN-TSH-00044","productName":"Men's T-Shirt","tiers":[{"quantity":2,"bundlePrice":100}]}]}
                """);
        assertEquals(BigDecimal.ZERO, service.calculateDiscount("FF-MEN-TSH-00044", List.of(new BigDecimal("500"), new BigDecimal("500"))));

        configure("""
                {"enabled":true,"offers":[{"productCode":"FF-MEN-TSH-00044","productName":"Men's T-Shirt","tiers":[{"quantity":2,"bundlePrice":100}]}]}
                """);
        assertEquals(BigDecimal.ZERO, service.calculateDiscount("OTHER", List.of(new BigDecimal("500"), new BigDecimal("500"))));
    }

    private void configure(String json) {
        when(settings.findById("multi_buy_offer_config"))
                .thenReturn(Optional.of(new AppSetting("multi_buy_offer_config", json)));
    }
}
