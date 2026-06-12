import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { api, fileUrl } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

const BADGE_STEPS = [
  ["model", "Model"],
  ["render25d", "Renders"],
  ["animation", "Anim"],
  ["export", "Export"],
];

function CharacterCard({ character, onOpen }) {
  const pipeline = character.pipeline || {};
  return (
    <button className="char-card" onClick={() => onOpen(character.id)}>
      <div className="char-card-art">
        {character.thumbnail ? (
          <img src={fileUrl(character.id, character.thumbnail, character.updatedAt)} alt={`${character.name} concept art`} />
        ) : (
          <div className="char-card-noart">
            <Users size={30} />
            <span>No reference art</span>
          </div>
        )}
        <div className="char-card-palette">
          {(character.colorPalette || []).slice(0, 5).map((color) => (
            <i key={color} style={{ background: color }} />
          ))}
        </div>
      </div>
      <div className="char-card-body">
        <h3>{character.name}</h3>
        <p className="char-card-title">{character.title || "No title yet"}</p>
        <p className="char-card-meta">
          {character.faction || "No faction"} · {character.role || "roster"} · {character.referenceCount} ref{character.referenceCount === 1 ? "" : "s"}
        </p>
        <div className="char-card-badges">
          {BADGE_STEPS.map(([step, label]) => (
            <div key={step} className="char-card-badge">
              <small>{label}</small>
              <StatusBadge small status={pipeline[step]?.status || "not_started"} />
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({ characters, onOpenCharacter, onRosterChange, notify }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", faction: "", role: "roster" });
  const [busy, setBusy] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const record = await api.createCharacter(form);
      await onRosterChange();
      setCreating(false);
      setForm({ name: "", title: "", faction: "", role: "roster" });
      onOpenCharacter(record.id);
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Project Dashboard</h1>
          <p>Every No Gods Above character, from lore to game-ready export.</p>
        </div>
        <button className="primary-button" onClick={() => setCreating((v) => !v)}>
          <Plus size={16} />
          <span>Create New Character</span>
        </button>
      </header>

      {creating && (
        <form className="create-form" onSubmit={handleCreate}>
          <label>
            <span>Name *</span>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lamuh" />
          </label>
          <label>
            <span>Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Hand That Buried Heaven" />
          </label>
          <label>
            <span>Faction</span>
            <input value={form.faction} onChange={(e) => setForm({ ...form, faction: e.target.value })} />
          </label>
          <label>
            <span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="roster">Roster</option>
              <option value="boss">Boss</option>
              <option value="npc">NPC / Lore</option>
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={busy || !form.name.trim()}>
            Create
          </button>
        </form>
      )}

      <div className="char-grid">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} onOpen={onOpenCharacter} />
        ))}
      </div>
    </div>
  );
}
