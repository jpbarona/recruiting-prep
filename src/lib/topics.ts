import type { TopicProgress } from "../types";

export const TOPIC_SCHEDULE_START = "2026-06-07";

export const TOPICS = [
  "Combinatorics",
  "Conditional EV",
  "Conditional probability",
  "Continuous random variables",
  "Discrete random variables",
  "Brain teasers",
] as const;

export function getCurrentTopicIndex(
  progress: TopicProgress[],
  asOfDate: string
): number {
  let count = 0;
  for (const topic of TOPICS) {
    const entry = progress.find((p) => p.topic === topic);
    if (entry?.ready_date && entry.ready_date <= asOfDate) {
      count++;
    } else {
      break;
    }
  }
  return Math.min(count, TOPICS.length - 1);
}

export function getTopicForDate(
  progress: TopicProgress[],
  date: string
): { current: string; upNext: string[] } | null {
  if (date < TOPIC_SCHEDULE_START) return null;
  const index = getCurrentTopicIndex(progress, date);
  return {
    current: TOPICS[index],
    upNext: TOPICS.slice(index + 1),
  };
}

export function getReadyTopicsForMixed(
  progress: TopicProgress[],
  asOfDate: string
): string[] {
  return TOPICS.filter((topic) => {
    const entry = progress.find((p) => p.topic === topic);
    return Boolean(entry?.ready_date && entry.ready_date <= asOfDate);
  });
}

export function pickMixedTopic(readyTopics: string[]): string | null {
  if (readyTopics.length === 0) return null;
  return readyTopics[Math.floor(Math.random() * readyTopics.length)];
}
