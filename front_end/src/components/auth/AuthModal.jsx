import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

/**
 * Modal qui contient les deux formulaires (login / register).
 * On passe "view" pour contrôler lequel afficher depuis l'extérieur.
 *
 * Props :
 * - isOpen     : boolean, affiche ou masque la modal
 * - onClose    : fonction appelée pour fermer la modal
 * - initialView: "login" ou "register"
 */
export default function AuthModal({ isOpen, onClose, initialView = "login" }) {
  const [view, setView] = useState(initialView);

  // Quand la modal s'ouvre, réinitialiser la vue
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Cliquer sur l'overlay (fond sombre) ferme la modal
    <div
      className="auth-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={
        view === "login" ? "Connexion" : view === "register" ? "Inscription" : "Mot de passe oublié"
      }
    >
      {/* Empêcher la fermeture quand on clique à l'intérieur de la modal */}
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Afficher la vue active : connexion, inscription, ou mot de passe oublié */}
        {view === "login" && (
          <LoginPage
            onSwitchToRegister={() => setView("register")}
            onSwitchToForgot={() => setView("forgot")}
            onClose={onClose}
          />
        )}
        {view === "register" && (
          <RegisterPage
            onSwitchToLogin={() => setView("login")}
            onClose={onClose}
          />
        )}
        {view === "forgot" && (
          <ForgotPasswordPage
            onSwitchToLogin={() => setView("login")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
