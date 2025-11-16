package com.foreignfits.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalePaymentDto {
    private Long id;
    
    @NotNull(message = "Payment method is required")
    private String paymentMethod; // CASH, CARD, OTHER
    
    @NotNull(message = "Payment amount is required")
    @Positive(message = "Payment amount must be positive")
    private BigDecimal amount;
    
    private String reference;
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
}
