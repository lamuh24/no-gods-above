const STATUS_META = {
  not_started: { label: "Not Started" },
  needs_reference: { label: "Needs Reference" },
  placeholder: { label: "Placeholder" },
  ready: { label: "Ready" },
  processing: { label: "Processing" },
  exported: { label: "Exported" },
  failed: { label: "Failed" },
  future_adapter: { label: "Future Adapter" },
  // job statuses reuse the same component
  queued: { label: "Queued" },
  running: { label: "Running" },
  completed: { label: "Completed" },
  cancelled: { label: "Cancelled" },
};

export default function StatusBadge({ status, small }) {
  const meta = STATUS_META[status] || { label: status || "Unknown" };
  return (
    <span className={`badge badge-${status || "unknown"} ${small ? "badge-small" : ""}`}>
      <i className="badge-dot" />
      {meta.label}
    </span>
  );
}
