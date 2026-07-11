package com.centrer.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "La date et l'heure sont obligatoires")
    @Future(message = "Le rendez-vous doit être dans le futur")
    private LocalDateTime appointmentDateTime;

    @NotBlank(message = "Le type de séance est obligatoire")
    private String type;
}
