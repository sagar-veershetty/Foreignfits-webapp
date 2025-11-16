package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeHistoryDto {
    
    private Long id;
    private String barcodeNumber;
    private Long barcodeId;
    private String productSku;
    private String productName;
    private String eventType;
    private Long locationId;
    private String locationName;
    private Long fromLocationId;
    private String fromLocationName;
    private Long toLocationId;
    private String toLocationName;
    private String referenceType;
    private Long referenceId;
    private String notes;
    private String performedBy;
    private LocalDateTime createdAt;
}
