package com.foreignfits.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeTransferStatusDto {
    private String barcodeNumber;
    private String status; // AVAILABLE, PENDING_TRANSFER, TRANSFERRED, SOLD
    private Long pendingTransferId;
    private String pendingTransferFrom;
    private String pendingTransferTo;
    private String currentLocation;
}
