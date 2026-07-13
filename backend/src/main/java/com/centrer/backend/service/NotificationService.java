package com.centrer.backend.service;

import com.centrer.backend.dto.NotificationResponse;
import com.centrer.backend.entity.*;
import com.centrer.backend.repository.NotificationRepository;
import com.centrer.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("d MMM yyyy 'à' HH:mm", Locale.FRENCH);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationPushHub pushHub;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        User user = getCurrentUser();
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByUserIdAndReadFalse(getCurrentUser().getId());
    }

    public NotificationResponse markRead(Long notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        if (!notification.getUserId().equals(user.getId())) {
            throw new RuntimeException("Accès refusé");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        long unread = notificationRepository.countByUserIdAndReadFalse(user.getId());
        pushHub.pushUnreadCount(user.getId(), unread);
        return NotificationResponse.from(saved);
    }

    public void markAllRead() {
        User user = getCurrentUser();
        notificationRepository.markAllReadForUser(user.getId());
        pushHub.pushUnreadCount(user.getId(), 0);
    }

    public void deleteAllNotifications() {
        User user = getCurrentUser();
        notificationRepository.deleteAllForUser(user.getId());
        pushHub.pushUnreadCount(user.getId(), 0);
    }

    @Transactional(readOnly = true)
    public SseEmitter subscribeStream() {
        User user = getCurrentUser();
        SseEmitter emitter = pushHub.subscribe(user.getId());
        pushHub.pushUnreadCount(user.getId(), notificationRepository.countByUserIdAndReadFalse(user.getId()));
        return emitter;
    }

    public void notifyAdmins(
            NotificationType type,
            String title,
            String message,
            String icon,
            String targetTab,
            Long appointmentId
    ) {
        userRepository.findByRole(Role.ROLE_ADMIN).forEach(admin ->
                createAndPush(admin.getId(), type, title, message, icon, targetTab, appointmentId)
        );
    }

    public void notifyUser(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String icon,
            String targetTab,
            Long appointmentId
    ) {
        createAndPush(userId, type, title, message, icon, targetTab, appointmentId);
    }

    public void onAppointmentCreated(Appointment appointment) {
        User patient = appointment.getUser();
        String when = appointment.getAppointmentDateTime().format(DATE_FMT);
        notifyAdmins(
                NotificationType.APPOINTMENT_REQUEST,
                "Nouvelle demande de RDV",
                patient.getPrenom() + " " + patient.getNom() + " — " + appointment.getType() + " · " + when,
                "bi-calendar-plus-fill",
                "appointments",
                appointment.getId()
        );
    }

    public void onAppointmentCancelledByPatient(Appointment appointment) {
        User patient = appointment.getUser();
        String when = appointment.getAppointmentDateTime().format(DATE_FMT);
        notifyAdmins(
                NotificationType.APPOINTMENT_CANCELLED,
                "RDV annulé par le patient",
                patient.getPrenom() + " " + patient.getNom() + " · " + when,
                "bi-calendar-x-fill",
                "appointments",
                appointment.getId()
        );
    }

    public void onAppointmentRescheduledByPatient(Appointment appointment, LocalDateTime oldDateTime) {
        User patient = appointment.getUser();
        String oldWhen = oldDateTime.format(DATE_FMT);
        String newWhen = appointment.getAppointmentDateTime().format(DATE_FMT);
        notifyAdmins(
                NotificationType.APPOINTMENT_RESCHEDULED,
                "RDV reprogrammé",
                patient.getPrenom() + " " + patient.getNom() + " a déplacé son RDV du " + oldWhen + " au " + newWhen,
                "bi-calendar-week-fill",
                "appointments",
                appointment.getId()
        );
    }

    public void onAppointmentStatusChangedByAdmin(Appointment appointment, AppointmentStatus status) {
        User patient = appointment.getUser();
        String when = appointment.getAppointmentDateTime().format(DATE_FMT);

        if (status == AppointmentStatus.CONFIRME) {
            notifyUser(
                    patient.getId(),
                    NotificationType.APPOINTMENT_CONFIRMED,
                    "Rendez-vous confirmé",
                    "Votre RDV du " + when + " est confirmé.",
                    "bi-calendar-check-fill",
                    "appointments",
                    appointment.getId()
            );
        } else if (status == AppointmentStatus.ANNULE) {
            notifyUser(
                    patient.getId(),
                    NotificationType.APPOINTMENT_REFUSED,
                    "Rendez-vous refusé",
                    "Votre demande du " + when + " n'a pas été acceptée.",
                    "bi-calendar-x-fill",
                    "appointments",
                    appointment.getId()
            );
        }
    }

    public void onAppointmentExpired(Appointment appointment) {
        User patient = appointment.getUser();
        String when = appointment.getAppointmentDateTime().format(DATE_FMT);

        notifyUser(
                patient.getId(),
                NotificationType.APPOINTMENT_EXPIRED,
                "Rendez-vous annulé automatiquement",
                "Votre demande du " + when + " a été annulée automatiquement : la date est passée sans confirmation.",
                "bi-calendar-x-fill",
                "appointments",
                appointment.getId()
        );
        notifyAdmins(
                NotificationType.APPOINTMENT_EXPIRED,
                "RDV annulé automatiquement",
                patient.getPrenom() + " " + patient.getNom() + " — " + appointment.getType() + " · " + when + " (non confirmé, date passée)",
                "bi-calendar-x-fill",
                "appointments",
                appointment.getId()
        );
    }

    public void onNewPatientRegistered(User patient) {
        notifyAdmins(
                NotificationType.NEW_PATIENT,
                "Nouveau patient",
                patient.getPrenom() + " " + patient.getNom() + " s'est inscrit.",
                "bi-person-plus-fill",
                "patients",
                null
        );
    }

    private void createAndPush(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String icon,
            String targetTab,
            Long appointmentId
    ) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .icon(icon)
                .targetTab(targetTab)
                .appointmentId(appointmentId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.from(saved);
        pushHub.push(userId, response);

        long unread = notificationRepository.countByUserIdAndReadFalse(userId);
        pushHub.pushUnreadCount(userId, unread);
    }

    private User getCurrentUser() {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non connecté"));
        }

        public void deleteNotification(Long notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        if (!notification.getUserId().equals(user.getId())) {
            throw new RuntimeException("Accès refusé");
        }

        notificationRepository.delete(notification);
        long unread = notificationRepository.countByUserIdAndReadFalse(user.getId());
        pushHub.pushUnreadCount(user.getId(), unread);
    }
}
