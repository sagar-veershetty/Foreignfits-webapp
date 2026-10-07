package com.foreignfits.controller;

import com.foreignfits.dto.MultiBuyConfigDto;
import com.foreignfits.dto.MultiBuyOfferDto;
import com.foreignfits.service.MultiBuyOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/promotions/multi-buy")
@RequiredArgsConstructor
public class MultiBuyOfferController {
    private final MultiBuyOfferService offerService;

    @GetMapping
    public ResponseEntity<List<MultiBuyOfferDto>> getActiveOffers() {
        return ResponseEntity.ok(offerService.getActiveOffers());
    }

    @GetMapping("/config")
    @PreAuthorize("hasAuthority('approve:users')")
    public ResponseEntity<MultiBuyConfigDto> getConfig() {
        return ResponseEntity.ok(offerService.getConfig());
    }

    @PutMapping("/config")
    @PreAuthorize("hasAuthority('approve:users')")
    public ResponseEntity<?> saveConfig(@RequestBody MultiBuyConfigDto config) {
        try {
            return ResponseEntity.ok(offerService.save(config));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }
}
