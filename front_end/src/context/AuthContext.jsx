import { createContext, useContext, useState, useCallback } from "react";

/**
 * createContext() crée un "espace partagé" accessible depuis n'importe quel
 * composant enfant. C'est comme une variable globale mais bien encapsulée.
 */
const AuthContext = createContext(null);

/**
 * AuthProvider = le composant qui entoure toute l'app et fournit l'état auth.
 * On le mettra dans App.jsx autour de tout le reste.
 */
export function AuthProvider({ children }) {
  /**
   * On initialise depuis localStorage pour persister la connexion
   * entre les rechargements de page.
   * Si token et user existent → l'utilisateur était connecté.
   */
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  /**
   * Appelée après un login ou register réussi.
   * Stocke les infos en mémoire (state) ET dans localStorage (persistance).
   *
   * useCallback mémorise la fonction pour éviter des re-renders inutiles.
   */
  const saveAuth = useCallback((authData) => {
    const { token, ...userInfo } = authData;

    // Stocker dans localStorage (persiste après rechargement de page)
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userInfo));

    // Mettre à jour le state React (déclenche un re-render)
    setToken(token);
    setUser(userInfo);
  }, []);

  /**
   * Déconnexion : nettoie tout.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Les valeurs accessibles par tous les composants enfants
  const value = {
    user,
    token,
    isAuthenticated: !!token, // true si connecté, false sinon
    saveAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personnalisé : utilise le contexte auth depuis n'importe quel composant.
 * Utilisation : const { user, isAuthenticated, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
