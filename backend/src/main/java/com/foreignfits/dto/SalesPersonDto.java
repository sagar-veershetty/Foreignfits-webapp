package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesPersonDto {
    
    private Long id;
    private String name;
    private String phone;
    private String email;
    private Long locationId;
    private String locationName;
    private Boolean isActive;
    private Double incentiveRate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String notes;
}
