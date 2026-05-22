package com.centrer.backend.repository;

import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateTimeDesc(Long userId);

    Optional<Appointment> findByIdAndUserId(Long id, Long userId);

    Optional<Appointment> findFirstByUserIdAndAppointmentDateTimeAfterAndStatusInOrderByAppointmentDateTimeAsc(
            Long userId,
            LocalDateTime after,
            List<AppointmentStatus> statuses
    );

    List<Appointment> findAllByOrderByAppointmentDateTimeDesc();

    @Query("SELECT a FROM Appointment a JOIN FETCH a.user ORDER BY a.appointmentDateTime DESC")
    List<Appointment> findAllWithUserOrderByAppointmentDateTimeDesc();

    @Query("SELECT a FROM Appointment a JOIN FETCH a.user WHERE a.id = :id")
    Optional<Appointment> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.user WHERE a.appointmentDateTime BETWEEN :start AND :end AND a.status <> :excluded ORDER BY a.appointmentDateTime ASC")
    List<Appointment> findTodayWithUser(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("excluded") AppointmentStatus excludedStatus
    );

    List<Appointment> findByAppointmentDateTimeBetweenAndStatusNotOrderByAppointmentDateTimeAsc(
            LocalDateTime start,
            LocalDateTime end,
            AppointmentStatus excludedStatus
    );

    long countByAppointmentDateTimeBetweenAndStatusNot(
            LocalDateTime start,
            LocalDateTime end,
            AppointmentStatus excludedStatus
    );

    long countByStatus(AppointmentStatus status);

    long countByUserId(Long userId);

    long countByAppointmentDateTimeBetweenAndStatus(
            LocalDateTime start,
            LocalDateTime end,
            AppointmentStatus status
    );

    List<Appointment> findByAppointmentDateTimeBetweenAndStatusNot(
            LocalDateTime start,
            LocalDateTime end,
            AppointmentStatus excludedStatus
    );
}
