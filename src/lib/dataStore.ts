import type {
  ErrorEntry,
  FreePracticeItem,
  PlannedDay,
  Resource,
  Session,
  TopicProgress,
  Workout,
} from "../types";
import { fetchCsv, parseCsv, saveCsv, serializeCsv } from "./csv";
import {
  isEnergy,
  isErrorStatus,
  isIsoDateString,
  isPlannedType,
} from "./validation";
import { TOPICS } from "./topics";

export interface LoadAllDataResult {
  workouts: Workout[];
  plannedDays: PlannedDay[];
  sessions: Session[];
  errors: ErrorEntry[];
  resources: Resource[];
  freePractice: FreePracticeItem[];
  topicProgress: TopicProgress[];
  warnings: string[];
}

function mapWorkouts(
  rows: Record<string, string>[],
  warnings: string[]
): Workout[] {
  const out: Workout[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!isIsoDateString(r.date ?? "")) {
      warnings.push(`workouts.csv row ${rowNum}: invalid date`);
      continue;
    }
    const energy = r.energy ?? "";
    if (!isEnergy(energy)) {
      warnings.push(`workouts.csv row ${rowNum}: invalid energy`);
      continue;
    }
    if (!r.title?.trim()) {
      warnings.push(`workouts.csv row ${rowNum}: missing title`);
      continue;
    }
    out.push({
      date: r.date,
      phase: r.phase ?? "",
      energy,
      title: r.title,
      estimated_minutes: Number(r.estimated_minutes) || 0,
      tasks: r.tasks ? r.tasks.split("|") : [],
      resource_refs: r.resource_refs ?? "",
    });
  }
  return out;
}

function mapPlanned(
  rows: Record<string, string>[],
  warnings: string[]
): PlannedDay[] {
  const out: PlannedDay[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!isIsoDateString(r.date ?? "")) {
      warnings.push(`planned-days.csv row ${rowNum}: invalid date`);
      continue;
    }
    const plannedType = r.planned_type ?? "";
    if (!isPlannedType(plannedType)) {
      warnings.push(`planned-days.csv row ${rowNum}: invalid planned_type`);
      continue;
    }
    out.push({
      date: r.date,
      phase: r.phase ?? "",
      planned_type: plannedType,
    });
  }
  return out;
}

function mapSessions(
  rows: Record<string, string>[],
  warnings: string[]
): Session[] {
  const out: Session[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!isIsoDateString(r.date ?? "")) {
      warnings.push(`sessions.csv row ${rowNum}: invalid date`);
      continue;
    }
    const chosenEnergy = r.chosen_energy ?? "";
    const plannedType = r.planned_type ?? "";
    if (!isEnergy(chosenEnergy)) {
      warnings.push(`sessions.csv row ${rowNum}: invalid chosen_energy`);
      continue;
    }
    if (!isPlannedType(plannedType)) {
      warnings.push(`sessions.csv row ${rowNum}: invalid planned_type`);
      continue;
    }
    if (!r.completed_at?.trim()) {
      warnings.push(`sessions.csv row ${rowNum}: missing completed_at`);
      continue;
    }
    out.push({
      date: r.date,
      phase: r.phase ?? "",
      chosen_energy: chosenEnergy,
      planned_type: plannedType,
      completed_at: r.completed_at,
      timer_seconds: Number(r.timer_seconds) || 0,
      notes: r.notes ?? "",
    });
  }
  return out;
}

function mapErrors(
  rows: Record<string, string>[],
  warnings: string[]
): ErrorEntry[] {
  const out: ErrorEntry[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.id?.trim()) {
      warnings.push(`errors.csv row ${rowNum}: missing id`);
      continue;
    }
    if (!isIsoDateString(r.date ?? "")) {
      warnings.push(`errors.csv row ${rowNum}: invalid date`);
      continue;
    }
    if (!r.source?.trim() || !r.mistake_type?.trim() || !r.lesson?.trim()) {
      warnings.push(`errors.csv row ${rowNum}: missing required fields`);
      continue;
    }
    const status = r.status?.trim() || "Open";
    if (!isErrorStatus(status)) {
      warnings.push(`errors.csv row ${rowNum}: invalid status`);
      continue;
    }
    if (r.retry_date?.trim() && !isIsoDateString(r.retry_date)) {
      warnings.push(`errors.csv row ${rowNum}: invalid retry_date`);
      continue;
    }
    out.push({
      id: r.id,
      date: r.date,
      source: r.source,
      topic: r.topic ?? "",
      mistake_type: r.mistake_type,
      lesson: r.lesson,
      retry_date: r.retry_date ?? "",
      status,
      notes: r.notes ?? "",
    });
  }
  return out;
}

