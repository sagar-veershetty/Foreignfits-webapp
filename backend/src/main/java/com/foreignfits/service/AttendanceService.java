package com.foreignfits.service;

import com.foreignfits.dto.AttendanceActionRequest;
import com.foreignfits.dto.AttendanceEditRequest;
import com.foreignfits.dto.AttendanceMonthlySummary;
import com.foreignfits.dto.AttendanceResponse;
import com.foreignfits.dto.SalesPersonDto;
import com.foreignfits.entity.Attendance;
import com.foreignfits.entity.Attendance.AttendanceStatus;
import com.foreignfits.entity.SalesPerson;
import com.foreignfits.entity.User;
import com.foreignfits.repository.AttendanceRepository;
import com.foreignfits.repository.SalesPersonRepository;
import com.foreignfits.repository.UserRepository;
import com.foreignfits.security.RolePermissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final BigDecimal FULL_DAY_HOURS = new BigDecimal("8.0");

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final SalesPersonRepository salesPersonRepository;
    private final SalesPersonService salesPersonService;
    private final RolePermissionMapper rolePermissionMapper;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private boolean hasCrossLocationAccess(User user) {
        return rolePermissionMapper.hasCrossLocationAccess(user.getRole());
    }

    private void ensureLocationAccess(User manager, Long locationId) {
        if (hasCrossLocationAccess(manager)) {
            return;
        }
        if (manager.getLocation() == null) {
            throw new RuntimeException("User location is not set");
        }
        if (!manager.getLocation().getId().equals(locationId)) {
            throw new RuntimeException("Access denied: You can only manage attendance for your location");
        }
    }

    private void ensureNotSelf(User manager, SalesPerson salesPerson) {
        if (salesPerson.getEmail() != null && manager.getEmail() != null
                && salesPerson.getEmail().equalsIgnoreCase(manager.getEmail())) {
            throw new RuntimeException("Employees cannot mark their own attendance");
        }
    }

    private void ensureSalesPersonLocation(User manager, SalesPerson salesPerson) {
        if (salesPerson.getLocation() != null) {
            return;
        }
        if (manager.getLocation() == null) {
            throw new RuntimeException("Sales person location is not set");
        }
        salesPerson.setLocation(manager.getLocation());
        salesPersonRepository.save(salesPerson);
    }

    public List<SalesPersonDto> getActiveEmployees(Long locationId, String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        Long resolvedLocationId = locationId;

        if (!hasCrossLocationAccess(manager)) {
            if (manager.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            resolvedLocationId = manager.getLocation().getId();
        }

        final Long locationIdFinal = resolvedLocationId;

    salesPersonService.syncSalesPersonsFromSales(locationIdFinal);

    List<SalesPerson> salesPersons = salesPersonRepository.findActiveNotDeletedOrderByNameAsc();

        if (locationIdFinal != null) {
            salesPersons = salesPersons.stream()
                .filter(person -> person.getLocation() == null || locationIdFinal.equals(person.getLocation().getId()))
                .collect(Collectors.toList());
        }

        return salesPersons.stream().map(this::mapToSalesPersonDto).collect(Collectors.toList());
    }

    @Transactional
    public AttendanceResponse checkIn(AttendanceActionRequest request, String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        if (request.getEmployeeId() == null) {
            throw new RuntimeException("Employee is required");
        }

        SalesPerson salesPerson = salesPersonRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Sales person not found"));

        ensureNotSelf(manager, salesPerson);

        ensureSalesPersonLocation(manager, salesPerson);

        ensureLocationAccess(manager, salesPerson.getLocation().getId());

        Optional<Attendance> existing = attendanceRepository.findBySalesPersonIdAndAttendanceDate(salesPerson.getId(), date);
        if (existing.isPresent()) {
            throw new RuntimeException("Attendance already exists for this employee and date");
        }

        Attendance attendance = new Attendance();
        attendance.setSalesPerson(salesPerson);
        attendance.setLocation(salesPerson.getLocation());
        attendance.setAttendanceDate(date);
        attendance.setCheckInTime(LocalDateTime.now());
        attendance.setCheckOutTime(null);
        attendance.setWorkedHours(BigDecimal.ZERO);
        attendance.setStatus(AttendanceStatus.MISSING_CHECKOUT);
        attendance.setRemarks(request.getRemarks());
        attendance.setMarkedBy(manager);

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(AttendanceActionRequest request, String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        if (request.getEmployeeId() == null) {
            throw new RuntimeException("Employee is required");
        }

        Attendance attendance = attendanceRepository.findBySalesPersonIdAndAttendanceDate(request.getEmployeeId(), date)
            .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        ensureNotSelf(manager, attendance.getSalesPerson());
        ensureLocationAccess(manager, attendance.getLocation().getId());

        if (attendance.getCheckInTime() == null) {
            throw new RuntimeException("Cannot check out without check in");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        attendance.setRemarks(request.getRemarks() != null ? request.getRemarks() : attendance.getRemarks());
        attendance.setMarkedBy(manager);
        applyWorkedHoursAndStatus(attendance);

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Transactional
    public AttendanceResponse markLeave(AttendanceActionRequest request, String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();

        if (request.getEmployeeId() == null) {
            throw new RuntimeException("Employee is required");
        }

        SalesPerson salesPerson = salesPersonRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Sales person not found"));

        ensureNotSelf(manager, salesPerson);

        ensureSalesPersonLocation(manager, salesPerson);

        ensureLocationAccess(manager, salesPerson.getLocation().getId());

        Attendance attendance = attendanceRepository.findBySalesPersonIdAndAttendanceDate(salesPerson.getId(), date)
            .orElseGet(() -> {
                Attendance newAttendance = new Attendance();
                newAttendance.setSalesPerson(salesPerson);
                newAttendance.setLocation(salesPerson.getLocation());
                newAttendance.setAttendanceDate(date);
                return newAttendance;
            });

        attendance.setCheckInTime(null);
        attendance.setCheckOutTime(null);
        attendance.setWorkedHours(BigDecimal.ZERO);
        attendance.setStatus(AttendanceStatus.LEAVE);
        attendance.setRemarks(request.getRemarks());
        attendance.setMarkedBy(manager);

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Transactional
    public AttendanceResponse updateAttendance(Long id, AttendanceEditRequest request, String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        Attendance attendance = attendanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Attendance not found"));

    ensureNotSelf(manager, attendance.getSalesPerson());
        ensureLocationAccess(manager, attendance.getLocation().getId());

        if (request.getCheckInTime() != null) {
            attendance.setCheckInTime(request.getCheckInTime());
        }
        if (request.getCheckOutTime() != null) {
            attendance.setCheckOutTime(request.getCheckOutTime());
        }
        if (request.getRemarks() != null) {
            attendance.setRemarks(request.getRemarks());
        }
        if (request.getStatus() != null) {
            attendance.setStatus(request.getStatus());
        } else {
            applyWorkedHoursAndStatus(attendance);
        }

        attendance.setMarkedBy(manager);
        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    public List<AttendanceResponse> getAttendanceList(
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            Long locationId,
            Long employeeId,
            AttendanceStatus status,
            String managerEmail) {
        User manager = getUserByEmail(managerEmail);

        LocalDate resolvedStart = date != null ? date : (startDate != null ? startDate : LocalDate.now());
        LocalDate resolvedEnd = date != null ? date : (endDate != null ? endDate : resolvedStart);

        Long resolvedLocationId = locationId;
        if (!hasCrossLocationAccess(manager)) {
            if (manager.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            resolvedLocationId = manager.getLocation().getId();
        }

        if (resolvedLocationId != null) {
            ensureLocationAccess(manager, resolvedLocationId);
        }

    salesPersonService.syncSalesPersonsFromSales(resolvedLocationId);

    List<SalesPerson> employees = salesPersonRepository.findActiveNotDeletedOrderByNameAsc();

        final Long locationIdFinal = resolvedLocationId;
        if (locationIdFinal != null) {
            employees = employees.stream()
                .filter(person -> person.getLocation() == null || locationIdFinal.equals(person.getLocation().getId()))
                .collect(Collectors.toList());
        }

        if (employeeId != null) {
            employees = employees.stream()
                .filter(person -> person.getId().equals(employeeId))
                .collect(Collectors.toList());
        }

        Map<String, Attendance> attendanceMap = fetchAttendanceMap(resolvedStart, resolvedEnd, resolvedLocationId, employeeId);

        List<AttendanceResponse> responses = new ArrayList<>();
        LocalDate current = resolvedStart;
        while (!current.isAfter(resolvedEnd)) {
            for (SalesPerson employee : employees) {
                Attendance attendance = attendanceMap.get(buildKey(employee.getId(), current));
                if (attendance != null) {
                    AttendanceResponse response = mapToResponse(attendance);
                    if (status == null || response.getStatus() == status) {
                        responses.add(response);
                    }
                } else {
                    AttendanceResponse response = buildAbsentResponse(employee, current);
                    if (status == null || status == AttendanceStatus.ABSENT) {
                        responses.add(response);
                    }
                }
            }
            current = current.plusDays(1);
        }

        responses.sort(Comparator.comparing(AttendanceResponse::getAttendanceDate)
            .thenComparing(AttendanceResponse::getEmployeeName));
        return responses;
    }

    public List<AttendanceMonthlySummary> getMonthlySummary(
            int year,
            int month,
            Long locationId,
            Long employeeId,
            String managerEmail) {
        User manager = getUserByEmail(managerEmail);
        YearMonth yearMonth = YearMonth.of(year, month);

        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        LocalDate today = LocalDate.now();
        if (yearMonth.equals(YearMonth.from(today))) {
            endDate = today;
        }

        Long resolvedLocationId = locationId;
        if (!hasCrossLocationAccess(manager)) {
            if (manager.getLocation() == null) {
                throw new RuntimeException("User location is not set");
            }
            resolvedLocationId = manager.getLocation().getId();
        }

        if (resolvedLocationId != null) {
            ensureLocationAccess(manager, resolvedLocationId);
        }

    salesPersonService.syncSalesPersonsFromSales(resolvedLocationId);

    List<SalesPerson> employees = salesPersonRepository.findActiveNotDeletedOrderByNameAsc();

        final Long locationIdFinalSummary = resolvedLocationId;
        if (locationIdFinalSummary != null) {
            employees = employees.stream()
                .filter(person -> person.getLocation() == null || locationIdFinalSummary.equals(person.getLocation().getId()))
                .collect(Collectors.toList());
        }

        if (employeeId != null) {
            employees = employees.stream()
                .filter(person -> person.getId().equals(employeeId))
                .collect(Collectors.toList());
        }

        Map<String, Attendance> attendanceMap = fetchAttendanceMap(startDate, endDate, resolvedLocationId, employeeId);

        List<AttendanceMonthlySummary> summaries = new ArrayList<>();
    for (SalesPerson employee : employees) {
            int fullDays = 0;
            int halfDays = 0;
            int leaveDays = 0;
            int missingCheckouts = 0;
            int absentDays = 0;

            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                Attendance attendance = attendanceMap.get(buildKey(employee.getId(), current));
                if (attendance == null) {
                    absentDays++;
                } else {
                    AttendanceStatus status = attendance.getStatus();
                    if (status == AttendanceStatus.FULL_DAY) {
                        fullDays++;
                    } else if (status == AttendanceStatus.HALF_DAY) {
                        halfDays++;
                    } else if (status == AttendanceStatus.LEAVE) {
                        leaveDays++;
                    } else if (status == AttendanceStatus.MISSING_CHECKOUT) {
                        missingCheckouts++;
                    } else if (status == AttendanceStatus.ABSENT) {
                        absentDays++;
                    }
                }
                current = current.plusDays(1);
            }

            BigDecimal payableDays = BigDecimal.valueOf(fullDays)
                .add(BigDecimal.valueOf(halfDays).multiply(new BigDecimal("0.5")))
                .setScale(2, RoundingMode.HALF_UP);

            summaries.add(new AttendanceMonthlySummary(
                employee.getId(),
                employee.getName(),
                employee.getLocation() != null ? employee.getLocation().getId() : null,
                employee.getLocation() != null ? employee.getLocation().getName() : null,
                year,
                month,
                fullDays,
                halfDays,
                absentDays,
                leaveDays,
                missingCheckouts,
                payableDays
            ));
        }

        summaries.sort(Comparator.comparing(AttendanceMonthlySummary::getEmployeeName));
        return summaries;
    }

    private Map<String, Attendance> fetchAttendanceMap(
            LocalDate startDate,
            LocalDate endDate,
            Long locationId,
            Long employeeId) {
        List<Attendance> attendances;
        if (locationId != null && employeeId != null) {
            attendances = attendanceRepository.findByAttendanceDateBetweenAndLocationIdAndSalesPersonId(startDate, endDate, locationId, employeeId);
        } else if (locationId != null) {
            attendances = attendanceRepository.findByAttendanceDateBetweenAndLocationId(startDate, endDate, locationId);
        } else if (employeeId != null) {
            attendances = attendanceRepository.findByAttendanceDateBetweenAndSalesPersonId(startDate, endDate, employeeId);
        } else {
            attendances = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
        }

        Map<String, Attendance> map = new HashMap<>();
        for (Attendance attendance : attendances) {
            map.put(buildKey(attendance.getSalesPerson().getId(), attendance.getAttendanceDate()), attendance);
        }
        return map;
    }

    private String buildKey(Long employeeId, LocalDate date) {
        return employeeId + "_" + date;
    }

    private void applyWorkedHoursAndStatus(Attendance attendance) {
        if (attendance.getCheckInTime() == null) {
            attendance.setStatus(AttendanceStatus.ABSENT);
            attendance.setWorkedHours(BigDecimal.ZERO);
            return;
        }

        if (attendance.getCheckOutTime() == null) {
            attendance.setStatus(AttendanceStatus.MISSING_CHECKOUT);
            attendance.setWorkedHours(BigDecimal.ZERO);
            return;
        }

        Duration duration = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime());
        if (duration.isNegative()) {
            throw new RuntimeException("Check-out time cannot be before check-in time");
        }

        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes())
            .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        attendance.setWorkedHours(hours);

        if (hours.compareTo(FULL_DAY_HOURS) >= 0) {
            attendance.setStatus(AttendanceStatus.FULL_DAY);
        } else {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        }
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        AttendanceResponse response = new AttendanceResponse();
        response.setId(attendance.getId());
        response.setEmployeeId(attendance.getSalesPerson().getId());
        response.setEmployeeName(attendance.getSalesPerson().getName());
        response.setLocationId(attendance.getLocation() != null ? attendance.getLocation().getId() : null);
        response.setLocationName(attendance.getLocation() != null ? attendance.getLocation().getName() : null);
        response.setAttendanceDate(attendance.getAttendanceDate());
        response.setCheckInTime(attendance.getCheckInTime());
        response.setCheckOutTime(attendance.getCheckOutTime());
        response.setWorkedHours(attendance.getWorkedHours());
        response.setStatus(attendance.getStatus());
        response.setRemarks(attendance.getRemarks());
        response.setMarkedByName(attendance.getMarkedBy() != null ? attendance.getMarkedBy().getName() : null);
        return response;
    }

    private AttendanceResponse buildAbsentResponse(SalesPerson employee, LocalDate date) {
        AttendanceResponse response = new AttendanceResponse();
        response.setId(null);
        response.setEmployeeId(employee.getId());
        response.setEmployeeName(employee.getName());
        response.setLocationId(employee.getLocation() != null ? employee.getLocation().getId() : null);
        response.setLocationName(employee.getLocation() != null ? employee.getLocation().getName() : null);
        response.setAttendanceDate(date);
        response.setStatus(AttendanceStatus.ABSENT);
        response.setWorkedHours(BigDecimal.ZERO);
        return response;
    }

    private SalesPersonDto mapToSalesPersonDto(SalesPerson salesPerson) {
        SalesPersonDto dto = new SalesPersonDto();
        dto.setId(salesPerson.getId());
        dto.setName(salesPerson.getName());
        dto.setEmail(salesPerson.getEmail());
        dto.setPhone(salesPerson.getPhone());
        dto.setIsActive(salesPerson.getIsActive());
        dto.setIncentiveRate(salesPerson.getIncentiveRate());
        dto.setNotes(salesPerson.getNotes());
        dto.setCreatedAt(salesPerson.getCreatedAt());
        dto.setUpdatedAt(salesPerson.getUpdatedAt());
        if (salesPerson.getLocation() != null) {
            dto.setLocationId(salesPerson.getLocation().getId());
            dto.setLocationName(salesPerson.getLocation().getName());
        }
        return dto;
    }
}
