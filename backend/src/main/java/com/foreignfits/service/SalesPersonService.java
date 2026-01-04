package com.foreignfits.service;

import com.foreignfits.dto.SalesPersonDto;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.SalesPerson;
import com.foreignfits.repository.LocationRepository;
import com.foreignfits.repository.SalesPersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesPersonService {

    private final SalesPersonRepository salesPersonRepository;
    private final LocationRepository locationRepository;

    @Transactional
    public SalesPersonDto createSalesPerson(SalesPersonDto dto) {
        log.info("Creating sales person: {}", dto.getName());
        
        // Check for duplicate name
        if (salesPersonRepository.findByName(dto.getName()).isPresent()) {
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

        // Check for duplicate name (excluding current record)
        salesPersonRepository.findByName(dto.getName()).ifPresent(existing -> {
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
        return convertToDto(salesPerson);
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getAllSalesPersons() {
        return salesPersonRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getActiveSalesPersons() {
        return salesPersonRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalesPersonDto> getSalesPersonsByLocation(Long locationId) {
        return salesPersonRepository.findByLocationId(locationId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivateSalesPerson(Long id) {
        log.info("Deactivating sales person: {}", id);
        
        SalesPerson salesPerson = salesPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales person not found with id: " + id));
        
        salesPerson.setIsActive(false);
        salesPerson.setUpdatedAt(LocalDateTime.now());
        salesPersonRepository.save(salesPerson);
        
        log.info("Sales person deactivated successfully: {}", id);
    }

    @Transactional
    public void deleteSalesPerson(Long id) {
        log.info("Deleting sales person: {}", id);
        
        if (!salesPersonRepository.existsById(id)) {
            throw new RuntimeException("Sales person not found with id: " + id);
        }
        
        salesPersonRepository.deleteById(id);
        log.info("Sales person deleted successfully: {}", id);
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
