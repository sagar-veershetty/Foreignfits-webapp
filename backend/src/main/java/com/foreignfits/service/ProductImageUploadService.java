package com.foreignfits.service;

import com.foreignfits.config.S3Properties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductImageUploadService {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");
    private static final long MAX_BYTES = 5 * 1024 * 1024;
    private final S3Properties properties;
    private final S3Presigner presigner;

    public record UploadRequest(String contentType, Long contentLength) {}
    public record UploadResponse(String mode, String uploadUrl, String imageUrl, Map<String, String> headers) {}

    public UploadResponse prepare(UploadRequest request) {
        if (request == null || request.contentType() == null || !EXTENSIONS.containsKey(request.contentType())) {
            throw new IllegalArgumentException("Use a JPEG, PNG, WebP or GIF image.");
        }
        if (request.contentLength() == null || request.contentLength() < 1 || request.contentLength() > MAX_BYTES) {
            throw new IllegalArgumentException("Each image must be between 1 byte and 5 MB.");
        }
        if (!properties.isEnabled()) {
            return new UploadResponse("inline", null, null, Map.of());
        }

        String key = "products/uploads/" + UUID.randomUUID() + "." + EXTENSIONS.get(request.contentType());
        // Sign the length as well as the type, so the URL cannot upload a larger object.
        var object = PutObjectRequest.builder().bucket(properties.getBucket()).key(key)
                .contentLength(request.contentLength()).contentType(request.contentType()).build();
        var signed = presigner.presignPutObject(PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5)).putObjectRequest(object).build());
        String base = properties.getPublicBaseUrl();
        if (base == null || base.isBlank()) {
            base = "https://" + properties.getBucket() + ".s3." + properties.getRegion() + ".amazonaws.com";
        }
        return new UploadResponse("direct", signed.url().toString(), base.replaceAll("/+$", "") + "/" + key,
                Map.of("Content-Type", request.contentType()));
    }
}
