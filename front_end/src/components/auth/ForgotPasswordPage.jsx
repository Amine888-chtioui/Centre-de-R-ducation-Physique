import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyResetCode, resetPassword } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getDashboardPath } from "../../utils/auth";

export default function ForgotPasswordPage({ onSwitchToLogin, onClose }) {
  const { saveAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // "request" : saisie de l'email
  // "code"    : saisie du code reçu par email
  // "password": nouveau mot de passe + confirmation
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("L'email est obligatoire");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Format d'email invalide");
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep("code");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await forgotPassword(email);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setIsLoading(true);
    try {
      await verifyResetCode({ email, code });
      setStep("password");
    } catch (err) {
      setError(err.response?.data?.message || "Code invalide ou expiré");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const authData = await resetPassword({ email, code, newPassword });
      saveAuth(authData);
      if (onClose) onClose();
      toast.success("Mot de passe mis à jour !");
      navigate(getDashboardPath(authData));
    } catch (err) {
      setError(err.response?.data?.message || "Code invalide ou expiré");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <span className="auth-icon">
          <i className="bi bi-key-fill"></i>
        </span>
        <h2 className="auth-title">Mot de passe oublié</h2>
        <p className="auth-subtitle">
          {step === "request" && "Recevez un code de vérification par email"}
          {step === "code" && `Code envoyé à ${email}`}
          {step === "password" && "Choisissez votre nouveau mot de passe"}
        </p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {step === "request" && (
        <form onSubmit={handleRequestCode} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="forgot-email" className="form-label">
              Adresse email
            </label>
            <div className="input-wrapper">
              <i className="bi bi-envelope-fill input-icon"></i>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="form-input"
                autoComplete="email"
              />
            </div>
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
                Envoi en cours...
              </>
            ) : (
              <>
                <i className="bi bi-send-fill" aria-hidden="true"></i>
                Envoyer le code
              </>
            )}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-code" className="form-label">
              Code de vérification
            </label>
            <div className="input-wrapper">
              <i className="bi bi-shield-lock-fill input-icon"></i>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="form-input"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
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
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </button>

          <p className="auth-switch" style={{ margin: "0.75rem 0 0" }}>
            <button type="button" className="auth-switch-btn" onClick={handleResend}>
              Renvoyer le code
            </button>
          </p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handleResetPassword} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              Nouveau mot de passe
            </label>
            <div className="input-wrapper">
              <i className="bi bi-lock-fill input-icon"></i>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="new-password"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              Confirmer le mot de passe
            </label>
            <div className="input-wrapper">
              <i className="bi bi-lock-fill input-icon"></i>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="new-password"
              />
            </div>
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
                Mise à jour...
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </button>
        </form>
      )}

      <p className="auth-switch">
        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
          Retour à la connexion
        </button>
      </p>
    </div>
  );
}
