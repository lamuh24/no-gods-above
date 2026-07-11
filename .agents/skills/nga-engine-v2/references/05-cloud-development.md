# Cloud Development Contract

Git is authoritative for code, schemas, scripts, and documentation. Use branches/worktrees for parallel Codex tasks. Do not edit the same binary `.blend` file concurrently.

Large binary assets belong in Git LFS or versioned object storage with manifests/checksums, not ordinary Git history. Approved assets record tool/version, provenance, rig/schema version, export settings, and approval state.

Use the cloud workspace for TypeScript work, tests, web previews, headless builds, and noninteractive Blender automation. Use local PC/laptop for Blender viewport review, controller feel, GPU profiling, Steam testing, and high-fidelity visual checks.

Pin Node, package manager, Python, Blender, and tool versions. Provide repeatable install/dev/build commands and CI gates for typecheck, lint, unit tests, schema validation, determinism/replay, asset manifests, web build, desktop smoke build, and benchmark performance.

Never commit Tripo keys, Steam credentials, signing keys, cloud tokens, or storage secrets. Use environment variables/provider secret stores and commit only `.env.example`.
