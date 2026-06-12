import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
import { api } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Step8Export({ character, notify, jobs }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((error) => notify(error.message));
  }, []);

  const model = character.model || {};
  const renders = character.renders || {};
  const renderCount = Object.entries(renders).filter(([key, value]) => key !== "lastRenderJobId" && value).length;
  const status = character.pipeline?.export?.status || "not_started";
  const lastExport = jobs.find((job) => job.type === "export_character" && job.characterId === character.id);
  const running = Boolean(lastExport && !["completed", "failed", "cancelled"].includes(lastExport.status));
  const isPlaceholder = model.sourceMode === "placeholder" || !model.cleanFile;

  async function run() {
    setBusy(true);
    try {
      await api.runExport(character.id);
      notify("Export started.", "ok");
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
          Export to No Gods Above <StatusBadge small status={status} />
        </h2>
        <div className="settings-row">
          <span>Destination</span>
          <code>{settings ? `${settings.exportRoot}\\no-gods-above-export\\characters\\${character.id}\\` : "…"}</code>
        </div>
        <div className="settings-row">
          <span>Model</span>
          <code>{model.cleanFile || model.sourceFile || "none — finish Step 3 first"}</code>
        </div>
        <div className="settings-row">
          <span>Renders</span>
          <span>{renderCount ? `${renderCount} render(s) included` : "none yet — Step 6 is recommended before export"}</span>
        </div>
        <div className="settings-row">
          <span>Lore + animations</span>
          <span>lore.md, lore.json, animations.json always included</span>
        </div>
        {isPlaceholder && (
          <p className="warning-line">
            This export will be flagged <code>placeholder: true</code> in manifest.json — the game side can tell it apart from
            production-ready assets.
          </p>
        )}
        <button className="primary-button" onClick={run} disabled={busy || running || !(model.cleanFile || model.sourceFile)}>
          <PackageCheck size={16} />
          <span>{running ? "Exporting…" : "Export Character"}</span>
        </button>
      </section>

      {lastExport && lastExport.status === "completed" && (
        <section className="panel">
          <h2>Last Export</h2>
          <div className="settings-row">
            <span>Folder</span>
            <code>{lastExport.outputs?.exportDir}</code>
          </div>
          {(lastExport.warnings || []).map((warning) => (
            <p key={warning} className="warning-line">
              {warning}
            </p>
          ))}
          {lastExport.outputs?.manifest && (
            <details>
              <summary>manifest.json</summary>
              <pre className="manifest-pre">{JSON.stringify(lastExport.outputs.manifest, null, 2)}</pre>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
