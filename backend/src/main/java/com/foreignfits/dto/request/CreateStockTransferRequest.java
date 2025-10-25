package com.foreignfits.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateStockTransferRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "From location ID is required")
    private Long fromLocationId;
    
    @NotNull(message = "To location ID is required")
    private Long toLocationId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
    
    @Size(max = 100, message = "Reference cannot exceed 100 characters")
    private String reference;
    
    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
}
