package com.centrer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CentreSettingsDto {

    @NotBlank(message = "Le nom du centre est obligatoire")
    private String centreName;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String phone;

    @NotBlank(message = "Les horaires sont obligatoires")
    private String hours;
}
