package com.foreignfits.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSalePaymentMethodRequest {
    @NotNull(message = "Payment method is required")
    private String paymentMethod;
}
