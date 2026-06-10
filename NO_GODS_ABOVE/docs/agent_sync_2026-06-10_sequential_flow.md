# Agent Sync: Sequential Flow Refactor

Date: 2026-06-10

Central Obsidian sync was attempted at `http://127.0.0.1:27124/` and was unreachable. The prior fallback folder `C:\Users\qchee\OneDrive\Documents\LAMUH\LAMUH\Agent Sync` was not present, so this repo-local note is the fallback sync artifact.

Summary:

- Refactored setup into `Mode -> Fighters -> Arena`.
- Online host/join now skips Mode and uses `Fighters -> Arena`; host starts from Arena.
- Added `state.selectStep` and step-aware keyboard/gamepad navigation.
- Preserved combat, roster, sprite loading, controller support, and host-authoritative PeerJS netcode.
- Updated the online smoke to assert both peers reach Arena before match start.
- Fixed `_stage_deploy.ps1` so it resolves paths relative to the script and reports zero missing files.
- Bumped runtime cache key to `game.js?v=flow-setup-1`.
- Live Netlify still serves `game.js?v=lamuh-legacy-p2-fix-1`; redeploy is required for public visibility.

Validation:

- `node --check NO_GODS_ABOVE/game.js`
- `node --check NO_GODS_ABOVE/scripts/smoke_online_versus.js`
- `git diff --check`
- Browser local Local Versus and Training flow smoke
- Browser 390x844 mobile Fighters and Arena layout checks
- `node NO_GODS_ABOVE/scripts/smoke_online_versus.js`
- `powershell -ExecutionPolicy Bypass -File .\_stage_deploy.ps1`
