package com.foreignfits.controller;

import com.foreignfits.config.S3Properties;
import com.foreignfits.service.ProductImageUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(ProductImageUploadControllerTest.Config.class)
class ProductImageUploadControllerTest {
    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean ProductImageUploadController controller() {
            return new ProductImageUploadController(new ProductImageUploadService(new S3Properties(), null));
        }
    }

    @Autowired ProductImageUploadController controller;
    private final ProductImageUploadService.UploadRequest request =
            new ProductImageUploadService.UploadRequest("image/png", 10L);

    @Test @WithMockUser(authorities = "view:products")
    void readOnlyUserCannotGetUploadUrl() {
        assertThrows(AccessDeniedException.class, () -> controller.prepare(request));
    }

    @Test @WithMockUser(authorities = "add:product")
    void creatorCanPrepareNonCacheableUpload() {
        assertEquals("no-store", controller.prepare(request).getHeaders().getCacheControl());
    }

    @Test @WithMockUser(authorities = "edit:product")
    void editorCanPrepareUpload() {
        assertEquals(200, controller.prepare(request).getStatusCode().value());
    }
}
