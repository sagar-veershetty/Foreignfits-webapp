package com.foreignfits.controller;

import com.foreignfits.entity.Location;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.UserRepository;
import com.foreignfits.entity.User;
import com.foreignfits.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
public class LocationController {
    
    private final LocationRepository locationRepository;
    private final LocationInventoryRepository locationInventoryRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    
    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
    List<Location> locations = locationRepository.findByIsActiveTrue();
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

    @GetMapping("/warehouses")
    @PreAuthorize("hasAuthority('view:locations')")
    public ResponseEntity<List<Location>> getWarehouses() {
        List<Location> warehouses = locationRepository.findByTypeAndIsActiveTrue(Location.LocationType.WAREHOUSE)
                .stream()
                .filter(loc -> loc.getId() != 0L)
                .toList();
        return ResponseEntity.ok(warehouses);
    }

    @PostMapping("/warehouses")
    @PreAuthorize("hasAuthority('manage:locations')")
    public ResponseEntity<?> createWarehouse(@RequestBody WarehouseRequest request) {
        String name = safeTrim(request.name());
        String address = safeTrim(request.address());
        String city = safeTrim(request.city());
        String state = safeTrim(request.state());
        String zipCode = safeTrim(request.zipCode());

        if (name.isEmpty() || address.isEmpty() || city.isEmpty() || state.isEmpty() || zipCode.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, address, city, state and zip code are required"));
        }

        boolean exists = locationRepository.existsByNameIgnoreCaseAndTypeAndIsActiveTrue(name, Location.LocationType.WAREHOUSE);
        if (exists) {
            return ResponseEntity.badRequest().body(Map.of("error", "An active warehouse with this name already exists"));
        }

        Location warehouse = new Location();
        warehouse.setName(name);
        warehouse.setType(Location.LocationType.WAREHOUSE);
        warehouse.setAddress(address);
        warehouse.setCity(city);
        warehouse.setState(state);
        warehouse.setZipCode(zipCode);
        warehouse.setPhone(optionalTrim(request.phone()));
        warehouse.setManager(optionalTrim(request.manager()));
        warehouse.setCapacity(request.capacity());
        warehouse.setIsActive(true);

        Location saved = locationRepository.save(warehouse);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/warehouses/{warehouseId}")
    @PreAuthorize("hasAuthority('manage:locations')")
    public ResponseEntity<?> deleteWarehouse(@PathVariable Long warehouseId) {
        Location warehouse = locationRepository.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        if (warehouse.getId() == 0L) {
            return ResponseEntity.badRequest().body(Map.of("error", "System location cannot be deleted"));
        }

        if (warehouse.getType() != Location.LocationType.WAREHOUSE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only warehouse locations can be deleted from this screen"));
        }

        long activeWarehouseCount = locationRepository.countByTypeAndIsActiveTrue(Location.LocationType.WAREHOUSE);
        if (Boolean.TRUE.equals(warehouse.getIsActive()) && activeWarehouseCount <= 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete the last active warehouse"));
        }

        if (userRepository.existsByLocationIdAndIsActiveTrue(warehouseId)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cannot delete warehouse while active users are assigned. Reassign users first."
            ));
        }

    if (locationInventoryRepository.existsByLocationIdAndQuantityGreaterThan(warehouseId, 0)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cannot delete warehouse while inventory exists. Remove inventory from this warehouse first."
            ));
        }

        warehouse.setIsActive(false);
        locationRepository.save(warehouse);

        return ResponseEntity.ok(Map.of(
                "message", "Warehouse deleted successfully",
                "warehouseId", warehouseId
        ));
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String optionalTrim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record WarehouseRequest(
            String name,
            String address,
            String city,
            String state,
            String zipCode,
            String phone,
            String manager,
            Integer capacity
    ) {}
}
