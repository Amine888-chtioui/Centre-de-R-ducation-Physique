package com.centrer.backend.dto;

import com.centrer.backend.entity.Appointment;
import com.centrer.backend.entity.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentAdminResponse {

    private Long id;
    private LocalDateTime appointmentDateTime;
    private String type;
    private AppointmentStatus status;
    private LocalDateTime createdAt;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private String patientEmail;

    public static AppointmentAdminResponse from(Appointment appointment) {
        return AppointmentAdminResponse.builder()
                .id(appointment.getId())
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .type(appointment.getType())
                .status(appointment.getStatus())
                .createdAt(appointment.getCreatedAt())
                .patientId(appointment.getUser().getId())
                .patientNom(appointment.getUser().getNom())
                .patientPrenom(appointment.getUser().getPrenom())
                .patientEmail(appointment.getUser().getEmail())
                .build();
    }
}
