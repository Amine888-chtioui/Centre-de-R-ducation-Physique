package com.centrer.backend.entity;

/**
 * Les rôles de l'application.
 * ROLE_USER  = patient / visiteur connecté
 * ROLE_ADMIN = kinésithérapeute / administrateur du centre
 *
 * Spring Security cherche des rôles qui commencent par "ROLE_"
 */
public enum Role {
    ROLE_USER,
    ROLE_ADMIN
}