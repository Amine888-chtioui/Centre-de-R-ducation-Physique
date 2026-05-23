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

export default api;
