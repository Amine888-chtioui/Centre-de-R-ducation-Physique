package com.centrer.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RescheduleRequest {

    @NotNull(message = "La date et l'heure sont obligatoires")
    @Future(message = "Le rendez-vous doit être dans le futur")
    private LocalDateTime appointmentDateTime;
}
