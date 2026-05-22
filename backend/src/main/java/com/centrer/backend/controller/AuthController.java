package com.centrer.backend.controller;

import com.centrer.backend.dto.AuthResponse;
import com.centrer.backend.dto.LoginRequest;
import com.centrer.backend.dto.RegisterRequest;
import com.centrer.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @RestController → combine @Controller + @ResponseBody
 *   Les méthodes retournent du JSON automatiquement (pas des vues HTML)
 *
 * @RequestMapping → préfixe toutes les routes de ce contrôleur avec "/api/auth"
 *   POST /api/auth/register
 *   POST /api/auth/login
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     *
     * @RequestBody  → lit le JSON du body de la requête et le convertit en objet Java
     * @Valid        → déclenche la validation (@NotBlank, @Email, @Size...)
     *
     * ResponseEntity<> → permet de contrôler le code HTTP de la réponse
     * 201 CREATED = ressource créée avec succès (plus sémantique que 200 OK)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity
                .status(201)
                .body(authService.register(request));
    }

    /**
     * POST /api/auth/login
     *
     * 200 OK = connexion réussie
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}