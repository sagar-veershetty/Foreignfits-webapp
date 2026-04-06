package com.foreignfits.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleItemRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    @NotEmpty(message = "Barcode numbers are required for sale")
    private List<String> barcodeNumbers; // Scanned barcode numbers for this item

    private String salesPersonName; // Optional: sales person responsible for this item
    
    // Manual getters and setters to ensure compatibility
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public List<String> getBarcodeNumbers() { return barcodeNumbers; }
    public void setBarcodeNumbers(List<String> barcodeNumbers) { this.barcodeNumbers = barcodeNumbers; }

    public String getSalesPersonName() { return salesPersonName; }
    public void setSalesPersonName(String salesPersonName) { this.salesPersonName = salesPersonName; }
}