package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PatientDetailResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private LocalDateTime createdAt;
    private List<AppointmentAdminResponse> appointments;
}
