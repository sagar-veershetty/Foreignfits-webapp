package com.foreignfits.controller;

import com.foreignfits.dto.ExpenseRequest;
import com.foreignfits.dto.ExpenseResponse;
import com.foreignfits.dto.ExpenseSummary;
import com.foreignfits.entity.Expense.ExpenseStatus;
import com.foreignfits.entity.Expense.ExpenseType;
import com.foreignfits.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasAuthority('create:expense')")
    public ResponseEntity<ExpenseResponse> createExpense(
            @RequestBody ExpenseRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ExpenseResponse response = expenseService.createExpense(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('edit:expense')")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @RequestBody ExpenseRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ExpenseResponse response = expenseService.updateExpense(id, request, username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('delete:expense')")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        expenseService.deleteExpense(id, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        ExpenseResponse response = expenseService.getExpenseById(id, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(Authentication authentication) {
        String username = authentication.getName();
        List<ExpenseResponse> expenses = expenseService.getAllExpenses(username);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByLocation(
            @PathVariable Long locationId,
            Authentication authentication) {
        String username = authentication.getName();
        List<ExpenseResponse> expenses = expenseService.getExpensesByLocation(locationId, username);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByType(
            @PathVariable ExpenseType type,
            Authentication authentication) {
        String username = authentication.getName();
        List<ExpenseResponse> expenses = expenseService.getExpensesByType(type, username);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<List<ExpenseResponse>> getExpensesWithFilters(
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) ExpenseType type,
            @RequestParam(required = false) ExpenseStatus status,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        String username = authentication.getName();
        List<ExpenseResponse> expenses = expenseService.getExpensesWithFilters(
                locationId, type, status, startDate, endDate, username);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('view:expense_reports')")
    public ResponseEntity<ExpenseSummary> getExpenseSummary(
            @RequestParam(required = false) Long locationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        String username = authentication.getName();
        ExpenseSummary summary = expenseService.getExpenseSummary(locationId, startDate, endDate, username);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/total/location/{locationId}")
    @PreAuthorize("hasAuthority('view:expense_reports')")
    public ResponseEntity<BigDecimal> getTotalExpensesByLocation(
            @PathVariable Long locationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        String username = authentication.getName();
        BigDecimal total = expenseService.getTotalExpensesByLocation(locationId, startDate, endDate, username);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/total/type/{type}")
    @PreAuthorize("hasAuthority('view:expense_reports')")
    public ResponseEntity<BigDecimal> getTotalExpensesByType(
            @PathVariable ExpenseType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        String username = authentication.getName();
        BigDecimal total = expenseService.getTotalExpensesByType(type, startDate, endDate, username);
        return ResponseEntity.ok(total);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('approve:expense')")
    public ResponseEntity<ExpenseResponse> approveExpense(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        ExpenseResponse response = expenseService.approveExpense(id, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('approve:expense')")
    public ResponseEntity<ExpenseResponse> rejectExpense(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication.getName();
        ExpenseResponse response = expenseService.rejectExpense(id, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('view:expenses')")
    public ResponseEntity<List<ExpenseResponse>> getPendingExpenses(Authentication authentication) {
        String username = authentication.getName();
        List<ExpenseResponse> expenses = expenseService.getPendingExpenses(username);
        return ResponseEntity.ok(expenses);
    }
}
