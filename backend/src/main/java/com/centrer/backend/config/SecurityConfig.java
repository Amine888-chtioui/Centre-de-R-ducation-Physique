package com.centrer.backend.config;

import com.centrer.backend.security.JwtAuthenticationFilter;
import com.centrer.backend.security.OAuth2AuthenticationFailureHandler;
import com.centrer.backend.security.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * @Configuration → Spring va lire cette classe au démarrage pour configurer l'app
 * @EnableWebSecurity → active la sécurité web de Spring
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    /**
     * La règle principale : qui peut accéder à quoi ?
     *
     * CSRF désactivé car on utilise JWT (pas de sessions/cookies).
     * CSRF protège contre les attaques via formulaires HTML avec cookies,
     * ça ne s'applique pas aux APIs REST avec JWT.
     *
     * SessionCreationPolicy.STATELESS → pas de session HTTP.
     * Chaque requête doit apporter son token JWT.
     * C'est le principe des APIs REST modernes.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Sans token (ou token expiré/invalide) → 401, pas 403.
            // Le frontend s'appuie sur le 401 pour détecter une session expirée
            // et déconnecter automatiquement l'utilisateur.
            .exceptionHandling(handling ->
                    handling.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )

            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/**", "/api/settings/public").permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/appointments/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .anyRequest().permitAll()
            )

            // STATELESS : le contexte de sécurité n'est jamais lu/écrit depuis une
            // session HTTP (NullSecurityContextRepository). C'est nécessaire ici :
            // avec IF_REQUIRED, l'authentification Google (session) restait persistée
            // et était réutilisée par erreur sur les appels API JWT suivants (le
            // filtre JWT ne s'exécute que si aucune authentification n'est déjà
            // présente). Le flux oauth2Login fonctionne quand même : le dépôt qui
            // stocke temporairement la requête d'autorisation (le temps de l'aller-
            // retour vers Google) crée sa propre session indépendamment de ce réglage.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Qui s'occupe de vérifier les credentials lors du login ?
            .authenticationProvider(authenticationProvider())

            .oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2AuthenticationSuccessHandler)
                    .failureHandler(oAuth2AuthenticationFailureHandler)
            )

            // Notre filtre JWT s'exécute AVANT le filtre d'auth classique
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS = Cross-Origin Resource Sharing.
     * Obligatoire pour que le frontend React (port 5173)
     * puisse parler au backend Spring Boot (port 8080).
     * Sans ça, le navigateur bloque les requêtes pour raisons de sécurité.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Dev : Vite (localhost, IP LAN, émulateur mobile)
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*:*",
                "http://10.*:*"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers autorisés (Authorization pour notre JWT)
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        // Permettre l'envoi du header Authorization
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * AuthenticationProvider = comment Spring vérifie les credentials lors du login.
     * DaoAuthenticationProvider utilise notre UserDetailsService + le PasswordEncoder.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * BCrypt = algorithme de hachage de mots de passe.
     * Avantages : lent intentionnellement (résiste aux attaques brute-force),
     * génère un "sel" aléatoire (deux mêmes mots de passe donnent des hashs différents).
     *
     * "$2a$10$..." = format BCrypt avec le sel inclus dans le hash.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager = point d'entrée pour authentifier un utilisateur.
     * Utilisé dans AuthService.login() pour vérifier email + password.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}