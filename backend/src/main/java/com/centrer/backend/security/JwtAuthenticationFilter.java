package com.centrer.backend.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Ce filtre s'exécute UNE FOIS pour chaque requête HTTP (OncePerRequestFilter).
 *
 * Son travail :
 * 1. Lire le header "Authorization" de la requête
 * 2. Extraire le token JWT
 * 3. Vérifier que le token est valide
 * 4. Si valide, dire à Spring Security "cet utilisateur est connecté"
 *
 * Format du header : Authorization: Bearer eyJhbGci...
 *                                    ↑ "Bearer" = standard pour les tokens JWT
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain  // la suite de la chaîne de filtres
    ) throws ServletException, IOException {

        final String jwt = resolveToken(request);

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Un token expiré, corrompu ou mal signé ne doit jamais faire planter la requête
        // (500) : on l'ignore simplement, la requête repart non authentifiée et Spring
        // Security répondra 401/403 comme pour une requête sans token.
        try {
            // 3. Extraire l'email depuis le token
            final String userEmail = jwtService.extractUsername(jwt);

            // SecurityContextHolder = là où Spring Security stocke l'utilisateur courant
            // Si userEmail != null et que personne n'est encore authentifié pour cette requête
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 4. Charger l'utilisateur depuis la base de données
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                // 5. Vérifier que le token est valide (non expiré, correspond à l'utilisateur)
                if (jwtService.isTokenValid(jwt, userDetails)) {

                    // 6. Créer l'objet d'authentification Spring Security
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null, // credentials = null (on n'a plus besoin du password)
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // 7. Enregistrer l'authentification dans le contexte Spring Security
                    // À partir de maintenant, Spring Security sait qui fait la requête
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException | UsernameNotFoundException ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /** Header Authorization ou paramètre access_token (flux SSE EventSource). */
    private String resolveToken(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        String queryToken = request.getParameter("access_token");
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken.trim();
        }
        return null;
    }
}