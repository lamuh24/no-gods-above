import { ArrowLeft } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import Step1Profile from "../steps/Step1Profile.jsx";
import Step2References from "../steps/Step2References.jsx";
import Step3ModelSource from "../steps/Step3ModelSource.jsx";
import Step4Cleanup from "../steps/Step4Cleanup.jsx";
import Step5Preview from "../steps/Step5Preview.jsx";
import Step6Render25D from "../steps/Step6Render25D.jsx";
import Step7AnimationPrep from "../steps/Step7AnimationPrep.jsx";
import Step8Export from "../steps/Step8Export.jsx";

const STEPS = [
  { id: 1, key: "profile", label: "Profile", component: Step1Profile },
  { id: 2, key: "references", label: "References", component: Step2References },
  { id: 3, key: "model", label: "Model Source", component: Step3ModelSource },
  { id: 4, key: "cleanup", label: "Cleanup", component: Step4Cleanup },
  { id: 5, key: null, label: "Preview", component: Step5Preview },
  { id: 6, key: "render25d", label: "2.5D Render", component: Step6Render25D },
  { id: 7, key: "animation", label: "Animation Prep", component: Step7AnimationPrep },
  { id: 8, key: "export", label: "Export", component: Step8Export },
];

export default function CharacterWorkspace({ character, step, onStep, onBack, refresh, notify, jobs }) {
  const active = STEPS.find((s) => s.id === step) || STEPS[0];
  const StepComponent = active.component;
  const pipeline = character.pipeline || {};

  return (
    <div className="page">
      <header className="workspace-head">
        <button className="icon-button back-button" onClick={onBack} aria-label="Back to dashboard">
          <ArrowLeft size={18} />
        </button>
        <div className="workspace-id">
          <h1>{character.name}</h1>
          <p>{character.title || "No title yet"}</p>
        </div>
        <div className="workspace-palette">
          {((character.lore || {}).colorPalette || []).map((color) => (
            <i key={color} style={{ background: color }} title={color} />
          ))}
        </div>
      </header>

      <nav className="stepper">
        {STEPS.map((s) => (
          <button key={s.id} className={`stepper-item ${s.id === active.id ? "active" : ""}`} onClick={() => onStep(s.id)}>
            <span className="stepper-num">{s.id}</span>
            <span className="stepper-label">{s.label}</span>
            {s.key && <StatusBadge small status={pipeline[s.key]?.status || "not_started"} />}
          </button>
        ))}
      </nav>

      <StepComponent character={character} refresh={refresh} notify={notify} jobs={jobs} />
    </div>
  );
}
