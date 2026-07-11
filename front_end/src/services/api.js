import axios from "axios";
import { getApiBaseUrl } from "../config/api";

/**
 * On crée une instance axios personnalisée.
 * Tous les appels API passeront par cette instance,
 * ce qui évite de répéter l'URL de base partout.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Intercepteur de REQUÊTES.
 * S'exécute avant CHAQUE requête envoyée.
 *
 * Récupère le token dans localStorage et l'ajoute automatiquement
 * au header Authorization.
 * Sans ça, il faudrait l'ajouter manuellement à chaque appel API.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Format standard : "Bearer " + le token JWT
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Intercepteur de RÉPONSES.
 * S'exécute après chaque réponse reçue.
 *
 * Si le serveur répond 401 (token expiré ou invalide) →
 * on déconnecte l'utilisateur automatiquement.
 */
api.interceptors.response.use(
  (response) => response, // Succès → on passe la réponse telle quelle
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré : nettoyer le localStorage et rediriger vers login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/dashboard") && !window.location.pathname.startsWith("/admin")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

// ─── Fonctions d'authentification ─────────────────────────────────────────────

/**
 * Inscription
 * @param {Object} data - { nom, prenom, email, password }
 * @returns {Promise} - { token, email, nom, prenom, role }
 */
export const register = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

/**
 * Connexion
 * @param {Object} data - { email, password }
 * @returns {Promise} - { token, email, nom, prenom, role }
 */
export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

/**
 * Profil de l'utilisateur courant (déduit du token JWT envoyé).
 * Utilisé après une connexion Google pour compléter les infos de profil
 * qui ne sont pas dans l'URL de redirection (seul le token y est).
 * @returns {Promise} - { id, email, nom, prenom, role }
 */
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * Demande de réinitialisation de mot de passe : envoie un code à 6 chiffres par email.
 * @param {string} email
 * @returns {Promise} - { message }
 */
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Vérifie le code reçu par email, sans encore changer le mot de passe.
 * @param {Object} data - { email, code }
 * @returns {Promise} - { message }
 */
export const verifyResetCode = async (data) => {
  const response = await api.post("/auth/verify-reset-code", data);
  return response.data;
};

/**
 * Revérifie le code et applique le nouveau mot de passe.
 * @param {Object} data - { email, code, newPassword }
 * @returns {Promise} - { message }
 */
export const resetPassword = async (data) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

/**
 * Modifie nom / prénom / téléphone du compte connecté.
 * @param {Object} data - { nom, prenom, telephone }
 * @returns {Promise} - { id, email, nom, prenom, telephone, role }
 */
export const updateProfile = async (data) => {
  const response = await api.put("/auth/me", data);
  return response.data;
};

/**
 * Change le mot de passe du compte connecté.
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise} - { message }
 */
export const changePassword = async (data) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

export default api;
