package com.foreignfits.dto.request;

import com.foreignfits.entity.Product;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name cannot exceed 200 characters")
    private String name;
    
    @NotNull(message = "Category is required")
    private Product.ProductCategory category;
    
    @NotBlank(message = "Size is required")
    @Size(max = 20, message = "Size cannot exceed 20 characters")
    private String size;
    
    @NotBlank(message = "Color is required")
    @Size(max = 50, message = "Color cannot exceed 50 characters")
    private String color;
    
    // Pricing fields moved to LocationInventory - kept here for backward compatibility
    // Frontend sends 'salePrice', backend internally uses 'price'
    private BigDecimal price;       // Maps to salePrice from frontend
    private BigDecimal salePrice;   // Alternative field name for frontend compatibility
    private BigDecimal cost;
    private BigDecimal wholesalePrice;
    private Integer wholesaleMinQuantity;
    
    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;
    
    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock cannot be negative")
    private Integer minStock;
    
    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    private String sku;
    
    private Boolean isManualSku = false; // True if SKU was manually entered, false if auto-generated
    
    private String description;
    
    private List<String> imageUrls;
    
    @NotNull(message = "Location ID is required")
    private Long locationId;
    
    // Manual getters and setters to ensure compatibility
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Product.ProductCategory getCategory() { return category; }
    public void setCategory(Product.ProductCategory category) { this.category = category; }
    
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    // Handle both 'price' and 'salePrice' from frontend
    public BigDecimal getPrice() { 
        return price != null ? price : salePrice; 
    }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getSalePrice() { 
        return salePrice != null ? salePrice : price; 
    }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }
    
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    
    public BigDecimal getWholesalePrice() { return wholesalePrice; }
    public void setWholesalePrice(BigDecimal wholesalePrice) { this.wholesalePrice = wholesalePrice; }
    
    public Integer getWholesaleMinQuantity() { return wholesaleMinQuantity; }
    public void setWholesaleMinQuantity(Integer wholesaleMinQuantity) { this.wholesaleMinQuantity = wholesaleMinQuantity; }
    
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    
    public Integer getMinStock() { return minStock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
    
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    
    public Boolean getIsManualSku() { return isManualSku; }
    public void setIsManualSku(Boolean isManualSku) { this.isManualSku = isManualSku; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    
    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
}