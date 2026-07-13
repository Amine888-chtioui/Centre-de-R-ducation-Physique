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
      <div className="oauth-redirect-spinner" aria-hidden="true"></div>
      <p className="oauth-redirect-text">Chargement en cours...</p>
    </div>
  );
}
