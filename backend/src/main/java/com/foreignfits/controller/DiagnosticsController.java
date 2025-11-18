package com.foreignfits.controller;

import com.foreignfits.entity.Location;
import com.foreignfits.entity.User;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/diagnostics")
@RequiredArgsConstructor
public class DiagnosticsController {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final Environment environment;

    @GetMapping("/database-status")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // Count records
        long locationCount = locationRepository.count();
        long userCount = userRepository.count();
        
        status.put("locationCount", locationCount);
        status.put("userCount", userCount);
        status.put("databaseUrl", environment.getProperty("spring.datasource.url"));
        status.put("databaseDriver", environment.getProperty("spring.datasource.driver-class-name"));
        status.put("hibernateDdlAuto", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
        status.put("sqlInitMode", environment.getProperty("spring.sql.init.mode"));
        status.put("deferDatasourceInit", environment.getProperty("spring.jpa.defer-datasource-initialization"));
        
        // Check if tables exist by trying to query
        try {
            locationRepository.findAll();
            status.put("locationTableExists", true);
        } catch (Exception e) {
            status.put("locationTableExists", false);
            status.put("locationTableError", e.getMessage());
        }
        
        try {
            userRepository.findAll();
            status.put("userTableExists", true);
        } catch (Exception e) {
            status.put("userTableExists", false);
            status.put("userTableError", e.getMessage());
        }
        
        return ResponseEntity.ok(status);
    }
}
