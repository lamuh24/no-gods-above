# Swahili Paid in Full playback correction

The previous public fix enabled the contract projectile but never connected `swahili_paid_super` to the assembled animation. The presenter listened only for the zero-damage training seal and was disabled in competitive matches.

Confirmed super hits now play the existing assembled-verdict-v8 sequence: capture, opening, alternating gunfire, jump, victim POV slash, screen split, and final collection. Block and whiff do not start it. Combat still applies the existing single 180-base-damage transaction; this change adds no damage events or new art. Art polish and balance approval remain separate from verified playback.

The simulation and round/stock director wait for completion. The confirming snapshot immediately starts the guest presentation too. Repeated snapshots cannot replay the same event. Gameplay has no rehearsal scrub or Escape skip; rematch/exit cleans up. Bodies remain visible while frames load. A progress-based stall watchdog replaces the fixed playback deadline that could truncate a slowly rendered ending.

Validation:
- Full build and focused paid-super/paid-seal tests passed.
- `scripts/swahili_paid_cinematic_smoke.js`: real P/Numpad0 inputs, both owners/facings, every phase through natural completion, running simulation held, no developer controls, Escape cannot interrupt, one damage transaction, lethal stock loss deferred, simulation resumes, no missing assets or page errors.
- `scripts/swahili_paid_online_smoke.js`: real two-browser room, both movies complete, confirming ticks match, snapshots resume.
- Screenshots: `versus_playtest/captures/swahili-paid-cinematic-2026-09-25/`.

Release uses `scripts/patch_swahili_cinematic_release.js` against the prior verified paid-super package. Only entry HTML and a new bundle change; stage, fighter assets, and unrelated local work are preserved. Candidate bundle: `playtest-index-paid-cinematic-3c6ed217b3f5.js`.

Applied NGA guidance: Engine V2 preservation, cinematic ultimate production, VFX audit, character visual consistency, local versus, deployment readiness, git checkpoint safety, sprite pipeline and animation fluidity. No atlases were regenerated or remapped.
