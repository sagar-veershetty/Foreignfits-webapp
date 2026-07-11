package com.foreignfits.service;

import com.foreignfits.dto.SalesPersonDto;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.SalesPerson;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.SaleItemRepository;
import com.foreignfits.repository.SaleRepository;
import com.foreignfits.repository.SalesPersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesPersonService {

    private final SalesPersonRepository salesPersonRepository;
    private final LocationRepository locationRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;

    @Transactional
    public SalesPersonDto createSalesPerson(SalesPersonDto dto) {
        log.info("Creating sales person: {}", dto.getName());
        
        // Check for duplicate name (case-insensitive). Restore if soft-deleted.
        SalesPerson existing = salesPersonRepository.findByNameIgnoreCase(dto.getName()).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                existing.setIsDeleted(false);
                existing.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
                existing.setPhone(dto.getPhone());
                existing.setEmail(dto.getEmail());
                existing.setIncentiveRate(dto.getIncentiveRate());
                existing.setNotes(dto.getNotes());
                existing.setUpdatedAt(LocalDateTime.now());

                if (dto.getLocationId() != null) {
                    Location location = locationRepository.findById(dto.getLocationId())
                            .orElseThrow(() -> new RuntimeException("Location not found with id: " + dto.getLocationId()));
                    existing.setLocation(location);
                }

                SalesPerson restored = salesPersonRepository.save(existing);
                return convertToDto(restored);
            }

            throw new RuntimeException("Sales person with name '" + dto.getName() + "' already exists");
        }

        SalesPerson salesPerson = new SalesPerson();
        salesPerson.setName(dto.getName());
        salesPerson.setPhone(dto.getPhone());
        salesPerson.setEmail(dto.getEmail());
        salesPerson.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        salesPerson.setIncentiveRate(dto.getIncentiveRate());
        salesPerson.setNotes(dto.getNotes());
        salesPerson.setCreatedAt(LocalDateTime.now());
        salesPerson.setUpdatedAt(LocalDateTime.now());

        // Set location if provided
        if (dto.getLocationId() != null) {
            Location location = locationRepository.findById(dto.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + dto.getLocationId()));
            salesPerson.setLocation(location);
        }

        SalesPerson saved = salesPersonRepository.save(salesPerson);
        log.info("Sales person created successfully: {}", saved.getId());
        
        return convertToDto(saved);
    }

    @Transactional
    public SalesPersonDto updateSalesPerson(Long id, SalesPersonDto dto) {
        log.info("Updating sales person: {}", id);
        
        SalesPerson salesPerson = salesPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales person not found with id: " + id));

        if (Boolean.TRUE.equals(salesPerson.getIsDeleted())) {
            throw new RuntimeException("Sales person not found with id: " + id);
        }

        // Check for duplicate name (excluding current record)
        salesPersonRepository.findByNameIgnoreCaseAndNotDeleted(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Sales person with name '" + dto.getName() + "' already exists");
            }
        });

        salesPerson.setName(dto.getName());
        salesPerson.setPhone(dto.getPhone());
        salesPerson.setEmail(dto.getEmail());
        salesPerson.setIsActive(dto.getIsActive());
        salesPerson.setIncentiveRate(dto.getIncentiveRate());
        salesPerson.setNotes(dto.getNotes());
        salesPerson.setUpdatedAt(LocalDateTime.now());

        // Update location if provided
        if (dto.getLocationId() != null) {
            Location location = locationRepository.findById(dto.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + dto.getLocationId()));
            salesPerson.setLocation(location);
        } else {
            salesPerson.setLocation(null);
        }

        SalesPerson updated = salesPersonRepository.save(salesPerson);
        log.info("Sales person updated successfully: {}", updated.getId());
        
        return convertToDto(updated);
    }

    @Transactional(readOnly = true)
    public SalesPersonDto getSalesPerson(Long id) {
        SalesPerson salesPerson = salesPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales person not found with id: " + id));

        if (Boolean.TRUE.equals(salesPerson.getIsDeleted())) {
            throw new RuntimeException("Sales person not found with id: " + id);
        }
        if (Boolean.TRUE.equals(salesPerson.getIsDeleted())) {
            throw new RuntimeException("Sales person not found with id: " + id);
        }
        return convertToDto(salesPerson);
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getAllSalesPersons() {
        syncSalesPersonsFromSales(null);
    return salesPersonRepository.findNotDeletedOrderByNameAsc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getActiveSalesPersons() {
        syncSalesPersonsFromSales(null);
    return salesPersonRepository.findActiveNotDeletedOrderByNameAsc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getSalesPersonsByLocation(Long locationId) {
        syncSalesPersonsFromSales(locationId);
    return salesPersonRepository.findByLocationIdOrLocationIsNullNotDeletedOrderByNameAsc(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void syncSalesPersonsFromSales(Long locationId) {
        Map<String, SalesPersonSeed> namesWithLocation = new LinkedHashMap<>();

        for (Object[] row : saleRepository.findDistinctSalesPersonNamesWithLocation(locationId)) {
            addNameWithLocation(namesWithLocation, row);
        }

        for (Object[] row : saleItemRepository.findDistinctSalesPersonNamesWithLocation(locationId)) {
            addNameWithLocation(namesWithLocation, row);
        }

        for (SalesPersonSeed seed : namesWithLocation.values()) {
            ensureSalesPersonExists(seed.name(), seed.locationId());
        }
    }

    @Transactional
    public SalesPersonDto ensureSalesPersonExists(String name, Long locationId) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }

        String trimmedName = name.trim();
        SalesPerson salesPerson;
        SalesPerson existing = salesPersonRepository.findByNameIgnoreCase(trimmedName).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                return null;
            }
            salesPerson = existing;
        } else {
            SalesPerson created = new SalesPerson();
            created.setName(trimmedName);
            created.setIsActive(true);
            created.setCreatedAt(LocalDateTime.now());
            created.setUpdatedAt(LocalDateTime.now());
            if (locationId != null) {
                Location location = locationRepository.findById(locationId)
                    .orElseThrow(() -> new RuntimeException("Location not found with id: " + locationId));
                created.setLocation(location);
            }
            salesPerson = salesPersonRepository.save(created);
        }

        if (salesPerson.getLocation() == null && locationId != null) {
            Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + locationId));
            salesPerson.setLocation(location);
            salesPerson.setUpdatedAt(LocalDateTime.now());
            salesPerson = salesPersonRepository.save(salesPerson);
        }

        return convertToDto(salesPerson);
    }

    private void addNameWithLocation(Map<String, SalesPersonSeed> namesWithLocation, Object[] row) {
        if (row == null || row.length < 1) {
            return;
        }

        String name = Objects.toString(row[0], "").trim();
        if (name.isEmpty()) {
            return;
        }

        Long locationId = row.length > 1 ? (Long) row[1] : null;
        String key = name.toLowerCase(Locale.ROOT);
        namesWithLocation.putIfAbsent(key, new SalesPersonSeed(name, locationId));
    }

    private record SalesPersonSeed(String name, Long locationId) {}

    @Transactional
    public void deactivateSalesPerson(Long id) {
        log.info("Deactivating sales person: {}", id);
        
        SalesPerson salesPerson = salesPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales person not found with id: " + id));

        if (Boolean.TRUE.equals(salesPerson.getIsDeleted())) {
            throw new RuntimeException("Sales person not found with id: " + id);
        }
        
        salesPerson.setIsActive(false);
        salesPerson.setUpdatedAt(LocalDateTime.now());
        salesPersonRepository.save(salesPerson);
        
        log.info("Sales person deactivated successfully: {}", id);
    }

    @Transactional
    public void deleteSalesPerson(Long id) {
        log.info("Deleting sales person: {}", id);
        
        SalesPerson salesPerson = salesPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales person not found with id: " + id));

        salesPerson.setIsDeleted(true);
        salesPerson.setIsActive(false);
        salesPerson.setUpdatedAt(LocalDateTime.now());
        salesPersonRepository.save(salesPerson);
        log.info("Sales person soft-deleted successfully: {}", id);
    }

    private SalesPersonDto convertToDto(SalesPerson salesPerson) {
        SalesPersonDto dto = new SalesPersonDto();
        dto.setId(salesPerson.getId());
        dto.setName(salesPerson.getName());
        dto.setPhone(salesPerson.getPhone());
        dto.setEmail(salesPerson.getEmail());
        dto.setIsActive(salesPerson.getIsActive());
        dto.setIncentiveRate(salesPerson.getIncentiveRate());
        dto.setCreatedAt(salesPerson.getCreatedAt());
        dto.setUpdatedAt(salesPerson.getUpdatedAt());
        dto.setNotes(salesPerson.getNotes());

        if (salesPerson.getLocation() != null) {
            dto.setLocationId(salesPerson.getLocation().getId());
            dto.setLocationName(salesPerson.getLocation().getName());
        }

        return dto;
    }
}
