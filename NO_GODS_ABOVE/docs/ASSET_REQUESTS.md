# ASSET REQUESTS — Everything The Game Needs (for Codex)

Written 2026-07-02 by Claude Code after the engine push (rounds, audio system,
ring-outs, grabs, combo system, juice pack). This is the master production
list. Every engine hook already exists — assets dropped at these exact paths
go live with zero code changes. Missing files degrade silently, so ship
incrementally and highest-priority first.

Research context (why these priorities): breakout fighters (DBFZ, SF6) win on
(1) spectacle that reads instantly, (2) low barrier to entry with real depth
underneath, (3) audio/visual feedback that makes every hit feel earned, and
(4) content beyond versus. The engine now covers depth + accessibility;
these assets deliver the spectacle and feedback.

## PRIORITY 1 — AUDIO (biggest gap in the whole game)

Engine loads these exact paths. Format: OGG (Vorbis), short SFX ≤ 1s,
punchy, layered (impact + body). Generate with AI audio tooling.

`assets/audio/sfx/`
| File | Direction |
|---|---|
| `hit_light.ogg` | quick snap/slap, tight low-mid thump |
| `hit_medium.ogg` | meatier punch, slight crunch |
| `hit_heavy.ogg` | heavy slam, bass drop, brief debris tail |
| `hit_super.ogg` | cinematic explosion hit, sub-bass boom |
| `block.ogg` | metallic/energy deflect "tink + shh" |
| `whoosh.ogg` | fast swing air-cut (engine pitch-shifts per strength) |
| `jump.ogg` | soft launch puff |
| `double_jump.ogg` | airy magical double-hop pop |
| `dash.ogg` | quick air rush |
| `super_dash.ogg` | jet-like homing rush with rising pitch |
| `grab_catch.ogg` | cloth snatch + grip impact |
| `grab_toss.ogg` | heave + body launch whoosh |
| `super_flash.ogg` | dramatic time-stop shimmer/impact sting |
| `ko.ogg` | massive final-blow slam with long tail |
| `ui_move.ogg` | soft menu tick |
| `ui_confirm.ogg` | decisive menu confirm hit |

`assets/audio/announcer/` — deep hype announcer voice (AI voice gen):
`round_1.ogg`, `round_2.ogg`, `final_round.ogg`, `fight.ogg` ("FIGHT!"),
`ko.ogg` ("K.O.!"), `ring_out.ogg` ("RING OUT!").

`assets/audio/music/` — loopable, 90–120s loops:
| File | Direction |
|---|---|
| `title_theme.ogg` | dark celestial choir + heavy drums, "no gods above" menace |
| `battle_theme.ogg` | fast hybrid orchestral/electronic fight track, DBFZ-energy |

Post-launch: one battle theme per stage (`battle_platform.ogg`,
`battle_eclipse.ogg`) — engine extension is trivial.

## PRIORITY 2 — CHARACTER ART (launch roster: Nyx, Lamuh, Sol, Seris)

1. **Lamuh legacy-style redo** — full spec locked at
   `docs/LAMUH_LEGACY_STYLE_REDO_LOCK.md`. Launch-critical.
2. **Grab animation clips** (all 4 launch characters): `grab_reach` (3–4f),
   `grab_hold` (2f), `grab_toss` (4–6f), 448x448, baseline 382, per the
   sprite standard. Engine currently borrows walk/idle poses — these clips
   replace that.
3. **Sable delayed / key-pose restart** - do not ship the current
   animator-rebuild-v2 pack. Sable remains visually/gameplay approved, but the
   current animation packs are not Steam/demo release-ready. Restart with the
   key-pose-first plan in
   `assets/characters/sable/reports/sable_key_pose_restart_plan.md` before any
   post-launch roster add.
4. **Celeste final art completion** — post-launch roster add.
5. Every new attack clip ships with smear frames + anticipation/impact/
   follow-through keys + `hitFrames`/`phaseFrames` metadata (see
   `docs/COMBO_SYSTEM.md` and the Lamuh lock doc).

## PRIORITY 3 — UI / PRESENTATION ART

- Round-win pip icon (small diamond/emblem, lit + unlit) — engine currently
  draws procedural diamonds; art replaces them later.
- Announcer splash art (optional): "ROUND 1/2", "FINAL ROUND", "FIGHT!",
  "K.O.", "RING OUT" as stylized PNGs — engine currently renders styled text.
- Victory portrait per launch character (half-body, dramatic) for the win
  screen.
- Mode panel art referenced by code: `assets/ui/flow/mode_panel_versus.png`,
  `mode_panel_training.png`, `mode_panel_arcade.png`, `mode_panel_online.png`
  (verify existing set is complete and on-style).
- Stage select thumbnails for the 3 stages.

## PRIORITY 4 — STAGE ART

- Platform Arena: below-ledge dressing (falling depth, clouds/void under the
  stage) so ring-outs read; edge highlight strip on the ledges.
- One new launch-flavor stage backdrop (post-launch OK).

## PRIORITY 4.5 — APP ICONS (mobile/PWA, engine already references these paths)

`assets/ui/app/`
| File | Size | Notes |
|---|---|---|
| `icon_192.png` | 192x192 | PWA manifest icon, maskable-safe margins |
| `icon_512.png` | 512x512 | PWA manifest icon, maskable-safe margins |
| `apple_touch_icon.png` | 180x180 | iOS home-screen icon, no transparency, full-bleed |
| `icon_1024.png` | 1024x1024 | App Store icon (Capacitor build later) |

Design: the NGA emblem/eclipse mark on the dark crimson-void palette; must
read at 60px. No text beyond the logo mark.

## PRIORITY 5 — STEAM STORE (user + Codex, AI-generated)

- Capsule images: 616x353, 231x87, 460x215, 1232x706, library 600x900 +
  hero 3840x1240. Key art: the four launch fighters, "NO GODS ABOVE" title
  treatment.
- 5–8 store screenshots at 1920x1080 (real gameplay, juiced moments:
  ultimates, ring-outs, grabs, big juggles).
- Trailer: gameplay capture cut with Seedance-generated cinematic character
  shots. Per standing user rules: Seedance 2.0 only, generate ONE clip at a
  time and verify before the next.

## Sequencing recommendation

Day 1: all Priority 1 audio (announcer + hits first — they transform feel
immediately) while Lamuh redo generation starts.
Day 2: Lamuh redo completion + grab clips; UI pips/victory portraits.
Day 3: stage dressing, store assets, trailer capture.
