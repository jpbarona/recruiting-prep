import { ERROR_STATUSES, PLANNED_TYPES, RED_DATE, TRAINING_START } from "./constants";
import type { Energy, ErrorStatus, PlannedType } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` === value;
}

export function isTrainingDate(value: string): boolean {
  return isIsoDateString(value) && value >= TRAINING_START && value <= RED_DATE;
}

export function isEnergy(value: string): value is Energy {
  return value === "Red" || value === "Yellow" || value === "Green";
}

export function isPlannedType(value: string): value is PlannedType {
  return (PLANNED_TYPES as readonly string[]).includes(value);
}

export function isErrorStatus(value: string): value is ErrorStatus {
  return (ERROR_STATUSES as readonly string[]).includes(value);
}
