package com.centrer.backend.controller;

import com.centrer.backend.dto.AuthResponse;
import com.centrer.backend.dto.ChangePasswordRequest;
import com.centrer.backend.dto.ForgotPasswordRequest;
import com.centrer.backend.dto.LoginRequest;
import com.centrer.backend.dto.RegisterRequest;
import com.centrer.backend.dto.ResetPasswordRequest;
import com.centrer.backend.dto.UpdateProfileRequest;
import com.centrer.backend.dto.VerifyResetCodeRequest;
import com.centrer.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    /**
     * GET /api/auth/me
     *
     * Utilisé après une connexion Google : le frontend n'a que le JWT (reçu
     * via l'URL de redirection), il vient chercher le reste du profil ici.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    /**
     * PUT /api/auth/me
     *
     * Modifie le profil (nom, prénom, téléphone) du compte connecté.
     */
    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    /**
     * PUT /api/auth/change-password
     *
     * Change le mot de passe du compte connecté (nécessite l'ancien).
     */
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour."));
    }

    /**
     * POST /api/auth/forgot-password
     *
     * Toujours 200 avec un message générique, que l'email existe ou non
     * (évite de révéler quels comptes existent).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of(
                "message", "Si un compte existe avec cet email, un code de vérification a été envoyé."
        ));
    }

    /**
     * POST /api/auth/verify-reset-code
     *
     * Vérifie le code sans encore changer le mot de passe (étape intermédiaire
     * côté UI, avant d'afficher le formulaire de nouveau mot de passe).
     */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        authService.verifyResetCode(request);
        return ResponseEntity.ok(Map.of("message", "Code vérifié."));
    }

    /**
     * POST /api/auth/reset-password
     *
     * Renvoie un JWT (comme /login) : l'utilisateur est directement connecté
     * et redirigé vers son dashboard après la réinitialisation.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}