function mapResources(
  rows: Record<string, string>[],
  warnings: string[]
): Resource[] {
  const out: Resource[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.title?.trim() || !r.category?.trim()) {
      warnings.push(`resources.csv row ${rowNum}: missing title or category`);
      continue;
    }
    out.push({
      category: r.category,
      title: r.title,
      description: r.description ?? "",
      url: r.url ?? "",
    });
  }
  return out;
}

function mapTopicProgress(
  rows: Record<string, string>[],
  warnings: string[]
): TopicProgress[] {
  const out: TopicProgress[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.topic?.trim()) {
      warnings.push(`topic-progress.csv row ${rowNum}: missing topic`);
      continue;
    }
    const readyDate = r.ready_date?.trim() ?? "";
    if (readyDate && !isIsoDateString(readyDate)) {
      warnings.push(`topic-progress.csv row ${rowNum}: invalid ready_date`);
      continue;
    }
    out.push({
      topic: r.topic,
      ready_date: readyDate,
    });
  }
  return out;
}

function seedTopicProgress(): TopicProgress[] {
  return TOPICS.map((topic) => ({ topic, ready_date: "" }));
}

function mapFreePractice(
  rows: Record<string, string>[],
  warnings: string[]
): FreePracticeItem[] {
  const out: FreePracticeItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.title?.trim() || !r.category?.trim()) {
      warnings.push(`free-practice.csv row ${rowNum}: missing title or category`);
      continue;
    }
    out.push({
      category: r.category,
      title: r.title,
      description: r.description ?? "",
      url: r.url ?? "",
      suggested_minutes: r.suggested_minutes ?? "",
    });
  }
  return out;
}

export async function loadAllData(): Promise<LoadAllDataResult> {
  const warnings: string[] = [];

  const [workoutsText, plannedText, sessionsText, errorsText, resourcesText, freeText, topicText] =
    await Promise.all([
      fetchCsv("workouts"),
      fetchCsv("planned-days"),
      fetchCsv("sessions"),
      fetchCsv("errors"),
      fetchCsv("resources"),
      fetchCsv("free-practice"),
      fetchCsv("topic-progress"),
    ]);

  const workoutsParsed = parseCsv(workoutsText, "workouts.csv");
  const plannedParsed = parseCsv(plannedText, "planned-days.csv");
  const sessionsParsed = parseCsv(sessionsText, "sessions.csv");
  const errorsParsed = parseCsv(errorsText, "errors.csv");
  const resourcesParsed = parseCsv(resourcesText, "resources.csv");
  const freeParsed = parseCsv(freeText, "free-practice.csv");
  const topicParsed = parseCsv(topicText, "topic-progress.csv");

  warnings.push(
    ...workoutsParsed.warnings,
    ...plannedParsed.warnings,
    ...sessionsParsed.warnings,
    ...errorsParsed.warnings,
    ...resourcesParsed.warnings,
    ...freeParsed.warnings,
    ...topicParsed.warnings
  );

  const workouts = mapWorkouts(workoutsParsed.rows, warnings);
  const plannedDays = mapPlanned(plannedParsed.rows, warnings);
  const sessions = mapSessions(sessionsParsed.rows, warnings);
  const errors = mapErrors(errorsParsed.rows, warnings);
  const resources = mapResources(resourcesParsed.rows, warnings);
  const freePractice = mapFreePractice(freeParsed.rows, warnings);
  const topicProgress = mapTopicProgress(topicParsed.rows, warnings);

  if (!workouts.length) {
    throw new Error("workouts.csv has no valid rows");
  }
  if (!plannedDays.length) {
    throw new Error("planned-days.csv has no valid rows");
  }

  return {
    workouts,
    plannedDays,
    sessions,
    errors,
    resources,
    freePractice,
    topicProgress: topicProgress.length ? topicProgress : seedTopicProgress(),
    warnings,
  };
}

export async function saveSessions(sessions: Session[]) {
  await saveCsv(
    "sessions",
    serializeCsv(sessions, [
      "date",
      "phase",
      "chosen_energy",
      "planned_type",
      "completed_at",
      "timer_seconds",
      "notes",
    ])
  );
}

export async function savePlannedDays(plannedDays: PlannedDay[]) {
  await saveCsv(
    "planned-days",
    serializeCsv(plannedDays, ["date", "phase", "planned_type"])
  );
}

export async function saveErrors(errors: ErrorEntry[]) {
  await saveCsv(
    "errors",
    serializeCsv(errors, [
      "id",
      "date",
      "source",
      "topic",
      "mistake_type",
      "lesson",
      "retry_date",
      "status",
      "notes",
    ])
  );
}

export async function saveTopicProgress(topicProgress: TopicProgress[]) {
  await saveCsv(
    "topic-progress",
    serializeCsv(topicProgress, ["topic", "ready_date"])
  );
}

export function nextErrorId(errors: ErrorEntry[]): string {
  const nums = errors
    .map((e) => Number(e.id))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1);
}
