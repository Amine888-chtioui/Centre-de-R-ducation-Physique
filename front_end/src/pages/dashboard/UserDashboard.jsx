import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AppointmentForm from "../../components/dashboard/AppointmentForm";
import ForgotPasswordPage from "../../components/auth/ForgotPasswordPage";
import { useAuth } from "../../context/AuthContext";
import {
  cancelAppointment,
  getMyAppointments,
  getMyNextAppointment,
} from "../../services/appointments";
import { changePassword, updateProfile } from "../../services/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useToast } from "../../context/ToastContext";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getStatusLabel,
  getStatusPillClass,
} from "../../utils/appointmentFormat";
import { getFetchErrorMessage } from "../../config/api";
import { withTimeout } from "../../utils/withTimeout";

const NAV = [
  {
    id: "home",
    label: "Accueil",
    shortLabel: "Accueil",
    icon: "bi-house-door-fill",
  },
  {
    id: "appointments",
    label: "Rendez-vous",
    shortLabel: "RDV",
    icon: "bi-calendar-check",
  },
  {
    id: "profile",
    label: "Profil",
    shortLabel: "Profil",
    icon: "bi-person-fill",
  },
];

const HEALTH_TIPS = [
  "Buvez suffisamment d'eau après chaque séance pour favoriser la récupération musculaire.",
  "Portez des vêtements souples le jour de votre séance pour faciliter les mouvements.",
  "Respectez les exercices recommandés à la maison : la régularité accélère la rééducation.",
  "Arrivez quelques minutes avant votre rendez-vous pour vous installer sereinement.",
  "Signalez toute douleur inhabituelle à votre kinésithérapeute dès que possible.",
  "Alternez repos et activité légère entre les séances pour ne pas solliciter la zone traitée.",
];

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function DateChip({ iso, small }) {
  const d = new Date(iso);
  const month = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "");

  return (
    <div className={`dash-date-chip${small ? " dash-date-chip--sm" : ""}`}>
      <span className="dash-date-chip__day">{d.getDate()}</span>
      <span className="dash-date-chip__month">{month}</span>
    </div>
  );
}

export default function UserDashboard() {
  const [tab, setTab] = useState("home");
  const { user } = useAuth();

  const titles = {
    home: { title: `Bonjour, ${user?.prenom || ""}`.trim() },
    appointments: { title: "Mes rendez-vous" },
    profile: { title: "Mon profil" },
  };

  const { title } = titles[tab] || titles.home;

  return (
    <DashboardLayout
      navItems={NAV}
      activeTab={tab}
      onTabChange={setTab}
      onNotificationNavigate={setTab}
      title={title}
      simple
    >
      {tab === "home" && (
        <UserHome onGoAppointments={() => setTab("appointments")} />
      )}
      {tab === "appointments" && <UserAppointments />}
      {tab === "profile" && <UserProfile />}
    </DashboardLayout>
  );
}

