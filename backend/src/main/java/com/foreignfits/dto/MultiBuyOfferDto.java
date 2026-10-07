package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiBuyOfferDto {
    private String productCode;
    private String productName;
    private List<Tier> tiers = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Tier {
        private Integer quantity;
        private BigDecimal bundlePrice;
    }
}
