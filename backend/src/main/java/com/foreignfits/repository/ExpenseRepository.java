package com.foreignfits.repository;

import com.foreignfits.entity.Expense;
import com.foreignfits.entity.Expense.ExpenseStatus;
import com.foreignfits.entity.Expense.ExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Find expenses by location
    List<Expense> findByLocationId(Long locationId);

    // Find expenses by type
    List<Expense> findByType(ExpenseType type);

    // Find expenses by status
    List<Expense> findByStatus(ExpenseStatus status);

    // Find expenses by date range
    List<Expense> findByExpenseDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find expenses by location and date range
    List<Expense> findByLocationIdAndExpenseDateBetween(Long locationId, LocalDateTime startDate, LocalDateTime endDate);

    // Find expenses by type and date range
    List<Expense> findByTypeAndExpenseDateBetween(ExpenseType type, LocalDateTime startDate, LocalDateTime endDate);

    // Find expenses created by user
    List<Expense> findByCreatedBy(String username);

    // Calculate total expenses by location
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.location.id = :locationId")
    BigDecimal calculateTotalByLocation(@Param("locationId") Long locationId);

    // Calculate total expenses by location and date range
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.location.id = :locationId AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalByLocationAndDateRange(@Param("locationId") Long locationId, 
                                                     @Param("startDate") LocalDateTime startDate, 
                                                     @Param("endDate") LocalDateTime endDate);

    // Calculate total expenses by type
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.type = :type")
    BigDecimal calculateTotalByType(@Param("type") ExpenseType type);

    // Calculate total expenses by type and date range
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.type = :type AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateTotalByTypeAndDateRange(@Param("type") ExpenseType type,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);

    // Get expenses summary by type for a date range
    @Query("SELECT e.type, COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate GROUP BY e.type")
    List<Object[]> getExpenseSummaryByType(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);

    // Get expenses summary by type and location for a date range
    @Query("SELECT e.type, COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.location.id = :locationId AND e.expenseDate BETWEEN :startDate AND :endDate GROUP BY e.type")
    List<Object[]> getExpenseSummaryByTypeAndLocation(@Param("locationId") Long locationId,
                                                       @Param("startDate") LocalDateTime startDate, 
                                                       @Param("endDate") LocalDateTime endDate);

    // Get expenses summary by location for a date range
    @Query("SELECT e.location.name, COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate GROUP BY e.location.name")
    List<Object[]> getExpenseSummaryByLocation(@Param("startDate") LocalDateTime startDate, 
                                                @Param("endDate") LocalDateTime endDate);

    // Find pending expenses for approval
    @Query("SELECT e FROM Expense e WHERE e.status = 'PENDING' ORDER BY e.expenseDate DESC")
    List<Expense> findPendingExpenses();

    // Find expenses with filter criteria
    @Query("SELECT e FROM Expense e WHERE " +
           "(:locationId IS NULL OR e.location.id = :locationId) AND " +
           "(:type IS NULL OR e.type = :type) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "e.expenseDate BETWEEN :startDate AND :endDate " +
           "ORDER BY e.expenseDate DESC")
    List<Expense> findWithFilters(@Param("locationId") Long locationId,
                                  @Param("type") ExpenseType type,
                                  @Param("status") ExpenseStatus status,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);
}
