export const sample = {
  "repoName": "foxhen-dashboard-dash",
  "title": "Dashboard Dash",
  "subtitle": "A data-cleanup arcade sample",
  "serviceLine": "Data ops game demo",
  "heroTitle": "Route clean rows, quarantine bad rows, hit the KPI.",
  "heroCopy": "A small game-style dashboard where players classify sample rows, protect reporting quality, and keep the executive metric from going red.",
  "primaryAction": "Play dash",
  "secondaryAction": "Review rules",
  "repositoryUrl": "https://github.com/foxandhenllc/foxhen-dashboard-dash",
  "liveDemoUrl": "https://freetoolsforpeople.com/dashboard-dash",
  "theme": {
    "accent": "#275f5a",
    "accent2": "#ffd166",
    "ink": "#061815",
    "soft": "#e9f9f6",
    "warm": "#fff8df",
    "surface": "#fffaf4",
    "muted": "#5c667a",
    "border": "rgba(7, 18, 31, 0.12)"
  },
  "metrics": [
    {
      "label": "Rows routed",
      "value": "120",
      "note": "sample wave"
    },
    {
      "label": "Quality meter",
      "value": "93%",
      "note": "+27 pts"
    },
    {
      "label": "KPI saved",
      "value": "Yes",
      "note": "green zone"
    }
  ],
  "stages": [
    {
      "label": "Incoming Rows",
      "detail": "Sample rows enter with missing fields, duplicates, and clean records mixed together.",
      "status": "ready",
      "owner": "Player",
      "index": 1
    },
    {
      "label": "Decision Lane",
      "detail": "Send records to accept, fix, or quarantine based on visible rules.",
      "status": "active",
      "owner": "Player",
      "index": 2
    },
    {
      "label": "KPI Meter",
      "detail": "Incorrect routing hurts confidence and changes the dashboard state.",
      "status": "waiting",
      "owner": "Game",
      "index": 3
    },
    {
      "label": "Handoff",
      "detail": "Finish with a cleanup report and rule summary.",
      "status": "queued",
      "owner": "Studio",
      "index": 4
    }
  ],
  "workItems": [
    {
      "title": "Clean row",
      "detail": "Route directly to dashboard",
      "status": "ready"
    },
    {
      "title": "Duplicate row",
      "detail": "Merge before reporting",
      "status": "active"
    },
    {
      "title": "Missing value",
      "detail": "Waiting for fix or quarantine",
      "status": "waiting"
    },
    {
      "title": "Rule summary",
      "detail": "Queued after the wave",
      "status": "queued"
    }
  ],
  "deliverables": [
    {
      "title": "Arcade data flow",
      "detail": "A visual explanation of data quality choices."
    },
    {
      "title": "Rule cards",
      "detail": "Clear classification rules for each row type."
    },
    {
      "title": "Score summary",
      "detail": "Final quality score and cleanup notes."
    }
  ],
  "timeline": [
    {
      "time": "Wave 1",
      "detail": "Classify basic clean and broken rows"
    },
    {
      "time": "Wave 2",
      "detail": "Handle duplicates and missing data"
    },
    {
      "time": "Wave 3",
      "detail": "Protect KPI score and package report"
    }
  ],
  "proof": [
    "Makes spreadsheet/data cleanup work easy to understand.",
    "Shows public-facing creativity without real data.",
    "Interactive enough to be memorable in a proposal."
  ]
} as const;

export type StageStatus = "ready" | "active" | "waiting" | "queued";
export type DemoStage = (typeof sample.stages)[number];
export type WorkItem = (typeof sample.workItems)[number];
