package com.foreignfits.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sale_items")
@Data
@EqualsAndHashCode(exclude = {"sale", "product", "barcodes"})
@ToString(exclude = {"sale", "product", "barcodes"})
@NoArgsConstructor
@AllArgsConstructor
public class SaleItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(nullable = false)
    private Integer quantity;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    
    @NotNull(message = "Total is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Total format is invalid")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "sales_person_name", length = 100)
    private String salesPersonName;
    
    // Track which specific barcodes were sold in this item
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "sale_item_barcodes",
        joinColumns = @JoinColumn(name = "sale_item_id"),
        inverseJoinColumns = @JoinColumn(name = "barcode_id")
    )
    private List<Barcode> barcodes = new ArrayList<>();
    
    // Manual getters and setters to ensure compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Sale getSale() { return sale; }
    public void setSale(Sale sale) { this.sale = sale; }
    
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getSalesPersonName() { return salesPersonName; }
    public void setSalesPersonName(String salesPersonName) { this.salesPersonName = salesPersonName; }
    
    public List<Barcode> getBarcodes() { return barcodes; }
    public void setBarcodes(List<Barcode> barcodes) { this.barcodes = barcodes; }
}