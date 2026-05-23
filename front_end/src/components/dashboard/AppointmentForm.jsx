import { useEffect, useState } from "react";
import {
  APPOINTMENT_TYPES,
  createAppointment,
  getAvailableDays,
  getAvailableSlots,
} from "../../services/appointments";

function formatDayNum(dateStr) {
  return new Date(dateStr + "T12:00:00").getDate();
}

function formatMonth(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
    month: "short",
  });
}

export default function AppointmentForm({ onSuccess, onCancel }) {
  const [days, setDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    setLoadingDays(true);
    getAvailableDays(21)
      .then(setDays)
      .catch(() => setError("Impossible de charger les jours disponibles"))
      .finally(() => setLoadingDays(false));
  }, []);

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
      await createAppointment({ appointmentDateTime, type });
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

        {loadingDays ? (
          <p className="booking-loading">Chargement des jours...</p>
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
            <p className="booking-loading">Chargement des horaires...</p>
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

      {selectedDate && selectedTime && (
        <section className="booking-section">
          <h4 className="booking-section__title">
            <span className="booking-step">3</span> Type de séance
          </h4>
          <select
            className="dash-appt-form__input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="booking-summary booking-summary--reveal">
            <i className="bi bi-calendar-check" aria-hidden="true" />
            <span>
              {formatDayNum(selectedDate)} {formatMonth(selectedDate)} {selectedTime} — {type}
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
          ) : (
            "Confirmer le rendez-vous"
          )}
        </button>
      </div>
    </form>
  );
}
