package com.foreignfits.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ExpenseType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "expense_date", nullable = false)
    private LocalDateTime expenseDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(length = 1000)
    private String receiptUrl;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private String createdBy; // Username of the person who created the expense

    @Column(name = "approved_by")
    private String approvedBy; // Username of the person who approved (if applicable)

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ExpenseStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ExpenseType {
        DAILY_MAINTENANCE,      // Daily store maintenance
        SALARY,                 // Staff salaries
        RENT,                   // Store rent
        ELECTRICITY,            // Electricity bills
        WATER,                  // Water bills
        INTERNET,               // Internet/Phone bills
        INVENTORY_PURCHASE,     // Purchasing inventory
        MARKETING,              // Marketing and advertising
        TRANSPORTATION,         // Transportation costs
        EQUIPMENT,              // Equipment purchase/maintenance
        CLEANING,               // Cleaning services
        SECURITY,               // Security services
        OFFICE_SUPPLIES,        // Office supplies
        MISCELLANEOUS           // Other expenses
    }

    public enum PaymentMethod {
        CASH,
        CARD,
        UPI,
        BANK_TRANSFER,
        CHEQUE
    }

    public enum ExpenseStatus {
        PENDING,    // Waiting for approval
        APPROVED,   // Approved by manager
        REJECTED,   // Rejected
        PAID        // Payment completed
    }
}
