import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AppointmentForm from "../../components/dashboard/AppointmentForm";
import { useAuth } from "../../context/AuthContext";
import {
  cancelAppointment,
  getMyAppointments,
  getMyNextAppointment,
} from "../../services/appointments";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useToast } from "../../context/ToastContext";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getStatusLabel,
  getStatusPillClass,
} from "../../utils/appointmentFormat";

const NAV = [
  { id: "home", label: "Accueil", shortLabel: "Accueil", icon: "bi-house-door-fill" },
  { id: "appointments", label: "Rendez-vous", shortLabel: "RDV", icon: "bi-calendar-check" },
  { id: "profile", label: "Profil", shortLabel: "Profil", icon: "bi-person-fill" },
];

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
      {tab === "home" && <UserHome onGoAppointments={() => setTab("appointments")} />}
      {tab === "appointments" && <UserAppointments />}
      {tab === "profile" && <UserProfile />}
    </DashboardLayout>
  );
}

function UserHome({ onGoAppointments }) {
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const { phone, telHref } = usePublicSettings();

  const loadNext = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNextAppointment();
      setNext(data);
    } catch {
      setNext(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  return (
    <div className="dash-panels dash-panels--simple">
      <p className="dash-intro">
        Bienvenue dans votre espace. Gérez vos rendez-vous en quelques clics.
      </p>

      <section
        className={`dash-simple-card dash-simple-card--highlight${!loading && next ? " dash-card--celebrate" : ""}`}
      >
        <div className="dash-simple-card__icon">
          <i className="bi bi-calendar-event" aria-hidden="true" />
        </div>
        <div className="dash-simple-card__body">
          <span className="dash-simple-label">Prochain rendez-vous</span>
          {loading ? (
            <div className="ui-skeleton-lines">
              <Skeleton height="14px" />
              <Skeleton height="12px" width="55%" />
            </div>
          ) : next ? (
            <>
              <strong>
                {formatAppointmentDate(next.appointmentDateTime)} ·{" "}
                {formatAppointmentTime(next.appointmentDateTime)}
              </strong>
              <p>{next.type}</p>
            </>
          ) : (
            <p>Aucun rendez-vous prévu. Prenez rendez-vous dès maintenant.</p>
          )}
        </div>
      </section>

      <nav className="dash-menu-list" aria-label="Actions principales">
        <button type="button" className="dash-menu-list__item ui-press" onClick={onGoAppointments}>
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

      <p className="dash-help">
        Besoin d&apos;aide ? <a href={telHref}>{phone}</a>
      </p>
    </div>
  );
}

function UserAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointments();
      setAppointments(data);
    } catch {
      setError("Impossible de charger vos rendez-vous");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
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

  const upcoming = appointments.filter((a) => a.status !== "ANNULE");

  return (
    <div className="dash-panels dash-panels--simple">
      {!showForm ? (
        <button
          type="button"
          className="dash-btn dash-btn--primary dash-btn--block ui-press"
          onClick={() => setShowForm(true)}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Nouveau rendez-vous
        </button>
      ) : (
        <section className="dash-card">
          <h3>Nouveau rendez-vous</h3>
          <AppointmentForm
            onSuccess={() => {
              setShowForm(false);
              loadAppointments();
              toast.success("Demande de rendez-vous envoyée !");
            }}
            onCancel={() => setShowForm(false)}
          />
        </section>
      )}

      {error && (
        <div className="auth-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="dash-intro">Chargement...</p>
      ) : upcoming.length === 0 ? (
        <p className="dash-intro">Vous n&apos;avez pas encore de rendez-vous.</p>
      ) : (
        <ul className="dash-simple-list">
          {upcoming.map((a) => (
            <li key={a.id} className="dash-simple-list__item dash-simple-list__item--stack">
              <div>
                <strong>
                  {formatAppointmentDate(a.appointmentDateTime)} —{" "}
                  {formatAppointmentTime(a.appointmentDateTime)}
                </strong>
                <span>{a.type}</span>
              </div>
              <div className="dash-simple-list__actions">
                <span className={`dash-pill dash-pill--${getStatusPillClass(a.status)}`}>
                  {getStatusLabel(a.status)}
                </span>
                {a.status !== "ANNULE" && (
                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={() => handleCancel(a.id)}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserProfile() {
  const { user } = useAuth();

  return (
    <div className="dash-panels dash-panels--simple">
      <section className="dash-profile-simple">
        <div className="dash-profile-simple__avatar">
          {(user?.prenom?.[0] || "") + (user?.nom?.[0] || "")}
        </div>
        <h2>
          {user?.prenom} {user?.nom}
        </h2>
        <p>{user?.email}</p>
      </section>

      <dl className="dash-info-list">
        <div>
          <dt>Nom</dt>
          <dd>{user?.nom}</dd>
        </div>
        <div>
          <dt>Prénom</dt>
          <dd>{user?.prenom}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>
    </div>
  );
}
