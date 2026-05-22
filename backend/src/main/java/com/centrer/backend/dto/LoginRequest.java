package com.centrer.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO = Data Transfer Object.
 * C'est ce que le frontend envoie dans le corps de la requête POST.
 *
 * Exemple JSON envoyé par React :
 * {
 *   "email": "jean@gmail.com",
 *   "password": "monmotdepasse"
 * }
 *
 * @NotBlank  → le champ ne peut pas être vide ou null
 * @Email     → vérifie que c'est un format email valide
 * Spring lancera une erreur 400 automatiquement si la validation échoue.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}