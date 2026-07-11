package com.centrer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAppointmentStatusRequest {

    @NotBlank(message = "Le statut est obligatoire")
    private String status;
}
