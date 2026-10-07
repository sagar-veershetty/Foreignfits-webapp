package com.foreignfits.service;

import com.foreignfits.dto.request.CreateStockTransferRequest;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StockTransferBatchTest {
    private final StockTransferService service = new StockTransferService(null, null, null, null, null, null, null, null);

    @Test
    void rejectsDuplicateProductsBeforeCreatingTransfers() {
        assertThrows(IllegalArgumentException.class, () -> service.createBatch(List.of(item(1L, 2L, 2), item(1L, 2L, 3)), 1L));
    }

    @Test
    void rejectsMixedDestinationsAndInvalidQuantitiesBeforeCreatingTransfers() {
        assertThrows(IllegalArgumentException.class, () -> service.createBatch(List.of(item(1L, 2L, 2), item(2L, 3L, 3)), 1L));
        assertThrows(IllegalArgumentException.class, () -> service.createBatch(List.of(item(1L, 2L, 2), item(2L, 2L, 0)), 1L));
    }

    private CreateStockTransferRequest item(Long productId, Long destination, int quantity) {
        CreateStockTransferRequest request = new CreateStockTransferRequest();
        request.setProductId(productId);
        request.setFromLocationId(1L);
        request.setToLocationId(destination);
        request.setQuantity(quantity);
        request.setReason("Restock");
        return request;
    }
}
