package com.centrer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ce que le backend renvoie au frontend après login/register réussi.
 *
 * Exemple JSON renvoyé :
 * {
 *   "token": "eyJhbGciOiJIUzI1NiJ9...",
 *   "email": "jean@gmail.com",
 *   "nom": "Dupont",
 *   "prenom": "Jean",
 *   "role": "ROLE_USER"
 * }
 *
 * IMPORTANT : on ne renvoie JAMAIS le password, même hashé.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String token;
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private String role;
}