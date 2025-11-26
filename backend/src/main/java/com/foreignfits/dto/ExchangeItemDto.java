package com.foreignfits.dto;

import com.foreignfits.entity.ExchangeItem.ExchangeItemType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
