package com.centrer.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Création manuelle d'un RDV par l'admin (patient qui a réservé par téléphone).
 *
 * Si patientId est fourni → RDV rattaché à ce patient existant.
 * Sinon → un compte patient est créé (ou réutilisé si l'email existe déjà)
 * à partir de nom/prenom/email/telephone.
 */
@Data
public class AdminAppointmentRequest {

    private Long patientId;

    private String nom;

    private String prenom;

    @Email(message = "Format d'email invalide")
    private String email;

    private String telephone;

    @NotNull(message = "La date et l'heure sont obligatoires")
    @Future(message = "Le rendez-vous doit être dans le futur")
    private LocalDateTime appointmentDateTime;

    @NotBlank(message = "Le type de séance est obligatoire")
    private String type;
}
