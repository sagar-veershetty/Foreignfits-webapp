package com.foreignfits.controller;

import com.foreignfits.service.ProductImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/product-images/uploads")
@RequiredArgsConstructor
public class ProductImageUploadController {
    private final ProductImageUploadService uploads;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('add:product', 'edit:product')")
    public ResponseEntity<ProductImageUploadService.UploadResponse> prepare(
            @RequestBody ProductImageUploadService.UploadRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(uploads.prepare(request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalidImage(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
