package com.foreignfits.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request DTO for creating a barcode-based stock transfer
 * Used by warehouse and store users who scan/enter barcodes instead of specifying quantity
 */
@Data
public class CreateBarcodeTransferRequest {
    
    @NotNull(message = "From location ID is required")
    private Long fromLocationId;
    
    @NotNull(message = "To location ID is required")
    private Long toLocationId;
    
    @NotEmpty(message = "At least one barcode is required")
    private List<@NotBlank(message = "Barcode cannot be blank") String> barcodeNumbers;
    
    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
    
    @Size(max = 100, message = "Reference cannot exceed 100 characters")
    private String reference;
    
    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
}
