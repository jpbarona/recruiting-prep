import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { EnergySelector } from "../components/EnergySelector";
import { MistakeForm } from "../components/MistakeForm";
import { SessionTimer } from "../components/SessionTimer";
import { useAppData } from "../context/AppDataContext";
import { PLANNED_TYPES } from "../lib/constants";
import {
  daysUntilRed,
  formatDisplayDate,
  getPhase,
  isFutureDate,
  isPastDate,
} from "../lib/dates";
import { isTrainingDate } from "../lib/validation";
import type { Energy, PlannedType } from "../types";

export function DayWorkoutPage() {
  const { date = "" } = useParams();
  const {
    loading,
    error,
    getPlanned,
    getSession,
    getWorkout,
    resources,
    completeSession,
    addError,
    updatePlannedType,
  } = useAppData();

  const [energy, setEnergy] = useState<Energy>("Red");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showMistake, setShowMistake] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");

  const planned = getPlanned(date);
  const session = getSession(date);
  const workout = getWorkout(date, energy);
  const phase = planned?.phase ?? getPhase(date);
  const countdown = daysUntilRed(date);

  if (!date) return null;
  if (!isTrainingDate(date)) {
    return <Navigate to="/" replace />;
  }
  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  if (session && !completed) {
    return (
      <div className="day-workout done-view">
        <p className="done-message">
          Done. Stop here unless you genuinely have spare energy.
        </p>
        <p className="muted">
          {formatDisplayDate(date)} · {session.chosen_energy} session completed
        </p>
        <Link to="/free-practice" className="btn">
          Free Practice
        </Link>
        <Link to="/" className="btn btn-ghost">
          Back to Calendar
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="day-workout done-view">
        <p className="done-message">
          Done. Stop here unless you genuinely have spare energy.
        </p>
        <Link to="/free-practice" className="btn">
          Free Practice
        </Link>
        <Link to="/" className="btn btn-ghost">
          Back to Calendar
        </Link>
      </div>
    );
  }

  const refTitles =
    workout?.resource_refs
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const linkedResources = refTitles
    .map((title) => resources.find((r) => r.title === title))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const handleComplete = async () => {
    try {
      await completeSession({
        date,
        phase,
        chosen_energy: energy,
        planned_type: (planned?.planned_type ?? "Flexible") as PlannedType,
        timer_seconds: timerSeconds,
        notes,
      });
      setShowConfirm(false);
      setCompleted(true);
    } catch {
      // Toast + rollback handled in context
    }
  };

  const canEditPlanned = isFutureDate(date);

  return (
    <div className="day-workout">
      <header className="day-header">
        <Link to="/" className="back-link">
          ← Calendar
        </Link>
        <h1>{formatDisplayDate(date)}</h1>
        <p className="phase">{phase}</p>
        <p className="countdown-inline">
          {countdown} day{countdown === 1 ? "" : "s"} to red date
        </p>
      </header>

      <section className="planned-section">
        <p>
          Planned: <strong>{planned?.planned_type ?? "Flexible"}</strong>
        </p>
        {canEditPlanned && planned && (
          <label className="inline-label">
            Change planned type
            <select
              value={planned.planned_type}
              onChange={(e) =>
                void updatePlannedType(date, e.target.value as PlannedType)
              }
            >
              {PLANNED_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
        {isPastDate(date) && (
          <p className="muted small">Past day — planned type is read-only.</p>
        )}
        {planned?.planned_type === "Off" && (
          <p className="off-day-note">
            Planned recovery day. Training is optional.
          </p>
        )}
      </section>

      <EnergySelector value={energy} onChange={setEnergy} />

      {workout ? (
        <section className="workout-tasks">
          <h2>{workout.title}</h2>
          <p className="muted">~{workout.estimated_minutes} min</p>
          <ol>
            {workout.tasks.map((task, i) => (
              <li key={i}>{task}</li>
            ))}
          </ol>
          {linkedResources.length > 0 && (
            <div className="workout-resources">
              <p className="resource-label">Resources</p>
              {linkedResources.map((r) => (
                <a
                  key={r.title}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link"
                >
                  {r.title}
                </a>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="status">No workout found for this day and energy.</p>
      )}

      <SessionTimer onElapsedChange={setTimerSeconds} />

      <label className="notes-label">
        Session notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </label>

      <div className="day-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowMistake(true)}
        >
          Log Mistake
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowConfirm(true)}
        >
          Complete Session
        </button>
      </div>

      {showMistake && (
        <div className="modal-overlay">
          <div className="modal">
            <MistakeForm
              defaultSource={`Day workout · ${date}`}
              onCancel={() => setShowMistake(false)}
              onSave={async (entry) => {
                await addError({
                  date: entry.date,
                  source: entry.source,
                  topic: entry.topic,
                  mistake_type: entry.mistake_type,
                  lesson: entry.lesson,
                  retry_date: entry.retry_date,
                  notes: entry.notes,
                });
                setShowMistake(false);
              }}
            />
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <p>Confirm you actually completed this session?</p>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleComplete()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
