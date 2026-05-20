export type Lane = "Accept" | "Repair" | "Quarantine";
export type DropKind = "clean" | "broken" | "duplicate" | "missing" | "bonus" | "shield" | "corrupt";
export type GameMode = "menu" | "playing" | "won" | "lost";

export type FallingDrop = {
  id: string;
  y: number;
  kind: DropKind;
  label: string;
  speed: number;
};

export type Wave = {
  name: string;
  target: number;
  spawnEvery: number;
  speedBonus: number;
  rule: string;
};

export type GameState = {
  mode: GameMode;
  lane: number;
  score: number;
  quality: number;
  routed: number;
  waveRouted: number;
  combo: number;
  bestScore: number;
  waveIndex: number;
  activeDrops: FallingDrop[];
  spawnTimer: number;
  nextDropIndex: number;
  message: string;
  events: string[];
};

export const laneNames: Lane[] = ["Accept", "Repair", "Quarantine"];

export const waves: Wave[] = [
  {
    name: "Wave 1 · Clean Sweep",
    target: 8,
    spawnEvery: 1.35,
    speedBonus: 0,
    rule: "Clean rows go to Accept. Formula mismatches go to Repair.",
  },
  {
    name: "Wave 2 · Messy Merge",
    target: 10,
    spawnEvery: 1.05,
    speedBonus: 34,
    rule: "Duplicates need Repair. Missing owners go to Quarantine.",
  },
  {
    name: "Wave 3 · Executive Review",
    target: 12,
    spawnEvery: 0.82,
    speedBonus: 68,
    rule: "Golden rows score bonuses. Corrupt imports must be Quarantined.",
  },
];

export const expectedLane: Record<DropKind, Lane> = {
  clean: "Accept",
  broken: "Repair",
  duplicate: "Repair",
  missing: "Quarantine",
  bonus: "Accept",
  shield: "Accept",
  corrupt: "Quarantine",
};

const dropLabels: Record<DropKind, string> = {
  clean: "Clean metric row",
  broken: "Formula mismatch",
  duplicate: "Duplicate lead",
  missing: "Missing owner",
  bonus: "Golden KPI bonus",
  shield: "Validation shield",
  corrupt: "Corrupt import",
};

const dropSequence: DropKind[] = [
  "clean",
  "broken",
  "clean",
  "duplicate",
  "missing",
  "bonus",
  "broken",
  "clean",
  "shield",
  "duplicate",
  "missing",
  "corrupt",
  "clean",
  "bonus",
  "duplicate",
  "broken",
  "missing",
  "shield",
];

const catchLine = 414;
const bottomLine = 520;

export function createInitialState(bestScore = 0): GameState {
  return {
    mode: "menu",
    lane: 1,
    score: 0,
    quality: 100,
    routed: 0,
    waveRouted: 0,
    combo: 0,
    bestScore,
    waveIndex: 0,
    activeDrops: [],
    spawnTimer: 0,
    nextDropIndex: 0,
    message: "Start a three-wave run and route every sample row into the right lane.",
    events: [],
  };
}

export function startRun(bestScore = 0): GameState {
  return {
    ...createInitialState(bestScore),
    mode: "playing",
    message: `${waves[0].name}: ${waves[0].rule}`,
  };
}

export function selectLane(state: GameState, laneIndex: number): GameState {
  return { ...state, lane: Math.max(0, Math.min(laneNames.length - 1, laneIndex)) };
}

export function spawnDrop(state: GameState): GameState {
  const wave = waves[state.waveIndex];
  const sequenceIndex = state.nextDropIndex + state.waveIndex * 5;
  const kind = dropSequence[sequenceIndex % dropSequence.length];
  const drop: FallingDrop = {
    id: `${state.waveIndex}-${state.nextDropIndex}-${kind}`,
    y: 86,
    kind,
    label: dropLabels[kind],
    speed: 108 + wave.speedBonus + (state.nextDropIndex % 3) * 12,
  };

  return {
    ...state,
    activeDrops: [...state.activeDrops, drop].slice(-4),
    nextDropIndex: state.nextDropIndex + 1,
  };
}

