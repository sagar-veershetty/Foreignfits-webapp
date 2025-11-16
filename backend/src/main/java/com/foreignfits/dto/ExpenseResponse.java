package com.foreignfits.dto;

import com.foreignfits.entity.Expense.ExpenseStatus;
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
public class ExpenseResponse {
    private Long id;
    private ExpenseType type;
    private BigDecimal amount;
    private String description;
    private LocalDateTime expenseDate;
    private Long locationId;
    private String locationName;
    private PaymentMethod paymentMethod;
    private String receiptUrl;
    private String notes;
    private String createdBy;
    private String approvedBy;
    private ExpenseStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
