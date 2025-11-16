package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSummary {
    private BigDecimal totalExpenses;
    private Map<String, BigDecimal> expensesByType;
    private Map<String, BigDecimal> expensesByLocation;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
