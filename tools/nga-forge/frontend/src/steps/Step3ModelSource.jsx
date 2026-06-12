import { useEffect, useState } from "react";
import { Box, FileUp, Play } from "lucide-react";
import { api } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Step3ModelSource({ character, refresh, notify, jobs }) {
  const [modes, setModes] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getModelSources()
      .then((data) => setModes(data.modes || []))
      .catch((error) => notify(error.message));
  }, []);

  const model = character.model || {};
  const generating = jobs.some((job) => job.type === "generate_model" && job.characterId === character.id && !["completed", "failed", "cancelled"].includes(job.status));

  async function generatePlaceholder() {
    setBusy(true);
    try {
      await api.generateModel(character.id);
      notify("Placeholder generation started.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function importModel(file) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await api.importModel(character.id, file);
      await refresh();
      notify(result.warnings?.length ? result.warnings.join(" ") : "Model imported.", result.warnings?.length ? "warn" : "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="step-body">
      {model.sourceFile && (
        <section className="panel current-model">
          <h2>Current Source Model</h2>
          <div className="settings-row">
            <span>Mode</span>
            <span className="settings-value">
              <StatusBadge small status={model.sourceMode === "placeholder" ? "placeholder" : "ready"} />
              <code>{model.sourceMode}</code>
            </span>
          </div>
          <div className="settings-row">
            <span>File</span>
            <code>{model.sourceFile}</code>
          </div>
          {(model.warnings || []).map((warning) => (
            <p key={warning} className="warning-line">
              {warning}
            </p>
          ))}
        </section>
      )}

      <div className="source-grid">
        {modes.map((mode) => (
          <section key={mode.id} className={`panel source-card ${mode.selectable ? "" : "source-disabled"}`}>
            <div className="source-head">
              <h3>{mode.label}</h3>
              <StatusBadge small status={mode.status} />
            </div>
            <p>{mode.description}</p>
            {mode.engines && (
              <p className="hint">
                Planned engines: {mode.engines.join(", ")}
              </p>
            )}
            {mode.id === "placeholder" && (
              <button className="primary-button" onClick={generatePlaceholder} disabled={busy || generating}>
                {generating ? <Box size={16} /> : <Play size={16} />}
                <span>{generating ? "Generating…" : "Generate Placeholder"}</span>
              </button>
            )}
            {mode.id === "import" && (
              <label className="secondary-button file-button">
                <FileUp size={16} />
                <span>{busy ? "Importing…" : "Choose GLB / GLTF / FBX / OBJ"}</span>
                <input
                  type="file"
                  accept=".glb,.gltf,.fbx,.obj"
                  disabled={busy}
                  onChange={(e) => {
                    importModel(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
