package com.foreignfits.service;

import com.foreignfits.config.S3Properties;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class ProductImageUploadServiceTest {
    @Test
    void signsUniqueBoundedUploadsWithFiveMinuteExpiry() {
        var properties = new S3Properties();
        properties.setEnabled(true);
        try (var signer = S3Presigner.builder().region(Region.AP_SOUTH_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("test", "test"))).build()) {
            var service = new ProductImageUploadService(properties, signer);
            var request = new ProductImageUploadService.UploadRequest("image/jpeg", 5L * 1024 * 1024);
            var response = service.prepare(request);
            String url = URLDecoder.decode(response.uploadUrl(), StandardCharsets.UTF_8);
            assertEquals("direct", response.mode());
            assertTrue(url.contains("X-Amz-Expires=300"));
            assertTrue(url.contains("X-Amz-SignedHeaders=content-length;content-type;host"));
            assertTrue(response.imageUrl().startsWith("https://foreign-fits-product-images.s3.ap-south-1.amazonaws.com/products/uploads/"));
            assertTrue(response.imageUrl().endsWith(".jpg"));
            assertEquals("image/jpeg", response.headers().get("Content-Type"));
            assertNotEquals(response.imageUrl(), service.prepare(request).imageUrl());
        }
    }

    @Test
    void rejectsUnsupportedTypesAndInvalidSizesBeforeSigning() {
        var service = new ProductImageUploadService(new S3Properties(), null);
        for (String type : new String[]{null, "image/svg+xml", "text/html", "image/jpeg; charset=utf-8"}) {
            assertThrows(IllegalArgumentException.class, () -> service.prepare(new ProductImageUploadService.UploadRequest(type, 10L)));
        }
        for (Long size : new Long[]{null, -1L, 0L, 5L * 1024 * 1024 + 1}) {
            assertThrows(IllegalArgumentException.class, () -> service.prepare(new ProductImageUploadService.UploadRequest("image/png", size)));
        }
    }

    @Test
    void disabledStorageRetainsLocalDevelopmentMode() {
        var service = new ProductImageUploadService(new S3Properties(), null);
        var response = service.prepare(new ProductImageUploadService.UploadRequest("image/png", 1L));
        assertEquals("inline", response.mode());
        assertNull(response.uploadUrl());
    }
}
