package com.foreignfits.dto.request;

import com.foreignfits.entity.Sale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleRequest {
    
    @NotEmpty(message = "Sale items are required")
    @Valid
    private List<SaleItemRequest> items;
    
    @NotNull(message = "Location ID is required")
    private Long locationId; // Location where sale is being made
    
    @NotNull(message = "Payment method is required")
    private Sale.PaymentMethod paymentMethod;
    
    @Size(max = 100, message = "Customer name cannot exceed 100 characters")
    private String customerName;
    
    @Size(max = 150, message = "Customer email cannot exceed 150 characters")
    private String customerEmail;
    
    @Size(max = 15, message = "Customer phone cannot exceed 15 characters")
    private String customerPhone;
    
    @Size(max = 5, message = "Customer country code cannot exceed 5 characters")
    private String customerCountryCode;
    
    private Integer pointsToRedeem; // Optional: points customer wants to redeem for discount
    
    @Size(max = 100, message = "Sales person name cannot exceed 100 characters")
    private String salesPersonName; // Optional: name of the sales person who assisted with the sale
    
    // Manual getters and setters to ensure compatibility
    public List<SaleItemRequest> getItems() { return items; }
    public void setItems(List<SaleItemRequest> items) { this.items = items; }
    
    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    
    public Sale.PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(Sale.PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public String getCustomerCountryCode() { return customerCountryCode; }
    public void setCustomerCountryCode(String customerCountryCode) { this.customerCountryCode = customerCountryCode; }
    
    public Integer getPointsToRedeem() { return pointsToRedeem; }
    public void setPointsToRedeem(Integer pointsToRedeem) { this.pointsToRedeem = pointsToRedeem; }
    
    public String getSalesPersonName() { return salesPersonName; }
    public void setSalesPersonName(String salesPersonName) { this.salesPersonName = salesPersonName; }
}