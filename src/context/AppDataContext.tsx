import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadAllData,
  nextErrorId,
  saveErrors,
  savePlannedDays,
  saveSessions,
  saveTopicProgress,
} from "../lib/dataStore";
import {
  getReadyTopicsForMixed,
  getTopicForDate as resolveTopicForDate,
} from "../lib/topics";
import type {
  ErrorEntry,
  FreePracticeItem,
  PlannedDay,
  PlannedType,
  Resource,
  Session,
  TopicProgress,
  Workout,
} from "../types";
import type { Energy } from "../types";
import { useToast } from "./ToastContext";

interface AppData {
  workouts: Workout[];
  plannedDays: PlannedDay[];
  sessions: Session[];
  errors: ErrorEntry[];
  resources: Resource[];
  freePractice: FreePracticeItem[];
  topicProgress: TopicProgress[];
  loading: boolean;
  error: string | null;
  loadWarnings: string[];
  reload: () => Promise<void>;
  getPlanned: (date: string) => PlannedDay | undefined;
  updatePlannedType: (date: string, plannedType: PlannedType) => Promise<void>;
  completeSession: (session: Omit<Session, "completed_at"> & { notes?: string }) => Promise<void>;
  addError: (entry: Omit<ErrorEntry, "id" | "status"> & { status?: ErrorEntry["status"] }) => Promise<void>;
  updateError: (entry: ErrorEntry) => Promise<void>;
  getSession: (date: string) => Session | undefined;
  getWorkout: (date: string, energy: Energy) => Workout | undefined;
  markTopicReady: (topic: string, date: string) => Promise<void>;
  getTopicForDate: (date: string) => { current: string; upNext: string[] } | null;
  getReadyTopics: (date: string) => string[];
  isTopicReady: (topic: string) => boolean;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plannedDays, setPlannedDays] = useState<PlannedDay[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [freePractice, setFreePractice] = useState<FreePracticeItem[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadWarnings([]);
    try {
      const data = await loadAllData();
      setWorkouts(data.workouts);
      setPlannedDays(data.plannedDays);
      setSessions(data.sessions);
      setErrors(data.errors);
      setResources(data.resources);
      setFreePractice(data.freePractice);
      setTopicProgress(data.topicProgress);
      setLoadWarnings(data.warnings);
      if (data.warnings.length > 0) {
        toast.showInfo(
          `Loaded with ${data.warnings.length} CSV warning(s). Check banner for details.`
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load data";
      setError(message);
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = useCallback(
    async <T,>(
      label: string,
      previous: T,
      next: T,
      apply: (value: T) => void,
      save: (value: T) => Promise<void>
    ) => {
      apply(next);
      try {
        await save(next);
      } catch (e) {
        apply(previous);
        const message =
          e instanceof Error ? e.message : `Could not save ${label}`;
        toast.showError(message);
        throw e;
      }
    },
    [toast]
  );

  const getPlanned = useCallback(
    (date: string) => plannedDays.find((p) => p.date === date),
    [plannedDays]
  );

  const getSession = useCallback(
    (date: string) => sessions.find((s) => s.date === date),
    [sessions]
  );

  const getWorkout = useCallback(
    (date: string, energy: Energy) =>
      workouts.find((w) => w.date === date && w.energy === energy),
    [workouts]
  );

  const updatePlannedType = useCallback(
    async (date: string, plannedType: PlannedType) => {
      const previous = plannedDays;
      const next = plannedDays.map((p) =>
        p.date === date ? { ...p, planned_type: plannedType } : p
      );
      await persist("planned days", previous, next, setPlannedDays, savePlannedDays);
    },
    [plannedDays, persist]
  );

  const completeSession = useCallback(
    async (
      partial: Omit<Session, "completed_at"> & { notes?: string }
    ) => {
      const session: Session = {
        ...partial,
        notes: partial.notes ?? "",
        completed_at: new Date().toISOString(),
      };
      const previous = sessions;
      const next = [
        ...sessions.filter((s) => s.date !== session.date),
        session,
      ];
      await persist("session", previous, next, setSessions, saveSessions);
      toast.showSuccess("Session saved.");
    },
    [sessions, persist, toast]
  );

  const addError = useCallback(
    async (
      entry: Omit<ErrorEntry, "id" | "status"> & { status?: ErrorEntry["status"] }
    ) => {
      const newEntry: ErrorEntry = {
        ...entry,
        id: nextErrorId(errors),
        status: entry.status ?? "Open",
        topic: entry.topic ?? "",
        retry_date: entry.retry_date ?? "",
        notes: entry.notes ?? "",
      };
      const previous = errors;
      const next = [...errors, newEntry];
      await persist("errors", previous, next, setErrors, saveErrors);
      toast.showSuccess("Mistake logged.");
    },
    [errors, persist, toast]
  );

  const updateError = useCallback(
    async (entry: ErrorEntry) => {
      const previous = errors;
      const next = errors.map((e) => (e.id === entry.id ? entry : e));
      await persist("errors", previous, next, setErrors, saveErrors);
      toast.showSuccess("Error updated.");
    },
    [errors, persist, toast]
  );

  const markTopicReady = useCallback(
    async (topic: string, readyDate: string) => {
      const previous = topicProgress;
      const next = topicProgress.map((p) =>
        p.topic === topic ? { ...p, ready_date: readyDate } : p
      );
      await persist(
        "topic progress",
        previous,
        next,
        setTopicProgress,
        saveTopicProgress
      );
      toast.showSuccess(`${topic} marked ready for mixed rotation.`);
    },
    [topicProgress, persist, toast]
  );

  const getTopicForDate = useCallback(
    (date: string) => resolveTopicForDate(topicProgress, date),
    [topicProgress]
  );

  const getReadyTopics = useCallback(
    (date: string) => getReadyTopicsForMixed(topicProgress, date),
    [topicProgress]
  );

  const isTopicReady = useCallback(
    (topic: string) =>
      Boolean(topicProgress.find((p) => p.topic === topic)?.ready_date),
    [topicProgress]
  );

  const value = useMemo(
    () => ({
      workouts,
      plannedDays,
      sessions,
      errors,
      resources,
      freePractice,
      topicProgress,
      loading,
      error,
      loadWarnings,
      reload,
      getPlanned,
      updatePlannedType,
      completeSession,
      addError,
      updateError,
      getSession,
      getWorkout,
      markTopicReady,
      getTopicForDate,
      getReadyTopics,
      isTopicReady,
    }),
    [
      workouts,
      plannedDays,
      sessions,
      errors,
      resources,
      freePractice,
      topicProgress,
      loading,
      error,
      loadWarnings,
      reload,
      getPlanned,
      updatePlannedType,
      completeSession,
      addError,
      updateError,
      getSession,
      getWorkout,
      markTopicReady,
      getTopicForDate,
      getReadyTopics,
      isTopicReady,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
