import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MistakeForm } from "../components/MistakeForm";
import { useAppData } from "../context/AppDataContext";
import { ERROR_STATUSES, MISTAKE_TYPES } from "../lib/constants";
import { formatDisplayDate, todayString } from "../lib/dates";
import type { ErrorEntry, ErrorStatus } from "../types";

function isRetryDue(entry: ErrorEntry): boolean {
  if (entry.status === "Retry Due") return true;
  if (!entry.retry_date) return false;
  return entry.retry_date <= todayString() && entry.status === "Open";
}

export function ErrorsPage() {
  const { loading, error, errors, addError, updateError } = useAppData();
  const [searchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ErrorEntry | null>(null);

  const filtered = useMemo(() => {
    return errors
      .filter((e) => !typeFilter || e.mistake_type === typeFilter)
      .filter((e) => {
        if (!statusFilter) return true;
        if (statusFilter === "Retry Due") return isRetryDue(e);
        return e.status === statusFilter;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [errors, typeFilter, statusFilter]);

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div className="errors-page">
      <div className="page-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add error
        </button>
        <label>
          Mistake type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            {MISTAKE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {ERROR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="error-list">
        {filtered.map((entry) => (
          <li key={entry.id} className={`error-card status-${entry.status.replace(/\s/g, "-").toLowerCase()}`}>
            <div className="error-card-header">
              <span>{formatDisplayDate(entry.date)}</span>
              <span className="badge">{entry.status}</span>
              {isRetryDue(entry) && entry.status !== "Retry Due" && (
                <span className="badge badge-retry">Retry due</span>
              )}
            </div>
            <p>
              <strong>{entry.mistake_type}</strong>
              {entry.topic && ` · ${entry.topic}`}
            </p>
            <p className="error-source">{entry.source}</p>
            <p>{entry.lesson}</p>
            {entry.retry_date && (
              <p className="muted">Retry: {formatDisplayDate(entry.retry_date)}</p>
            )}
            {entry.notes && <p className="muted">{entry.notes}</p>}
            <div className="error-actions">
              <button
                type="button"
                className="btn btn-small btn-ghost"
                onClick={() => setEditing(entry)}
              >
                Edit
              </button>
              {entry.status !== "Resolved" && (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() =>
                    void updateError({ ...entry, status: "Resolved" })
                  }
                >
                  Mark resolved
                </button>
              )}
              {entry.status === "Open" && (
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() =>
                    void updateError({ ...entry, status: "Retry Due" as ErrorStatus })
                  }
                >
                  Mark retry due
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!filtered.length && <p className="muted">No errors match these filters.</p>}

      {(showForm || editing) && (
        <div className="modal-overlay">
          <div className="modal">
            <MistakeForm
              initial={editing ?? undefined}
              defaultSource="Manual log"
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSave={async (entry) => {
                if (editing) {
                  await updateError({
                    id: editing.id,
                    date: entry.date,
                    source: entry.source,
                    topic: entry.topic,
                    mistake_type: entry.mistake_type,
                    lesson: entry.lesson,
                    retry_date: entry.retry_date,
                    status: entry.status ?? editing.status,
                    notes: entry.notes,
                  });
                } else {
                  await addError({
                    date: entry.date,
                    source: entry.source,
                    topic: entry.topic,
                    mistake_type: entry.mistake_type,
                    lesson: entry.lesson,
                    retry_date: entry.retry_date,
                    notes: entry.notes,
                  });
                }
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
