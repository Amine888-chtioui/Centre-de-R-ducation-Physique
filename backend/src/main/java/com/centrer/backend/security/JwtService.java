package com.centrer.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Ce service s'occupe de TOUT ce qui concerne les tokens JWT.
 *
 * Un JWT ressemble à : eyJhbGci....eyJzdWI....ABC123
 *                        HEADER     PAYLOAD   SIGNATURE
 *
 * - HEADER : algorithme utilisé (HS256)
 * - PAYLOAD : données (email, date d'expiration...) → lisibles par tous !
 * - SIGNATURE : hash secret → permet de vérifier que le token est authentique
 *
 * La SIGNATURE est calculée avec notre clé secrète.
 * Si quelqu'un modifie le payload, la signature ne correspondra plus → rejeté.
 */
@Service
public class JwtService {

    /**
     * @Value lit la valeur depuis application.properties.
     * La clé secrète DOIT être longue (au moins 32 caractères) et secrète.
     * En production, elle sera dans une variable d'environnement, jamais dans le code.
     */
    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Durée de validité du token en millisecondes.
     * 86400000 = 24 heures (1000ms × 60s × 60min × 24h)
     */
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // ─── Méthodes publiques ───────────────────────────────────────────────────

    /**
     * Crée un token JWT pour un utilisateur.
     * Appelé après un login ou register réussi.
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Crée un token avec des données supplémentaires (claims).
     * On peut ajouter n'importe quelle info dans le token, mais
     * attention : le payload est lisible ! Ne jamais mettre le password.
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                // subject = l'identifiant de l'utilisateur (son email chez nous)
                .subject(userDetails.getUsername())
                // issuedAt = quand le token a été créé
                .issuedAt(new Date(System.currentTimeMillis()))
                // expiration = quand le token expire (maintenant + 24h)
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                // on signe avec notre clé secrète (algorithme HS256)
                .signWith(getSigningKey())
                .compact(); // transforme tout en chaîne "header.payload.signature"
    }

    /**
     * Vérifie si un token est valide pour un utilisateur donné.
     * Appelé à chaque requête protégée.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // Le token est valide si : l'email correspond ET le token n'a pas expiré
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Extrait l'email (username) du token.
     * "subject" = l'email qu'on a mis à la création.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // ─── Méthodes privées (internes) ─────────────────────────────────────────

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Méthode générique pour extraire n'importe quelle info du token.
     * claimsResolver = une fonction qui dit "extrais tel champ des claims"
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Décode et vérifie la signature du token.
     * Si la signature est invalide → lance une exception automatiquement.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Convertit la clé secrète (String UTF-8) en clé HMAC-SHA256.
     * La clé doit faire au moins 32 caractères (256 bits) pour HS256.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}