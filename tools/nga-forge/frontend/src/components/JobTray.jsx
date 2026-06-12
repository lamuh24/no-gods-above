import StatusBadge from "./StatusBadge.jsx";

const TYPE_LABELS = {
  generate_model: "Generate Model",
  cleanup_model: "Cleanup / Normalize",
  render_character: "2.5D Render",
  export_character: "Export",
};

export default function JobTray({ jobs }) {
  if (!jobs.length) return null;
  const visible = jobs.slice(0, 4);
  return (
    <footer className="job-tray">
      {visible.map((job) => (
        <div key={job.id} className={`job-chip job-${job.status}`}>
          <div className="job-chip-head">
            <strong>{TYPE_LABELS[job.type] || job.type}</strong>
            <span className="job-chip-char">{job.characterId}</span>
            <StatusBadge small status={job.status} />
          </div>
          <div className="job-chip-bar">
            <span style={{ width: `${Math.max(0, Math.min(job.progress || 0, 100))}%` }} />
          </div>
          <div className="job-chip-stage">{job.error || job.stage}</div>
        </div>
      ))}
    </footer>
  );
}
