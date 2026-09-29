package com.foreignfits.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to add additional quantity to an EXISTING product's inventory at a location
 * (typically Supplier/warehouse) and generate new barcodes for the added units.
 *
 * Use case: Recounting physical stock already present at a store/warehouse and
 * re-registering it into the system against the same product/SKU, so fresh barcodes
 * can be printed and the stock can be moved through the normal transfer workflow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestockProductRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String reason; // Optional note, e.g. "Recount from store"

    // Whether to apply the location's existing cost/sale price to the newly generated barcodes
    private Boolean applyPriceToBarcode = true;

    // Manual getters/setters for compatibility with the rest of the codebase style
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Boolean getApplyPriceToBarcode() { return applyPriceToBarcode != null ? applyPriceToBarcode : true; }
    public void setApplyPriceToBarcode(Boolean applyPriceToBarcode) { this.applyPriceToBarcode = applyPriceToBarcode; }
}
