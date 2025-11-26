package com.foreignfits.dto;

import com.foreignfits.entity.Exchange.ExchangeStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeDto {
    private Long id;
    private Long originalSaleId;
    private Long newSaleId;
    private String exchangeReason;
    private BigDecimal priceDifference;
    private ExchangeStatus status;
    private String exchangedByName;
    private String locationName;
    private String notes;
    private LocalDateTime createdAt;
    private List<ExchangeItemDto> items;
}
