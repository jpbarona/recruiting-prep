import { useEffect, useRef, useState } from "react";

interface SessionTimerProps {
  onElapsedChange: (seconds: number) => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionTimer({ onElapsedChange }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    onElapsedChange(elapsed);
  }, [elapsed, onElapsedChange]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startedAt.current !== null) {
        const next = accumulated.current + Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(next);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    if (running) return;
    startedAt.current = Date.now();
    setRunning(true);
  };

  const pause = () => {
    if (!running || startedAt.current === null) return;
    accumulated.current += Math.floor((Date.now() - startedAt.current) / 1000);
    startedAt.current = null;
    setElapsed(accumulated.current);
    setRunning(false);
  };

  const reset = () => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsed(0);
    setRunning(false);
  };

  return (
    <div className="session-timer">
      <p className="timer-label">Session timer</p>
      <p className="timer-display">{formatElapsed(elapsed)}</p>
      <div className="timer-actions">
        <button type="button" className="btn" onClick={start} disabled={running}>
          Start
        </button>
        <button type="button" className="btn" onClick={pause} disabled={!running}>
          Pause
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
