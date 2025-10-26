package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationInventoryDto {
    private Long id;
    private Long locationId;
    private String locationName;
    private String locationType;
    private String productSku;
    private Long productId;
    private String productName;
    private Integer quantity;
    private Integer minStock;
    private Integer maxStock;
    private Integer reorderPoint;
    private LocalDateTime lastRestockDate;
    private LocalDateTime lastSaleDate;
    private Long lastMovementId;
    private boolean isLowStock;
    private boolean isOverStock;
    private boolean shouldReorder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
