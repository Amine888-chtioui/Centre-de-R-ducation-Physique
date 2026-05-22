package com.centrer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PatientResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private long appointmentCount;
    private String status;
}
