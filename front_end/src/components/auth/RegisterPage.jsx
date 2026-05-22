import { useState } from "react";
import { register } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage({ onSwitchToLogin, onClose }) {
  const { saveAuth } = useAuth();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.email) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est obligatoire";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // On n'envoie pas confirmPassword au serveur (c'est uniquement côté client)
      const { confirmPassword, ...dataToSend } = formData;
      const authData = await register(dataToSend);
      saveAuth(authData);
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
          <i className="bi bi-person-plus-fill"></i>
        </span>
        <h2 className="auth-title">Créer un compte</h2>
        <p className="auth-subtitle">Rejoignez notre centre de rééducation</p>
      </div>

      {serverError && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {/* Ligne nom + prénom côte à côte */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reg-nom" className="form-label">
              Nom
            </label>
            <div className="input-wrapper">
              <i className="bi bi-person-fill input-icon"></i>
              <input
                id="reg-nom"
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                className={`form-input ${errors.nom ? "input-error" : ""}`}
                autoComplete="family-name"
              />
            </div>
            {errors.nom && <span className="field-error">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-prenom" className="form-label">
              Prénom
            </label>
            <div className="input-wrapper">
              <i className="bi bi-person-fill input-icon"></i>
              <input
                id="reg-prenom"
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Jean"
                className={`form-input ${errors.prenom ? "input-error" : ""}`}
                autoComplete="given-name"
              />
            </div>
            {errors.prenom && (
              <span className="field-error">{errors.prenom}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">
            Adresse email
          </label>
          <div className="input-wrapper">
            <i className="bi bi-envelope-fill input-icon"></i>
            <input
              id="reg-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className={`form-input ${errors.email ? "input-error" : ""}`}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-password" className="form-label">
            Mot de passe
          </label>
          <div className="input-wrapper">
            <i className="bi bi-lock-fill input-icon"></i>
            <input
              id="reg-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 caractères"
              className={`form-input ${errors.password ? "input-error" : ""}`}
              autoComplete="new-password"
            />
          </div>
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirm" className="form-label">
            Confirmer le mot de passe
          </label>
          <div className="input-wrapper">
            <i className="bi bi-lock-fill input-icon"></i>
            <input
              id="reg-confirm"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="btn-spinner" aria-hidden="true"></span>
              Inscription en cours...
            </>
          ) : (
            <>
              <i className="bi bi-person-check-fill" aria-hidden="true"></i>
              Créer mon compte
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        Déjà un compte ?{" "}
        <button
          type="button"
          className="auth-switch-btn"
          onClick={onSwitchToLogin}
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}
