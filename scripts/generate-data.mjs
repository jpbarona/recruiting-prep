import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const START = new Date(2026, 5, 3);
const END = new Date(2026, 6, 20);

const OFF_DAYS = new Set([
  "2026-06-07",
  "2026-06-14",
  "2026-06-21",
  "2026-06-28",
  "2026-07-05",
  "2026-07-12",
  "2026-07-19",
]);

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPhase(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const june3 = new Date(2026, 5, 3);
  const june9 = new Date(2026, 5, 9);
  const june23 = new Date(2026, 5, 23);
  const july7 = new Date(2026, 6, 7);
  if (d < june9) return "Soft Ramp";
  if (d < june23) return "Foundations";
  if (d < july7) return "Interview Fluency";
  return "Pressure and Readiness";
}

const WORKOUTS_BY_PHASE = {
  "Soft Ramp": {
    Red: {
      title: "Soft Ramp — Red",
      minutes: 15,
      tasks: [
        "10 min mental math",
        "Read today's task list",
        "Stop",
      ],
      refs: "TraderMath,Zetamac",
    },
    Yellow: {
      title: "Soft Ramp — Yellow",
      minutes: 25,
      tasks: [
        "10 min mental math",
        "1 easy probability question",
        "Log any mistake",
        "Stop",
      ],
      refs: "QuantGuide Trader 75,QuantQuestions",
    },
    Green: {
      title: "Soft Ramp — Green",
      minutes: 35,
      tasks: [
        "15 min mental math",
        "2 easy probability questions",
        "Explain 1 solution aloud",
        "Stop",
      ],
      refs: "QuantGuide Trader 75,Jane Street Probability & Markets",
    },
  },
  Foundations: {
    Red: {
      title: "Foundations — Red",
      minutes: 15,
      tasks: ["10 min mental math", "Review 1 previous error", "Stop"],
      refs: "TraderMath",
    },
    Yellow: {
      title: "Foundations — Yellow",
      minutes: 35,
      tasks: [
        "10 min mental math",
        "2 probability questions",
        "Explain 1 solution aloud",
        "Log mistakes",
        "Stop",
      ],
      refs: "QuantQuestions",
    },
    Green: {
      title: "Foundations — Green",
      minutes: 50,
      tasks: [
        "15 min mental math",
        "3 probability questions",
        "1 counting/combinatorics drill",
        "Explain 1 solution aloud",
        "Log mistakes",
        "Stop",
      ],
      refs: "QuantGuide Trader 75,QuantQuestions",
    },
  },
  "Interview Fluency": {
    Red: {
      title: "Interview Fluency — Red",
      minutes: 15,
      tasks: ["10 min mental math", "Review 1 previous error", "Stop"],
      refs: "TraderMath",
    },
    Yellow: {
      title: "Interview Fluency — Yellow",
      minutes: 40,
      tasks: [
        "10 min mental math",
        "2 timed probability questions",
        "Explain 1 solution aloud",
        "Log mistakes",
        "Stop",
      ],
      refs: "QuantQuestions",
    },
    Green: {
      title: "Interview Fluency — Green",
      minutes: 55,
      tasks: [
        "15 min mental math",
        "3 timed probability questions",
        "1 market-making drill",
        "Record yourself explaining 1 solution",
        "Log mistakes",
        "Stop",
      ],
      refs: "TraderMath Market Games,Jane Street Probability & Markets",
    },
  },
  "Pressure and Readiness": {
    Red: {
      title: "Pressure and Readiness — Red",
      minutes: 15,
      tasks: ["10 min mental math", "Review retry-due errors", "Stop"],
      refs: "TraderMath",
    },
    Yellow: {
      title: "Pressure and Readiness — Yellow",
      minutes: 40,
      tasks: [
        "10 min mental math",
        "2 mixed timed questions",
        "1 explanation aloud",
        "Log mistakes",
        "Stop",
      ],
      refs: "QuantGuide Trader 75,QuantQuestions",
    },
    Green: {
      title: "Pressure and Readiness — Green",
      minutes: 55,
      tasks: [
        "15 min mental math",
        "3 mixed timed questions",
        "1 market-making game",
        "Record yourself explaining 1 solution",
        "Log mistakes",
        "Stop",
      ],
      refs: "TraderMath Market Games",
    },
  },
};

function escapeCsv(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(fields) {
  return fields.map(escapeCsv).join(",");
}

const workoutRows = [
  csvRow([
    "date",
    "phase",
    "energy",
    "title",
    "estimated_minutes",
    "tasks",
    "resource_refs",
  ]),
];

const plannedRows = [csvRow(["date", "phase", "planned_type"])];

for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
  const dateStr = formatDate(d);
  const phase = getPhase(dateStr);
  const planned = OFF_DAYS.has(dateStr) ? "Off" : "Flexible";
  plannedRows.push(csvRow([dateStr, phase, planned]));

  for (const energy of ["Red", "Yellow", "Green"]) {
    const w = WORKOUTS_BY_PHASE[phase][energy];
    workoutRows.push(
      csvRow([
        dateStr,
        phase,
        energy,
        w.title,
        w.minutes,
        w.tasks.join("|"),
        w.refs,
      ])
    );
  }
}

