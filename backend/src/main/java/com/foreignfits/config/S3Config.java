package com.foreignfits.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Provides a singleton {@link S3Client} configured from {@link S3Properties}.
 * Credentials are resolved via the AWS SDK's default provider chain, which
 * picks up the Elastic Beanstalk EC2 instance role automatically in production
 * (no access keys need to be stored in the app).
 */
@Configuration
@RequiredArgsConstructor
public class S3Config {

    private final S3Properties s3Properties;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(s3Properties.getRegion()))
                .build();
    }
}
