package com.centrer.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * @RestControllerAdvice → intercepte les exceptions de TOUS les contrôleurs.
 * Sans ça, les erreurs retourneraient une stack trace HTML au frontend.
 * Avec ça, on retourne du JSON lisible et un code HTTP approprié.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Erreurs de validation (@Valid).
     * Par ex : email invalide, mot de passe trop court.
     * → 400 Bad Request avec le détail de chaque champ invalide.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });

        // JSON retourné :
        // { "status": 400, "errors": { "email": "Format invalide", "password": "Min 8 chars" } }
        Map<String, Object> response = new HashMap<>();
        response.put("status", 400);
        response.put("message", "Données invalides");
        response.put("errors", errors);
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Email ou mot de passe incorrect lors du login.
     * → 401 Unauthorized
     * Message générique volontairement pour ne pas divulguer si l'email existe.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildError(401, "Email ou mot de passe incorrect"));
    }

    /**
     * Erreurs métier (email déjà utilisé, etc.)
     * → 409 Conflict
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(buildError(409, ex.getMessage()));
    }

    private Map<String, Object> buildError(int status, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", status);
        error.put("message", message);
        error.put("timestamp", LocalDateTime.now().toString());
        return error;
    }
}