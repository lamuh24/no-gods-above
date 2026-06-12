import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { api, fileUrl } from "../api/client.js";

const LABELS = [
  ["main_design", "Main Design"],
  ["front_view", "Front View"],
  ["side_view", "Side View"],
  ["back_view", "Back View"],
  ["expression", "Expression"],
  ["outfit", "Outfit"],
  ["weapon", "Weapon"],
  ["trailer_style", "Trailer Style"],
  ["lore_world", "Lore / World"],
];

const LABEL_NAMES = Object.fromEntries(LABELS);

export default function Step2References({ character, refresh, notify }) {
  const [label, setLabel] = useState("main_design");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  async function handleFiles(files) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        await api.uploadReference(character.id, file, label, "");
      }
      await refresh();
      notify(`${files.length} reference${files.length > 1 ? "s" : ""} added as ${LABEL_NAMES[label]}.`, "ok");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeLabel(ref, nextLabel) {
    try {
      await api.patchReference(character.id, ref.id, { label: nextLabel });
      await refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function remove(ref) {
    try {
      await api.deleteReference(character.id, ref.id);
      await refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  const refs = character.references || [];
  const groups = LABELS.map(([id, name]) => [id, name, refs.filter((ref) => ref.label === id)]).filter(([, , items]) => items.length);

  return (
    <div className="step-body">
      <section className="panel">
        <h2>Add References</h2>
        <div className="ref-upload-row">
          <label className="ref-drop">
            <ImagePlus size={26} />
            <span>{busy ? "Uploading…" : "Click to add images (multi-select supported)"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => {
                handleFiles(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
          </label>
          <label className="ref-label-pick">
            <span>Label new uploads as</span>
            <select value={label} onChange={(e) => setLabel(e.target.value)}>
              {LABELS.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {groups.length === 0 && (
        <section className="panel empty-panel">
          <p>No references yet. Concept art, turnarounds, outfit and weapon sheets all live here — the main design becomes the dashboard card art.</p>
        </section>
      )}

      {groups.map(([id, name, items]) => (
        <section key={id} className="panel">
          <h2>
            {name} <small>({items.length})</small>
          </h2>
          <div className="ref-gallery">
            {items.map((ref) => (
              <figure key={ref.id} className="ref-card">
                <button className="ref-image" onClick={() => setLightbox(ref)}>
                  <img src={fileUrl(character.id, ref.file, ref.addedAt)} alt={ref.originalName || ref.id} loading="lazy" />
                </button>
                <figcaption>
                  <select value={ref.label} onChange={(e) => changeLabel(ref, e.target.value)}>
                    {LABELS.map(([labelId, labelName]) => (
                      <option key={labelId} value={labelId}>
                        {labelName}
                      </option>
                    ))}
                  </select>
                  <button className="icon-button" onClick={() => remove(ref)} aria-label="Delete reference">
                    <Trash2 size={14} />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={fileUrl(character.id, lightbox.file, lightbox.addedAt)} alt={lightbox.originalName || lightbox.id} />
          <p>
            {LABEL_NAMES[lightbox.label]} · {lightbox.originalName}
          </p>
        </div>
      )}
    </div>
  );
}
