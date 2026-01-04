package com.foreignfits.dto;

import com.foreignfits.entity.ExchangeItem.ExchangeItemType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private ExchangeItemType itemType;
    private String barcode;
    private BigDecimal price; // Price per unit for this item
}
