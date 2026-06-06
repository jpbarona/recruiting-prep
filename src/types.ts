export type Energy = "Red" | "Yellow" | "Green";
export type PlannedType = "Flexible" | "Off" | "Red" | "Yellow" | "Green";
export type ErrorStatus = "Open" | "Retry Due" | "Resolved";

export interface Workout {
  date: string;
  phase: string;
  energy: Energy;
  title: string;
  estimated_minutes: number;
  tasks: string[];
  resource_refs: string;
}

export interface PlannedDay {
  date: string;
  phase: string;
  planned_type: PlannedType;
}

export interface Session {
  date: string;
  phase: string;
  chosen_energy: Energy;
  planned_type: PlannedType;
  completed_at: string;
  timer_seconds: number;
  notes: string;
}

export interface ErrorEntry {
  id: string;
  date: string;
  source: string;
  topic: string;
  mistake_type: string;
  lesson: string;
  retry_date: string;
  status: ErrorStatus;
  notes: string;
}

export interface Resource {
  category: string;
  title: string;
  description: string;
  url: string;
}

export interface FreePracticeItem {
  category: string;
  title: string;
  description: string;
  url: string;
  suggested_minutes: string;
}
