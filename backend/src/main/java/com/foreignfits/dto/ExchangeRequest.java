package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRequest {
    private Long originalSaleId;
    private Long locationId;
    private String exchangeReason;
    private String notes;
    private String paymentMethod;
    private String salesPersonName;
    private List<ExchangePaymentRequest> payments;
    private List<ExchangeItemRequest> returnedItems;
    private List<ExchangeItemRequest> exchangedItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExchangePaymentRequest {
        private String paymentMethod;
        private java.math.BigDecimal amount;
        private String reference;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExchangeItemRequest {
        private Long productId;
        private Integer quantity;
        private String barcode; // Single barcode for backward compatibility
        private List<String> barcodes; // Multiple barcodes for batch returns/exchanges
    }
}
