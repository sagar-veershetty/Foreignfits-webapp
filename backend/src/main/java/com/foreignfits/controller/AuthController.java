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
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for email={}", loginRequest.getEmail());
        try {
            // Temporary simplified login - check user exists first
            UserDto user = userService.getUserByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // For now, accept "admin" as password for all users (TEMPORARY - for testing only)
            if (!"admin".equals(loginRequest.getPassword())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid email or password");
                error.put("debug", "Password must be: admin");
                log.info("Login failed for email={} reason=invalid-password", loginRequest.getEmail());
                return ResponseEntity.badRequest().body(error);
            }

            // Generate token directly from email (simplified)
            String token = tokenProvider.generateTokenFromEmail(loginRequest.getEmail());

            // Update last login
            userService.updateLastLogin(loginRequest.getEmail());
            log.info("Login successful for email={}", loginRequest.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("message", "Login successful");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password");
            error.put("debug", e.getMessage());
            log.error("Login error for email={}: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam User.UserRole role) {
        try {
            UserDto user = userService.createUser(name, email, password, role);
            
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
