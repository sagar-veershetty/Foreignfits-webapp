package com.foreignfits.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foreignfits.dto.MultiBuyConfigDto;
import com.foreignfits.dto.MultiBuyOfferDto;
import com.foreignfits.entity.AppSetting;
import com.foreignfits.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MultiBuyOfferService {
    private static final String CONFIG_KEY = "multi_buy_offer_config";
    private final AppSettingRepository settings;
    private final ObjectMapper objectMapper;

    public MultiBuyConfigDto getConfig() {
        return settings.findById(CONFIG_KEY).map(setting -> {
            try {
                return objectMapper.readValue(setting.getValue(), MultiBuyConfigDto.class);
            } catch (Exception ignored) {
                return new MultiBuyConfigDto(false, new ArrayList<>());
            }
        }).orElseGet(() -> new MultiBuyConfigDto(false, new ArrayList<>()));
    }

    @Transactional
    public MultiBuyConfigDto save(MultiBuyConfigDto config) {
        if (config == null || config.getOffers() == null || config.getOffers().size() > 250) {
            throw new IllegalArgumentException("Add between 0 and 250 product offers.");
        }
        Set<String> codes = new HashSet<>();
        for (MultiBuyOfferDto offer : config.getOffers()) {
            if (offer.getProductCode() == null || offer.getProductCode().isBlank() || offer.getProductCode().length() > 100) {
                throw new IllegalArgumentException("Each offer must have a valid product code.");
            }
            offer.setProductCode(offer.getProductCode().trim());
            if (!codes.add(offer.getProductCode())) throw new IllegalArgumentException("A product can only have one offer.");
            if (offer.getTiers() == null || offer.getTiers().isEmpty() || offer.getTiers().size() > 20) {
                throw new IllegalArgumentException("Each product offer needs between 1 and 20 quantity tiers.");
            }
            Set<Integer> quantities = new HashSet<>();
            for (MultiBuyOfferDto.Tier tier : offer.getTiers()) {
                if (tier.getQuantity() == null || tier.getQuantity() < 2 || tier.getQuantity() > 1000
                        || !quantities.add(tier.getQuantity())) {
                    throw new IllegalArgumentException("Bundle quantities must be unique and between 2 and 1000.");
                }
                if (tier.getBundlePrice() == null || tier.getBundlePrice().compareTo(BigDecimal.ZERO) <= 0
                        || tier.getBundlePrice().compareTo(new BigDecimal("10000000")) > 0) {
                    throw new IllegalArgumentException("Bundle prices must be greater than ₹0 and no more than ₹1 crore.");
                }
                tier.setBundlePrice(tier.getBundlePrice().setScale(2, RoundingMode.HALF_UP));
            }
            offer.setTiers(offer.getTiers().stream().sorted(Comparator.comparing(MultiBuyOfferDto.Tier::getQuantity)).toList());
        }
        try {
            String json = objectMapper.writeValueAsString(config);
            if (json.length() > 12000) {
                throw new IllegalArgumentException("Offer settings are too large. Reduce the number of products or tiers.");
            }
            AppSetting setting = settings.findById(CONFIG_KEY).orElse(new AppSetting(CONFIG_KEY, "{}"));
            setting.setValue(json);
            settings.save(setting);
            return config;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Could not save multi-buy offers.", ex);
        }
    }

    public List<MultiBuyOfferDto> getActiveOffers() {
        MultiBuyConfigDto config = getConfig();
        return config.isEnabled() ? config.getOffers() : List.of();
    }

    public BigDecimal calculateDiscount(String productCode, List<BigDecimal> unitPrices) {
        return calculateDiscount(getActiveOffers(), productCode, unitPrices);
    }

    public BigDecimal calculateDiscount(List<MultiBuyOfferDto> offers, String productCode, List<BigDecimal> unitPrices) {
        if (offers == null || unitPrices == null || unitPrices.isEmpty()) return BigDecimal.ZERO;
        MultiBuyOfferDto offer = offers.stream()
                .filter(candidate -> candidate.getProductCode().equals(productCode)).findFirst().orElse(null);
        if (offer == null) return BigDecimal.ZERO;

        List<BigDecimal> prices = unitPrices.stream().sorted(Comparator.reverseOrder()).toList();
        BigDecimal[] cheapest = new BigDecimal[prices.size() + 1];
        cheapest[0] = BigDecimal.ZERO;
        for (int count = 1; count <= prices.size(); count++) {
            cheapest[count] = cheapest[count - 1].add(prices.get(count - 1));
            for (MultiBuyOfferDto.Tier tier : offer.getTiers()) {
                if (count >= tier.getQuantity()) {
                    BigDecimal bundle = cheapest[count - tier.getQuantity()].add(tier.getBundlePrice());
                    if (bundle.compareTo(cheapest[count]) < 0) cheapest[count] = bundle;
                }
            }
        }
        BigDecimal original = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return original.subtract(cheapest[prices.size()]).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}
