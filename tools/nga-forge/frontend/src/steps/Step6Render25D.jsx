import { useEffect, useState } from "react";
import { Camera, Download } from "lucide-react";
import { api, fileUrl } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

const RENDER_TITLES = {
  preview25d: "2.5D Sprite Frame",
  turntableFront: "Front",
  turntableSide: "Side",
  turntableBack: "Back",
  turntableThreeQuarter: "3/4",
  portraitSelect: "Select Portrait",
  splash: "Splash / Trailer",
};

export default function Step6Render25D({ character, notify, jobs }) {
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState(["sprite_frame_448"]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getRenderPresets()
      .then((data) => setPresets(data.presets || []))
      .catch((error) => notify(error.message));
  }, []);

  const running = jobs.some((job) => job.type === "render_character" && job.characterId === character.id && !["completed", "failed", "cancelled"].includes(job.status));
  const renders = character.renders || {};
  const model = character.model || {};
  const status = character.pipeline?.render25d?.status || "not_started";
  const done = Object.entries(renders).filter(([key, value]) => key !== "lastRenderJobId" && value);

  function toggle(presetId) {
    setSelected((prev) => (prev.includes(presetId) ? prev.filter((p) => p !== presetId) : [...prev, presetId]));
  }

  async function run() {
    setBusy(true);
    try {
      await api.runRender(character.id, selected);
      notify("Render job started.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="step-body">
      <section className="panel">
        <h2>
          Render Presets <StatusBadge small status={status} />
        </h2>
        <p className="hint">
          Every preset uses the same fixed camera, floor baseline, and light rig — that shared setup is what keeps the whole
          roster visually consistent.
        </p>
        <div className="preset-list">
          {presets.map((preset) => (
            <label key={preset.id} className={`preset-row ${selected.includes(preset.id) ? "selected" : ""}`}>
              <input type="checkbox" checked={selected.includes(preset.id)} onChange={() => toggle(preset.id)} />
              <div>
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </div>
            </label>
          ))}
        </div>
        <button className="primary-button" onClick={run} disabled={busy || running || !selected.length || !(model.cleanFile || model.sourceFile)}>
          <Camera size={16} />
          <span>{running ? "Rendering…" : `Render ${selected.length} preset${selected.length === 1 ? "" : "s"}`}</span>
        </button>
        {!(model.cleanFile || model.sourceFile) && <p className="warning-line">No model yet — finish Step 3 first.</p>}
      </section>

      {done.length > 0 && (
        <section className="panel">
          <h2>Results</h2>
          <div className="render-grid">
            {done.map(([key, rel]) => (
              <figure key={key} className="render-card">
                <div className="render-image checker">
                  <img src={fileUrl(character.id, rel, character.updatedAt)} alt={RENDER_TITLES[key] || key} loading="lazy" />
                </div>
                <figcaption>
                  <span>{RENDER_TITLES[key] || key}</span>
                  <a className="icon-button" href={fileUrl(character.id, rel, character.updatedAt)} download>
                    <Download size={14} />
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
