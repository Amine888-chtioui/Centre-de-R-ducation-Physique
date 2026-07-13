package com.centrer.backend.service;

import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import com.centrer.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Annule automatiquement les rendez-vous restés EN_ATTENTE dont la date est
 * passée : une demande non confirmée par l'admin avant son créneau n'a plus
 * de sens à honorer, aussi bien côté patient que côté admin.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentExpirationScheduler {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${appointment.expiration.poll-interval-ms:300000}")
    @Transactional
    public void cancelExpiredAppointments() {
        List<Appointment> expired = appointmentRepository.findExpiredByStatus(
                AppointmentStatus.EN_ATTENTE,
                LocalDateTime.now()
        );

        for (Appointment appointment : expired) {
            appointment.setStatus(AppointmentStatus.ANNULE);
            appointmentRepository.save(appointment);
            notificationService.onAppointmentExpired(appointment);
            log.info("RDV #{} annulé automatiquement : date passée sans confirmation", appointment.getId());
        }
    }
}
