package com.foreignfits.service;

import com.foreignfits.config.S3Properties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Uploads product images to S3 and returns public HTTPS URLs, replacing any
 * base64 data URLs the frontend may send. Existing http(s) URLs are passed
 * through unchanged so already-migrated images aren't re-uploaded.
 *
 * When app.aws.s3.enabled=false (default), this service is a no-op passthrough,
 * preserving the previous base64-in-database behavior for local/dev use.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageStorageService {

    private static final Pattern DATA_URL_PATTERN =
            Pattern.compile("^data:image/(?<ext>[a-zA-Z0-9.+-]+);base64,(?<data>.+)$", Pattern.DOTALL);

    private final S3Client s3Client;
    private final S3Properties s3Properties;

    /**
     * Processes a list of image URLs/data-URLs for a product, uploading any
     * base64 data URLs to S3 and returning the resulting public URLs.
     *
     * @param imageUrls   raw image entries (may be base64 data URLs or existing http(s) URLs)
     * @param keyContext  a short identifier (e.g. SKU) used to namespace the S3 keys
     */
    public List<String> storeImages(List<String> imageUrls, String keyContext) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return imageUrls;
        }

        List<String> result = new ArrayList<>(imageUrls.size());
        for (String entry : imageUrls) {
            result.add(storeImage(entry, keyContext));
        }
        return result;
    }

    private String storeImage(String entry, String keyContext) {
        if (entry == null || entry.isBlank()) {
            return entry;
        }

        // Already a hosted URL (previously uploaded, or an external link) - leave untouched
        if (entry.startsWith("http://") || entry.startsWith("https://")) {
            return entry;
        }

        // Not a base64 data URL and S3 upload disabled/not applicable - keep as-is (dev/local fallback)
        Matcher matcher = DATA_URL_PATTERN.matcher(entry);
        if (!matcher.matches()) {
            return entry;
        }

        if (!s3Properties.isEnabled()) {
            // S3 uploads disabled - keep storing base64 in the DB (previous behavior)
            return entry;
        }

        try {
            String ext = normalizeExtension(matcher.group("ext"));
            byte[] bytes = Base64.getDecoder().decode(matcher.group("data"));
            String safeContext = sanitizeKeyContext(keyContext);
            String key = "products/" + safeContext + "/" + UUID.randomUUID() + "." + ext;

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(s3Properties.getBucket())
                            .key(key)
                            .contentType("image/" + ext)
                            .build(),
                    RequestBody.fromBytes(bytes)
            );

            return buildPublicUrl(key);
        } catch (Exception e) {
            log.error("Failed to upload product image to S3 for context '{}': {}", keyContext, e.getMessage(), e);
            // Fall back to keeping the original base64 data rather than losing the image entirely
            return entry;
        }
    }

    private String normalizeExtension(String ext) {
        String lower = ext.toLowerCase();
        if (lower.equals("jpg") || lower.equals("jpeg")) return "jpg";
        if (lower.equals("png")) return "png";
        if (lower.equals("webp")) return "webp";
        if (lower.equals("gif")) return "gif";
        return "jpg";
    }

    private String sanitizeKeyContext(String context) {
        String value = Objects.requireNonNullElse(context, "misc").trim();
        String cleaned = value.replaceAll("[^a-zA-Z0-9_-]", "-");
        return cleaned.isBlank() ? "misc" : cleaned;
    }

    private String buildPublicUrl(String key) {
        String base = s3Properties.getPublicBaseUrl();
        if (base != null && !base.isBlank()) {
            String trimmedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
            return trimmedBase + "/" + key;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                s3Properties.getBucket(), s3Properties.getRegion(), key);
    }
}
