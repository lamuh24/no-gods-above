import { useState } from "react";
import { fileUrl } from "../api/client.js";
import ModelViewer from "../components/ModelViewer.jsx";

export default function Step5Preview({ character }) {
  const model = character.model || {};
  const hasClean = Boolean(model.cleanFile);
  const [which, setWhich] = useState(hasClean ? "clean" : "source");

  const rel = which === "clean" && hasClean ? model.cleanFile : model.sourceFile;
  const isGlb = rel && rel.toLowerCase().endsWith(".glb");
  const modelUrl = rel && isGlb ? fileUrl(character.id, rel, character.updatedAt) : "";

  return (
    <div className="step-body">
      <div className="preview-toolbar">
        <button className={`tab-button ${which === "source" ? "active" : ""}`} onClick={() => setWhich("source")} disabled={!model.sourceFile}>
          Source model
        </button>
        <button className={`tab-button ${which === "clean" ? "active" : ""}`} onClick={() => setWhich("clean")} disabled={!hasClean}>
          Clean model
        </button>
      </div>
      {rel && !isGlb && (
        <p className="warning-line">
          The {which} model is a {rel.split(".").pop().toUpperCase()} file — the in-browser viewer only plays GLB. Run Step 4 cleanup
          (with Blender) to convert it to a clean GLB.
        </p>
      )}
      <ModelViewer
        modelUrl={modelUrl}
        emptyHint={model.sourceFile ? "Select a GLB to preview." : "No model yet — generate or import one in Step 3."}
      />
    </div>
  );
}
