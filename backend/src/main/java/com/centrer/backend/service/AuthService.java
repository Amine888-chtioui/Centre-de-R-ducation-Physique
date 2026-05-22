package com.centrer.backend.service;

import com.centrer.backend.dto.AuthResponse;
import com.centrer.backend.dto.LoginRequest;
import com.centrer.backend.dto.RegisterRequest;
import com.centrer.backend.entity.Role;
import com.centrer.backend.entity.User;
import com.centrer.backend.repository.UserRepository;
import com.centrer.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * @Service → Spring gère cette classe (injection de dépendances, transactions...)
 * C'est ici qu'on code LA LOGIQUE MÉTIER, séparée du contrôleur (HTTP) et du repo (BDD).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Inscription d'un nouvel utilisateur.
     *
     * Étapes :
     * 1. Vérifier que l'email n'est pas déjà utilisé
     * 2. Hasher le mot de passe (JAMAIS stocker en clair !)
     * 3. Créer et sauvegarder l'utilisateur en base
     * 4. Générer un JWT et le retourner → l'utilisateur est directement connecté
     */
    public AuthResponse register(RegisterRequest request) {
        // Étape 1 : vérification d'unicité de l'email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        // Étape 2 & 3 : créer l'utilisateur avec le mot de passe hashé
        // passwordEncoder.encode("monmdp") → "$2a$10$xyz..." (irréversible)
        var user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER) // par défaut, tout nouvel utilisateur est ROLE_USER
                .build();

        // save() = INSERT INTO users (...) VALUES (...)
        userRepository.save(user);

        // Étape 4 : générer le JWT
        var token = jwtService.generateToken(user);

        // Construire et retourner la réponse (sans le password !)
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Connexion d'un utilisateur existant.
     *
     * Étapes :
     * 1. Vérifier email + password via Spring Security
     *    (Spring comparera automatiquement le hash BCrypt)
     * 2. Générer un nouveau JWT
     * 3. Retourner le token + les infos de l'utilisateur
     */
    public AuthResponse login(LoginRequest request) {
        // Étape 1 : authentification via Spring Security
        // authenticate() va appeler userDetailsService.loadUserByUsername(email)
        // puis comparer le mot de passe avec BCrypt.
        // Si ça échoue → BadCredentialsException lancée automatiquement
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Si on arrive ici, les credentials sont corrects.
        // Étape 2 : charger l'utilisateur et générer le token
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        var token = jwtService.generateToken(user);

        // Étape 3 : retourner la réponse
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .build();
    }
}