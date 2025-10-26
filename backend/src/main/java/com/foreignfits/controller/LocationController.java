package com.foreignfits.controller;

import com.foreignfits.entity.Location;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.entity.User;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
public class LocationController {
    
    private final LocationRepository locationRepository;
    private final UserService userService;
    
    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        List<Location> locations = locationRepository.findAll();
        // Filter out INITIAL location (ID=0) - system-only location
        locations = locations.stream()
                .filter(loc -> loc.getId() != 0L)
                .toList();
        return ResponseEntity.ok(locations);
    }

    // Get all active locations except the user's own (for transfer destinations)
    @GetMapping("/transfer-destinations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Location>> getTransferDestinations(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getUserEntityByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long userLocationId = user.getLocation() != null ? user.getLocation().getId() : null;
        List<Location> destinations = locationRepository.findByIsActiveTrue();
        // Filter out INITIAL location (ID=0) and user's own location
        destinations = destinations.stream()
                .filter(loc -> loc.getId() != 0L)
                .filter(loc -> userLocationId == null || !loc.getId().equals(userLocationId))
                .toList();
        return ResponseEntity.ok(destinations);
    }
}
