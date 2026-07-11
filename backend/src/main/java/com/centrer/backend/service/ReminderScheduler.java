package com.centrer.backend.service;

import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import com.centrer.backend.entity.User;
import com.centrer.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vérifie périodiquement les rendez-vous à venir et envoie les rappels par email
 * (24h puis 2h avant). Les fenêtres 24h et 2h sont mutuellement exclusives afin
 * qu'un même passage ne déclenche jamais les deux rappels pour le même rendez-vous.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    @Scheduled(fixedDelayString = "${reminder.poll-interval-ms:300000}")
    public void sendDueReminders() {
        LocalDateTime now = LocalDateTime.now();
        processReminders(
                appointmentRepository.findDue24hReminders(AppointmentStatus.ANNULE, now.plusHours(2), now.plusHours(24)),
                "24h",
                appointmentRepository::markReminder24Sent
        );
        processReminders(
                appointmentRepository.findDue2hReminders(AppointmentStatus.ANNULE, now, now.plusHours(2)),
                "2h",
                appointmentRepository::markReminder2hSent
        );
    }

    private void processReminders(List<Appointment> dueAppointments, String reminderLabel, ReminderMarker marker) {
        for (Appointment appointment : dueAppointments) {
            if (sendReminder(appointment, reminderLabel)) {
                marker.markSent(appointment.getId());
            }
        }
    }

    private boolean sendReminder(Appointment appointment, String reminderLabel) {
        User patient = appointment.getUser();
        String email = patient.getEmail();

        if (email == null || email.isBlank()) {
            log.warn("Rappel {} non envoyé : email manquant pour le patient du RDV #{}", reminderLabel, appointment.getId());
            return false;
        }

        try {
            emailService.sendAppointmentReminder(
                    email,
                    patient.getPrenom() + " " + patient.getNom(),
                    appointment.getAppointmentDateTime(),
                    appointment.getType()
            );
            log.info("Rappel {} envoyé pour le RDV #{} à {}", reminderLabel, appointment.getId(), email);
            return true;
        } catch (Exception e) {
            log.error("Échec de l'envoi du rappel {} pour le RDV #{} à {}", reminderLabel, appointment.getId(), email, e);
            return false;
        }
    }

    @FunctionalInterface
    private interface ReminderMarker {
        void markSent(Long appointmentId);
    }
}
