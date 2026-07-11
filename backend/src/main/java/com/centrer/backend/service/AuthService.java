package com.centrer.backend.service;

import com.centrer.backend.dto.AuthResponse;
import com.centrer.backend.dto.ChangePasswordRequest;
import com.centrer.backend.dto.ForgotPasswordRequest;
import com.centrer.backend.dto.LoginRequest;
import com.centrer.backend.dto.RegisterRequest;
import com.centrer.backend.dto.ResetPasswordRequest;
import com.centrer.backend.dto.UpdateProfileRequest;
import com.centrer.backend.dto.VerifyResetCodeRequest;
import com.centrer.backend.entity.PasswordResetToken;
import com.centrer.backend.entity.Role;
import com.centrer.backend.entity.User;
import com.centrer.backend.repository.PasswordResetTokenRepository;
import com.centrer.backend.repository.UserRepository;
import com.centrer.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @Service → Spring gère cette classe (injection de dépendances, transactions...)
 * C'est ici qu'on code LA LOGIQUE MÉTIER, séparée du contrôleur (HTTP) et du repo (BDD).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Duration RESET_CODE_VALIDITY = Duration.ofMinutes(10);
    private static final Duration RESET_REQUEST_COOLDOWN = Duration.ofSeconds(60);
    private static final int RESET_CODE_MAX_ATTEMPTS = 5;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    // Anti-spam simple : une demande de reset par email au maximum toutes les 60s.
    private final ConcurrentHashMap<String, Instant> lastResetRequestAt = new ConcurrentHashMap<>();

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
                .telephone(request.getTelephone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER) // par défaut, tout nouvel utilisateur est ROLE_USER
                .build();

        // save() = INSERT INTO users (...) VALUES (...)
        userRepository.save(user);
        notificationService.onNewPatientRegistered(user);

        var token = jwtService.generateToken(user);

        return toAuthResponse(user, token);
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
        return toAuthResponse(user, token);
    }

    /**
     * Utilisateur courant à partir du JWT déjà validé par le filtre de sécurité.
     * Utilisé après une connexion Google : le frontend a le token dans l'URL
     * mais pas les infos de profil, donc il les récupère via cet endpoint.
     */
    public AuthResponse getCurrentUser() {
        return toAuthResponse(getAuthenticatedUser(), null);
    }

    /**
     * Modifie nom / prénom / téléphone du compte connecté (page "Mon profil").
     * L'email n'est volontairement pas modifiable ici : c'est l'identifiant de connexion.
     */
    @Transactional
    public AuthResponse updateProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());
        userRepository.save(user);
        return toAuthResponse(user, null);
    }

    /**
     * Change le mot de passe du compte connecté. Nécessite l'ancien mot de passe :
     * ne s'applique pas aux comptes créés via Google (mot de passe aléatoire inconnu
     * de l'utilisateur) — ceux-ci doivent passer par "mot de passe oublié".
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mot de passe actuel incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non connecté"));
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Demande de réinitialisation de mot de passe : génère un code à 6 chiffres
     * et l'envoie par email.
     *
     * Ne révèle jamais si l'email existe ou non (anti-énumération de comptes) :
     * on répond toujours pareil, que l'utilisateur soit trouvé ou pas.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();

        Instant lastRequest = lastResetRequestAt.get(email);
        if (lastRequest != null
                && Duration.between(lastRequest, Instant.now()).compareTo(RESET_REQUEST_COOLDOWN) < 0) {
            return;
        }
        lastResetRequestAt.put(email, Instant.now());

        userRepository.findByEmail(email).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String code = generateSixDigitCode();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .codeHash(hash(code))
                    .expiryDate(LocalDateTime.now().plus(RESET_CODE_VALIDITY))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetCode(user.getEmail(), code);
        });
    }

    /**
     * Vérifie le code reçu par email, sans encore changer le mot de passe.
     * Permet au frontend de n'afficher le formulaire de nouveau mot de passe
     * qu'une fois le code confirmé valide (étapes séparées côté UI). Le code
     * n'est PAS consommé ici : il sera revérifié par resetPassword().
     */
    @Transactional(noRollbackFor = RuntimeException.class)
    public void verifyResetCode(VerifyResetCodeRequest request) {
        validateCode(request.getEmail(), request.getCode());
    }

    /**
     * Revérifie le code puis applique le nouveau mot de passe. Le code est à
     * usage unique (supprimé dès qu'il est consommé) et se bloque après
     * quelques tentatives incorrectes (protection brute-force, un code à 6
     * chiffres étant bien plus faible qu'un token aléatoire) — le compteur de
     * tentatives est partagé avec verifyResetCode.
     *
     * Renvoie un JWT (comme login/register) : l'utilisateur est directement
     * connecté après la réinitialisation, pas besoin de retaper ses identifiants.
     */
    // noRollbackFor : les rejets ci-dessous (code faux, expiré...) lèvent une
    // RuntimeException volontaire pour informer l'appelant, mais le compteur de
    // tentatives qu'on vient d'incrémenter doit malgré tout être persisté — sans
    // ça, le rollback par défaut de Spring sur RuntimeException annule aussi cet
    // incrément et le blocage anti-brute-force ne fait jamais effet.
    @Transactional(noRollbackFor = RuntimeException.class)
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = validateCode(request.getEmail(), request.getCode());

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);

        String token = jwtService.generateToken(user);

        return toAuthResponse(user, token);
    }

    /**
     * Message volontairement identique dans tous les cas d'échec (email
     * inconnu, code faux, code expiré) : on ne révèle jamais lequel.
     * Incrémente le compteur de tentatives (et bloque au-delà du seuil) à
     * chaque code incorrect, que ce soit via verifyResetCode ou resetPassword.
     */
    private PasswordResetToken validateCode(String email, String code) {
        RuntimeException invalidCode = new RuntimeException("Code invalide ou expiré");

        User user = userRepository.findByEmail(email).orElseThrow(() -> invalidCode);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByUser(user)
                .orElseThrow(() -> invalidCode);

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw invalidCode;
        }

        if (!resetToken.getCodeHash().equals(hash(code))) {
            resetToken.setAttempts(resetToken.getAttempts() + 1);
            if (resetToken.getAttempts() >= RESET_CODE_MAX_ATTEMPTS) {
                passwordResetTokenRepository.delete(resetToken);
            } else {
                passwordResetTokenRepository.save(resetToken);
            }
            throw invalidCode;
        }

        return resetToken;
    }

    private String generateSixDigitCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }
}