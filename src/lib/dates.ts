import { RED_DATE, TRAINING_START } from "./constants";

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

export function formatDisplayDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isInTrainingRange(dateStr: string): boolean {
  return dateStr >= TRAINING_START && dateStr <= RED_DATE;
}

export function enumerateTrainingDates(): string[] {
  const dates: string[] = [];
  const start = parseDate(TRAINING_START);
  const end = parseDate(RED_DATE);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export function daysUntilRed(fromDateStr: string): number {
  const from = parseDate(fromDateStr);
  const red = parseDate(RED_DATE);
  const ms = red.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getPhase(dateStr: string): string {
  const d = parseDate(dateStr);
  if (d < parseDate("2026-06-09")) return "Soft Ramp";
  if (d < parseDate("2026-06-23")) return "Foundations";
  if (d < parseDate("2026-07-07")) return "Interview Fluency";
  return "Pressure and Readiness";
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < todayString();
}

export function isFutureDate(dateStr: string): boolean {
  return dateStr > todayString();
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayString();
}