function UserHome({ onGoAppointments }) {
  const [next, setNext] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { phone, telHref, hours } = usePublicSettings();
  const isMounted = useRef(true);

  const loadHome = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    const [nextData, allData] = await Promise.all([
      withTimeout(getMyNextAppointment()).catch(() => null),
      withTimeout(getMyAppointments()).catch(() => []),
    ]);
    if (isMounted.current) {
      setNext(nextData);
      setAppointments(allData || []);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    Promise.resolve().then(loadHome);
    return () => {
      isMounted.current = false;
    };
  }, [loadHome]);

  const now = new Date();
  const completedCount = appointments.filter(
    (a) => a.status !== "ANNULE" && new Date(a.appointmentDateTime) < now,
  ).length;
  const upcomingCount = appointments.filter(
    (a) => a.status !== "ANNULE" && new Date(a.appointmentDateTime) >= now,
  ).length;
  const daysUntilNext = next
    ? Math.max(
        0,
        Math.ceil(
          (new Date(next.appointmentDateTime) - now) / 86400000,
        ),
      )
    : null;

  const tip = HEALTH_TIPS[dayOfYear(now) % HEALTH_TIPS.length];

  return (
    <div className="dash-panels dash-panels--simple">
      <p className="dash-intro">
        Bienvenue dans votre espace. Gérez vos rendez-vous en quelques clics.
      </p>

      <section
        className={`dash-simple-card dash-simple-card--highlight${!loading && next ? " dash-card--celebrate" : ""}`}
      >
        {!loading && next ? (
          <DateChip iso={next.appointmentDateTime} />
        ) : (
          <div className="dash-simple-card__icon">
            <i className="bi bi-calendar-event" aria-hidden="true" />
          </div>
        )}
        <div className="dash-simple-card__body">
          <span className="dash-simple-label">Prochain rendez-vous</span>
          {loading ? (
            <div className="ui-skeleton-lines">
              <Skeleton height="14px" />
              <Skeleton height="12px" width="55%" />
            </div>
          ) : next ? (
            <>
              <div className="dash-simple-card__row">
                <strong>{formatAppointmentTime(next.appointmentDateTime)}</strong>
                <span
                  className={`dash-pill dash-pill--${getStatusPillClass(next.status)}`}
                >
                  {getStatusLabel(next.status)}
                </span>
              </div>
              <p>
                {next.type} · {formatAppointmentDate(next.appointmentDateTime)}
              </p>
            </>
          ) : (
            <p>Aucun rendez-vous prévu. Prenez rendez-vous dès maintenant.</p>
          )}
        </div>
      </section>

      {loading ? (
        <div className="dash-home-stats">
          {[1, 2, 3].map((i) => (
            <div className="dash-home-stat" key={i}>
              <Skeleton circle width="22px" height="22px" />
              <Skeleton height="10px" width="70%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="dash-home-stats">
          <div className="dash-home-stat">
            <i className="bi bi-check2-circle" aria-hidden="true" />
            <strong>{completedCount}</strong>
            <span>Séances passées</span>
          </div>
          <div className="dash-home-stat">
            <i className="bi bi-calendar-week" aria-hidden="true" />
            <strong>{upcomingCount}</strong>
            <span>À venir</span>
          </div>
          <div className="dash-home-stat">
            <i className="bi bi-hourglass-split" aria-hidden="true" />
            <strong>
              {daysUntilNext === null
                ? "—"
                : daysUntilNext === 0
                  ? "Auj."
                  : `J-${daysUntilNext}`}
            </strong>
            <span>Prochain RDV</span>
          </div>
        </div>
      )}

      <nav className="dash-menu-list" aria-label="Actions principales">
        <button
          type="button"
          className="dash-menu-list__item ui-press"
          onClick={onGoAppointments}
        >
          <i className="bi bi-calendar-plus" aria-hidden="true" />
          <span>Prendre rendez-vous</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
        <a href={telHref} className="dash-menu-list__item ui-press">
          <i className="bi bi-telephone-fill" aria-hidden="true" />
          <span>Appeler le centre</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </a>
        <a href="/#localisation" className="dash-menu-list__item ui-press">
          <i className="bi bi-geo-alt-fill" aria-hidden="true" />
          <span>Adresse & horaires</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </a>
      </nav>

      <section className="dash-tip-card">
        <div className="dash-tip-card__icon">
          <i className="bi bi-lightbulb-fill" aria-hidden="true" />
        </div>
        <div>
          <span className="dash-simple-label">Conseil du jour</span>
          <p>{tip}</p>
        </div>
      </section>

      <p className="dash-help">
        Besoin d&apos;aide ? <a href={telHref}>{phone}</a>
        {hours ? ` · ${hours}` : ""}
      </p>
    </div>
  );
}

function UserAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [view, setView] = useState("upcoming");
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const loadAppointments = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError("");
    try {
      const data = await withTimeout(getMyAppointments());
      if (isMounted.current) setAppointments(data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        getFetchErrorMessage(err, {
          timeout: "La connexion est trop lente. Veuillez réessayer.",
          fallback: "Impossible de charger vos rendez-vous.",
        }),
      );
      setAppointments([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    Promise.resolve().then(loadAppointments);
    return () => {
      isMounted.current = false;
    };
  }, [loadAppointments]);

  const handleCancel = async (id) => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    try {
      await cancelAppointment(id);
      await loadAppointments();
      toast.info("Rendez-vous annulé");
    } catch (err) {
      setError(err.response?.data?.message || "Annulation impossible");
    }
  };

  const now = new Date();
  const upcoming = appointments
    .filter((a) => a.status !== "ANNULE" && new Date(a.appointmentDateTime) >= now)
    .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
  const history = appointments.filter(
    (a) => a.status === "ANNULE" || new Date(a.appointmentDateTime) < now,
  );
  const list = view === "upcoming" ? upcoming : history;

  const formOpen = showForm || !!rescheduleTarget;

  return (
    <div className="dash-panels dash-panels--simple">
      {formOpen && (
        <section className="dash-card">
          <h3>{rescheduleTarget ? "Reprogrammer le rendez-vous" : "Nouveau rendez-vous"}</h3>
          <AppointmentForm
            rescheduleId={rescheduleTarget?.id}
            onSuccess={() => {
              setShowForm(false);
              setRescheduleTarget(null);
              loadAppointments();
              toast.success(
                rescheduleTarget
                  ? "Rendez-vous reprogrammé !"
                  : "Demande de rendez-vous envoyée !",
              );
            }}
            onCancel={() => {
              setShowForm(false);
              setRescheduleTarget(null);
            }}
          />
        </section>
      )}

      {!formOpen && (
        <div className="dash-subtabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === "upcoming"}
            className={`dash-subtabs__btn ${view === "upcoming" ? "dash-subtabs__btn--active" : ""}`}
            onClick={() => setView("upcoming")}
          >
            À venir
            {upcoming.length > 0 && (
              <span className="dash-subtabs__count">{upcoming.length}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "history"}
            className={`dash-subtabs__btn ${view === "history" ? "dash-subtabs__btn--active" : ""}`}
            onClick={() => setView("history")}
          >
            Historique
          </button>
        </div>
      )}

      {error && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
            onClick={loadAppointments}
            aria-label="Réessayer"
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      )}

      {loading ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="dash-simple-list__item"
              style={{
                flexDirection: "row",
                alignItems: "center",
                opacity: 0.6,
              }}
            >
              <div style={{ flex: 1 }}>
                <Skeleton height="14px" width="60%" />
                <Skeleton height="11px" width="40%" style={{ marginTop: 6 }} />
              </div>
              <Skeleton height="24px" width="70px" />
            </div>
          ))}
        </div>
      ) : list.length === 0 && !error ? (
        <div className="dash-empty-state">
          <div className="dash-empty-state__icon">
            <i
              className={`bi ${view === "upcoming" ? "bi-calendar-heart" : "bi-clock-history"}`}
              aria-hidden="true"
            />
          </div>
          <h3>
            {view === "upcoming"
              ? "Aucun rendez-vous pour l'instant"
              : "Aucun historique pour l'instant"}
          </h3>
          <p>
            {view === "upcoming"
              ? "Prenez rendez-vous en quelques clics : choisissez le jour et l'heure qui vous conviennent."
              : "Vos rendez-vous passés ou annulés apparaîtront ici."}
          </p>
        </div>
      ) : (
        <ul className="dash-simple-list">
          {list.map((a) => (
            <li
              key={a.id}
              className={`dash-simple-list__item dash-simple-list__item--${getStatusPillClass(a.status)}${view === "history" ? " dash-simple-list__item--history" : ""}`}
            >
              <div className="dash-simple-list__row">
                <DateChip iso={a.appointmentDateTime} small />
                <div className="dash-simple-list__info">
                  <strong>{formatAppointmentTime(a.appointmentDateTime)}</strong>
                  <span>
                    {a.type}
                    {view === "history" && ` · ${formatAppointmentDate(a.appointmentDateTime)}`}
                  </span>
                </div>
                <span
                  className={`dash-pill dash-pill--${getStatusPillClass(a.status)}`}
                >
                  {getStatusLabel(a.status)}
                </span>
              </div>
              {view === "upcoming" && a.status !== "ANNULE" && (
                <div className="dash-simple-list__actions">
                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={() => setRescheduleTarget(a)}
                  >
                    <i className="bi bi-arrow-repeat" aria-hidden="true" />
                    Reprogrammer
                  </button>
                  <button
                    type="button"
                    className="dash-btn dash-btn--danger-outline dash-btn--sm"
                    onClick={() => handleCancel(a.id)}
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                    Annuler
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!formOpen && (
        <button
          type="button"
          className="dash-fab ui-press"
          onClick={() => setShowForm(true)}
          aria-label="Nouveau rendez-vous"
          title="Nouveau rendez-vous"
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function UserProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    telephone: user?.telephone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setSavingProfile(true);
    try {
      const updated = await updateProfile(form);
      updateUser(updated);
      toast.success("Profil mis à jour");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Mise à jour impossible");
    } finally {
      setSavingProfile(false);
    }
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword.length < 8) {
      setPwError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Mot de passe mis à jour");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (err) {
      setPwError(err.response?.data?.message || "Mise à jour impossible");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="dash-panels dash-panels--simple">
      <section className="dash-profile-simple">
        <div className="dash-profile-simple__banner" />
        <div className="dash-profile-simple__avatar">
          {(user?.prenom?.[0] || "") + (user?.nom?.[0] || "")}
        </div>
        <h2>
          {user?.prenom} {user?.nom}
        </h2>
        <p>{user?.email}</p>
      </section>

      <section className="dash-card">
        <h3>Mes informations</h3>
        {profileError && (
          <div className="auth-error-banner" role="alert">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
            <span>{profileError}</span>
          </div>
        )}
        <form className="dash-form" onSubmit={handleProfileSubmit}>
          <label>
            Nom
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
            />
          </label>
          <label>
            Prénom
            <input
              type="text"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              required
            />
          </label>
          <label>
            Téléphone
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              placeholder="06 12 34 56 78"
            />
          </label>
          <label>
            Email
            <input type="email" value={user?.email || ""} disabled />
          </label>
          <button
            type="submit"
            className="dash-btn dash-btn--primary"
            disabled={savingProfile}
          >
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>

      <section className="dash-card">
        <div className="dash-card__head">
          <h3>Mot de passe</h3>
          {!showPasswordForm && !showForgot && (
            <button
              type="button"
              className="dash-btn dash-btn--outline dash-btn--sm"
              onClick={() => setShowPasswordForm(true)}
            >
              Modifier
            </button>
          )}
        </div>

        {showForgot ? (
          <ForgotPasswordPage
            onSwitchToLogin={() => setShowForgot(false)}
            onClose={() => setShowForgot(false)}
          />
        ) : showPasswordForm ? (
          <>
            {pwError && (
              <div className="auth-error-banner" role="alert">
                <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                <span>{pwError}</span>
              </div>
            )}
            <form className="dash-form" onSubmit={handlePasswordSubmit}>
              <label>
                Mot de passe actuel
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                  }
                  required
                  autoComplete="current-password"
                />
              </label>
              <label>
                Nouveau mot de passe
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirmer le nouveau mot de passe
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                  }
                  required
                  autoComplete="new-password"
                />
              </label>
              <div className="dash-appt-form__actions">
                <button
                  type="button"
                  className="dash-btn dash-btn--outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPwError("");
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="dash-btn dash-btn--primary"
                  disabled={savingPw}
                >
                  {savingPw ? "Enregistrement..." : "Mettre à jour"}
                </button>
              </div>
            </form>
            <p className="dash-help">
              Connecté avec Google ou mot de passe oublié ?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setShowForgot(true)}
              >
                Réinitialiser par email
              </button>
            </p>
          </>
        ) : (
          <p className="dash-intro">••••••••</p>
        )}
      </section>
    </div>
  );
}
