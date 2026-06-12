import { useCallback, useEffect, useRef, useState } from "react";
import { Hammer, LayoutGrid, Settings as SettingsIcon } from "lucide-react";
import { api, apiBase } from "./api/client.js";
import JobTray from "./components/JobTray.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CharacterWorkspace from "./pages/CharacterWorkspace.jsx";
import Settings from "./pages/Settings.jsx";

const TERMINAL = ["completed", "failed", "cancelled"];

export default function App() {
  const [view, setView] = useState({ page: "dashboard", slug: null, step: 1 });
  const [characters, setCharacters] = useState([]);
  const [character, setCharacter] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const jobStatesRef = useRef({});
  const toastTimerRef = useRef(0);

  const notify = useCallback((message, tone = "error") => {
    setToast({ message, tone });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), tone === "error" ? 6000 : 3200);
  }, []);

  const loadCharacters = useCallback(async () => {
    try {
      const data = await api.listCharacters();
      setCharacters(data.characters || []);
    } catch (error) {
      notify(`Backend unreachable at ${apiBase()} — ${error.message}`);
    }
  }, [notify]);

  const loadCharacter = useCallback(
    async (slug) => {
      if (!slug) return;
      try {
        setCharacter(await api.getCharacter(slug));
      } catch (error) {
        notify(error.message);
      }
    },
    [notify]
  );

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (view.page === "character" && view.slug) loadCharacter(view.slug);
  }, [view.page, view.slug, loadCharacter]);

  // Poll jobs; refresh roster + open character whenever a job finishes.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const data = await api.listJobs(12);
        if (cancelled) return;
        const nextJobs = data.jobs || [];
        setJobs(nextJobs);
        let finishedSomething = false;
        const states = jobStatesRef.current;
        for (const job of nextJobs) {
          if (TERMINAL.includes(job.status) && states[job.id] && !TERMINAL.includes(states[job.id])) {
            finishedSomething = true;
            if (job.status === "failed") notify(`${job.type} failed: ${job.error || "unknown error"}`);
          }
          states[job.id] = job.status;
        }
        if (finishedSomething) {
          loadCharacters();
          if (view.page === "character" && view.slug) loadCharacter(view.slug);
        }
      } catch {
        // Backend offline; the next action will surface the error.
      }
    }
    poll();
    const hasActive = jobs.some((job) => !TERMINAL.includes(job.status));
    const timer = window.setInterval(poll, hasActive ? 1200 : 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [view.page, view.slug, jobs.some((job) => !TERMINAL.includes(job.status)), loadCharacters, loadCharacter, notify]);

  function openCharacter(slug) {
    setCharacter(null);
    setView({ page: "character", slug, step: 1 });
  }

  const activeJobs = jobs.filter((job) => !TERMINAL.includes(job.status));
  const trayJobs = [...activeJobs, ...jobs.filter((job) => TERMINAL.includes(job.status)).slice(0, 2)];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => setView({ page: "dashboard", slug: null, step: 1 })}>
          <div className="brand-mark">
            <Hammer size={18} />
          </div>
          <div>
            <h1>NGA Forge</h1>
            <span>No Gods Above studio</span>
          </div>
        </div>

        <nav className="side-nav">
          <button className={view.page === "dashboard" ? "active" : ""} onClick={() => setView({ page: "dashboard", slug: null, step: 1 })}>
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </button>
          <button className={view.page === "settings" ? "active" : ""} onClick={() => setView({ page: "settings", slug: null, step: 1 })}>
            <SettingsIcon size={16} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="side-roster">
          <h3>Roster</h3>
          {characters.map((c) => (
            <button key={c.id} className={`roster-item ${view.slug === c.id ? "active" : ""}`} onClick={() => openCharacter(c.id)}>
              <span className="roster-name">{c.name}</span>
              <span className={`roster-dot dot-${c.pipeline?.export?.status === "exported" ? "exported" : c.pipeline?.model?.status || "not_started"}`} />
            </button>
          ))}
        </div>

        <div className="side-foot">
          <code>{apiBase()}</code>
        </div>
      </aside>

      <main className="content">
        {view.page === "dashboard" && (
          <Dashboard characters={characters} onOpenCharacter={openCharacter} onRosterChange={loadCharacters} notify={notify} />
        )}
        {view.page === "settings" && <Settings notify={notify} />}
        {view.page === "character" &&
          (character && character.id === view.slug ? (
            <CharacterWorkspace
              character={character}
              step={view.step}
              onStep={(step) => setView((prev) => ({ ...prev, step }))}
              onBack={() => setView({ page: "dashboard", slug: null, step: 1 })}
              refresh={async () => {
                await loadCharacter(view.slug);
                await loadCharacters();
              }}
              notify={notify}
              jobs={jobs}
            />
          ) : (
            <div className="page">
              <p className="hint">Loading character…</p>
            </div>
          ))}
      </main>

      {toast && <div className={`toast toast-${toast.tone}`}>{toast.message}</div>}
      <JobTray jobs={trayJobs} />
    </div>
  );
}
