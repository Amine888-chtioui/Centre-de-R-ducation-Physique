package com.centrer.backend.service;

import com.centrer.backend.dto.*;
import com.centrer.backend.entity.*;
import com.centrer.backend.repository.AppointmentRepository;
import com.centrer.backend.repository.CentreSettingsRepository;
import com.centrer.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final CentreSettingsRepository centreSettingsRepository;
    private final ScheduleService scheduleService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public AdminStatsResponse getStats() {
        requireAdmin();
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.atTime(23, 59, 59);
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

        return AdminStatsResponse.builder()
                .totalPatients(userRepository.countByRole(Role.ROLE_USER))
                .appointmentsToday(appointmentRepository.countByAppointmentDateTimeBetweenAndStatusNot(
                        dayStart, dayEnd, AppointmentStatus.ANNULE))
                .newPatientsThisMonth(userRepository.countByRoleAndCreatedAtAfter(
                        Role.ROLE_USER, monthStart))
                .pendingAppointments(appointmentRepository.countByStatus(AppointmentStatus.EN_ATTENTE))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AppointmentAdminResponse> getTodayAppointments() {
        requireAdmin();
        LocalDate today = LocalDate.now();
        return appointmentRepository
                .findTodayWithUser(
                        today.atStartOfDay(),
                        today.atTime(23, 59, 59),
                        AppointmentStatus.ANNULE)
                .stream()
                .map(AppointmentAdminResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentAdminResponse> getAllAppointments() {
        requireAdmin();
        return appointmentRepository.findAllWithUserOrderByAppointmentDateTimeDesc()
                .stream()
                .map(AppointmentAdminResponse::from)
                .toList();
    }

    /**
     * Création manuelle d'un RDV par l'admin, pour les patients qui réservent
     * par téléphone plutôt que par le site. Le RDV est directement CONFIRME
     * (réservé par le centre lui-même, pas besoin de validation).
     */
    public AppointmentAdminResponse createAppointmentForPatient(AdminAppointmentRequest request) {
        requireAdmin();
        User patient = resolvePatient(request);
        validateSlot(request.getAppointmentDateTime());

        Appointment appointment = Appointment.builder()
                .user(patient)
                .appointmentDateTime(request.getAppointmentDateTime())
                .type(request.getType().trim())
                .status(AppointmentStatus.CONFIRME)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        notificationService.notifyUser(
                patient.getId(),
                NotificationType.APPOINTMENT_CONFIRMED,
                "Rendez-vous créé",
                "Le centre a créé un RDV pour vous le "
                        + saved.getAppointmentDateTime().toLocalDate() + " à "
                        + saved.getAppointmentDateTime().toLocalTime(),
                "bi-calendar-plus-fill",
                "appointments",
                saved.getId()
        );
        return AppointmentAdminResponse.from(saved);
    }

    private User resolvePatient(AdminAppointmentRequest request) {
        if (request.getPatientId() != null) {
            return userRepository.findById(request.getPatientId())
                    .filter(u -> u.getRole() == Role.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Patient introuvable"));
        }

        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getNom() == null || request.getNom().isBlank()
                || request.getPrenom() == null || request.getPrenom().isBlank()) {
            throw new RuntimeException("Nom, prénom et email sont obligatoires pour un nouveau patient");
        }

        return userRepository.findByEmail(request.getEmail()).orElseGet(() -> {
            User created = User.builder()
                    .nom(request.getNom().trim())
                    .prenom(request.getPrenom().trim())
                    .email(request.getEmail().trim())
                    .telephone(request.getTelephone())
                    // Mot de passe aléatoire inutilisable : le patient définira le sien
                    // via "mot de passe oublié" s'il souhaite se connecter au site.
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ROLE_USER)
                    .build();
            User saved = userRepository.save(created);
            notificationService.onNewPatientRegistered(saved);
            return saved;
        });
    }

    private void validateSlot(LocalDateTime dateTime) {
        if (!dateTime.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Ce créneau est déjà passé");
        }
        LocalDate date = dateTime.toLocalDate();
        int hour = dateTime.getHour();
        if (!scheduleService.isSlotActive(date, hour)) {
            throw new RuntimeException("Ce créneau n'est pas ouvert à la réservation");
        }
        if (dateTime.toLocalTime().getMinute() != 0) {
            throw new RuntimeException("Horaire non disponible");
        }

        Set<LocalDateTime> occupied = new HashSet<>();
        appointmentRepository
                .findByAppointmentDateTimeBetweenAndStatusNot(
                        date.atStartOfDay(), date.atTime(23, 59, 59), AppointmentStatus.ANNULE)
                .forEach(a -> occupied.add(a.getAppointmentDateTime().withSecond(0).withNano(0)));
        if (occupied.contains(dateTime.withSecond(0).withNano(0))) {
            throw new RuntimeException("Ce créneau est déjà réservé");
        }
    }

    public AppointmentAdminResponse updateAppointmentStatus(Long id, UpdateAppointmentStatusRequest request) {
        requireAdmin();
        Appointment appointment = appointmentRepository.findByIdWithUser(id)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        AppointmentStatus newStatus;
        try {
            newStatus = AppointmentStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut invalide : " + request.getStatus());
        }

        if (newStatus != AppointmentStatus.CONFIRME && newStatus != AppointmentStatus.ANNULE) {
            throw new RuntimeException("Seuls les statuts CONFIRME et ANNULE sont autorisés");
        }

        appointment.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appointment);
        notificationService.onAppointmentStatusChangedByAdmin(saved, newStatus);
        return AppointmentAdminResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getPatients(String search) {
        requireAdmin();
        String query = search == null ? "" : search.trim().toLowerCase();

        return userRepository.findByRoleOrderByCreatedAtDesc(Role.ROLE_USER).stream()
                .filter(user -> {
                    if (query.isEmpty()) return true;
                    String full = (user.getPrenom() + " " + user.getNom() + " " + user.getEmail())
                            .toLowerCase();
                    return full.contains(query);
                })
                .map(this::toPatientResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientDetailResponse getPatientDetail(Long patientId) {
        requireAdmin();
        User user = userRepository.findById(patientId)
                .filter(u -> u.getRole() == Role.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        List<AppointmentAdminResponse> appointments =
                appointmentRepository.findByUserIdOrderByAppointmentDateTimeDesc(user.getId())
                        .stream()
                        .map(AppointmentAdminResponse::from)
                        .toList();

        return PatientDetailResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .createdAt(user.getCreatedAt())
                .appointments(appointments)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ActivityItemResponse> getRecentActivity() {
        requireAdmin();
        List<ActivityItemResponse> items = new ArrayList<>();

        userRepository.findByRoleOrderByCreatedAtDesc(Role.ROLE_USER).stream()
                .limit(5)
                .forEach(user -> items.add(ActivityItemResponse.builder()
                        .kind("NEW_PATIENT")
                        .icon("bi-person-plus-fill")
                        .patientName(user.getPrenom() + " " + user.getNom())
                        .detail("Nouveau compte")
                        .status(null)
                        .at(user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now())
                        .build()));

        appointmentRepository.findAllWithUserOrderByAppointmentDateTimeDesc().stream()
                .limit(8)
                .forEach(appt -> items.add(ActivityItemResponse.builder()
                        .kind("APPOINTMENT")
                        .icon("bi-calendar-check")
                        .patientName(appt.getUser().getPrenom() + " " + appt.getUser().getNom())
                        .detail(appt.getType())
                        .status(appt.getStatus().name())
                        .at(appt.getCreatedAt())
                        .build()));

        return items.stream()
                .sorted(Comparator.comparing(ActivityItemResponse::getAt).reversed())
                .limit(5)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WeeklyChartDayResponse> getWeeklyChart() {
        requireAdmin();
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<WeeklyChartDayResponse> days = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.atTime(23, 59, 59);
            long count = appointmentRepository.countByAppointmentDateTimeBetweenAndStatusNot(
                    start, end, AppointmentStatus.ANNULE);
            String label = day.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                    .substring(0, 1)
                    .toUpperCase();
            days.add(WeeklyChartDayResponse.builder().day(label).count(count).build());
        }
        return days;
    }

    @Transactional(readOnly = true)
    public CentreSettingsDto getPublicSettings() {
        return toSettingsDto(getOrCreateSettings());
    }

    @Transactional(readOnly = true)
    public CentreSettingsDto getSettings() {
        requireAdmin();
        return toSettingsDto(getOrCreateSettings());
    }

    public CentreSettingsDto updateSettings(CentreSettingsDto dto) {
        requireAdmin();
        CentreSettings settings = getOrCreateSettings();
        settings.setCentreName(dto.getCentreName().trim());
        settings.setPhone(dto.getPhone().trim());
        settings.setHours(dto.getHours().trim());
        centreSettingsRepository.save(settings);
        return toSettingsDto(settings);
    }

    private PatientResponse toPatientResponse(User user) {
        long count = appointmentRepository.countByUserId(user.getId());
        String status = "actif";
        if (user.getCreatedAt() != null
                && user.getCreatedAt().isAfter(LocalDateTime.now().minusDays(7))
                && count <= 1) {
            status = "nouveau";
        }
        return PatientResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .appointmentCount(count)
                .status(status)
                .build();
    }

    private CentreSettings getOrCreateSettings() {
        return centreSettingsRepository.findById(1L).orElseGet(() -> {
            CentreSettings settings = CentreSettings.builder()
                    .id(1L)
                    .centreName("Centre de Rééducation Physique")
                    .phone("+212 600 000 000")
                    .hours("Lun–Sam 8h–20h")
                    .build();
            return centreSettingsRepository.save(settings);
        });
    }

    private CentreSettingsDto toSettingsDto(CentreSettings settings) {
        CentreSettingsDto dto = new CentreSettingsDto();
        dto.setCentreName(settings.getCentreName());
        dto.setPhone(settings.getPhone());
        dto.setHours(settings.getHours());
        return dto;
    }

    public ScheduleMatrixDto getSchedule() {
        requireAdmin();
        return scheduleService.getMatrix();
    }

    public ScheduleMatrixDto updateSchedule(ScheduleUpdateRequest request) {
        requireAdmin();
        return scheduleService.updateSchedule(request);
    }

    private void requireAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new AccessDeniedException("Accès réservé aux administrateurs");
        }
    }
}
