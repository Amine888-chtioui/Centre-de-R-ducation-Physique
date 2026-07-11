const STATUS_LABELS = {
  EN_ATTENTE: "en attente",
  CONFIRME: "confirmé",
  ANNULE: "annulé",
};

export function formatAppointmentDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatAppointmentTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function getStatusPillClass(status) {
  if (status === "CONFIRME") return "ok";
  if (status === "ANNULE") return "muted";
  return "pending";
}

export function toDateTimeLocalValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatActivityTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function patientStatusPill(status) {
  return status === "nouveau" ? "pending" : "ok";
}

export function activityStatusLabel(status) {
  const labels = {
    EN_ATTENTE: "En attente",
    CONFIRME: "Confirmé",
    ANNULE: "Annulé",
  };
  return labels[status] || status;
}

export function activityStatusPill(status) {
  if (status === "CONFIRME") return "ok";
  if (status === "ANNULE") return "muted";
  return "pending";
}

export function minDateTimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
