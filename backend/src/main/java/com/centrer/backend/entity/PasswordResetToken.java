package com.centrer.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Un seul code actif à la fois par utilisateur : toute nouvelle demande de
 * réinitialisation supprime d'abord l'ancien. Le code n'est jamais stocké en
 * clair (seulement son hash SHA-256), et la ligne est supprimée dès qu'il est
 * utilisé — pas besoin d'un champ "used". Pas de contrainte unique sur le
 * hash : deux utilisateurs différents peuvent légitimement recevoir le même
 * code à 6 chiffres.
 */
@Entity
@Table(name = "password_reset_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
