import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { enumerateTrainingDates, formatDisplayDate, isToday, todayString } from "../lib/dates";
import type { Energy, PlannedType } from "../types";

function completionClass(energy?: Energy, planned?: PlannedType): string {
  if (energy) return `completed-${energy.toLowerCase()}`;
  if (planned === "Off") return "planned-off";
  return "not-completed";
}

export function CalendarPage() {
  const { loading, error, getPlanned, getSession, getTopicForDate, plannedDays, updatePlannedType } =
    useAppData();
  const dates = enumerateTrainingDates();
  const today = todayString();

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div className="calendar-page">
      <p className="page-intro">
        Training period · click any day to open its workout
      </p>
      <div className="calendar-grid">
        {dates.map((date) => {
          const planned = getPlanned(date);
          const session = getSession(date);
          const topicInfo = getTopicForDate(date);
          const isFuture = date > today;
          const isPast = date < today;
          const cellClass = [
            "calendar-cell",
            completionClass(session?.chosen_energy, planned?.planned_type),
            isToday(date) ? "is-today" : "",
            isPast ? "is-past" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={date} className={cellClass}>
              <Link to={`/day/${date}`} className="cell-link">
                <span className="cell-date">{formatDisplayDate(date)}</span>
                <span className="cell-phase">{planned?.phase}</span>
                {topicInfo && (
                  <span className="cell-topic">{topicInfo.current}</span>
                )}
                {planned?.planned_type && planned.planned_type !== "Flexible" && (
                  <span className="cell-planned">{planned.planned_type}</span>
                )}
                {session && (
                  <span className="cell-done">{session.chosen_energy} done</span>
                )}
              </Link>
              {isFuture && planned && (
                <select
                  className="planned-select"
                  value={planned.planned_type}
                  onChange={(e) =>
                    void updatePlannedType(
                      date,
                      e.target.value as PlannedType
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Flexible">Flexible</option>
                  <option value="Off">Off</option>
                  <option value="Red">Red</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Green">Green</option>
                </select>
              )}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span className="legend-item completed-red">Red session</span>
        <span className="legend-item completed-yellow">Yellow session</span>
        <span className="legend-item completed-green">Green session</span>
        <span className="legend-item planned-off">Planned off</span>
        <span className="legend-item not-completed">Not completed</span>
      </div>
      {!plannedDays.length && (
        <p className="muted">No planned days loaded.</p>
      )}
    </div>
  );
}
