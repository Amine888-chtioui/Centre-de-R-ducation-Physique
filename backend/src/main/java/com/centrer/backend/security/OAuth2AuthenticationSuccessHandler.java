package com.centrer.backend.security;

import com.centrer.backend.entity.Role;
import com.centrer.backend.entity.User;
import com.centrer.backend.repository.UserRepository;
import com.centrer.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

/**
 * Appelé par Spring Security quand la connexion Google réussit.
 * Fait le pont entre le monde OAuth2 (session Google) et notre monde JWT :
 * on retrouve/crée l'utilisateur, on génère NOTRE token, et on redirige
 * le navigateur vers le frontend avec ce token en paramètre d'URL.
 */
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final NotificationService notificationService;

    // Instance dédiée, indépendante du bean PasswordEncoder de SecurityConfig :
    // l'injecter ici créerait un cycle (SecurityConfig -> ce handler -> PasswordEncoder
    // -> SecurityConfig, puisque le bean PasswordEncoder est défini dans SecurityConfig).
    // Ce hash n'a de toute façon qu'un rôle de "mot de passe inutilisable".
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.oauth2.authorized-redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");
        if (email == null || Boolean.FALSE.equals(emailVerified)) {
            response.sendRedirect(
                    UriComponentsBuilder.fromUriString(redirectUri)
                            .queryParam("error", "email_non_verifie")
                            .build().toUriString()
            );
            return;
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String familyName = oAuth2User.getAttribute("family_name");
            String givenName = oAuth2User.getAttribute("given_name");
            User created = User.builder()
                    .nom(familyName != null ? familyName : "")
                    .prenom(givenName != null ? givenName : "")
                    .email(email)
                    // Mot de passe aléatoire inutilisable : ce compte ne peut se
                    // connecter que via Google, jamais via le formulaire classique.
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ROLE_USER)
                    .build();
            User saved = userRepository.save(created);
            notificationService.onNewPatientRegistered(saved);
            return saved;
        });

        String token = jwtService.generateToken(user);

        response.sendRedirect(
                UriComponentsBuilder.fromUriString(redirectUri)
                        .queryParam("token", token)
                        .build().toUriString()
        );
    }
}
