package com.centrer.backend.repository;

import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

    @Query("SELECT a FROM Appointment a JOIN FETCH a.user " +
            "WHERE a.reminder24Sent = false AND a.status <> :excludedStatus " +
            "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findDue24hReminders(
            @Param("excludedStatus") AppointmentStatus excludedStatus,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT a FROM Appointment a JOIN FETCH a.user " +
            "WHERE a.reminder2hSent = false AND a.status <> :excludedStatus " +
            "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findDue2hReminders(
            @Param("excludedStatus") AppointmentStatus excludedStatus,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // @Transactional ici (et pas seulement sur l'appelant) : chaque marquage doit
    // rester atomique et indépendant des autres rendez-vous du même lot. Sans
    // transaction propre, cette requête @Modifying lève
    // TransactionRequiredException — et regrouper tout le lot dans une seule
    // transaction ferait échouer/annuler les marquages déjà réussis dès qu'un
    // rendez-vous du lot pose problème.
    @Modifying
    @Transactional
    @Query("UPDATE Appointment a SET a.reminder24Sent = true WHERE a.id = :id")
    void markReminder24Sent(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Appointment a SET a.reminder2hSent = true WHERE a.id = :id")
    void markReminder2hSent(@Param("id") Long id);
}
