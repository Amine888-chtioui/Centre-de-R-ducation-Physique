package com.centrer.backend.repository;

import com.centrer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * JpaRepository<User, Long> = Spring génère automatiquement toutes les
 * requêtes SQL courantes : findById, save, delete, findAll...
 * On n'écrit AUCUN SQL à la main pour les opérations basiques.
 *
 * Spring lit le nom des méthodes et génère le SQL correspondant.
 * findByEmail → SELECT * FROM users WHERE email = ?
 * existsByEmail → SELECT COUNT(*) FROM users WHERE email = ?
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Optional<User> = peut retourner un User ou être vide (absent).
     * C'est plus sûr que retourner null, qui peut causer des NullPointerException.
     * Utilisation : userRepository.findByEmail("...").orElseThrow(...)
     */
    Optional<User> findByEmail(String email);

    /**
     * Vérifie si un email est déjà pris (pour l'inscription).
     * Retourne true si l'email existe, false sinon.
     */
    boolean existsByEmail(String email);
}