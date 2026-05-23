import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  getAdminStats,
  getAllAppointments,
  getPatients,
  getRecentActivity,
  getAdminSettings,
  getTodayAppointments,
  getWeeklyChart,
  updateAdminSettings,
  updateAppointmentStatus,
} from "../../services/admin";
import AdminSchedulePlanner from "../../components/dashboard/AdminSchedulePlanner";
import CountUp from "../../components/ui/CountUp";
import { SkeletonStats } from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  activityStatusLabel,
  activityStatusPill,
  formatActivityTime,
  getStatusLabel,
  getStatusPillClass,
  patientStatusPill,
} from "../../utils/appointmentFormat";
import { getFetchErrorMessage } from "../../config/api";
import { withTimeout } from "../../utils/withTimeout";

const BASE_NAV = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    shortLabel: "Accueil",
    icon: "bi-speedometer2",
  },
  {
    id: "patients",
    label: "Patients",
    shortLabel: "Patients",
    icon: "bi-people-fill",
  },
  {
    id: "appointments",
    label: "Rendez-vous",
    shortLabel: "RDV",
    icon: "bi-calendar3",
  },
  {
    id: "planning",
    label: "Planning",
    shortLabel: "Planning",
    icon: "bi-grid-3x3-gap-fill",
  },
  {
    id: "settings",
    label: "Paramètres",
    shortLabel: "Réglages",
    icon: "bi-gear-fill",
  },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [patientCount, setPatientCount] = useState(null);

  const navItems = useMemo(
    () =>
      BASE_NAV.map((item) =>
        item.id === "patients" && patientCount != null
          ? { ...item, badge: patientCount }
          : { ...item, badge: undefined },
      ),
    [patientCount],
  );

  useEffect(() => {
    withTimeout(getAdminStats())
      .then((s) => setPatientCount(s.totalPatients))
      .catch(() => setPatientCount(null));
  }, []);

  const titles = {
    overview: { title: "Administration", subtitle: "Vue globale du centre" },
    patients: { title: "Patients", subtitle: "Gestion des dossiers" },
    appointments: { title: "Rendez-vous", subtitle: "Tous les rendez-vous" },
    planning: {
      title: "Planning",
      subtitle: "Jours et heures ouverts aux réservations",
    },
    settings: { title: "Paramètres", subtitle: "Configuration du centre" },
  };

  const { title, subtitle } = titles[tab] || titles.overview;

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={tab}
      onTabChange={setTab}
      onNotificationNavigate={setTab}
      title={title}
      subtitle={subtitle}
    >
      {tab === "overview" && <AdminOverview />}
      {tab === "patients" && <AdminPatients />}
      {tab === "appointments" && <AdminAppointments />}
      {tab === "planning" && <AdminSchedulePlanner />}
      {tab === "settings" && <AdminSettings />}
    </DashboardLayout>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [activity, setActivity] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!isMounted.current) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [s, t, a, c] = await Promise.all([
        withTimeout(getAdminStats()),
        withTimeout(getTodayAppointments()),
        withTimeout(getRecentActivity()),
        withTimeout(getWeeklyChart()),
      ]);
      if (!isMounted.current) return;
      setStats(s);
      setToday(t);
      setActivity(a);
      setChart(c);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        getFetchErrorMessage(err, {
          timeout:
            "La connexion est trop lente. Cliquez sur actualiser pour réessayer.",
          fallback:
            "Impossible de charger les données. Vérifiez que le backend est démarré.",
        }),
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  const chartMax = Math.max(...chart.map((d) => d.count), 1);

  return (
    <div className="dash-panels">
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
            onClick={() => load(true)}
            aria-label="Réessayer"
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      )}

      <section className="dash-welcome dash-welcome--admin">
        <div className="dash-welcome__content">
          <span className="dash-welcome__tag dash-welcome__tag--admin">
            <i className="bi bi-shield-check" aria-hidden="true" />{" "}
            Administration
          </span>
          <h2>Pilotage du centre en temps réel</h2>
          <p>Données chargées depuis la base de données.</p>
        </div>
        <div className="dash-welcome__aside">
          <button
            type="button"
            className={`dash-refresh-btn ui-press${refreshing ? " dash-refresh-btn--spin" : ""}`}
            aria-label="Actualiser les données"
            disabled={loading || refreshing}
            onClick={() => load(true)}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
          <div
            className="dash-welcome__visual dash-welcome__visual--admin"
            aria-hidden="true"
          >
            <i className="bi bi-bar-chart-fill" />
          </div>
        </div>
      </section>

      {loading ? (
        <SkeletonStats count={4} />
      ) : stats ? (
        <>
          <div className="dash-stats dash-stats--4">
            <article
              className="dash-stat-card dash-stat-card--live"
              style={{ "--stagger": 0 }}
            >
              <div className="dash-stat-card__icon dash-stat-card__icon--blue">
                <i className="bi bi-people-fill" aria-hidden="true" />
              </div>
              <div>
                <strong>
                  <CountUp value={stats?.totalPatients ?? 0} />
                </strong>
                <span>Patients</span>
              </div>
            </article>
            <article
              className="dash-stat-card dash-stat-card--live"
              style={{ "--stagger": 1 }}
            >
              <div className="dash-stat-card__icon dash-stat-card__icon--green">
                <i className="bi bi-calendar-check" aria-hidden="true" />
              </div>
              <div>
                <strong>
                  <CountUp value={stats?.appointmentsToday ?? 0} />
                </strong>
                <span>RDV aujourd&apos;hui</span>
              </div>
            </article>
            <article
              className="dash-stat-card dash-stat-card--live"
              style={{ "--stagger": 2 }}
            >
              <div className="dash-stat-card__icon dash-stat-card__icon--orange">
                <i className="bi bi-person-plus-fill" aria-hidden="true" />
              </div>
              <div>
                <strong>
                  <CountUp value={stats?.newPatientsThisMonth ?? 0} />
                </strong>
                <span>Nouveaux ce mois</span>
              </div>
            </article>
            <article
              className="dash-stat-card dash-stat-card--live"
              style={{ "--stagger": 3 }}
            >
              <div className="dash-stat-card__icon dash-stat-card__icon--purple">
                <i className="bi bi-hourglass-split" aria-hidden="true" />
              </div>
              <div>
                <strong>
                  <CountUp value={stats?.pendingAppointments ?? 0} />
                </strong>
                <span>En attente</span>
              </div>
            </article>
          </div>

          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <div className="dash-card__head">
                <h3>Planning du jour</h3>
                <span className="dash-pill dash-pill--ok">
                  {today.length} RDV
                </span>
              </div>
              {today.length === 0 ? (
                <p className="dash-intro">
                  Aucun rendez-vous aujourd&apos;hui.
                </p>
              ) : (
                <ul className="dash-appointment-list">
                  {today.map((r) => (
                    <li key={r.id} className="dash-appointment-item">
                      <div className="dash-appointment-item__date">
                        <strong>
                          {formatAppointmentTime(r.appointmentDateTime)}
                        </strong>
                      </div>
                      <div className="dash-appointment-item__info">
                        <strong>
                          {r.patientPrenom} {r.patientNom}
                        </strong>
                        <span>
                          {r.type} · {getStatusLabel(r.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dash-card">
              <div className="dash-card__head">
                <h3>Activité récente</h3>
              </div>
              {activity.length === 0 ? (
                <p className="dash-intro">Aucune activité récente.</p>
              ) : (
                <ul className="dash-activity-feed">
                  {activity.map((item) => (
                    <li
                      key={`${item.kind}-${item.at}-${item.patientName}`}
                      className="dash-activity-feed__item"
                    >
                      <span
                        className={`dash-activity-feed__icon dash-activity-feed__icon--${item.kind === "NEW_PATIENT" ? "user" : "rdv"}`}
                      >
                        <i className={`bi ${item.icon}`} aria-hidden="true" />
                      </span>
                      <div className="dash-activity-feed__body">
                        <div className="dash-activity-feed__row">
                          <strong>{item.patientName}</strong>
                          {item.status && (
                            <span
                              className={`dash-pill dash-pill--${activityStatusPill(item.status)}`}
                            >
                              {activityStatusLabel(item.status)}
                            </span>
                          )}
                        </div>
                        <span className="dash-activity-feed__detail">
                          {item.detail}
                        </span>
                      </div>
                      <time
                        className="dash-activity-feed__time"
                        dateTime={item.at}
                      >
                        {formatActivityTime(item.at)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="dash-card dash-card--chart">
            <h3>Fréquentation cette semaine</h3>
            <div className="dash-chart-bars" aria-hidden="true">
              {chart.map((d, i) => (
                <div key={i} className="dash-chart-bars__col">
                  <div
                    className="dash-chart-bars__bar dash-chart-bars__bar--animate"
                    style={{
                      "--bar-h": `${Math.max((d.count / chartMax) * 100, d.count > 0 ? 8 : 4)}%`,
                      "--bar-delay": `${i * 60}ms`,
                    }}
                  />
                  <span>{d.day}</span>
                  <small>{d.count}</small>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const load = useCallback(async (q) => {
    setLoading(true);
    setError("");
    try {
      const data = await withTimeout(getPatients(q));
      if (isMounted.current) setPatients(data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        getFetchErrorMessage(err, {
          timeout: "Délai dépassé. Réessayez.",
          fallback: "Impossible de charger les patients",
        }),
      );
      setPatients([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const delay = search ? 300 : 0;
    const t = setTimeout(() => load(search), delay);
    return () => clearTimeout(t);
  }, [search, load]);

  return (
    <div className="dash-panels">
      <div className="dash-toolbar">
        <div className="dash-search">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
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
            onClick={() => load(search)}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="dash-intro">Chargement...</p>
      ) : patients.length === 0 ? (
        <p className="dash-intro">Aucun patient trouvé.</p>
      ) : (
        <>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>RDV</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>
                        {p.prenom} {p.nom}
                      </strong>
                    </td>
                    <td>{p.email}</td>
                    <td>{p.appointmentCount}</td>
                    <td>
                      <span
                        className={`dash-pill dash-pill--${patientStatusPill(p.status)}`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="dash-patient-cards">
            {patients.map((p) => (
              <li key={p.id} className="dash-patient-card">
                <div className="dash-patient-card__avatar">{p.prenom[0]}</div>
                <div>
                  <strong>
                    {p.prenom} {p.nom}
                  </strong>
                  <span>{p.email}</span>
                </div>
                <span
                  className={`dash-pill dash-pill--${patientStatusPill(p.status)}`}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AdminAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await withTimeout(getAllAppointments());
      if (isMounted.current) setAppointments(data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        getFetchErrorMessage(err, {
          timeout: "Délai dépassé. Réessayez.",
          fallback: "Impossible de charger les rendez-vous",
        }),
      );
      setAppointments([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  const handleStatus = async (id, status) => {
    setError("");
    try {
      await updateAppointmentStatus(id, status);
      await load();
      if (status === "CONFIRME") toast.success("Rendez-vous confirmé");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.status ||
        err.message ||
        "Mise à jour impossible";
      setError(msg);
    }
  };

  const active = appointments.filter((a) => a.status !== "ANNULE");

  return (
    <div className="dash-panels">
      {error && (
        <div className="auth-error-banner" role="alert">
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
            onClick={load}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="dash-intro">Chargement...</p>
      ) : active.length === 0 ? (
        <p className="dash-intro">Aucun rendez-vous enregistré.</p>
      ) : (
        <ul className="dash-appointment-list dash-appointment-list--full">
          {active.map((r) => (
            <li
              key={r.id}
              className="dash-appointment-item dash-appointment-item--card"
            >
              <div className="dash-appointment-item__date">
                <strong>{formatAppointmentTime(r.appointmentDateTime)}</strong>
                <small>{formatAppointmentDate(r.appointmentDateTime)}</small>
              </div>
              <div className="dash-appointment-item__info">
                <strong>
                  {r.patientPrenom} {r.patientNom}
                </strong>
                <span>
                  {r.type} · {r.patientEmail}
                </span>
              </div>
              <div className="dash-simple-list__actions">
                <span
                  className={`dash-pill dash-pill--${getStatusPillClass(r.status)}`}
                >
                  {getStatusLabel(r.status)}
                </span>
                {r.status === "EN_ATTENTE" && (
                  <>
                    <button
                      type="button"
                      className="dash-btn dash-btn--primary dash-btn--sm"
                      onClick={() => handleStatus(r.id, "CONFIRME")}
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      className="dash-btn dash-btn--outline dash-btn--sm"
                      onClick={() => handleStatus(r.id, "ANNULE")}
                    >
                      Refuser
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminSettings() {
  const toast = useToast();
  const [form, setForm] = useState({ centreName: "", phone: "", hours: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    withTimeout(getAdminSettings())
      .then((data) => {
        if (isMounted.current) setForm(data);
      })
      .catch(() => {
        if (isMounted.current) setError("Impossible de charger les paramètres");
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminSettings(form);
      setForm(updated);
      setMessage("Paramètres enregistrés");
      toast.success("Paramètres enregistrés avec succès");
    } catch (err) {
      setError(err.response?.data?.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="dash-intro">Chargement...</p>;

  return (
    <div className="dash-panels">
      <section className="dash-card">
        <h3>Paramètres du centre</h3>
        {message && <p className="dash-intro dash-intro--ok">{message}</p>}
        {error && (
          <div className="auth-error-banner" role="alert">
            <span>{error}</span>
          </div>
        )}
        <form className="dash-form" onSubmit={handleSubmit}>
          <label>
            Nom du centre
            <input
              type="text"
              value={form.centreName}
              onChange={(e) => setForm({ ...form, centreName: e.target.value })}
              required
            />
          </label>
          <label>
            Téléphone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </label>
          <label>
            Horaires
            <input
              type="text"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              required
            />
          </label>
          <button
            type="submit"
            className="dash-btn dash-btn--primary"
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>
    </div>
  );
}
