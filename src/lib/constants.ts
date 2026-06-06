export const TRAINING_START = "2026-06-03";
export const RED_DATE = "2026-07-20";

export const MISTAKE_TYPES = [
  "Arithmetic",
  "Counting/combinatorics",
  "Conditional probability",
  "Expected value",
  "Bayes",
  "Variance/distribution",
  "Game strategy",
  "Market making",
  "Explanation unclear",
  "Time pressure",
  "Other",
] as const;

export const ERROR_STATUSES = ["Open", "Retry Due", "Resolved"] as const;

export const PLANNED_TYPES = [
  "Flexible",
  "Off",
  "Red",
  "Yellow",
  "Green",
] as const;

export type CsvFile =
  | "workouts"
  | "sessions"
  | "errors"
  | "resources"
  | "planned-days"
  | "free-practice"
  | "topic-progress";
