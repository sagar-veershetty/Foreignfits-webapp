package com.foreignfits.controller;

import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.Sale;
import com.foreignfits.entity.User;
import com.foreignfits.repository.SaleRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;

    @GetMapping("/pending-users")
    public ResponseEntity<List<UserDto>> getPendingUsers() {
        log.info("Fetching pending users");
        List<User> pendingUsers = userRepository.findByIsActive(false);
        List<UserDto> userDtos = pendingUsers.stream()
                .map(this::convertUserToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    @GetMapping("/pending-sales")
    public ResponseEntity<List<Sale>> getPendingSales() {
        log.info("Fetching pending sales");
        List<Sale> pendingSales = saleRepository.findByIsActive(false);
        return ResponseEntity.ok(pendingSales);
    }

    @PostMapping("/approve-user/{userId}")
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

    @PostMapping("/approve-sale/{saleId}")
    public ResponseEntity<?> approveSale(@PathVariable Long saleId) {
        log.info("Approving sale with id={}", saleId);
        try {
            Sale sale = saleRepository.findById(saleId)
                    .orElseThrow(() -> new RuntimeException("Sale not found"));
            sale.setIsActive(true);
            saleRepository.save(sale);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sale approved successfully");
            log.info("Sale approved successfully: id={}", saleId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            log.error("Error approving sale id={}: {}", saleId, e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/reject-sale/{saleId}")
    public ResponseEntity<?> rejectSale(@PathVariable Long saleId) {
        log.info("Rejecting sale with id={}", saleId);
        try {
            Sale sale = saleRepository.findById(saleId)
                    .orElseThrow(() -> new RuntimeException("Sale not found"));
            sale.setIsActive(false);
            saleRepository.save(sale);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sale rejected successfully");
            log.info("Sale rejected successfully: id={}", saleId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            log.error("Error rejecting sale id={}: {}", saleId, e.getMessage());
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
