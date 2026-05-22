package com.centrer.backend.service;

import com.centrer.backend.dto.AppointmentRequest;
import com.centrer.backend.dto.AppointmentResponse;
import com.centrer.backend.dto.DayAvailabilityDto;
import com.centrer.backend.dto.SlotAvailabilityDto;
import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import com.centrer.backend.entity.User;
import com.centrer.backend.repository.AppointmentRepository;
import com.centrer.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentService {

    private static final int DEFAULT_DAYS_AHEAD = 21;

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ScheduleService scheduleService;
    private final NotificationService notificationService;

    public List<AppointmentResponse> getMyAppointments() {
        User user = getCurrentUser();
        return appointmentRepository.findByUserIdOrderByAppointmentDateTimeDesc(user.getId())
                .stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    public AppointmentResponse getMyNextAppointment() {
        User user = getCurrentUser();
        return appointmentRepository
                .findFirstByUserIdAndAppointmentDateTimeAfterAndStatusInOrderByAppointmentDateTimeAsc(
                        user.getId(),
                        LocalDateTime.now(),
                        List.of(AppointmentStatus.EN_ATTENTE, AppointmentStatus.CONFIRME)
                )
                .map(AppointmentResponse::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<DayAvailabilityDto> getAvailableDays(int daysAhead) {
        getCurrentUser();
        int days = daysAhead > 0 ? Math.min(daysAhead, 42) : DEFAULT_DAYS_AHEAD;
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(days - 1L);

        Set<LocalDateTime> occupied = loadOccupiedSlots(start.atStartOfDay(), end.atTime(23, 59, 59));

        List<DayAvailabilityDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = start.plusDays(i);
            boolean available = scheduleService.hasActiveHourOnDay(date.getDayOfWeek())
                    && hasFreeSlot(date, occupied);
            String label = date.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            result.add(DayAvailabilityDto.builder()
                    .date(date.toString())
                    .label(capitalize(label))
                    .available(available)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<SlotAvailabilityDto> getAvailableSlots(LocalDate date) {
        getCurrentUser();
        if (date == null) {
            throw new RuntimeException("Date invalide");
        }

        Set<LocalDateTime> occupied = loadOccupiedSlots(
                date.atStartOfDay(),
                date.atTime(23, 59, 59)
        );

        List<SlotAvailabilityDto> slots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int hour = ScheduleService.OPEN_HOUR; hour <= ScheduleService.CLOSE_HOUR; hour++) {
            LocalDateTime slot = date.atTime(hour, 0);
            boolean available = scheduleService.isSlotActive(date, hour)
                    && slot.isAfter(now)
                    && !occupied.contains(slot);

            slots.add(SlotAvailabilityDto.builder()
                    .time(String.format("%02d:00", hour))
                    .available(available)
                    .build());
        }
        return slots;
    }

    public AppointmentResponse create(AppointmentRequest request) {
        User user = getCurrentUser();
        LocalDateTime dateTime = request.getAppointmentDateTime();

        validateSlot(dateTime);

        Appointment appointment = Appointment.builder()
                .user(user)
                .appointmentDateTime(dateTime)
                .type(request.getType().trim())
                .status(AppointmentStatus.EN_ATTENTE)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        notificationService.onAppointmentCreated(saved);
        return AppointmentResponse.from(saved);
    }

    public void cancel(Long id) {
        User user = getCurrentUser();
        Appointment appointment = appointmentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        if (appointment.getStatus() == AppointmentStatus.ANNULE) {
            throw new RuntimeException("Ce rendez-vous est déjà annulé");
        }

        appointment.setStatus(AppointmentStatus.ANNULE);
        appointmentRepository.save(appointment);
        notificationService.onAppointmentCancelledByPatient(appointment);
    }

    private void validateSlot(LocalDateTime dateTime) {
        if (dateTime == null) {
            throw new RuntimeException("Date et heure obligatoires");
        }
        if (!dateTime.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Ce créneau est déjà passé");
        }
        LocalDate date = dateTime.toLocalDate();
        int hour = dateTime.getHour();
        if (!scheduleService.isSlotActive(date, hour)) {
            throw new RuntimeException("Ce créneau n'est pas ouvert à la réservation");
        }
        LocalTime time = dateTime.toLocalTime();
        if (time.getMinute() != 0) {
            throw new RuntimeException("Horaire non disponible");
        }

        Set<LocalDateTime> occupied = loadOccupiedSlots(
                dateTime.toLocalDate().atStartOfDay(),
                dateTime.toLocalDate().atTime(23, 59, 59)
        );
        if (occupied.contains(dateTime.withSecond(0).withNano(0))) {
            throw new RuntimeException("Ce créneau vient d'être réservé, choisissez un autre horaire");
        }
    }

    private Set<LocalDateTime> loadOccupiedSlots(LocalDateTime start, LocalDateTime end) {
        Set<LocalDateTime> occupied = new HashSet<>();
        appointmentRepository
                .findByAppointmentDateTimeBetweenAndStatusNot(start, end, AppointmentStatus.ANNULE)
                .forEach(a -> occupied.add(
                        a.getAppointmentDateTime().withSecond(0).withNano(0)
                ));
        return occupied;
    }

    private boolean hasFreeSlot(LocalDate date, Set<LocalDateTime> occupied) {
        if (!scheduleService.hasActiveHourOnDay(date.getDayOfWeek())) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        for (int hour = ScheduleService.OPEN_HOUR; hour <= ScheduleService.CLOSE_HOUR; hour++) {
            if (!scheduleService.isSlotActive(date, hour)) {
                continue;
            }
            LocalDateTime slot = date.atTime(hour, 0);
            if (slot.isAfter(now) && !occupied.contains(slot)) {
                return true;
            }
        }
        return false;
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non connecté"));
    }
}
