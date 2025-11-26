package com.foreignfits.config;

import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            log.info("===== DATA INITIALIZATION CHECK =====");
            
            long locationCount = locationRepository.count();
            long userCount = userRepository.count();
            
            log.info("Locations in database: {}", locationCount);
            log.info("Users in database: {}", userCount);
            
            if (locationCount == 0) {
                log.warn("⚠️  WARNING: No locations found in database!");
                log.warn("⚠️  data.sql may not have executed properly");
                log.warn("⚠️  Check application.yml configuration:");
                log.warn("⚠️    - spring.sql.init.mode should be 'always'");
                log.warn("⚠️    - spring.jpa.defer-datasource-initialization should be 'true'");
            } else {
                log.info("✅ Data initialization successful!");
                log.info("✅ Found {} locations and {} users", locationCount, userCount);
            }
            
            log.info("===== END DATA INITIALIZATION CHECK =====");
        };
    }
}
