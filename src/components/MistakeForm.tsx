import { useState, type FormEvent } from "react";
import { MISTAKE_TYPES } from "../lib/constants";
import { todayString } from "../lib/dates";
import type { ErrorEntry } from "../types";

interface MistakeFormProps {
  defaultSource?: string;
  initial?: ErrorEntry;
  onSave: (entry: Omit<ErrorEntry, "id"> & { id?: string }) => void | Promise<void>;
  onCancel: () => void;
}

export function MistakeForm({
  defaultSource = "Day workout",
  initial,
  onSave,
  onCancel,
}: MistakeFormProps) {
  const [source, setSource] = useState(initial?.source ?? defaultSource);
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [mistakeType, setMistakeType] = useState(initial?.mistake_type ?? "");
  const [lesson, setLesson] = useState(initial?.lesson ?? "");
  const [retryDate, setRetryDate] = useState(initial?.retry_date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [status, setStatus] = useState<ErrorEntry["status"]>(
    initial?.status ?? "Open"
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !mistakeType || !lesson.trim()) return;
    await onSave({
      id: initial?.id,
      date,
      source: source.trim(),
      topic: topic.trim(),
      mistake_type: mistakeType,
      lesson: lesson.trim(),
      retry_date: retryDate,
      status,
      notes: notes.trim(),
    });
  };

  return (
    <form className="mistake-form" onSubmit={handleSubmit}>
      <h3>{initial ? "Edit error" : "Log mistake"}</h3>
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Source <span className="required">*</span>
        <input value={source} onChange={(e) => setSource(e.target.value)} required />
      </label>
      <label>
        Topic
        <input value={topic} onChange={(e) => setTopic(e.target.value)} />
      </label>
      <label>
        Mistake type <span className="required">*</span>
        <select
          value={mistakeType}
          onChange={(e) => setMistakeType(e.target.value)}
          required
        >
          <option value="">Select…</option>
          {MISTAKE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        Lesson <span className="required">*</span>
        <textarea
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          rows={2}
          required
        />
      </label>
      <label>
        Retry date
        <input
          type="date"
          value={retryDate}
          onChange={(e) => setRetryDate(e.target.value)}
        />
      </label>
      {initial && (
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ErrorEntry["status"])}
          >
            <option value="Open">Open</option>
            <option value="Retry Due">Retry Due</option>
            <option value="Resolved">Resolved</option>
          </select>
        </label>
      )}
      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
