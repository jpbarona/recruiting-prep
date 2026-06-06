import type { Energy } from "../types";

interface EnergySelectorProps {
  value: Energy;
  onChange: (energy: Energy) => void;
}

const options: { value: Energy; label: string; hint: string }[] = [
  { value: "Red", label: "Red", hint: "Minimum viable day" },
  { value: "Yellow", label: "Yellow", hint: "Normal training" },
  { value: "Green", label: "Green", hint: "Hard training" },
];

export function EnergySelector({ value, onChange }: EnergySelectorProps) {
  return (
    <section className="energy-section">
      <h2>Choose today&apos;s energy.</h2>
      <p className="muted">Red counts. Do the minimum. Protect the habit.</p>
      <div className="energy-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`energy-btn energy-${opt.value.toLowerCase()}${value === opt.value ? " selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="energy-label">{opt.label}</span>
            <span className="energy-hint">{opt.hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
