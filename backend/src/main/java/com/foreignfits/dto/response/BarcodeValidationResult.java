package com.foreignfits.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeValidationResult {
    private boolean success;
    private String message;
    private List<BarcodeError> errors = new ArrayList<>();
    private Long transferId; // If successful, the created transfer ID
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BarcodeError {
        private String barcodeNumber;
        private String errorType; // NOT_FOUND, WRONG_LOCATION, ALREADY_PENDING, NOT_ACTIVE, ALREADY_TRANSFERRED
        private String message;
        private String currentLocation; // For WRONG_LOCATION and ALREADY_TRANSFERRED
        private Long pendingTransferId; // For ALREADY_PENDING
    }
    
    public void addError(String barcodeNumber, String errorType, String message) {
        errors.add(new BarcodeError(barcodeNumber, errorType, message, null, null));
    }
    
    public void addError(String barcodeNumber, String errorType, String message, String currentLocation) {
        errors.add(new BarcodeError(barcodeNumber, errorType, message, currentLocation, null));
    }
    
    public void addError(String barcodeNumber, String errorType, String message, String currentLocation, Long pendingTransferId) {
        errors.add(new BarcodeError(barcodeNumber, errorType, message, currentLocation, pendingTransferId));
    }
    
    public boolean hasErrors() {
        return errors != null && !errors.isEmpty();
    }
}
