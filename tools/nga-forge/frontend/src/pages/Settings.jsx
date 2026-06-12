import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Settings({ notify }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ exportRoot: "", blenderPath: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setForm({ exportRoot: data.exportRoot || "", blenderPath: data.blenderPath || "" });
    } catch (error) {
      notify(error.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    setBusy(true);
    try {
      const data = await api.patchSettings(form);
      setSettings(data);
      notify("Settings saved.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Local pipeline configuration. Nothing here touches the main game.</p>
        </div>
      </header>

      <section className="panel">
        <h2>Blender</h2>
        <div className="settings-row">
          <span>Detected</span>
          {settings ? (
            <span className="settings-value">
              <StatusBadge small status={settings.blender?.available ? "ready" : "not_started"} />
              <code>{settings.blender?.path || "not found (settings, NGA_FORGE_BLENDER, PATH all checked)"}</code>
            </span>
          ) : (
            <span>…</span>
          )}
        </div>
        <label>
          <span>Blender executable path (optional override)</span>
          <input
            value={form.blenderPath}
            placeholder="C:\\Program Files\\Blender Foundation\\Blender 4.x\\blender.exe"
            onChange={(e) => setForm({ ...form, blenderPath: e.target.value })}
          />
        </label>
        <p className="hint">
          Without Blender, cleanup and 2.5D renders fall back to clearly-labeled stand-ins. With it, you get real
          normalization and renders.
        </p>
      </section>

      <section className="panel">
        <h2>Export</h2>
        <label>
          <span>Export root folder</span>
          <input value={form.exportRoot} onChange={(e) => setForm({ ...form, exportRoot: e.target.value })} />
        </label>
        <p className="hint">
          Characters export to <code>{form.exportRoot || "…"}\no-gods-above-export\characters\&lt;slug&gt;\</code>. NGA Forge
          never writes into the game folder itself.
        </p>
      </section>

      <button className="primary-button" onClick={handleSave} disabled={busy}>
        <Save size={16} />
        <span>Save Settings</span>
      </button>
    </div>
  );
}
