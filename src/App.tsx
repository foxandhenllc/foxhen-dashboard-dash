import { useEffect, useRef, useState } from "react";
import "./styles.css";

type Lane = "Accept" | "Repair" | "Quarantine";
type RowType = "clean" | "broken" | "duplicate" | "missing";
type FallingRow = { x: number; y: number; type: RowType; label: string; speed: number };
const laneNames: Lane[] = ["Accept", "Repair", "Quarantine"];
const expectedLane: Record<RowType, Lane> = { clean: "Accept", broken: "Repair", duplicate: "Repair", missing: "Quarantine" };
const rowTypes: RowType[] = ["clean", "broken", "duplicate", "missing"];

type GameState = { mode: "menu" | "playing" | "won" | "lost"; lane: number; score: number; quality: number; routed: number; combo: number; current: FallingRow; keys: Record<string, boolean>; message: string };

function newRow(routed = 0): FallingRow {
  const type = rowTypes[(routed * 7 + 2) % rowTypes.length];
  return { x: 450, y: 75, type, label: type === "clean" ? "Clean metric row" : type === "broken" ? "Formula mismatch" : type === "duplicate" ? "Duplicate lead" : "Missing owner", speed: 95 + routed * 4 };
}
function fresh(): GameState {
  return { mode: "menu", lane: 1, score: 0, quality: 100, routed: 0, combo: 0, current: newRow(), keys: {}, message: "Start the run and route rows into the right lane." };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(fresh());
  const [, forceRender] = useState(0);
  const sync = () => forceRender((value) => value + 1);

  function start() { (document.activeElement as HTMLElement | null)?.blur(); stateRef.current = { ...fresh(), mode: "playing", message: "Route clean rows to Accept, broken or duplicate rows to Repair, missing rows to Quarantine." }; sync(); }
  function routeCurrent() {
    const state = stateRef.current;
    if (state.mode !== "playing") return;
    const lane = laneNames[state.lane];
    const expected = expectedLane[state.current.type];
    const correct = lane === expected;
    if (correct) {
      state.combo += 1;
      state.score += 50 + state.combo * 10;
      state.quality = Math.min(100, state.quality + 2);
      state.message = `Correct: ${state.current.label} → ${lane}. Combo ${state.combo}.`;
    } else {
      state.combo = 0;
      state.score = Math.max(0, state.score - 20);
      state.quality -= 13;
      state.message = `Wrong lane. ${state.current.label} belonged in ${expected}.`;
    }
    state.routed += 1;
    if (state.quality <= 0) state.mode = "lost";
    else if (state.routed >= 18) state.mode = "won";
    state.current = newRow(state.routed);
    state.current.y = 75;
  }
  function update(dt: number) {
    const state = stateRef.current;
    if (state.mode !== "playing") return;
    if (state.keys.ArrowLeft || state.keys.a) state.lane = Math.max(0, state.lane - 1);
    if (state.keys.ArrowRight || state.keys.d) state.lane = Math.min(2, state.lane + 1);
    state.keys.ArrowLeft = state.keys.a = state.keys.ArrowRight = state.keys.d = false;
    state.current.y += state.current.speed * dt;
    if (state.current.y > 500) routeCurrent();
  }
  function render() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const state = stateRef.current;
    ctx.clearRect(0, 0, 900, 560);
    const gradient = ctx.createLinearGradient(0, 0, 900, 560); gradient.addColorStop(0, "#0e2020"); gradient.addColorStop(1, "#091018"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 560);
    ctx.fillStyle = "#fffaf4"; ctx.font = "950 30px Inter, sans-serif"; ctx.fillText("Dashboard Dash", 34, 45);
    ctx.font = "800 14px Inter, sans-serif"; ctx.fillStyle = "rgba(255,250,244,.66)"; ctx.fillText("Left/right chooses the lane. Space routes the active row early.", 34, 68);
    laneNames.forEach((lane, index) => {
      const x = 90 + index * 250;
      ctx.fillStyle = index === state.lane ? "#ffd166" : "rgba(255,255,255,.08)";
      ctx.fillRect(x, 390, 210, 120);
      ctx.fillStyle = index === state.lane ? "#111207" : "#fffaf4";
      ctx.font = "950 22px Inter, sans-serif"; ctx.fillText(lane, x + 24, 455);
    });
    if (state.mode === "playing") {
      const row = state.current;
      ctx.fillStyle = row.type === "clean" ? "#bff3d2" : row.type === "missing" ? "#ffc6c6" : "#ffe0a4";
      ctx.beginPath(); ctx.roundRect(row.x - 115, row.y - 28, 230, 56, 16); ctx.fill();
      ctx.fillStyle = "#07121f"; ctx.font = "950 17px Inter, sans-serif"; ctx.fillText(row.label, row.x - 90, row.y + 6);
    }
    ctx.fillStyle = "#fffaf4"; ctx.font = "900 16px Inter, sans-serif"; ctx.fillText(`Score ${state.score}`, 34, 535); ctx.fillText(`Quality ${state.quality}%`, 150, 535); ctx.fillText(`Rows ${state.routed}/18`, 290, 535); ctx.fillText(`Combo ${state.combo}`, 410, 535);
    if (state.mode !== "playing") {
      ctx.fillStyle = "rgba(8,8,18,.78)"; ctx.fillRect(0, 0, 900, 560);
      ctx.fillStyle = "#fffaf4"; ctx.font = "950 56px Inter, sans-serif"; ctx.fillText(state.mode === "won" ? "KPI Saved" : state.mode === "lost" ? "Dashboard Broke" : "Dashboard Dash", 105, 245);
      ctx.font = "700 20px Inter, sans-serif"; ctx.fillStyle = "rgba(255,250,244,.72)"; ctx.fillText("Route rows: clean → Accept, broken/duplicate → Repair, missing → Quarantine.", 108, 288);
    }
  }
  useEffect(() => { let frame = 0; let last = performance.now(); const tick = (now: number) => { const dt = Math.min(.033, (now - last) / 1000); last = now; update(dt); render(); frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => { const down = (event: KeyboardEvent) => { if (event.key === " " || event.code === "Space" || event.key === "Enter") routeCurrent(); if (event.key === "f") canvasRef.current?.requestFullscreen?.(); stateRef.current.keys[event.key] = true; }; const up = (event: KeyboardEvent) => { stateRef.current.keys[event.key] = false; }; window.addEventListener("keydown", down); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); }; }, []);
  useEffect(() => { window.render_game_to_text = () => { const state = stateRef.current; return JSON.stringify({ coordinateSystem: "Canvas 900x560, origin top-left, x right, y down", mode: state.mode, lane: laneNames[state.lane], currentRow: state.current, expectedLane: expectedLane[state.current.type], score: state.score, quality: state.quality, routed: state.routed, message: state.message }); }; window.advanceTime = (ms: number) => { const steps = Math.max(1, Math.round(ms / (1000 / 60))); for (let step = 0; step < steps; step += 1) update(1 / 60); render(); }; }, []);
  const state = stateRef.current;
  return <div className="game-shell"><header className="site-header"><a className="brand" href="https://foxandhenllc.com"><span className="brand-mark">F&amp;H</span><span><strong>Fox &amp; Hen</strong><small>Dashboard Dash</small></span></a><nav><a href="#play">Play</a><a className="nav-button" href="https://github.com/foxandhenllc/foxhen-dashboard-dash">Repository</a></nav></header><main><aside className="game-info"><p>Playable data ops game</p><h1>Route rows before the KPI breaks.</h1><p className="lede">Move the router between lanes and classify each row. Correct routing raises score and keeps dashboard quality alive.</p><div className="controls"><span>Move: left/right or A/D</span><span>Route early: Space</span><span>Fullscreen: F</span></div><div className="action-row"><button id="start-btn" onClick={start}>Start / restart</button><button onClick={routeCurrent}>Route current row</button></div><div className="stat-grid"><article><span>Score</span><strong>{state.score}</strong><small>routing points</small></article><article><span>Quality</span><strong>{state.quality}%</strong><small>dashboard health</small></article><article><span>Rows</span><strong>{state.routed}/18</strong><small>run progress</small></article><article><span>Lane</span><strong>{laneNames[state.lane]}</strong><small>{state.message}</small></article></div></aside><section id="play" className="game-card"><canvas ref={canvasRef} width={900} height={560} /></section></main></div>;
}

declare global { interface Window { render_game_to_text?: () => string; advanceTime?: (ms: number) => void; } }
export default App;
