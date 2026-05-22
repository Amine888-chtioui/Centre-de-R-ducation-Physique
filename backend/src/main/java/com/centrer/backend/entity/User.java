package com.centrer.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * @Entity  → dit à JPA "cette classe = une table en base"
 * @Table   → nomme la table "users" (sinon JPA prendrait "user", mot réservé MySQL)
 *
 * On implémente UserDetails car Spring Security a besoin de cette interface
 * pour savoir comment récupérer le mot de passe, les rôles, etc.
 */
@Entity
@Table(name = "users")
@Data                   // Lombok : génère getters + setters + toString + equals
@Builder                // Lombok : permet User.builder().email("...").build()
@NoArgsConstructor      // Lombok : constructeur vide (requis par JPA)
@AllArgsConstructor     // Lombok : constructeur avec tous les champs
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // IDENTITY = MySQL s'occupe de l'auto-incrément (1, 2, 3...)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    /**
     * unique = true → MySQL refuse deux comptes avec le même email
     * C'est la sécurité côté base de données (en plus des checks dans le service)
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Le mot de passe sera TOUJOURS stocké haché (BCrypt)
     * JAMAIS en clair. BCrypt transforme "monmdp" en "$2a$10$abc..."
     */
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    // EnumType.STRING = stocke "ROLE_USER" plutôt qu'un chiffre 0/1
    private Role role;

    // ─── Méthodes de UserDetails (requises par Spring Security) ───────────────

    /**
     * Les "authorities" = les permissions de l'utilisateur.
     * On retourne son rôle (ROLE_USER ou ROLE_ADMIN).
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        // Spring Security utilise "username" pour identifier l'utilisateur.
        // Dans notre app, l'identifiant unique c'est l'email.
        return email;
    }

    // Ces 4 méthodes retournent true = compte actif, non expiré, etc.
    // Plus tard tu pourras les utiliser pour bloquer des comptes.
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return true; }
}