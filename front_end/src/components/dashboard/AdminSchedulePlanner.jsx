import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminSchedule, updateAdminSchedule } from "../../services/admin";
import { getFetchErrorMessage } from "../../config/api";
import { withTimeout } from "../../utils/withTimeout";
import LoadingSpinner from "../ui/LoadingSpinner";

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const WEEKEND = ["SATURDAY", "SUNDAY"];

function cloneMatrix(days) {
  return days.map((d) => ({
    ...d,
    hours: d.hours.map((h) => ({ ...h })),
  }));
}

function buildSlotsPayload(days) {
  return days.flatMap((day) =>
    day.hours.map((h) => ({
      dayOfWeek: day.dayOfWeek,
      hour: h.hour,
      active: h.active,
    })),
  );
}

function countDayActive(day) {
  if (!day) return 0;
  return day.hours.filter((h) => h.active).length;
}

function ScheduleHourButton({ cell, dayLabel, onToggle }) {
  const cls = [
    "schedule-slot",
    cell.active ? "schedule-slot--on" : "schedule-slot--off",
  ].join(" ");

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={cell.active}
      aria-label={`${dayLabel} ${cell.time} — ${cell.active ? "ouvert" : "fermé"}`}
      onClick={onToggle}
    >
      <span className="schedule-slot__time">{cell.time}</span>
      <span className="schedule-slot__state">{cell.active ? "Ouvert" : "Fermé"}</span>
    </button>
  );
}

function DayHoursGrid({ day, dayIndex, onToggleHour }) {
  return (
    <div className="schedule-hours" role="group" aria-label={`Créneaux ${day.label}`}>
      {day.hours.map((cell, hourIndex) => (
        <ScheduleHourButton
          key={cell.hour}
          cell={cell}
          dayLabel={day.label}
          onToggle={() => onToggleHour(dayIndex, hourIndex)}
        />
      ))}
    </div>
  );
}

