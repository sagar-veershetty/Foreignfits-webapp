package com.foreignfits.service;

import com.foreignfits.dto.ExpenseRequest;
import com.foreignfits.dto.ExpenseResponse;
import com.foreignfits.dto.ExpenseSummary;
import com.foreignfits.entity.Expense;
import com.foreignfits.entity.Expense.ExpenseStatus;
import com.foreignfits.entity.Expense.ExpenseType;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.User;
import com.foreignfits.repository.ExpenseRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    /**
     * Helper method to get user by username
     */
    private User getUserByUsername(String username) {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + username));
    }

    /**
     * Helper method to check if user is admin
     */
    private boolean isAdmin(User user) {
        return user.getRole() == User.UserRole.ADMIN;
    }

    /**
     * Helper method to filter expenses by user's location (for non-admin users)
     */
    private List<ExpenseResponse> filterByUserLocation(List<ExpenseResponse> expenses, User user) {
        if (isAdmin(user)) {
            return expenses;
        }
        
        if (user.getLocation() == null) {
            throw new RuntimeException("User location is not set");
        }
        
        Long userLocationId = user.getLocation().getId();
        return expenses.stream()
                .filter(expense -> expense.getLocationId().equals(userLocationId))
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, String username) {
        User user = getUserByUsername(username);
        
        // Non-admin users can only create expenses for their own location
        if (!isAdmin(user)) {
            if (user.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            // Force the location to be the user's location for non-admin users
            request.setLocationId(user.getLocation().getId());
        }
        
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));

        Expense expense = Expense.builder()
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate())
                .location(location)
                .paymentMethod(request.getPaymentMethod())
                .receiptUrl(request.getReceiptUrl())
                .notes(request.getNotes())
                .createdBy(username)
                .status(ExpenseStatus.APPROVED) // Auto-approve for now, can be changed to PENDING
                .build();

        expense = expenseRepository.save(expense);
        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, String username) {
        User user = getUserByUsername(username);
        
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        // Check if user has access to this expense's location
        if (!isAdmin(user) && user.getLocation() != null && !expense.getLocation().getId().equals(user.getLocation().getId())) {
            throw new RuntimeException("Access denied: You can only edit expenses from your own location");
        }

        // Non-admin users can only update to their own location
        if (!isAdmin(user)) {
            if (user.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            request.setLocationId(user.getLocation().getId());
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + request.getLocationId()));

        expense.setType(request.getType());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setLocation(location);
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setReceiptUrl(request.getReceiptUrl());
        expense.setNotes(request.getNotes());

        expense = expenseRepository.save(expense);
        return mapToResponse(expense);
    }

    @Transactional
    public void deleteExpense(Long id, String username) {
        User user = getUserByUsername(username);
        
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
        
        // Check if user has access to this expense's location
        if (!isAdmin(user) && user.getLocation() != null && !expense.getLocation().getId().equals(user.getLocation().getId())) {
            throw new RuntimeException("Access denied: You can only delete expenses from your own location");
        }
        
        expenseRepository.deleteById(id);
    }

    public ExpenseResponse getExpenseById(Long id, String username) {
        User user = getUserByUsername(username);
        
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
        
        // Check if user has access to this expense's location
        if (!isAdmin(user) && user.getLocation() != null && !expense.getLocation().getId().equals(user.getLocation().getId())) {
            throw new RuntimeException("Access denied: You can only view expenses from your own location");
        }
        
        return mapToResponse(expense);
    }

    public List<ExpenseResponse> getAllExpenses(String username) {
        User user = getUserByUsername(username);
        List<ExpenseResponse> expenses = expenseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return filterByUserLocation(expenses, user);
    }

    public List<ExpenseResponse> getExpensesByLocation(Long locationId, String username) {
        User user = getUserByUsername(username);
        
        // Check if user has access to this location
        if (!isAdmin(user) && user.getLocation() != null && !user.getLocation().getId().equals(locationId)) {
            throw new RuntimeException("Access denied: You can only view expenses from your own location");
        }
        
        return expenseRepository.findByLocationId(locationId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesByType(ExpenseType type, String username) {
        User user = getUserByUsername(username);
        List<ExpenseResponse> expenses = expenseRepository.findByType(type).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return filterByUserLocation(expenses, user);
    }

    public List<ExpenseResponse> getExpensesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return expenseRepository.findByExpenseDateBetween(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesWithFilters(Long locationId, ExpenseType type, 
                                                        ExpenseStatus status,
                                                        LocalDateTime startDate, 
                                                        LocalDateTime endDate,
                                                        String username) {
        User user = getUserByUsername(username);
        
        // For non-admin users, force filter by their location
        if (!isAdmin(user) && user.getLocation() != null) {
            locationId = user.getLocation().getId();
        }
        
        return expenseRepository.findWithFilters(locationId, type, status, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ExpenseSummary getExpenseSummary(Long locationId, LocalDateTime startDate, LocalDateTime endDate, String username) {
        User user = getUserByUsername(username);
        
        // For non-admin users, force filter by their location
        Long finalLocationId = locationId;
        if (!isAdmin(user) && user.getLocation() != null) {
            finalLocationId = user.getLocation().getId();
        }
        
        List<Object[]> byType;
        List<Object[]> byLocation;
        
        if (finalLocationId != null) {
            // Filter by specific location
            byType = expenseRepository.getExpenseSummaryByTypeAndLocation(finalLocationId, startDate, endDate);
            byLocation = expenseRepository.getExpenseSummaryByLocation(startDate, endDate);
            
            // Filter byLocation to only include the selected location
            final Long locId = finalLocationId;
            byLocation = byLocation.stream()
                .filter(row -> {
                    // Get location name from row
                    String locName = (String) row[0];
                    // Check if this matches the requested location
                    Location loc = locationRepository.findById(locId).orElse(null);
                    return loc != null && loc.getName().equals(locName);
                })
                .collect(Collectors.toList());
        } else if (isAdmin(user)) {
            // Admin without location filter - show all
            byType = expenseRepository.getExpenseSummaryByType(startDate, endDate);
            byLocation = expenseRepository.getExpenseSummaryByLocation(startDate, endDate);
        } else {
            // Non-admin user - filter by their location
            if (user.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            Long userLocationId = user.getLocation().getId();
            
            // Get expenses filtered by user's location
            List<ExpenseResponse> userExpenses = expenseRepository.findWithFilters(
                userLocationId, null, null, startDate, endDate
            ).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
            
            // Build summary from filtered expenses
            Map<String, BigDecimal> typeMap = new HashMap<>();
            for (ExpenseResponse expense : userExpenses) {
                String typeKey = expense.getType().toString();
                typeMap.merge(typeKey, expense.getAmount(), BigDecimal::add);
            }
            
            Map<String, BigDecimal> locationMap = new HashMap<>();
            locationMap.put(user.getLocation().getName(), 
                userExpenses.stream()
                    .map(ExpenseResponse::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            
            BigDecimal totalExpenses = typeMap.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            return ExpenseSummary.builder()
                    .totalExpenses(totalExpenses)
                    .expensesByType(typeMap)
                    .expensesByLocation(locationMap)
                    .startDate(startDate)
                    .endDate(endDate)
                    .build();
        }

        Map<String, BigDecimal> typeMap = new HashMap<>();
        for (Object[] row : byType) {
            typeMap.put(row[0].toString(), (BigDecimal) row[1]);
        }

        Map<String, BigDecimal> locationMap = new HashMap<>();
        for (Object[] row : byLocation) {
            locationMap.put((String) row[0], (BigDecimal) row[1]);
        }

        BigDecimal totalExpenses = typeMap.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ExpenseSummary.builder()
                .totalExpenses(totalExpenses)
                .expensesByType(typeMap)
                .expensesByLocation(locationMap)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    public BigDecimal getTotalExpensesByLocation(Long locationId, LocalDateTime startDate, LocalDateTime endDate, String username) {
        User user = getUserByUsername(username);
        
        // Check if user has access to this location
        if (!isAdmin(user) && user.getLocation() != null && !user.getLocation().getId().equals(locationId)) {
            throw new RuntimeException("Access denied: You can only view expenses from your own location");
        }
        
        return expenseRepository.calculateTotalByLocationAndDateRange(locationId, startDate, endDate);
    }

    public BigDecimal getTotalExpensesByType(ExpenseType type, LocalDateTime startDate, LocalDateTime endDate, String username) {
        User user = getUserByUsername(username);
        
        if (isAdmin(user)) {
            return expenseRepository.calculateTotalByTypeAndDateRange(type, startDate, endDate);
        } else {
            if (user.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            // Calculate total for user's location only
            List<ExpenseResponse> expenses = expenseRepository.findWithFilters(
                user.getLocation().getId(), type, null, startDate, endDate
            ).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
            
            return expenses.stream()
                .map(ExpenseResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    @Transactional
    public ExpenseResponse approveExpense(Long id, String approvedBy) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        expense.setStatus(ExpenseStatus.APPROVED);
        expense.setApprovedBy(approvedBy);
        expense = expenseRepository.save(expense);

        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse rejectExpense(Long id, String rejectedBy) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        expense.setStatus(ExpenseStatus.REJECTED);
        expense.setApprovedBy(rejectedBy);
        expense = expenseRepository.save(expense);

        return mapToResponse(expense);
    }

    public List<ExpenseResponse> getPendingExpenses(String username) {
        User user = getUserByUsername(username);
        List<ExpenseResponse> expenses = expenseRepository.findPendingExpenses().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return filterByUserLocation(expenses, user);
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .type(expense.getType())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .expenseDate(expense.getExpenseDate())
                .locationId(expense.getLocation().getId())
                .locationName(expense.getLocation().getName())
                .paymentMethod(expense.getPaymentMethod())
                .receiptUrl(expense.getReceiptUrl())
                .notes(expense.getNotes())
                .createdBy(expense.getCreatedBy())
                .approvedBy(expense.getApprovedBy())
                .status(expense.getStatus())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
