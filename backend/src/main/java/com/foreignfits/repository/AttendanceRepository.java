package com.foreignfits.repository;

import com.foreignfits.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findBySalesPersonIdAndAttendanceDate(Long salesPersonId, LocalDate attendanceDate);

    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);

    List<Attendance> findByAttendanceDateBetweenAndLocationId(LocalDate startDate, LocalDate endDate, Long locationId);

    List<Attendance> findByAttendanceDateBetweenAndSalesPersonId(LocalDate startDate, LocalDate endDate, Long salesPersonId);

    List<Attendance> findByAttendanceDateBetweenAndLocationIdAndSalesPersonId(
            LocalDate startDate,
            LocalDate endDate,
            Long locationId,
        Long salesPersonId);
}