export default function AdminSchedulePlanner() {
  const [days, setDays] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isMounted = useRef(true);

  const selectedDay = days[selectedDayIndex];
  const selectedDayActive = useMemo(
    () => countDayActive(selectedDay),
    [selectedDay],
  );
  const selectedDayTotal = selectedDay?.hours?.length ?? 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await withTimeout(getAdminSchedule());
      if (!isMounted.current) return;
      setDays(cloneMatrix(data.days));
      setActiveCount(data.activeSlotsCount ?? 0);
      setDirty(false);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        getFetchErrorMessage(err, {
          timeout: "Délai dépassé. Réessayez.",
          fallback: "Impossible de charger le planning",
        }),
      );
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

  const recount = (nextDays) => {
    let count = 0;
    nextDays.forEach((d) =>
      d.hours.forEach((h) => {
        if (h.active) count += 1;
      }),
    );
    setActiveCount(count);
  };

  const toggleCell = (dayIndex, hourIndex) => {
    setDays((prev) => {
      const next = cloneMatrix(prev);
      const cell = next[dayIndex].hours[hourIndex];
      cell.active = !cell.active;
      recount(next);
      return next;
    });
    setDirty(true);
    setSuccess("");
  };

  const setDayActive = (dayOfWeek, active) => {
    setDays((prev) => {
      const next = cloneMatrix(prev);
      next.forEach((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          d.hours.forEach((h) => {
            h.active = active;
          });
        }
      });
      recount(next);
      return next;
    });
    setDirty(true);
    setSuccess("");
  };

  const applyPreset = (preset) => {
    setDays((prev) => {
      const next = cloneMatrix(prev);
      next.forEach((d) => {
        if (preset === "weekdays" && WEEKDAYS.includes(d.dayOfWeek)) {
          d.hours.forEach((h) => {
            h.active = true;
          });
        }
        if (preset === "weekend-off" && WEEKEND.includes(d.dayOfWeek)) {
          d.hours.forEach((h) => {
            h.active = false;
          });
        }
        if (preset === "all-on") {
          d.hours.forEach((h) => {
            h.active = true;
          });
        }
        if (preset === "all-off") {
          d.hours.forEach((h) => {
            h.active = false;
          });
        }
      });
      recount(next);
      return next;
    });
    setDirty(true);
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await updateAdminSchedule({ slots: buildSlotsPayload(days) });
      setDays(cloneMatrix(data.days));
      setActiveCount(data.activeSlotsCount ?? 0);
      setDirty(false);
      setSuccess("Planning enregistré. Les patients voient les nouveaux créneaux.");
    } catch {
      setError("Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du planning…" />;
  }

  return (
    <div className="schedule-planner dash-panels">
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
            onClick={load}
            aria-label="Réessayer"
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      )}
      {success && (
        <div className="dash-success-banner" role="status">
          <span>{success}</span>
        </div>
      )}

      <section className="schedule-planner__card dash-card">
        <header className="schedule-planner__header">
          <div className="schedule-planner__intro">
            <h3 className="dash-card__title">Planning des réservations</h3>
            <p className="dash-card__subtitle">
              Définissez les créneaux d’1 h ouverts à la réservation. Les patients
              ne voient que les créneaux actifs.
            </p>
          </div>
          <div className="schedule-planner__stat" aria-label="Créneaux actifs">
            <span className="schedule-planner__stat-value">{activeCount}</span>
            <span className="schedule-planner__stat-label">créneaux actifs</span>
          </div>
        </header>

        <div className="schedule-planner__toolbar">
          <div className="schedule-planner__presets" role="group" aria-label="Actions rapides">
            <button type="button" className="schedule-chip" onClick={() => applyPreset("weekdays")}>
              Lun–Ven ouvert
            </button>
            <button type="button" className="schedule-chip" onClick={() => applyPreset("weekend-off")}>
              Week-end fermé
            </button>
            <button type="button" className="schedule-chip" onClick={() => applyPreset("all-on")}>
              Tout ouvrir
            </button>
            <button type="button" className="schedule-chip" onClick={() => applyPreset("all-off")}>
              Tout fermer
            </button>
          </div>
          <div className="schedule-planner__legends">
            <span className="booking-legend booking-legend--ok">Ouvert</span>
            <span className="booking-legend booking-legend--no">Fermé</span>
          </div>
        </div>

        {/* Mobile & tablette : un jour à la fois */}
        <div className="schedule-planner__mobile">
          <p className="schedule-planner__section-label">Choisir un jour</p>
          <div className="schedule-day-tabs" role="tablist" aria-label="Jours de la semaine">
            {days.map((day, index) => {
              const open = countDayActive(day);
              const total = day.hours.length;
              const isActive = index === selectedDayIndex;
              return (
                <button
                  key={day.dayOfWeek}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`schedule-day-tab${isActive ? " schedule-day-tab--active" : ""}`}
                  onClick={() => setSelectedDayIndex(index)}
                >
                  <span className="schedule-day-tab__name">{day.label}</span>
                  <span className="schedule-day-tab__count">
                    {open}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div
              className="schedule-day-panel"
              role="tabpanel"
              aria-labelledby={`day-tab-${selectedDay.dayOfWeek}`}
            >
              <div className="schedule-day-panel__head">
                <div>
                  <h4 className="schedule-day-panel__title">{selectedDay.label}</h4>
                  <p className="schedule-day-panel__meta">
                    {selectedDayActive} / {selectedDayTotal} créneaux ouverts
                  </p>
                </div>
                <button
                  type="button"
                  className="schedule-day-panel__toggle"
                  onClick={() =>
                    setDayActive(
                      selectedDay.dayOfWeek,
                      !selectedDay.hours.every((h) => h.active),
                    )
                  }
                >
                  {selectedDay.hours.every((h) => h.active) ? "Tout fermer" : "Tout ouvrir"}
                </button>
              </div>
              <DayHoursGrid
                day={selectedDay}
                dayIndex={selectedDayIndex}
                onToggleHour={toggleCell}
              />
            </div>
          )}
        </div>

        {/* Desktop : vue semaine en cartes */}
        <div className="schedule-planner__desktop" aria-label="Planning de la semaine">
          <p className="schedule-planner__section-label">Semaine complète</p>
          <div className="schedule-week">
            {days.map((day, dayIndex) => {
              const open = countDayActive(day);
              const total = day.hours.length;
              const allOpen = day.hours.every((h) => h.active);
              return (
                <article key={day.dayOfWeek} className="schedule-week-day">
                  <header className="schedule-week-day__head">
                    <div>
                      <h4 className="schedule-week-day__name">{day.label}</h4>
                      <span className="schedule-week-day__badge">
                        {open}/{total}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="schedule-week-day__action"
                      onClick={() => setDayActive(day.dayOfWeek, !allOpen)}
                    >
                      {allOpen ? "Fermer" : "Ouvrir"}
                    </button>
                  </header>
                  <DayHoursGrid
                    day={day}
                    dayIndex={dayIndex}
                    onToggleHour={toggleCell}
                  />
                </article>
              );
            })}
          </div>
        </div>

        <footer className="schedule-planner__footer">
          <button
            type="button"
            className="dash-btn dash-btn--primary schedule-planner__save"
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            {saving ? "Enregistrement…" : "Enregistrer le planning"}
          </button>
          {dirty && (
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={load}
              disabled={saving}
            >
              Annuler
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
