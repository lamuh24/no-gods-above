const API_BASE = import.meta.env.VITE_NGA_FORGE_API || "http://127.0.0.1:8765";

export function apiBase() {
  return API_BASE;
}

export function fileUrl(slug, relpath, version) {
  if (!relpath) return "";
  const v = version ? `?v=${encodeURIComponent(version)}` : "";
  return `${API_BASE}/characters/${slug}/files/${relpath}${v}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // keep HTTP status text
    }
    throw new Error(detail);
  }
  return response.json();
}

function jsonOptions(method, payload) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

export const api = {
  health: () => request("/health"),
  getSettings: () => request("/settings"),
  patchSettings: (payload) => request("/settings", jsonOptions("PATCH", payload)),
  getModelSources: () => request("/model-sources"),
  getRenderPresets: () => request("/render-presets"),

  listCharacters: () => request("/characters"),
  createCharacter: (payload) => request("/characters", jsonOptions("POST", payload)),
  getCharacter: (slug) => request(`/characters/${slug}`),
  patchCharacter: (slug, payload) => request(`/characters/${slug}`, jsonOptions("PATCH", payload)),
  deleteCharacter: (slug) => request(`/characters/${slug}`, { method: "DELETE" }),
  putAnimations: (slug, animations) => request(`/characters/${slug}/animations`, jsonOptions("PUT", { animations })),

  uploadReference: (slug, file, label, notes) => {
    const body = new FormData();
    body.append("file", file);
    body.append("label", label);
    body.append("notes", notes || "");
    return request(`/characters/${slug}/references`, { method: "POST", body });
  },
  patchReference: (slug, refId, payload) => request(`/characters/${slug}/references/${refId}`, jsonOptions("PATCH", payload)),
  deleteReference: (slug, refId) => request(`/characters/${slug}/references/${refId}`, { method: "DELETE" }),

  generateModel: (slug) => request(`/characters/${slug}/model/generate`, jsonOptions("POST", { sourceMode: "placeholder" })),
  importModel: (slug, file) => {
    const body = new FormData();
    body.append("file", file);
    return request(`/characters/${slug}/model/import`, { method: "POST", body });
  },
  runCleanup: (slug, payload) => request(`/characters/${slug}/pipeline/cleanup`, jsonOptions("POST", payload || {})),
  runRender: (slug, presets) => request(`/characters/${slug}/pipeline/render`, jsonOptions("POST", { presets })),
  runExport: (slug) => request(`/characters/${slug}/pipeline/export`, jsonOptions("POST", {})),

  listJobs: (limit = 12) => request(`/jobs?limit=${limit}`),
};
