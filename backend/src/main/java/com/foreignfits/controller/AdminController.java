package com.foreignfits.controller;

import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.User;
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
public class AdminController {
    
    private final UserRepository userRepository;

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
