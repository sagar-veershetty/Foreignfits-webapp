package com.foreignfits;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class InventoryManagementApplication {

    /**
     * Ensure the JVM default timezone is IST (India) regardless of the
     * timezone of the host running the server (e.g. AWS Elastic Beanstalk
     * instances often default to UTC, which looks like Irish/GMT time).
     * All LocalDateTime.now() calls in the app rely on the JVM default zone,
     * so this must be set before the application context starts using them.
     */
    static {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }

    public static void main(String[] args) {
        SpringApplication.run(InventoryManagementApplication.class, args);
    }

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }
}