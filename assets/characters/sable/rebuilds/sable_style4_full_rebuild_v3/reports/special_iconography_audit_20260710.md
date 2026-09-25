# Sable Full Rebuild V3 Special Iconography Audit - 2026-07-10

Scope: already queued/previewed Sable special clips in `full-rebuild-v3`.

Standing rule applied: special family names are gameplay metaphors, never literal real-world objects. Void Shard = crystal fragments; Phase Lunge = dash with fracture trail; Void Anchor = faceted obsidian/void-crystal shard with silver-violet fracture lines over a small void pool/rift trap; Ground Rift = cracked void fissure; Vertical Phase = rising fracture. Any recognizable real-world object in VFX fails before packing.

## Results

- PASS: `neutral_special_light`, `neutral_special_medium`, `neutral_special_heavy` - shard bursts remain on-model and do not show literal real-world iconography.
- PASS: `forward_special_light` - grey-violet Phase Lunge trail remains on-model and non-literal.
- PASS: `forward_special_medium` - Phase Lunge dash/trail reads as fracture/phase energy; no literal-object finding in this audit.
- FIXED / RESCRUBBED: `forward_special_heavy` - mint-green dash-trail residue was hue-shifted to approved violet/silver in post-processing. Green/chroma detector now reports zero pixels. Contact sheet: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/reports/frame_scrub/forward_special_heavy/fluidity_redraw01_9f_mainbody_trim10_greenfix/forward_special_heavy_numbered_contact_sheet.png`.
- REJECTED / DEMOTED: `back_special_light` - literal anchor glyph appears on the gauntlet/burst. Removed from active preview manifest and pack.
- REJECTED / DEMOTED: `back_special_heavy` - frames 5-6 show a physical nautical anchor projectile. Removed from active preview manifest and pack.
- DEFERRED: `back_special_medium` - previous candidates already rejected for floating/repeated anchor iconography; next healthy-generator attempt must use the canonical obsidian shard plus void pool/rift trap.
- PASS: `down_special_light`, `down_special_medium` - Ground Rift clips read as cracked void fissures, no literal-object finding in this audit.

No other literal-object findings were recorded among the already queued special clips.

## Deferred List After Audit

- `back_special_light` - redo/remove anchor glyphs; canonical Void Anchor VFX only.
- `back_special_medium` - redo; previous candidates were floating/repeated anchor objects.
- `back_special_heavy` - redo VFX passage; body motion passed but anchor projectile fails identity/VFX.
- `down_special_heavy` - generator returned unrelated infographic/non-sprite content.
- `up_special_light` - generator returned unrelated electoral-map/infographic/non-sprite content.
- `up_special_medium` - not attempted after generator corruption halt.
- `up_special_heavy` - not attempted after generator corruption halt.
