package com.foreignfits.dto;

import com.foreignfits.entity.StockTransfer;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StockTransferDto {
    private Long id;
    private ProductDto product;
    private LocationDto fromLocation;
    private LocationDto toLocation;
    private Integer quantity;
    private String reason;
    private String reference;
    private StockTransfer.TransferStatus status;
    private UserDto requestedBy;
    private UserDto approvedBy;
    private UserDto completedBy;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;
    private String notes;
    private LocalDateTime updatedAt;
}
