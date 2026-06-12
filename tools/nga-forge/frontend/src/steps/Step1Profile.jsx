import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client.js";

const LORE_FIELDS = [
  ["powerSource", "Power Source", "Where their strength comes from — divine, stolen, forged…"],
  ["personality", "Personality", "How they carry themselves in and out of a fight."],
  ["fightingStyle", "Fighting Style", "Range, speed, archetype, signature mechanics."],
  ["visualMotifs", "Visual Motifs", "Shapes, symbols, and effects that should repeat everywhere."],
  ["loreSummary", "Lore Summary", "The short version of who they are in the world."],
  ["storyArcNotes", "Story Arc Notes", "Where their story goes across the game / series."],
  ["trailerHook", "Trailer Hook", "The one line or moment that sells them in a trailer."],
  ["seriesNotes", "Series / Episode Notes", "Beats reserved for future episodic content."],
];

export default function Step1Profile({ character, refresh, notify }) {
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      name: character.name || "",
      title: character.title || "",
      faction: character.faction || "",
      role: character.role || "roster",
      lore: { ...character.lore },
    });
    setDirty(false);
  }, [character.id, character.updatedAt]);

  if (!form) return null;

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  function updateLore(key, value) {
    setForm((prev) => ({ ...prev, lore: { ...prev.lore, [key]: value } }));
    setDirty(true);
  }

  function updatePalette(index, value) {
    const palette = [...(form.lore.colorPalette || [])];
    if (value === null) palette.splice(index, 1);
    else if (index === -1) palette.push(value);
    else palette[index] = value;
    updateLore("colorPalette", palette);
  }

  async function save() {
    setBusy(true);
    try {
      await api.patchCharacter(character.id, form);
      await refresh();
      setDirty(false);
      notify("Profile saved — lore.md regenerated.", "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="step-body">
      <section className="panel">
        <h2>Identity</h2>
        <div className="field-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label>
            <span>Title</span>
            <input value={form.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label>
            <span>Faction</span>
            <input value={form.faction} onChange={(e) => update({ faction: e.target.value })} />
          </label>
          <label>
            <span>Role</span>
            <select value={form.role} onChange={(e) => update({ role: e.target.value })}>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="roster">Roster</option>
              <option value="boss">Boss</option>
              <option value="npc">NPC / Lore</option>
            </select>
          </label>
        </div>
        <div className="palette-editor">
          <span>Color palette</span>
          <div className="palette-chips">
            {(form.lore.colorPalette || []).map((color, index) => (
              <span key={`${color}-${index}`} className="palette-chip">
                <input type="color" value={color} onChange={(e) => updatePalette(index, e.target.value)} />
                <button type="button" onClick={() => updatePalette(index, null)} aria-label={`Remove ${color}`}>
                  ×
                </button>
              </span>
            ))}
            {(form.lore.colorPalette || []).length < 8 && (
              <button type="button" className="palette-add" onClick={() => updatePalette(-1, "#2ce4f0")}>
                + color
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Character Bible</h2>
        <div className="lore-grid">
          {LORE_FIELDS.map(([key, label, hint]) => (
            <label key={key}>
              <span>{label}</span>
              <textarea rows={3} placeholder={hint} value={form.lore[key] || ""} onChange={(e) => updateLore(key, e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <div className="step-actions">
        <button className="primary-button" onClick={save} disabled={busy || !dirty}>
          <Save size={16} />
          <span>{dirty ? "Save Profile" : "Saved"}</span>
        </button>
      </div>
    </div>
  );
}
