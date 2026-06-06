import { Navigate } from "react-router-dom";
import { TRAINING_START, RED_DATE } from "../lib/constants";
import { formatDisplayDate, todayString } from "../lib/dates";

export function TodayPage() {
  const today = todayString();

  if (today < TRAINING_START) {
    return (
      <div className="message-page">
        <p>Training starts on {formatDisplayDate(TRAINING_START)}.</p>
      </div>
    );
  }

  if (today > RED_DATE) {
    return (
      <div className="message-page">
        <p>Red date has passed. Review mode only.</p>
      </div>
    );
  }

  return <Navigate to={`/day/${today}`} replace />;
}
