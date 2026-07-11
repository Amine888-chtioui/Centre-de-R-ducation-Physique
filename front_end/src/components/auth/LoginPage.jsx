import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getDashboardPath } from "../../utils/auth";
import { getApiBaseUrl } from "../../config/api";

export default function LoginPage({ onSwitchToRegister, onSwitchToForgot, onClose }) {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
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
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const authData = await login(formData);
      saveAuth(authData);
      if (onClose) onClose();
      navigate(getDashboardPath(authData));
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

  const handleGoogleLogin = () => {
    const backendOrigin = getApiBaseUrl().replace(/\/api$/, "");
    window.location.href = `${backendOrigin}/oauth2/authorization/google`;
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

      {serverError && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
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
          <p className="auth-switch" style={{ textAlign: "center", margin: "0.5rem 0 0" }}>
            <button
              type="button"
              className="auth-switch-btn"
              onClick={onSwitchToForgot}
            >
              Mot de passe oublié ?
            </button>
          </p>
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

      {/* ── Séparateur ── */}
      <div className="auth-divider" aria-hidden="true">
        <span className="auth-divider__line"></span>
        <span className="auth-divider__text">ou</span>
        <span className="auth-divider__line"></span>
      </div>

      {/* ── Bouton Google ── */}
      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleLogin}
        aria-label="Continuer avec Google"
      >
        <svg
          className="auth-google-btn__icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.6 42.5 14.8 48 24 48z"
          />
          <path
            fill="#FBBC05"
            d="M10.8 28.8c-.5-1.4-.7-2.9-.7-4.4s.2-3 .7-4.4v-6.2H2.7C1 17.1 0 20.4 0 24s1 6.9 2.7 9.2l8.1-4.4z"
          />
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.4 0 24 0 14.8 0 6.6 5.5 2.7 14.8l8.1 4.4C12.7 13.6 17.9 9.5 24 9.5z"
          />
        </svg>
        <span>Continuer avec Google</span>
      </button>

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
