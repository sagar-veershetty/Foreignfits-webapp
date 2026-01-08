package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleItemDto {
    private Long id;
    private ProductDto product;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal total;
    private List<String> barcodes; // List of barcode numbers sold in this item
    private Map<String, BigDecimal> barcodePrices; // Map of barcode number to individual price
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public ProductDto getProduct() { return product; }
    public void setProduct(ProductDto product) { this.product = product; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    
    public List<String> getBarcodes() { return barcodes; }
    public void setBarcodes(List<String> barcodes) { this.barcodes = barcodes; }
    
    public Map<String, BigDecimal> getBarcodePrices() { return barcodePrices; }
    public void setBarcodePrices(Map<String, BigDecimal> barcodePrices) { this.barcodePrices = barcodePrices; }
}