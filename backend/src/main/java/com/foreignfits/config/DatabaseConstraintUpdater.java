package com.foreignfits.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseConstraintUpdater {
    
    private final JdbcTemplate jdbcTemplate;
    
    @PostConstruct
    public void updatePaymentMethodConstraints() {
        try {
            log.info("Updating payment method constraints to include UPI...");
            
            // Drop old constraints
            jdbcTemplate.execute("ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check");
            jdbcTemplate.execute("ALTER TABLE sale_payments DROP CONSTRAINT IF EXISTS sale_payments_payment_method_check");
            
            // Add new constraints with UPI
            jdbcTemplate.execute("ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check " +
                    "CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'OTHER'))");
            jdbcTemplate.execute("ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_payment_method_check " +
                    "CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'OTHER'))");
            
            log.info("Payment method constraints updated successfully");
        } catch (Exception e) {
            log.warn("Failed to update payment method constraints (they may already exist): {}", e.getMessage());
        }
    }
}
