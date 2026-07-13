import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getMe } from "../services/api";
import { getDashboardPath } from "../utils/auth";

/**
 * Page atterrissage après le flux Google OAuth2 (voir
 * OAuth2AuthenticationSuccessHandler côté backend, qui redirige ici avec
 * ?token=... ou ?error=...).
 */
export default function OAuth2RedirectPage() {
  const [searchParams] = useSearchParams();
  const { saveAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const error = searchParams.get("error");
    if (error) {
      toast.error("Connexion Google impossible. Veuillez réessayer.");
      navigate("/", { replace: true });
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    localStorage.setItem("token", token);

    getMe()
      .then((me) => {
        saveAuth({ ...me, token });
        navigate(getDashboardPath(me), { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        toast.error("Connexion Google impossible. Veuillez réessayer.");
        navigate("/", { replace: true });
      });
  }, [searchParams, saveAuth, toast, navigate]);

  return (
    <div className="oauth-redirect-page">
      <div className="oauth-redirect-card">
        <div className="oauth-redirect-logo" aria-hidden="true">
          <i className="bi bi-person-arms-up"></i>
        </div>
        <h1 className="oauth-redirect-title">Connexion en cours...</h1>
        <p className="oauth-redirect-subtitle">
          Merci de patienter, nous finalisons votre connexion à votre espace
          Centre de Rééducation Physique.
        </p>
        <div className="oauth-redirect-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