export function applyRoute(state: GameState, dropId?: string): GameState {
  if (state.mode !== "playing" || state.activeDrops.length === 0) return state;

  const targetDrop =
    state.activeDrops.find((drop) => drop.id === dropId) ??
    [...state.activeDrops].sort((first, second) => second.y - first.y)[0];
  const selectedLane = laneNames[state.lane];
  const expected = expectedLane[targetDrop.kind];
  const correct = selectedLane === expected;
  const isBonus = targetDrop.kind === "bonus";
  const isShield = targetDrop.kind === "shield";
  const isCorrupt = targetDrop.kind === "corrupt";
  const combo = correct ? state.combo + 1 : 0;
  const scoreDelta = correct
    ? 42 + combo * 9 + (isBonus ? 90 : 0) + (isShield ? 35 : 0) + (isCorrupt ? 30 : 0)
    : isCorrupt
      ? -70
      : -26;
  const qualityDelta = correct ? (isShield ? 12 : 3) : isCorrupt ? -24 : -12;
  const routed = state.routed + 1;
  const waveRouted = state.waveRouted + 1;
  const quality = Math.max(0, Math.min(100, state.quality + qualityDelta));
  const score = Math.max(0, state.score + scoreDelta);
  const activeDrops = state.activeDrops.filter((drop) => drop.id !== targetDrop.id);
  const message = correct
    ? `${targetDrop.label} → ${selectedLane}. +${scoreDelta} points, combo ${combo}.`
    : `${targetDrop.label} belonged in ${expected}. ${scoreDelta} points, quality ${quality}%.`;
  const nextState: GameState = {
    ...state,
    score,
    quality,
    routed,
    waveRouted,
    combo,
    activeDrops,
    message,
    events: [`${selectedLane}: ${message}`, ...state.events].slice(0, 6),
  };

  return advanceWaveOrEnd(nextState);
}

export function missDrop(state: GameState, dropId: string): GameState {
  const missed = state.activeDrops.find((drop) => drop.id === dropId);
  if (!missed || missed.kind === "bonus" || missed.kind === "shield") {
    return { ...state, activeDrops: state.activeDrops.filter((drop) => drop.id !== dropId) };
  }

  const quality = Math.max(0, state.quality - 10);
  const nextState: GameState = {
    ...state,
    quality,
    combo: 0,
    activeDrops: state.activeDrops.filter((drop) => drop.id !== dropId),
    message: `${missed.label} slipped past the router. Quality ${quality}%.`,
    events: [`Missed ${missed.label}.`, ...state.events].slice(0, 6),
  };

  return quality <= 0 ? finishRun(nextState, "lost") : nextState;
}

export function updateGame(state: GameState, deltaSeconds: number): GameState {
  if (state.mode !== "playing") return state;

  let nextState = { ...state, spawnTimer: state.spawnTimer - deltaSeconds };
  if (nextState.spawnTimer <= 0 && nextState.activeDrops.length < 4) {
    nextState = spawnDrop(nextState);
    nextState.spawnTimer = waves[nextState.waveIndex].spawnEvery;
  }

  nextState = {
    ...nextState,
    activeDrops: nextState.activeDrops.map((drop) => ({ ...drop, y: drop.y + drop.speed * deltaSeconds })),
  };

  const catchable = [...nextState.activeDrops].filter((drop) => drop.y >= catchLine).sort((first, second) => second.y - first.y)[0];
  if (catchable) nextState = applyRoute(nextState, catchable.id);

  const missedDrops = nextState.activeDrops.filter((drop) => drop.y > bottomLine);
  for (const missedDrop of missedDrops) nextState = missDrop(nextState, missedDrop.id);

  return nextState;
}

export function exportRunReport(state: GameState): string {
  const wave = waves[Math.min(state.waveIndex, waves.length - 1)];
  return [
    "Dashboard Dash run report",
    `Result: ${state.mode.toUpperCase()}`,
    `Score: ${state.score}`,
    `Best score: ${Math.max(state.bestScore, state.score)}`,
    `Quality: ${state.quality}%`,
    `Rows routed: ${state.routed}`,
    `Current wave: ${wave.name}`,
    "Rules:",
    "- Clean rows and golden/shield drops route to Accept.",
    "- Formula mismatches and duplicates route to Repair.",
    "- Missing owners and corrupt imports route to Quarantine.",
    "Recent decisions:",
    ...(state.events.length ? state.events.map((event) => `- ${event}`) : ["- No decisions yet."]),
  ].join("\n");
}

function advanceWaveOrEnd(state: GameState): GameState {
  if (state.quality <= 0) return finishRun(state, "lost");

  const wave = waves[state.waveIndex];
  if (state.waveRouted < wave.target) return state;

  if (state.waveIndex >= waves.length - 1) return finishRun(state, "won");

  const nextWave = waves[state.waveIndex + 1];
  return {
    ...state,
    waveIndex: state.waveIndex + 1,
    waveRouted: 0,
    activeDrops: [],
    spawnTimer: 0.35,
    message: `${nextWave.name}: ${nextWave.rule}`,
    events: [`Advanced to ${nextWave.name}.`, ...state.events].slice(0, 6),
  };
}

function finishRun(state: GameState, mode: "won" | "lost"): GameState {
  return {
    ...state,
    mode,
    activeDrops: [],
    bestScore: Math.max(state.bestScore, state.score),
    message: mode === "won" ? "KPI saved. Export the report or run it back." : "Dashboard broke. Export the postmortem and try again.",
  };
}
