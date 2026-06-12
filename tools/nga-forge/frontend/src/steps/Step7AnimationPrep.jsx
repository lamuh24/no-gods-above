import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client.js";

const SOURCES = ["unassigned", "mixamo", "ai_mocap", "video_to_animation", "cascadeur", "blender", "custom"];
const SLOT_STATUSES = ["planned", "in_progress", "done"];

export default function Step7AnimationPrep({ character, refresh, notify }) {
  const [slots, setSlots] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSlots((character.animations || []).map((slot) => ({ ...slot, frameData: { ...slot.frameData }, spriteExportRange: { ...slot.spriteExportRange } })));
    setDirty(false);
  }, [character.id, character.updatedAt]);

  function update(index, patch) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
    setDirty(true);
  }

  function updateFrame(index, key, value) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, frameData: { ...slot.frameData, [key]: value } } : slot)));
    setDirty(true);
  }

  function updateRange(index, key, value) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, spriteExportRange: { ...slot.spriteExportRange, [key]: value } } : slot)));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      await api.putAnimations(character.id, slots);
      await refresh();
      notify("Animation plan saved.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="step-body">
      <section className="panel">
        <h2>Animation Prep</h2>
        <p className="hint">
          Planning layer only for now: frame data, hit timing, and intended sources are recorded here and exported in
          animations.json. Clip import (Mixamo, mocap, video-to-animation, Cascadeur) plugs into these slots later.
        </p>
        <div className="anim-table-wrap">
          <table className="anim-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Status</th>
                <th>Source</th>
                <th title="Startup frames">Start</th>
                <th title="Active frames">Active</th>
                <th title="Recovery frames">Recov</th>
                <th title="Root motion">Root</th>
                <th>Sprite range</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, index) => (
                <tr key={slot.name}>
                  <td>
                    <strong>{slot.name}</strong>
                    <small>{slot.category}</small>
                  </td>
                  <td>
                    <select value={slot.status} onChange={(e) => update(index, { status: e.target.value })}>
                      {SLOT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={slot.source} onChange={(e) => update(index, { source: e.target.value })}>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0" value={slot.frameData.startup ?? ""} onChange={(e) => updateFrame(index, "startup", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" min="0" value={slot.frameData.active ?? ""} onChange={(e) => updateFrame(index, "active", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" min="0" value={slot.frameData.recovery ?? ""} onChange={(e) => updateFrame(index, "recovery", e.target.value)} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(slot.rootMotion)} onChange={(e) => update(index, { rootMotion: e.target.checked })} />
                  </td>
                  <td className="range-cell">
                    <input type="number" min="0" value={slot.spriteExportRange.start ?? ""} onChange={(e) => updateRange(index, "start", e.target.value)} />
                    <span>–</span>
                    <input type="number" min="0" value={slot.spriteExportRange.end ?? ""} onChange={(e) => updateRange(index, "end", e.target.value)} />
                  </td>
                  <td>
                    <input className="notes-input" value={slot.notes || ""} onChange={(e) => update(index, { notes: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="step-actions">
          <button className="primary-button" onClick={save} disabled={busy || !dirty}>
            <Save size={16} />
            <span>{dirty ? "Save Animation Plan" : "Saved"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
