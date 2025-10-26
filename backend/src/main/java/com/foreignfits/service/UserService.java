package com.foreignfits.service;

import com.foreignfits.dto.UserDto;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.User;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDto);
    }
    
    public Optional<UserDto> getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::convertToDto);
    }
    
    public UserDto createUser(String name, String email, String password, User.UserRole role) {
        return createUser(name, email, password, role, null);
    }
    
    public UserDto createUser(String name, String email, String password, User.UserRole role, Long locationId) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        
        // Validate location assignment based on role
        if (locationId != null) {
            Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + locationId));
            
            // SALES users can only be assigned to STORE locations
            if (role == User.UserRole.SALES && location.getType() != Location.LocationType.STORE) {
                throw new RuntimeException("Sales users can only be assigned to STORE locations");
            }
            
            // WAREHOUSE users can only be assigned to WAREHOUSE locations
            if (role == User.UserRole.WAREHOUSE && location.getType() != Location.LocationType.WAREHOUSE) {
                throw new RuntimeException("Warehouse users can only be assigned to WAREHOUSE locations");
            }
        } else {
            // SALES and WAREHOUSE users must have a location
            if (role == User.UserRole.SALES || role == User.UserRole.WAREHOUSE) {
                throw new RuntimeException(role + " users must be assigned to a location");
            }
        }
        
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setIsActive(true);
        
        // Set location if provided
        if (locationId != null) {
            Location location = locationRepository.findById(locationId).orElse(null);
            user.setLocation(location);
        }
        
        User savedUser = userRepository.save(user);
        return convertToDto(savedUser);
    }
    
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setName(userDto.getName());
        user.setRole(userDto.getRole());
        user.setIsActive(userDto.getIsActive());
        
        User savedUser = userRepository.save(user);
        return convertToDto(savedUser);
    }
    
    public void updateLastLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    public boolean verifyPassword(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public List<UserDto> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        
        // Include location information if user is assigned to a location
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