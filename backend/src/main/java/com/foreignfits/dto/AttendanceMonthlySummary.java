package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceMonthlySummary {
    private Long employeeId;
    private String employeeName;
    private Long locationId;
    private String locationName;
    private int year;
    private int month;
    private int fullDays;
    private int halfDays;
    private int absentDays;
    private int leaveDays;
    private int missingCheckouts;
    private BigDecimal payableDays;
}
