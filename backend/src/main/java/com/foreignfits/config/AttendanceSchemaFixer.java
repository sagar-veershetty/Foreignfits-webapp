package com.foreignfits.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.context.event.EventListener;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceSchemaFixer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void run() {
        try {
            jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
            jdbcTemplate.execute("ALTER TABLE ATTENDANCE ADD COLUMN IF NOT EXISTS SALES_PERSON_ID BIGINT");
            jdbcTemplate.execute("UPDATE ATTENDANCE SET SALES_PERSON_ID = EMPLOYEE_ID WHERE SALES_PERSON_ID IS NULL");

            List<String> constraints = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CONSTRAINTS " +
                    "WHERE TABLE_NAME = 'ATTENDANCE' " +
                    "AND CONSTRAINT_TYPE = 'REFERENTIAL'",
                String.class
            );

            for (String constraint : constraints) {
                jdbcTemplate.execute("ALTER TABLE ATTENDANCE DROP CONSTRAINT IF EXISTS " + constraint);
            }

            jdbcTemplate.execute(
                "ALTER TABLE ATTENDANCE ADD CONSTRAINT IF NOT EXISTS FK_ATTENDANCE_EMPLOYEE_SALES_PERSON " +
                    "FOREIGN KEY (EMPLOYEE_ID) REFERENCES SALES_PERSONS(ID)"
            );
            jdbcTemplate.execute(
                "ALTER TABLE ATTENDANCE ADD CONSTRAINT IF NOT EXISTS FK_ATTENDANCE_SALES_PERSON " +
                    "FOREIGN KEY (SALES_PERSON_ID) REFERENCES SALES_PERSONS(ID)"
            );
            jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
        } catch (Exception ex) {
            log.warn("Attendance schema fix skipped: {}", ex.getMessage());
        }
    }
}