package com.foreignfits.controller;

import com.foreignfits.dto.AttendanceActionRequest;
import com.foreignfits.dto.AttendanceEditRequest;
import com.foreignfits.dto.AttendanceMonthlySummary;
import com.foreignfits.dto.AttendanceResponse;
import com.foreignfits.dto.SalesPersonDto;
import com.foreignfits.entity.Attendance.AttendanceStatus;
import com.foreignfits.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/employees")
    @PreAuthorize("hasAuthority('view:attendance')")
    public ResponseEntity<List<SalesPersonDto>> getActiveEmployees(
            @RequestParam(required = false) Long locationId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.getActiveEmployees(locationId, email));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('manage:attendance')")
    public ResponseEntity<AttendanceResponse> checkIn(
            @RequestBody AttendanceActionRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.checkIn(request, email));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('manage:attendance')")
    public ResponseEntity<AttendanceResponse> checkOut(
            @RequestBody AttendanceActionRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.checkOut(request, email));
    }

    @PostMapping("/leave")
    @PreAuthorize("hasAuthority('manage:attendance')")
    public ResponseEntity<AttendanceResponse> markLeave(
            @RequestBody AttendanceActionRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.markLeave(request, email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('manage:attendance')")
    public ResponseEntity<AttendanceResponse> updateAttendance(
            @PathVariable Long id,
            @RequestBody AttendanceEditRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request, email));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('view:attendance')")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) AttendanceStatus status,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.getAttendanceList(
            date,
            startDate,
            endDate,
            locationId,
            employeeId,
            status,
            email
        ));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('view:attendance')")
    public ResponseEntity<List<AttendanceMonthlySummary>> getMonthlySummary(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long employeeId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(attendanceService.getMonthlySummary(year, month, locationId, employeeId, email));
    }
}
