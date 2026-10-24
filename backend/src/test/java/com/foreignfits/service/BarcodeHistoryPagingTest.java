package com.foreignfits.service;

import com.foreignfits.entity.BarcodeHistory;
import com.foreignfits.repository.BarcodeHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "spring.jpa.show-sql=false"})
class BarcodeHistoryPagingTest {
    @Autowired BarcodeHistoryRepository repository;

    @Test
    void pagesInDatabaseAndPreservesLocationAndSearchFilters() {
        for (int i = 0; i < 205; i++) {
            BarcodeHistory row = new BarcodeHistory();
            row.setBarcodeNumber("TEST" + i);
            row.setEventType("CREATED");
            row.setLocationId(5L);
            repository.save(row);
        }
        BarcodeHistory transfer = new BarcodeHistory();
        transfer.setBarcodeNumber("TEST0");
        transfer.setEventType("TRANSFERRED");
        transfer.setLocationId(6L);
        repository.saveAndFlush(transfer);
        LocalDateTime start = LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(9999, 1, 1, 0, 0);
        var first = repository.findHistoryPage(null, null, 5L, start, end, PageRequest.of(0, 100));
        var second = repository.findHistoryPage(null, null, 5L, start, end, PageRequest.of(1, 100));
        assertEquals(100, first.size());
        assertEquals(100, second.size());
        assertTrue(first.stream().noneMatch(second::contains));
        assertEquals(6, repository.findHistoryPage(null, null, 5L, start, end, PageRequest.of(2, 100)).size());
        assertEquals(2, repository.findHistoryPage("TEST0", null, 5L, start, end, PageRequest.of(0, 100)).size());
        assertEquals(1, repository.findHistoryPage(null, "TRANSFERRED", 5L, start, end, PageRequest.of(0, 100)).size());
        assertTrue(repository.findHistoryPage(null, null, 99L, start, end, PageRequest.of(0, 100)).isEmpty());
        assertEquals(100, repository.findHistoryPage(null, null, null, start, end, PageRequest.of(0, 100)).size());
    }
}
