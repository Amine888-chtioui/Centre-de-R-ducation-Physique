import { useState } from "react";
import { login } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

/**
 * Composant de la page de connexion.
 *
 * Gestion du formulaire :
 * - formData : les valeurs des champs
 * - errors : les messages d'erreur par champ
 * - isLoading : désactiver le bouton pendant l'appel API
 * - serverError : erreur globale venue du serveur
 */
export default function LoginPage({ onSwitchToRegister, onClose }) {
  const { saveAuth } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Met à jour le champ modifié et efface son erreur.
   * e.target.name = le name de l'input (email ou password)
   * e.target.value = la valeur tapée
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ quand l'utilisateur recommence à taper
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /**
   * Validation côté client (avant d'envoyer au serveur).
   * On double avec la validation serveur pour l'expérience utilisateur.
   */
  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est obligatoire";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page (comportement HTML natif)
    setServerError("");

    // Validation client
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Appel API → POST /api/auth/login
      const authData = await login(formData);

      // Succès : sauvegarder le token et les infos utilisateur
      saveAuth(authData);

      // Fermer la modal si on est dans une modal
      if (onClose) onClose();
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.message ||
        (data?.errors
          ? Object.values(data.errors).join(" ")
          : "Une erreur est survenue");
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <span className="auth-icon">
          <i className="bi bi-person-fill"></i>
        </span>
        <h2 className="auth-title">Connexion</h2>
        <p className="auth-subtitle">Accédez à votre espace patient</p>
      </div>

      {/* Erreur globale du serveur */}
      {serverError && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {/* Champ email */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            Adresse email
          </label>
          <div className="input-wrapper">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className={`form-input ${errors.email ? "input-error" : ""}`}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <span id="email-error" className="field-error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Champ password */}
        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            Mot de passe
          </label>
          <div className="input-wrapper">
            <i className="bi bi-lock-fill input-icon"></i>
            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`form-input ${errors.password ? "input-error" : ""}`}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
            />
          </div>
          {errors.password && (
            <span className="field-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner" aria-hidden="true"></span>
              Connexion en cours...
            </>
          ) : (
            <>
              <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
              Se connecter
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        Pas encore de compte ?{" "}
        <button
          type="button"
          className="auth-switch-btn"
          onClick={onSwitchToRegister}
        >
          S'inscrire
        </button>
      </p>
    </div>
  );
}
