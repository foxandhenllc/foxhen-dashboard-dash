import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import {
  createInitialState,
  exportRunReport,
  expectedLane,
  laneNames,
  selectLane,
  startRun,
  updateGame,
  waves,
  type DropKind,
  type GameState,
} from "./gameLogic";

const bestScoreKey = "dashboard-dash.bestScore";
const laneCenters = [194, 450, 706];
const dropColors: Record<DropKind, string> = {
  clean: "#bff3d2",
  broken: "#ffe0a4",
  duplicate: "#ffd6a5",
  missing: "#ffc6c6",
  bonus: "#ffd166",
  shield: "#9be7ff",
  corrupt: "#ff7a90",
};

function loadBestScore() {
  const rawValue = window.localStorage.getItem(bestScoreKey);
  return rawValue ? Number.parseInt(rawValue, 10) || 0 : 0;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState(typeof window === "undefined" ? 0 : loadBestScore()));
  const [showHelp, setShowHelp] = useState(true);
  const [, forceRender] = useState(0);
  const sync = () => forceRender((value) => value + 1);
  const report = useMemo(() => exportRunReport(stateRef.current), [stateRef.current.score, stateRef.current.mode, stateRef.current.message]);

  function setState(nextState: GameState) {
    stateRef.current = nextState;
    window.localStorage.setItem(bestScoreKey, String(nextState.bestScore));
    sync();
  }

  function start() {
    (document.activeElement as HTMLElement | null)?.blur();
    setShowHelp(false);
    setState(startRun(stateRef.current.bestScore));
  }

  function moveLane(delta: number) {
    setState(selectLane(stateRef.current, stateRef.current.lane + delta));
  }

  function chooseLane(laneIndex: number) {
    setState(selectLane(stateRef.current, laneIndex));
  }

  async function copyReport() {
    try {
      await navigator.clipboard?.writeText(exportRunReport(stateRef.current));
      setState({ ...stateRef.current, message: "Run report copied to clipboard." });
    } catch {
      setState({ ...stateRef.current, message: "Clipboard permission denied. Use Export .txt instead." });
    }
  }

  function downloadReport() {
    const blob = new Blob([exportRunReport(stateRef.current)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard-dash-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;
    const wave = waves[state.waveIndex];
    ctx.clearRect(0, 0, 900, 560);
    const gradient = ctx.createLinearGradient(0, 0, 900, 560);
    gradient.addColorStop(0, "#10262a");
    gradient.addColorStop(0.52, "#111827");
    gradient.addColorStop(1, "#070914");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 560);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    for (let gridIndex = 0; gridIndex < 9; gridIndex += 1) ctx.fillRect(gridIndex * 120 - 20, 0, 2, 560);
    ctx.fillStyle = "#fffaf4";
    ctx.font = "950 30px Inter, sans-serif";
    ctx.fillText("Dashboard Dash", 34, 45);
    ctx.font = "800 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,250,244,.72)";
    ctx.fillText(`${wave.name} · ${wave.rule}`, 34, 70);
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(54, 414, 792, 4);
    ctx.fillStyle = "rgba(255,250,244,.55)";
    ctx.font = "800 12px Inter, sans-serif";
    ctx.fillText("Decision line", 58, 405);
    laneNames.forEach((lane, index) => {
      const x = 90 + index * 250;
      ctx.fillStyle = index === state.lane ? "#ffd166" : "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.roundRect(x, 430, 210, 88, 22);
      ctx.fill();
      ctx.fillStyle = index === state.lane ? "#111207" : "#fffaf4";
      ctx.font = "950 21px Inter, sans-serif";
      ctx.fillText(lane, x + 24, 481);
    });
    state.activeDrops.forEach((drop, index) => {
      const x = laneCenters[index % laneCenters.length] + Math.sin((drop.y + index * 30) / 62) * 24;
      ctx.fillStyle = dropColors[drop.kind];
      ctx.beginPath();
      ctx.roundRect(x - 102, drop.y - 28, 204, 56, 16);
      ctx.fill();
      ctx.fillStyle = "#07121f";
      ctx.font = "950 16px Inter, sans-serif";
      ctx.fillText(drop.label, x - 82, drop.y + 3);
      ctx.font = "800 11px Inter, sans-serif";
      ctx.fillText(`→ ${expectedLane[drop.kind]}`, x - 82, drop.y + 20);
    });
    ctx.fillStyle = "#fffaf4";
    ctx.font = "900 16px Inter, sans-serif";
    ctx.fillText(`Score ${state.score}`, 34, 535);
    ctx.fillText(`Best ${state.bestScore}`, 140, 535);
    ctx.fillText(`Quality ${state.quality}%`, 245, 535);
    ctx.fillText(`Wave ${state.waveIndex + 1}/3`, 380, 535);
    ctx.fillText(`Combo ${state.combo}`, 495, 535);
    if (state.mode !== "playing") {
      ctx.fillStyle = "rgba(8,8,18,.8)";
      ctx.fillRect(0, 0, 900, 560);
      ctx.fillStyle = "#fffaf4";
      ctx.font = "950 54px Inter, sans-serif";
      ctx.fillText(state.mode === "won" ? "KPI Saved" : state.mode === "lost" ? "Dashboard Broke" : "Dashboard Dash", 95, 232);
      ctx.font = "700 20px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,250,244,.76)";
      ctx.fillText("Three waves. Three lanes. Route sample rows before quality hits zero.", 100, 278);
      ctx.fillText("Use lane buttons, mouse/touch, ←/→, A/D, or 1/2/3.", 100, 310);
    }
  }

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.033, (now - last) / 1000);
      last = now;
      const nextState = updateGame(stateRef.current, deltaSeconds);
      if (nextState !== stateRef.current) {
        stateRef.current = nextState;
        if (nextState.bestScore !== Number(window.localStorage.getItem(bestScoreKey) ?? 0)) {
          window.localStorage.setItem(bestScoreKey, String(nextState.bestScore));
        }
        sync();
      }
      render();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a") moveLane(-1);
      if (event.key === "ArrowRight" || event.key === "d") moveLane(1);
      if (["1", "2", "3"].includes(event.key)) chooseLane(Number(event.key) - 1);
      if (event.key === "?" || event.key === "h") setShowHelp((value) => !value);
      if (event.key === "f") canvasRef.current?.requestFullscreen?.();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const state = stateRef.current;
      return JSON.stringify({
        coordinateSystem: "Canvas 900x560, origin top-left, x right, y down. Drops auto-route through the selected lane at y=414.",
        mode: state.mode,
        selectedLane: laneNames[state.lane],
        wave: waves[state.waveIndex],
        activeDrops: state.activeDrops.map((drop) => ({ ...drop, expectedLane: expectedLane[drop.kind] })),
        score: state.score,
        bestScore: state.bestScore,
        quality: state.quality,
        routed: state.routed,
        combo: state.combo,
        message: state.message,
      });
    };
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let step = 0; step < steps; step += 1) stateRef.current = updateGame(stateRef.current, 1 / 60);
      render();
      sync();
    };
  }, []);

  const state = stateRef.current;
  return (
    <div className="game-shell">
      <header className="site-header">
        <a className="brand" href="https://foxandhenllc.com">
          <span className="brand-mark">F&amp;H</span>
          <span><strong>Fox &amp; Hen</strong><small>Dashboard Dash</small></span>
        </a>
        <nav>
          <a href="#play">Play</a>
          <button className="nav-link" onClick={() => setShowHelp(true)}>Rules</button>
          <a className="nav-button" href="https://github.com/foxandhenllc/foxhen-dashboard-dash">Repository</a>
        </nav>
      </header>
      <main>
        <aside className="game-info">
          <p>Playable data ops game</p>
          <h1>Route rows before the KPI breaks.</h1>
          <p className="lede">Survive three faster waves of fictional dashboard rows. Bonus drops raise score, shields restore quality, and corrupt imports punish sloppy routing.</p>
          <div className="controls">
            <span>Move: ←/→, A/D, 1/2/3, or lane buttons</span>
            <span>Rules: Accept clean/bonus/shield · Repair broken/duplicate · Quarantine missing/corrupt</span>
            <span>Help: H or ? · Fullscreen: F</span>
          </div>
          <div className="action-row">
            <button id="start-btn" onClick={start}>Start / restart</button>
            <button onClick={copyReport}>Copy report</button>
            <button onClick={downloadReport}>Export .txt</button>
          </div>
          <div className="lane-buttons" aria-label="Lane controls">
            {laneNames.map((lane, index) => <button key={lane} className={state.lane === index ? "active" : ""} onClick={() => chooseLane(index)}>{index + 1}. {lane}</button>)}
          </div>
          <div className="stat-grid">
            <article><span>Score</span><strong>{state.score}</strong><small>best {state.bestScore}</small></article>
            <article><span>Quality</span><strong>{state.quality}%</strong><small>dashboard health</small></article>
            <article><span>Wave</span><strong>{state.waveIndex + 1}/3</strong><small>{state.waveRouted}/{waves[state.waveIndex].target} routed</small></article>
            <article><span>Lane</span><strong>{laneNames[state.lane]}</strong><small>{state.message}</small></article>
          </div>
          {(state.mode === "won" || state.mode === "lost") && <pre className="report-card">{report}</pre>}
        </aside>
        <section id="play" className="game-card">
          <canvas ref={canvasRef} width={900} height={560} onPointerDown={(event) => chooseLane(Math.floor((event.nativeEvent.offsetX / event.currentTarget.clientWidth) * 3))} />
          {showHelp && <div className="help-overlay">
            <h2>Rules of the run</h2>
            <p>Rows route automatically through the selected lane when they cross the decision line. Switch lanes before each drop lands.</p>
            <ul>
              <li>Accept: clean rows, golden KPI bonuses, and validation shields.</li>
              <li>Repair: formula mismatches and duplicate leads.</li>
              <li>Quarantine: missing owners and corrupt imports.</li>
            </ul>
            <button onClick={() => setShowHelp(false)}>Got it</button>
          </div>}
        </section>
      </main>
    </div>
  );
}

declare global { interface Window { render_game_to_text?: () => string; advanceTime?: (ms: number) => void; } }
export default App;
