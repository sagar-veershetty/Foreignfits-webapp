package com.foreignfits.controller;

import com.foreignfits.dto.LocationInventoryDto;
import com.foreignfits.repository.LocationInventoryRepository;
import com.foreignfits.repository.ProductRepository;
import com.foreignfits.service.LocationInventoryService;
import com.foreignfits.service.MultiBuyOfferService;
import com.foreignfits.service.UserService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicCatalogTest {
    @Test
    void exposesSellingPriceButNotInternalPricingOrStockCounts() {
        var service = mock(LocationInventoryService.class);
        var products = mock(ProductRepository.class);
        var stock = new LocationInventoryDto();
        stock.setProductId(1L);
        stock.setProductSku("SHIRT-M");
        stock.setProductName("Shirt");
        stock.setQuantity(42);
        stock.setSalePrice(new BigDecimal("899"));
        stock.setCost(new BigDecimal("400"));
        stock.setWholesalePrice(new BigDecimal("599"));
        stock.setWholesaleMinQuantity(10);
        when(service.getAllInventory()).thenReturn(List.of(stock));
        when(products.findAllById(List.of(1L))).thenReturn(List.of());
        var controller = new LocationInventoryController(service, mock(UserService.class), mock(LocationInventoryRepository.class), products, mock(MultiBuyOfferService.class));
        var result = controller.getPublicCatalog().getBody();
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(new BigDecimal("899"), result.get(0).get("salePrice"));
        assertEquals(true, result.get(0).get("available"));
        for (var key : List.of("cost", "wholesalePrice", "wholesaleMinQuantity", "quantity", "locationId")) {
            assertFalse(result.get(0).containsKey(key), key + " must not be public");
        }
        stock.setQuantity(0);
        assertTrue(controller.getPublicCatalog().getBody().isEmpty());
    }
}
