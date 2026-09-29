package com.foreignfits.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for S3-backed product image storage.
 * See application.yml under `app.aws.s3`.
 */
@Configuration
@ConfigurationProperties(prefix = "app.aws.s3")
public class S3Properties {

    /** Master switch - when false, images are kept as-is (e.g. base64) and never uploaded. */
    private boolean enabled = false;

    /** Target S3 bucket name for product images. */
    private String bucket = "foreign-fits-product-images";

    /** AWS region the bucket lives in. */
    private String region = "ap-south-1";

    /** Optional CDN/custom domain to serve images from instead of the raw S3 URL. */
    private String publicBaseUrl;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }
}
