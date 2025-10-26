package com.foreignfits.controller;

import com.foreignfits.dto.UserDto;
import com.foreignfits.dto.request.LoginRequest;
import com.foreignfits.entity.User;
import com.foreignfits.security.JwtTokenProvider;
import com.foreignfits.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for email={}", loginRequest.getEmail());
        try {
            // Get user by email
            UserDto userDto = userService.getUserByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Invalid email or password"));

            // Verify password using PasswordEncoder
            if (!userService.verifyPassword(loginRequest.getEmail(), loginRequest.getPassword())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid email or password");
                log.info("Login failed for email={} reason=invalid-password", loginRequest.getEmail());
                return ResponseEntity.badRequest().body(error);
            }
            
            // Check if user is active
            if (!userDto.getIsActive()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Your account is pending approval. Please contact administrator.");
                log.info("Login failed for email={} reason=account-inactive", loginRequest.getEmail());
                return ResponseEntity.status(403).body(error);
            }

            // Generate token
            String token = tokenProvider.generateTokenFromEmail(loginRequest.getEmail());

            // Update last login
            userService.updateLastLogin(loginRequest.getEmail());
            log.info("Login successful for email={}", loginRequest.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", userDto);
            response.put("message", "Login successful");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password");
            log.error("Login error for email={}: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam User.UserRole role,
            @RequestParam(required = false) Long locationId) {
        try {
            UserDto user = userService.createUser(name, email, password, role, locationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("message", "User registered successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserDto user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(user);
    }
}
