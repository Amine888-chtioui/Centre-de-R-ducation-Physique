import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AppointmentForm from "../../components/dashboard/AppointmentForm";
import {
  createManualAppointment,
  getAdminStats,
  getAllAppointments,
  getPatientDetail,
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
    Promise.resolve().then(load);
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
                      key={`${item.kind}-${item.at}-${item.patientName}-${item.detail}`}
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
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [bookingPatient, setBookingPatient] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
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
        <button
          type="button"
          className="dash-btn dash-btn--primary ui-press"
          onClick={() => setShowBooking(true)}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Nouveau RDV
        </button>
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
                  <th>Téléphone</th>
                  <th>RDV</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="dash-table__row--clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPatientId(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedPatientId(p.id)}
                  >
                    <td>
                      <strong>
                        {p.prenom} {p.nom}
                      </strong>
                    </td>
                    <td>{p.email}</td>
                    <td>{p.telephone || "—"}</td>
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
              <li
                key={p.id}
                className="dash-patient-card ui-press"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPatientId(p.id)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPatientId(p.id)}
              >
                <div className="dash-patient-card__avatar">{p.prenom[0]}</div>
                <div>
                  <strong>
                    {p.prenom} {p.nom}
                  </strong>
                  <span>{p.email}</span>
                  {p.telephone && (
                    <a
                      href={`tel:${p.telephone}`}
                      className="dash-patient-card__phone"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="bi bi-telephone-fill" aria-hidden="true" />
                      {p.telephone}
                    </a>
                  )}
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

      {selectedPatientId && (
        <PatientDetailModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onBookAppointment={(p) => {
            setSelectedPatientId(null);
            setBookingPatient(p);
            setShowBooking(true);
          }}
        />
      )}

      {showBooking && (
        <NewAppointmentModal
          initialPatient={bookingPatient}
          onClose={() => {
            setShowBooking(false);
            setBookingPatient(null);
          }}
          onCreated={() => {
            setShowBooking(false);
            setBookingPatient(null);
            load(search);
          }}
        />
      )}
    </div>
  );
}

function AdminAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBooking, setShowBooking] = useState(false);
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
    Promise.resolve().then(load);
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
      <div className="dash-toolbar" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="dash-btn dash-btn--primary ui-press"
          onClick={() => setShowBooking(true)}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Nouveau RDV
        </button>
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

      {showBooking && (
        <NewAppointmentModal
          onClose={() => setShowBooking(false)}
          onCreated={() => {
            setShowBooking(false);
            load();
          }}
        />
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

function PatientDetailModal({ patientId, onClose, onBookAppointment }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError("");
      withTimeout(getPatientDetail(patientId))
        .then((data) => {
          if (active) setDetail(data);
        })
        .catch(() => {
          if (active) setError("Impossible de charger la fiche patient");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, [patientId]);

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div
        className="dash-modal dash-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Fiche patient"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dash-modal__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>

        {loading ? (
          <p className="dash-intro">Chargement...</p>
        ) : error || !detail ? (
          <p className="dash-intro">{error || "Patient introuvable"}</p>
        ) : (
          <>
            <div className="dash-modal__patient-header">
              <div className="dash-patient-card__avatar dash-patient-card__avatar--lg">
                {detail.prenom[0]}
              </div>
              <div>
                <h3>
                  {detail.prenom} {detail.nom}
                </h3>
                {detail.createdAt && (
                  <span>Patient depuis le {formatAppointmentDate(detail.createdAt)}</span>
                )}
              </div>
            </div>

            <dl className="dash-info-list">
              <div>
                <dt>
                  <i className="bi bi-envelope-fill" aria-hidden="true" /> Email
                </dt>
                <dd>
                  <a href={`mailto:${detail.email}`}>{detail.email}</a>
                </dd>
              </div>
              <div>
                <dt>
                  <i className="bi bi-telephone-fill" aria-hidden="true" /> Téléphone
                </dt>
                <dd>
                  {detail.telephone ? (
                    <a href={`tel:${detail.telephone}`}>{detail.telephone}</a>
                  ) : (
                    "Non renseigné"
                  )}
                </dd>
              </div>
            </dl>

            <div className="dash-modal__actions">
              {detail.telephone && (
                <a href={`tel:${detail.telephone}`} className="dash-btn dash-btn--outline">
                  <i className="bi bi-telephone-fill" aria-hidden="true" /> Appeler
                </a>
              )}
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                onClick={() =>
                  onBookAppointment({
                    id: detail.id,
                    nom: detail.nom,
                    prenom: detail.prenom,
                    email: detail.email,
                    telephone: detail.telephone,
                  })
                }
              >
                <i className="bi bi-calendar-plus" aria-hidden="true" /> Nouveau RDV
              </button>
            </div>

            <h4 className="dash-modal__section-title">Historique des rendez-vous</h4>
            {detail.appointments.length === 0 ? (
              <p className="dash-intro">Aucun rendez-vous.</p>
            ) : (
              <ul className="dash-appointment-list dash-appointment-list--full">
                {detail.appointments.map((a) => (
                  <li
                    key={a.id}
                    className="dash-appointment-item dash-appointment-item--card"
                  >
                    <div className="dash-appointment-item__date">
                      <strong>{formatAppointmentTime(a.appointmentDateTime)}</strong>
                      <small>{formatAppointmentDate(a.appointmentDateTime)}</small>
                    </div>
                    <div className="dash-appointment-item__info">
                      <strong>{a.type}</strong>
                    </div>
                    <span
                      className={`dash-pill dash-pill--${getStatusPillClass(a.status)}`}
                    >
                      {getStatusLabel(a.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PatientPicker({ onSelect }) {
  const [mode, setMode] = useState("existing");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newPatient, setNewPatient] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
  });

  useEffect(() => {
    if (mode !== "existing") return undefined;
    const t = setTimeout(
      () => {
        setSearching(true);
        getPatients(search)
          .then(setResults)
          .catch(() => setResults([]))
          .finally(() => setSearching(false));
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(t);
  }, [search, mode]);

  return (
    <div className="dash-patient-picker">
      <div className="dash-subtabs">
        <button
          type="button"
          className={`dash-subtabs__btn ${mode === "existing" ? "dash-subtabs__btn--active" : ""}`}
          onClick={() => setMode("existing")}
        >
          Patient existant
        </button>
        <button
          type="button"
          className={`dash-subtabs__btn ${mode === "new" ? "dash-subtabs__btn--active" : ""}`}
          onClick={() => setMode("new")}
        >
          Nouveau patient
        </button>
      </div>

      {mode === "existing" ? (
        <>
          <div className="dash-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {searching ? (
            <p className="dash-intro">Recherche...</p>
          ) : results.length === 0 ? (
            <p className="dash-intro">Aucun patient trouvé.</p>
          ) : (
            <ul className="dash-patient-cards">
              {results.map((p) => (
                <li
                  key={p.id}
                  className="dash-patient-card ui-press"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onSelect({
                      id: p.id,
                      nom: p.nom,
                      prenom: p.prenom,
                      email: p.email,
                      telephone: p.telephone,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.click();
                  }}
                >
                  <div className="dash-patient-card__avatar">{p.prenom[0]}</div>
                  <div>
                    <strong>
                      {p.prenom} {p.nom}
                    </strong>
                    <span>{p.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <form
          className="dash-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSelect(newPatient);
          }}
        >
          <label>
            Nom
            <input
              type="text"
              required
              value={newPatient.nom}
              onChange={(e) => setNewPatient({ ...newPatient, nom: e.target.value })}
            />
          </label>
          <label>
            Prénom
            <input
              type="text"
              required
              value={newPatient.prenom}
              onChange={(e) => setNewPatient({ ...newPatient, prenom: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={newPatient.email}
              onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
            />
          </label>
          <label>
            Téléphone
            <input
              type="tel"
              value={newPatient.telephone}
              onChange={(e) => setNewPatient({ ...newPatient, telephone: e.target.value })}
            />
          </label>
          <button type="submit" className="dash-btn dash-btn--primary">
            Continuer
          </button>
        </form>
      )}
    </div>
  );
}

function NewAppointmentModal({ initialPatient = null, onClose, onCreated }) {
  const toast = useToast();
  const [patient, setPatient] = useState(initialPatient);

  const handleSubmitAppointment = async ({ appointmentDateTime, type }) => {
    const payload = patient.id
      ? { patientId: patient.id, appointmentDateTime, type }
      : { ...patient, appointmentDateTime, type };
    await createManualAppointment(payload);
  };

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div
        className="dash-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Nouveau rendez-vous"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dash-modal__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <h3 className="dash-modal__title">Nouveau rendez-vous</h3>

        {!patient ? (
          <PatientPicker onSelect={setPatient} />
        ) : (
          <>
            <div className="dash-modal__selected-patient">
              <div className="dash-patient-card__avatar">{patient.prenom[0]}</div>
              <div>
                <strong>
                  {patient.prenom} {patient.nom}
                </strong>
                <span>{patient.email}</span>
              </div>
              <button
                type="button"
                className="dash-btn dash-btn--outline dash-btn--sm"
                onClick={() => setPatient(null)}
              >
                Changer
              </button>
            </div>
            <AppointmentForm
              onSubmitOverride={handleSubmitAppointment}
              onSuccess={() => {
                toast.success("Rendez-vous créé");
                onCreated?.();
              }}
              onCancel={onClose}
            />
          </>
        )}
      </div>
    </div>
  );
}
