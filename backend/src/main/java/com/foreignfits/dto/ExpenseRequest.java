package com.foreignfits.dto;

import com.foreignfits.entity.Expense.ExpenseType;
import com.foreignfits.entity.Expense.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseRequest {
    private ExpenseType type;
    private BigDecimal amount;
    private String description;
    private LocalDateTime expenseDate;
    private Long locationId;
    private PaymentMethod paymentMethod;
    private String receiptUrl;
    private String notes;
}
