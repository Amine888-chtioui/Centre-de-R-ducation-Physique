/**
 * URL de base de l'API.
 * En dev : "/api" est proxifié par Vite vers le backend (même hôte que le front,
 * y compris accès mobile via l'IP du PC).
 * En prod : définir VITE_API_URL ou utiliser la même origine.
 */
export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return `${window.location.origin}/api`;
}

export function getNotificationStreamUrl(token) {
  const params = new URLSearchParams({ access_token: token });
  return `${getApiBaseUrl()}/notifications/stream?${params.toString()}`;
}

/** Message d'erreur lisible pour les échecs de chargement dashboard. */
export function getFetchErrorMessage(
  err,
  {
    timeout = "La connexion est trop lente. Veuillez réessayer.",
    offline = "Impossible de joindre le serveur. Vérifiez que le backend est démarré.",
    fallback = "Impossible de charger les données.",
  } = {},
) {
  if (err?.message === "timeout" || err?.code === "ECONNABORTED") {
    return timeout;
  }
  if (!err?.response) {
    return offline;
  }
  return fallback;
}
