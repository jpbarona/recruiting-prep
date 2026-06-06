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
import { pickMixedTopic } from "../lib/topics";
import { isTrainingDate } from "../lib/validation";
import type { Energy, PlannedType } from "../types";

const QUANT_QUESTIONS_URL = "https://quantquestions.io/problems";

function TopicSection({
  current,
  upNext,
}: {
  current: string;
  upNext: string[];
}) {
  return (
    <section className="topic-section">
      <p className="topic-current">
        Topic: <strong>{current}</strong>
      </p>
      {upNext.length > 0 && (
        <p className="topic-up-next muted small">
          Up next: {upNext.join(" → ")}
        </p>
      )}
    </section>
  );
}

function DoneView({
  date,
  sessionEnergy,
}: {
  date: string;
  sessionEnergy?: Energy;
}) {
  const {
    getTopicForDate,
    getReadyTopics,
    isTopicReady,
    markTopicReady,
  } = useAppData();
  const [mixedTopic, setMixedTopic] = useState<string | null>(null);

  const topicInfo = getTopicForDate(date);
  const readyTopics = getReadyTopics(date);
  const showTopicControls = topicInfo !== null;
  const currentReady = topicInfo ? isTopicReady(topicInfo.current) : false;

  const handleMixedRotation = () => {
    setMixedTopic(pickMixedTopic(readyTopics));
  };

  return (
    <div className="day-workout done-view">
      {topicInfo && <TopicSection current={topicInfo.current} upNext={topicInfo.upNext} />}
      <p className="done-message">
        Done. Stop here unless you genuinely have spare energy.
      </p>
      {sessionEnergy && (
        <p className="muted">
          {formatDisplayDate(date)} · {sessionEnergy} session completed
        </p>
      )}
      {showTopicControls && !currentReady && (
        <button
          type="button"
          className="btn"
          onClick={() => void markTopicReady(topicInfo!.current, date)}
        >
          Mark &ldquo;{topicInfo!.current}&rdquo; ready for mixed rotation
        </button>
      )}
      {showTopicControls && (
        <div className="mixed-rotation">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={readyTopics.length === 0}
            onClick={handleMixedRotation}
          >
            Mixed rotation
          </button>
          {mixedTopic && (
            <p className="mixed-topic-result muted">
              Practice: <strong>{mixedTopic}</strong>
            </p>
          )}
        </div>
      )}
      <a
        href={QUANT_QUESTIONS_URL}
        target="_blank"
        rel="noreferrer"
        className="btn"
      >
        QuantQuestions
      </a>
      <Link to="/" className="btn btn-ghost">
        Back to Calendar
      </Link>
    </div>
  );
}

export function DayWorkoutPage() {
  const { date = "" } = useParams();
  const {
    loading,
    error,
    getPlanned,
    getSession,
    getWorkout,
    getTopicForDate,
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
  const topicInfo = getTopicForDate(date);
  const phase = planned?.phase ?? getPhase(date);
  const countdown = daysUntilRed(date);

  if (!date) return null;
  if (!isTrainingDate(date)) {
    return <Navigate to="/" replace />;
  }
  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  if (session && !completed) {
    return <DoneView date={date} sessionEnergy={session.chosen_energy} />;
  }

  if (completed) {
    return <DoneView date={date} />;
  }

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

      {topicInfo && (
        <TopicSection current={topicInfo.current} upNext={topicInfo.upNext} />
      )}

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
          <a
            href={QUANT_QUESTIONS_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-small"
          >
            QuantQuestions
          </a>
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
