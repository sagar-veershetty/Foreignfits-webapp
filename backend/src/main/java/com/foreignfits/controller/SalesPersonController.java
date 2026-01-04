package com.foreignfits.controller;

import com.foreignfits.dto.SalesPersonDto;
import com.foreignfits.service.SalesPersonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sales-persons")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SalesPersonController {

    private final SalesPersonService salesPersonService;

    @PostMapping
    public ResponseEntity<?> createSalesPerson(@RequestBody SalesPersonDto dto) {
        try {
            log.info("REST request to create sales person: {}", dto.getName());
            SalesPersonDto created = salesPersonService.createSalesPerson(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating sales person: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSalesPerson(@PathVariable Long id, @RequestBody SalesPersonDto dto) {
        try {
            log.info("REST request to update sales person: {}", id);
            SalesPersonDto updated = salesPersonService.updateSalesPerson(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating sales person: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSalesPerson(@PathVariable Long id) {
        try {
            SalesPersonDto salesPerson = salesPersonService.getSalesPerson(id);
            return ResponseEntity.ok(salesPerson);
        } catch (Exception e) {
            log.error("Error getting sales person: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<SalesPersonDto>> getAllSalesPersons() {
        log.info("REST request to get all sales persons");
        List<SalesPersonDto> salesPersons = salesPersonService.getAllSalesPersons();
        return ResponseEntity.ok(salesPersons);
    }

    @GetMapping("/active")
    public ResponseEntity<List<SalesPersonDto>> getActiveSalesPersons() {
        log.info("REST request to get active sales persons");
        List<SalesPersonDto> salesPersons = salesPersonService.getActiveSalesPersons();
        return ResponseEntity.ok(salesPersons);
    }

    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<SalesPersonDto>> getSalesPersonsByLocation(@PathVariable Long locationId) {
        log.info("REST request to get sales persons for location: {}", locationId);
        List<SalesPersonDto> salesPersons = salesPersonService.getSalesPersonsByLocation(locationId);
        return ResponseEntity.ok(salesPersons);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateSalesPerson(@PathVariable Long id) {
        try {
            log.info("REST request to deactivate sales person: {}", id);
            salesPersonService.deactivateSalesPerson(id);
            return ResponseEntity.ok().body("Sales person deactivated successfully");
        } catch (Exception e) {
            log.error("Error deactivating sales person: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSalesPerson(@PathVariable Long id) {
        try {
            log.info("REST request to delete sales person: {}", id);
            salesPersonService.deleteSalesPerson(id);
            return ResponseEntity.ok().body("Sales person deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting sales person: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
