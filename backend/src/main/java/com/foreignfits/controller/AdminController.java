package com.foreignfits.controller;

import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.User;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    
    private final UserRepository userRepository;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/pending-users")
    @PreAuthorize("hasAuthority('approve:users')")
    public ResponseEntity<List<UserDto>> getPendingUsers() {
        log.info("Fetching pending users");
        List<User> pendingUsers = userRepository.findByIsActive(false);
        List<UserDto> userDtos = pendingUsers.stream()
                .map(this::convertUserToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    @PostMapping("/approve-user/{userId}")
    @PreAuthorize("hasAuthority('approve:users')")
    public ResponseEntity<?> approveUser(@PathVariable Long userId) {
        log.info("Approving user with id={}", userId);
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setIsActive(true);
            userRepository.save(user);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User approved successfully");
            log.info("User approved successfully: id={}, email={}", userId, user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            log.error("Error approving user id={}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/reject-user/{userId}")
    @PreAuthorize("hasAuthority('approve:users')")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId) {
        log.info("Rejecting/deactivating user with id={}", userId);
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setIsActive(false);
            userRepository.save(user);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deactivated successfully");
            log.info("User deactivated successfully: id={}, email={}", userId, user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            log.error("Error deactivating user id={}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/all-users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.info("Fetching all users");
        List<User> users = userRepository.findAll();
        List<UserDto> userDtos = users.stream()
                .map(this::convertUserToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }
    
    @PostMapping("/update-subcategories")
    public ResponseEntity<?> updateSubcategories() {
        log.info("Updating product subcategories");
        try {
            Map<String, Integer> results = new HashMap<>();
            
            // Update Kids products
            int kidsCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'KIDS' " +
                "WHERE (LOWER(name) LIKE '%kid%' OR LOWER(name) LIKE '%kids%') " +
                "AND subcategory IS NULL"
            );
            results.put("kids", kidsCount);
            
            // Update Boys products
            int boysCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'BOYS' " +
                "WHERE (LOWER(name) LIKE '%boy%' OR LOWER(name) LIKE '%boys%') " +
                "AND subcategory IS NULL"
            );
            results.put("boys", boysCount);
            
            // Update Girls products
            int girlsCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'GIRLS' " +
                "WHERE (LOWER(name) LIKE '%girl%' OR LOWER(name) LIKE '%girls%') " +
                "AND subcategory IS NULL"
            );
            results.put("girls", girlsCount);
            
            // Update Mens products
            int mensCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'MENS' " +
                "WHERE (LOWER(name) LIKE '%men%' OR LOWER(name) LIKE '%mens%' OR LOWER(name) LIKE '%man%') " +
                "AND subcategory IS NULL"
            );
            results.put("mens", mensCount);
            
            // Update Womens products
            int womensCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'WOMENS' " +
                "WHERE (LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%womens%' OR LOWER(name) LIKE '%ladies%' OR LOWER(name) LIKE '%lady%') " +
                "AND subcategory IS NULL"
            );
            results.put("womens", womensCount);
            
            // Update Infant products
            int infantCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'INFANT' " +
                "WHERE (LOWER(name) LIKE '%infant%' OR LOWER(name) LIKE '%baby%') " +
                "AND subcategory IS NULL"
            );
            results.put("infant", infantCount);
            
            // Update Toddler products
            int toddlerCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'TODDLER' " +
                "WHERE LOWER(name) LIKE '%toddler%' " +
                "AND subcategory IS NULL"
            );
            results.put("toddler", toddlerCount);
            
            // Set remaining products to UNISEX
            int unisexCount = jdbcTemplate.update(
                "UPDATE products SET subcategory = 'UNISEX' " +
                "WHERE subcategory IS NULL"
            );
            results.put("unisex", unisexCount);
            
            int totalUpdated = results.values().stream().mapToInt(Integer::intValue).sum();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Subcategories updated successfully");
            response.put("updatedCounts", results);
            response.put("totalUpdated", totalUpdated);
            
            log.info("Subcategories updated successfully. Total products updated: {}", totalUpdated);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error updating subcategories: " + e.getMessage());
            log.error("Error updating subcategories: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    private UserDto convertUserToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        
        if (user.getLocation() != null) {
            dto.setLocationId(user.getLocation().getId());
            dto.setLocationName(user.getLocation().getName());
        }
        
        dto.setAvatar(user.getAvatar());
        dto.setIsActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
