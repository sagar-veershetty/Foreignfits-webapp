package com.foreignfits.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Junction table to track which specific barcodes are included in a transfer
 * This ensures we transfer the exact barcodes that were scanned
 */
@Entity
@Table(name = "transfer_barcodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferBarcode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id", nullable = false)
    private StockTransfer transfer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barcode_id", nullable = false)
    private Barcode barcode;
    
    @Column(name = "barcode_number", nullable = false)
    private String barcodeNumber;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public StockTransfer getTransfer() { return transfer; }
    public void setTransfer(StockTransfer transfer) { this.transfer = transfer; }
    
    public Barcode getBarcode() { return barcode; }
    public void setBarcode(Barcode barcode) { this.barcode = barcode; }
    
    public String getBarcodeNumber() { return barcodeNumber; }
    public void setBarcodeNumber(String barcodeNumber) { this.barcodeNumber = barcodeNumber; }
}
