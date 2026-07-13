import { useEffect, useState } from "react";
import {
  APPOINTMENT_TYPES,
  createAppointment,
  getAvailableDays,
  getAvailableSlots,
  rescheduleAppointment,
} from "../../services/appointments";
import LoadingSpinner from "../ui/LoadingSpinner";

function formatDayNum(dateStr) {
  return new Date(dateStr + "T12:00:00").getDate();
}

function formatMonth(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
    month: "short",
  });
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthLabel(year, month) {
  return capitalize(
    new Date(year, month, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
  );
}

const TYPE_ICONS = {
  Kinésithérapie: "bi-activity",
  "Rééducation sportive": "bi-trophy-fill",
  "Bilan initial": "bi-clipboard2-pulse-fill",
  Suivi: "bi-arrow-repeat",
};

export default function AppointmentForm({
  onSuccess,
  onCancel,
  rescheduleId = null,
  onSubmitOverride = null,
}) {
  const now = new Date();
  const [days, setDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [horizonReached, setHorizonReached] = useState(false);

  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goPrevMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (horizonReached) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    setLoadingDays(true);
    setSelectedDate(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const rangeStart = firstOfMonth < today ? today : firstOfMonth;
    const count = Math.round((lastOfMonth - rangeStart) / 86400000) + 1;

    getAvailableDays(count, toDateStr(rangeStart))
      .then((data) => {
        setDays(data);
        setHorizonReached(data.length === 0);
      })
      .catch(() => setError("Impossible de charger les jours disponibles"))
      .finally(() => setLoadingDays(false));
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setSelectedTime(null);
      return;
    }

    setLoadingSlots(true);
    setSelectedTime(null);
    getAvailableSlots(selectedDate)
      .then(setSlots)
      .catch(() => setError("Impossible de charger les horaires"))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDate || !selectedTime) {
      setError("Choisissez un jour et une heure disponibles");
      return;
    }

    const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;

    setLoading(true);
    try {
      if (onSubmitOverride) {
        await onSubmitOverride({ appointmentDateTime, type });
      } else if (rescheduleId) {
        await rescheduleAppointment(rescheduleId, appointmentDateTime);
      } else {
        await createAppointment({ appointmentDateTime, type });
      }
      onSuccess?.();
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.message ||
          (data?.errors
            ? Object.values(data.errors).join(" ")
            : "Impossible de créer le rendez-vous"),
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedDayLabel = days.find((d) => d.date === selectedDate);

  return (
    <form className="dash-appt-form" onSubmit={handleSubmit}>
      {error && (
        <div className="auth-error-banner" role="alert">
          <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className="booking-section">
        <h4 className="booking-section__title">
          <span className="booking-step">1</span> Choisir un jour
        </h4>
        <p className="booking-hint">
          <span className="booking-legend booking-legend--ok" /> Disponible
          <span className="booking-legend booking-legend--no" /> Indisponible
        </p>

        <div className="booking-month-nav">
          <button
            type="button"
            className="booking-month-nav__btn"
            onClick={goPrevMonth}
            disabled={isCurrentMonth}
            aria-label="Mois précédent"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <span className="booking-month-nav__label">
            {monthLabel(viewYear, viewMonth)}
          </span>
          <button
            type="button"
            className="booking-month-nav__btn"
            onClick={goNextMonth}
            disabled={horizonReached}
            aria-label="Mois suivant"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </div>

        {loadingDays ? (
          <LoadingSpinner text="Chargement des jours..." inline />
        ) : days.length === 0 ? (
          <p className="booking-loading">
            Aucune date disponible pour ce mois.
          </p>
        ) : (
          <div className="booking-grid booking-grid--days" role="list">
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                role="listitem"
                disabled={!day.available}
                className={`booking-cell booking-cell--day ui-press ${
                  day.available ? "booking-cell--ok" : "booking-cell--disabled"
                } ${selectedDate === day.date ? "booking-cell--selected booking-cell--pop" : ""}`}
                onClick={() => day.available && setSelectedDate(day.date)}
              >
                <span className="booking-cell__dow">{day.label}</span>
                <strong className="booking-cell__num">{formatDayNum(day.date)}</strong>
                <span className="booking-cell__month">{formatMonth(day.date)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedDate && (
        <section className="booking-section">
          <h4 className="booking-section__title">
            <span className="booking-step">2</span> Choisir une heure
            {selectedDayLabel && (
              <small>
                — {formatDayNum(selectedDate)} {selectedDayLabel.label}
              </small>
            )}
          </h4>
          <p className="booking-hint">Chaque séance dure 1 heure.</p>

          {loadingSlots ? (
            <LoadingSpinner text="Chargement des horaires..." inline />
          ) : (
            <div className="booking-grid booking-grid--hours" role="list">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  role="listitem"
                  disabled={!slot.available}
                  className={`booking-cell booking-cell--hour ui-press ${
                    slot.available ? "booking-cell--ok" : "booking-cell--disabled"
                  } ${selectedTime === slot.time ? "booking-cell--selected booking-cell--pop" : ""}`}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedDate && selectedTime && !rescheduleId && (
        <section className="booking-section">
          <h4 className="booking-section__title">
            <span className="booking-step">3</span> Type de séance
          </h4>
          <div className="booking-type-grid" role="list">
            {APPOINTMENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="listitem"
                className={`booking-type-card ui-press ${type === t ? "booking-type-card--selected" : ""}`}
                onClick={() => setType(t)}
              >
                <i className={`bi ${TYPE_ICONS[t] || "bi-heart-pulse-fill"}`} aria-hidden="true" />
                {t}
              </button>
            ))}
          </div>

          <div className="booking-summary booking-summary--reveal">
            <i className="bi bi-calendar-check" aria-hidden="true" />
            <span>
              {formatDayNum(selectedDate)} {formatMonth(selectedDate)} {selectedTime} — {type}
            </span>
          </div>
        </section>
      )}

      {selectedDate && selectedTime && rescheduleId && (
        <section className="booking-section">
          <div className="booking-summary booking-summary--reveal">
            <i className="bi bi-calendar-check" aria-hidden="true" />
            <span>
              Nouveau créneau : {formatDayNum(selectedDate)} {formatMonth(selectedDate)} à {selectedTime}
            </span>
          </div>
        </section>
      )}

      <div className="dash-appt-form__actions">
        {onCancel && (
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          className="dash-btn dash-btn--primary ui-press"
          disabled={loading || !selectedDate || !selectedTime}
        >
          {loading ? (
            <>
              <i className="bi bi-arrow-repeat dash-spin" aria-hidden="true" /> Envoi...
            </>
          ) : rescheduleId ? (
            "Confirmer la reprogrammation"
          ) : (
            "Confirmer le rendez-vous"
          )}
        </button>
      </div>
    </form>
  );
}
