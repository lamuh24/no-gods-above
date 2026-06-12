import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { api } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Step4Cleanup({ character, notify, jobs }) {
  const [blender, setBlender] = useState(null);
  const [targetHeight, setTargetHeight] = useState(character.model?.targetHeight || 2.05);
  const [toon, setToon] = useState(character.model?.toonMaterial ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => setBlender(data.blender))
      .catch(() => setBlender({ available: false, path: null }));
  }, []);

  useEffect(() => {
    setTargetHeight(character.model?.targetHeight || 2.05);
    setToon(character.model?.toonMaterial ?? true);
  }, [character.id, character.updatedAt]);

  const model = character.model || {};
  const running = jobs.some((job) => job.type === "cleanup_model" && job.characterId === character.id && !["completed", "failed", "cancelled"].includes(job.status));
  const status = character.pipeline?.cleanup?.status || "not_started";

  async function run() {
    setBusy(true);
    try {
      await api.runCleanup(character.id, { targetHeight: Number(targetHeight), toonMaterial: toon });
      notify("Cleanup job started.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="step-body">
      <section className="panel">
        <h2>Cleanup / Normalize</h2>
        <p className="hint">
          Centers the model, puts the feet at the floor origin, normalizes height, applies scale and rotation, optionally
          adds a stylized fallback material, and exports a clean self-contained GLB.
        </p>
        <div className="settings-row">
          <span>Blender</span>
          <span className="settings-value">
            <StatusBadge small status={blender?.available ? "ready" : "not_started"} />
            <code>{blender?.path || "not found — fallback will copy the raw source and flag it"}</code>
          </span>
        </div>
        <div className="field-grid">
          <label>
            <span>Target height (m)</span>
            <input type="number" min="0.25" max="20" step="0.05" value={targetHeight} onChange={(e) => setTargetHeight(e.target.value)} />
          </label>
          <label className="inline-check">
            <input type="checkbox" checked={toon} onChange={(e) => setToon(e.target.checked)} />
            <span>Apply toon/stylized material to unmaterialed meshes</span>
          </label>
        </div>
        <button className="primary-button" onClick={run} disabled={busy || running || !model.sourceFile}>
          <Wrench size={16} />
          <span>{running ? "Processing…" : "Run Cleanup"}</span>
        </button>
        {!model.sourceFile && <p className="warning-line">No source model yet — finish Step 3 first.</p>}
      </section>

      <section className="panel">
        <h2>Result</h2>
        <div className="settings-row">
          <span>Status</span>
          <StatusBadge small status={status} />
        </div>
        <div className="settings-row">
          <span>Clean file</span>
          <code>{model.cleanFile || "none yet"}</code>
        </div>
        {(model.warnings || []).map((warning) => (
          <p key={warning} className="warning-line">
            {warning}
          </p>
        ))}
      </section>
    </div>
  );
}
