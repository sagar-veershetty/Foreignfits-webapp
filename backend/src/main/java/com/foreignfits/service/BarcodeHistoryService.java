package com.foreignfits.service;

import com.foreignfits.dto.BarcodeHistoryDto;
import com.foreignfits.entity.Barcode;
import com.foreignfits.entity.BarcodeHistory;
import com.foreignfits.entity.Location;
import com.foreignfits.entity.Product;
import com.foreignfits.repository.BarcodeHistoryRepository;
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
public class BarcodeHistoryService {
    
    private final BarcodeHistoryRepository barcodeHistoryRepository;
    
    @Transactional
    public BarcodeHistory recordHistory(
        Barcode barcode,
        String eventType,
        Location location,
        Location fromLocation,
        Location toLocation,
        String referenceType,
        Long referenceId,
        String notes,
        String performedBy
    ) {
        BarcodeHistory history = new BarcodeHistory();
        history.setBarcodeNumber(barcode.getBarcodeNumber());
        history.setBarcode(barcode);
        
        if (barcode.getProduct() != null) {
            Product product = barcode.getProduct();
            history.setProductSku(product.getSku());
            history.setProductName(product.getName());
        }
        
        history.setEventType(eventType);
        
        if (location != null) {
            history.setLocationId(location.getId());
            history.setLocationName(location.getName());
        }
        
        if (fromLocation != null) {
            history.setFromLocationId(fromLocation.getId());
            history.setFromLocationName(fromLocation.getName());
        }
        
        if (toLocation != null) {
            history.setToLocationId(toLocation.getId());
            history.setToLocationName(toLocation.getName());
        }
        
        history.setReferenceType(referenceType);
        history.setReferenceId(referenceId);
        history.setNotes(notes);
        history.setPerformedBy(performedBy);
        
        return barcodeHistoryRepository.save(history);
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getAllHistory() {
        return barcodeHistoryRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getHistoryByLocation(Long locationId) {
        return barcodeHistoryRepository.findByAnyLocationId(locationId)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getHistoryByBarcodeNumber(String barcodeNumber) {
        return barcodeHistoryRepository.findByBarcodeNumberOrderByCreatedAtDesc(barcodeNumber)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getHistoryByBarcodeNumberAndLocation(String barcodeNumber, Long locationId) {
        return barcodeHistoryRepository.findByBarcodeNumberAndLocationId(barcodeNumber, locationId)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return barcodeHistoryRepository.findByDateRange(startDate, endDate)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getHistoryByLocationAndDateRange(
        Long locationId, 
        LocalDateTime startDate, 
        LocalDateTime endDate
    ) {
        return barcodeHistoryRepository.findByLocationIdAndDateRange(locationId, startDate, endDate)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get complete history for all barcodes currently at a location
     * This includes creation history and all transfer history even if from other locations
     */
    @Transactional(readOnly = true)
    public List<BarcodeHistoryDto> getCompleteHistoryForBarcodesAtLocation(Long locationId) {
        // Get all history records where the barcode touched this location
        List<BarcodeHistory> locationHistory = barcodeHistoryRepository.findByAnyLocationId(locationId);
        
        // Extract unique barcode numbers
        List<String> barcodeNumbers = locationHistory.stream()
            .map(BarcodeHistory::getBarcodeNumber)
            .distinct()
            .collect(Collectors.toList());
        
        // For each barcode, get complete history
        return barcodeNumbers.stream()
            .flatMap(barcodeNumber -> 
                barcodeHistoryRepository.findByBarcodeNumberOrderByCreatedAtDesc(barcodeNumber).stream()
            )
            .map(this::toDto)
            .distinct() // Remove any duplicates
            .collect(Collectors.toList());
    }
    
    private BarcodeHistoryDto toDto(BarcodeHistory history) {
        BarcodeHistoryDto dto = new BarcodeHistoryDto();
        dto.setId(history.getId());
        dto.setBarcodeNumber(history.getBarcodeNumber());
        
        if (history.getBarcode() != null) {
            dto.setBarcodeId(history.getBarcode().getId());
        }
        
        dto.setProductSku(history.getProductSku());
        dto.setProductName(history.getProductName());
        dto.setEventType(history.getEventType());
        dto.setLocationId(history.getLocationId());
        dto.setLocationName(history.getLocationName());
        dto.setFromLocationId(history.getFromLocationId());
        dto.setFromLocationName(history.getFromLocationName());
        dto.setToLocationId(history.getToLocationId());
        dto.setToLocationName(history.getToLocationName());
        dto.setReferenceType(history.getReferenceType());
        dto.setReferenceId(history.getReferenceId());
        dto.setNotes(history.getNotes());
        dto.setPerformedBy(history.getPerformedBy());
        dto.setCreatedAt(history.getCreatedAt());
        
        return dto;
    }
}