writeFileSync(join(dataDir, "workouts.csv"), workoutRows.join("\n") + "\n");
writeFileSync(join(dataDir, "planned-days.csv"), plannedRows.join("\n") + "\n");

writeFileSync(
  join(dataDir, "sessions.csv"),
  csvRow([
    "date",
    "phase",
    "chosen_energy",
    "planned_type",
    "completed_at",
    "timer_seconds",
    "notes",
  ]) + "\n"
);

writeFileSync(
  join(dataDir, "errors.csv"),
  csvRow([
    "id",
    "date",
    "source",
    "topic",
    "mistake_type",
    "lesson",
    "retry_date",
    "status",
    "notes",
  ]) + "\n"
);

const resources = [
  ["Official", "Jane Street Probability & Markets", "Official JS probability resource", "https://www.janestreet.com/probability-and-markets/"],
  ["Official", "Jane Street Interviewing", "How Jane Street interviews", "https://www.janestreet.com/join-jane-street/interviewing/"],
  ["Official", "Optiver Careers / Students", "Optiver student recruiting", "https://www.optiver.com/working-at-optiver/career-opportunities/students/"],
  ["Question Bank", "QuantGuide Trader 75", "Curated quant interview questions", "https://quantguide.io/"],
  ["Question Bank", "QuantQuestions", "Probability and brainteaser practice", "https://www.quantquestions.com/"],
  ["Mental Math", "TraderMath", "Mental math and market games", "https://www.tradermath.org/"],
  ["Mental Math", "Zetamac", "Fast arithmetic drills", "https://arithmetic.zetamac.com/"],
  ["Market Making", "TraderMath Market Games", "Market making practice games", "https://www.tradermath.org/market-making-games"],
  ["Firm Careers", "Jane Street Open Roles", "Jane Street careers", "https://www.janestreet.com/join-jane-street/open-roles/"],
  ["Firm Careers", "Optiver Careers", "Optiver jobs", "https://www.optiver.com/working-at-optiver/career-opportunities/"],
  ["Firm Careers", "SIG Careers", "Susquehanna careers", "https://careers.sig.com/"],
  ["Firm Careers", "Citadel Securities Careers", "Citadel Securities jobs", "https://www.citadelsecurities.com/careers/"],
  ["Firm Careers", "DRW Careers", "DRW recruiting", "https://www.drw.com/work-at-drw/"],
  ["Firm Careers", "IMC Careers", "IMC Trading careers", "https://www.imc.com/eu/careers/"],
  ["Firm Careers", "Flow Traders Careers", "Flow Traders jobs", "https://www.flowtraders.com/careers/"],
  ["Firm Careers", "Maven Careers", "Maven Securities careers", "https://www.mavensecurities.com/careers/"],
  ["Firm Careers", "G-Research Careers", "G-Research jobs", "https://www.gresearch.com/careers/"],
  ["Firm Careers", "XTX Markets Careers", "XTX Markets careers", "https://www.xtxmarkets.com/careers/"],
];

writeFileSync(
  join(dataDir, "resources.csv"),
  [csvRow(["category", "title", "description", "url"]), ...resources.map((r) => csvRow(r))].join("\n") + "\n"
);

const freePractice = [
  ["Mental Math", "TraderMath mental math", "Speed arithmetic drills", "https://www.tradermath.org/mental-math", "10"],
  ["Mental Math", "Zetamac arithmetic", "Timed arithmetic practice", "https://arithmetic.zetamac.com/", "10"],
  ["Probability", "QuantGuide Trader 75", "Interview-style question bank", "https://quantguide.io/", "20"],
  ["Probability", "QuantQuestions", "Probability and brainteasers", "https://www.quantquestions.com/", "20"],
  ["Probability", "Jane Street Probability & Markets", "Official probability material", "https://www.janestreet.com/probability-and-markets/", "30"],
  ["Market Making", "TraderMath market games", "Simulated market making", "https://www.tradermath.org/market-making-games", "15"],
  ["Market Making", "Dice market making", "Practice with dice-based markets", "", "15"],
  ["Market Making", "Card game", "Card-based market making practice", "", "15"],
  ["Market Making", "ETF/arbitrage-style games", "Arbitrage and ETF style drills", "", "20"],
  ["Review", "Review open errors", "Work through open mistakes in Errors log", "/errors", ""],
  ["Review", "Re-solve retry-due errors", "Errors marked Retry Due", "/errors?status=Retry%20Due", ""],
  ["Review", "Explain an old solution aloud", "Pick a past problem and explain without notes", "", "10"],
];

writeFileSync(
  join(dataDir, "free-practice.csv"),
  [
    csvRow(["category", "title", "description", "url", "suggested_minutes"]),
    ...freePractice.map((r) => csvRow(r)),
  ].join("\n") + "\n"
);

console.log("Generated data/*.csv");
