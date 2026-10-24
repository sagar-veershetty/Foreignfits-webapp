package com.foreignfits.service;

import com.foreignfits.entity.*;
import com.foreignfits.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockAdjustmentBarcodeTest {
    @Mock ProductRepository products;
    @Mock StockMovementRepository movements;
    @Mock LocationInventoryRepository inventories;
    @Mock LocationRepository locations;
    @Mock StockTransferRepository transfers;
    @Mock UserRepository users;
    @Mock BarcodeService barcodes;
    @Mock TransferBarcodeRepository transferBarcodes;
    @Mock BarcodeRepository barcodeRepository;
    @Mock BarcodeHistoryService history;
    @InjectMocks StockService service;
    StockMovement movement;
    LocationInventory inventory;
    Product product;
    Location warehouse;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(910L);
        product.setSku("MESHI120BLU9775");
        warehouse = new Location();
        warehouse.setId(3L);
        warehouse.setName("Gangotri");
        StockTransfer transfer = new StockTransfer();
        transfer.setToLocation(warehouse);
        movement = new StockMovement();
        movement.setId(1L);
        movement.setProduct(product);
        movement.setTransfer(transfer);
        movement.setType(StockMovement.MovementType.ADJUSTMENT);
        movement.setStatus(StockMovement.MovementStatus.PENDING);
        movement.setQuantity(14);
        movement.setPreviousStock(0);
        movement.setNewStock(14);
        inventory = new LocationInventory();
        inventory.setQuantity(0);
        inventory.setCost(new BigDecimal("400"));
        inventory.setSalePrice(new BigDecimal("899"));
        when(movements.findById(1L)).thenReturn(Optional.of(movement));
    }

    void stubApproval() {
        when(inventories.findByLocationIdAndProductSku(3L, product.getSku()))
                .thenReturn(Optional.of(inventory));
        when(movements.save(movement)).thenReturn(movement);
    }

    @Test
    void createsPricedBarcodesAtWarehouseForFourteenAddedUnits() {
        stubApproval();
        List<Barcode> generated = List.of(new Barcode());
        when(barcodes.generateBarcodes(product, warehouse, 14, 400.0, 899.0)).thenReturn(generated);
        service.approveStockMovement(1L, "Warehouse", new User());
        assertEquals(14, inventory.getQuantity());
        assertEquals(generated, movement.getBarcodes());
        assertEquals(StockMovement.MovementStatus.APPROVED, movement.getStatus());
        verify(barcodes).generateBarcodes(product, warehouse, 14, 400.0, 899.0);
    }

    @Test
    void preservesStockChangesWhileApprovalWasPending() {
        stubApproval();
        inventory.setQuantity(5);
        service.approveStockMovement(1L, "Warehouse", new User());
        assertEquals(19, inventory.getQuantity());
        verify(barcodes).generateBarcodes(product, warehouse, 14, 400.0, 899.0);
    }

    @Test
    void duplicateApprovalCannotCreateMoreBarcodes() {
        movement.setStatus(StockMovement.MovementStatus.APPROVED);
        assertThrows(RuntimeException.class, () -> service.approveStockMovement(1L, "Warehouse", new User()));
        verifyNoInteractions(barcodes);
    }

    @Test
    void barcodeFailureDoesNotApproveOrSaveInventory() {
        when(inventories.findByLocationIdAndProductSku(3L, product.getSku()))
                .thenReturn(Optional.of(inventory));
        when(barcodes.generateBarcodes(product, warehouse, 14, 400.0, 899.0))
                .thenThrow(new RuntimeException("Barcode storage unavailable"));
        assertThrows(RuntimeException.class, () -> service.approveStockMovement(1L, "Warehouse", new User()));
        assertEquals(StockMovement.MovementStatus.PENDING, movement.getStatus());
        verify(inventories, never()).save(any());
    }
}
