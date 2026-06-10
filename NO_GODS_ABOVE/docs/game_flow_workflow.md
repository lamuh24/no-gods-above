# Game Flow Workflow

Updated: 2026-06-10

## Current Runtime State

`NO_GODS_ABOVE` is a static browser game built with plain HTML, CSS, and JavaScript Canvas. There is no bundler or package-managed app shell. The deployable runtime is:

- `index.html`
- `style.css`
- `game.js`
- relative files under `assets/`

The active UI surfaces are:

- Main menu with `Online Versus`, `Local Versus`, `Training`, `Arcade` (coming soon), and `Settings / Controls`.
- Mode detail screen with mode-specific copy and CTAs.
- Online setup menu for PeerJS host/join room flow.
- Fighter Select screen.
- Fighter Showcase / Confirm screen.
- Stage Select screen.
- Match Intro screen.
- Canvas match view with DOM HUD.
- Match-flow overlay for pause, win, rematch, and return-to-select.

## Multiplayer Flow

Online Versus is Phase 1 PeerJS netplay:

- Host creates and shares a 5-character room code.
- Guest joins by code through the online menu.
- After connection, both players enter Fighter Select.
- Host is P1; guest is P2.
- Guest uses the P1 keyboard layout locally, but inputs drive P2 over the network.
- The host simulates the authoritative match and sends snapshots to the guest.
- Stage selection is host-controlled and synchronized to the guest.
- Host confirms the stage into Match Intro, then starts the match from the intro screen.

Local Versus uses the same match setup screen without PeerJS:

- P1 locks a fighter.
- P2 locks a fighter.
- Arena is selected last.
- The match starts only from the arena step.

Training uses the setup screen with one player fighter and an auto-selected dummy rival.

## Character Selection

Public selectable fighters are:

- Kairo Final
- Vanta Reign
- Nyx
- Sol Raze
- Seris
- LAMUH
- LAMUH Legacy
- Celeste

The runtime keeps separate P1/P2 state objects. Same-character mirrors use the same loaded asset set and code-side facing/mirroring, not separate left-facing sheets.

## New Sequential Workflow

The previous setup screen combined match mode, fighter selection, and stage selection at once. The workflow is now explicit:

1. Main Menu
   - Choose Online Versus, Local Versus, Training, Arcade (coming soon), or Settings / Controls.

2. Mode Detail
   - Online exposes Host Match and Join Match.
   - Local Versus exposes Continue.
   - Training exposes Free Training and Training Dummy.

3. Fighter Select
   - Training: choose the player fighter, then continue.
   - Local Versus: choose P1, then choose P2.
   - Online Versus: each peer chooses their own fighter and waits for the other.

4. Fighter Showcase / Confirm
   - The selected fighter gets a large portrait, archetype, difficulty, playstyle, strengths, and quote.
   - Confirm locks the current side and returns to Fighter Select for P2 when needed.

5. Stage Select
   - Choose `Platform Arena`, `Standard Arena`, or `Eclipse Rooftop`.
   - Online guest sees the host-selected arena and waits.

6. Match Intro
   - Shows P1, P2/dummy, stage preview, stage name, and matchup quote.
   - Local/training/online host starts the match from this screen.

7. Fight
   - Canvas match view, HUD, pause/rematch/return-to-select overlay flow.

## Eclipse Rooftop Stage

`eclipse_rooftop` uses the supplied production asset pack under:

```text
assets/stages/eclipse_rooftop/
```

Runtime layers:

- `01_far_background_16x9.png`: far background, opaque, screen-space cover.
- `02_midground_layer_transparent.png`: transparent midground, screen-space cover with light horizontal parallax.
- `03_main_platform_transparent.png`: main floor art, world-space draw rectangle `{ x: 150, y: 420, w: 2300, h: 540 }`.
- `04_side_platform_left_transparent.png`: left side platform art, world-space draw rectangle `{ x: 450, y: 270, w: 660, h: 390 }`.
- `05_side_platform_right_transparent.png`: right side platform art, world-space draw rectangle `{ x: 1490, y: 330, w: 650, h: 350 }`.
- `06_foreground_layer_transparent.png`: foreground framing overlay, clipped to side and bottom screen bands with `alpha: 0.74`.
- `07_stage_select_card_16x9.png`: Stage Select / Match Intro preview image.

Gameplay collision stays simple and gameplay-first:

- Main floor: `groundY: 590`, bounds `left: 96`, `right: 2504`.
- Left platform: `{ x: 650, y: 436, w: 310, h: 24, dropThrough: true }`.
- Right platform: `{ x: 1640, y: 436, w: 310, h: 24, dropThrough: true }`.
- Spawns: P1 `720`, P2 `1880`.
- Camera: `minScale: 0.66`, `maxScale: 1`, `paddingX: 360`, `damping: 8`.

## Implementation Notes

- Added `state.flowStep` alongside `state.selectStep` so the new screens can coexist with the existing select/gameplay state.
- Reused existing fighter state: `selectedPlayerId`, `selectedP1CharacterId`, `selectedP2CharacterId`, `activeSelectSide`, `p1Ready`, `p2Ready`, and `selectedStagePresetId`.
- Kept existing `startTraining()`, `startLocalVersus()`, and `startOnlineVersus()` entry points.
- Changed only setup flow/UI behavior; combat, character data, sprite loading, hitboxes, and net snapshot logic are unchanged.
- Added step-aware keyboard and gamepad navigation.
- Online lock/unlock messages move both peers between Fighters and Stage Select consistently.
- Online adds an `intro` sync message before the existing `start` message.
- Eclipse Rooftop adds a narrow stage-specific layered renderer; Standard Arena and Platform Arena rendering are unchanged.

## Breaking Changes

- The main menu now routes through Mode Detail rather than opening the old shared setup panel directly.
- Fighter cards open Fighter Showcase first; fighters lock only after `Confirm Fighter`.
- Local Versus no longer starts immediately after P2 lock-in; users must confirm Stage Select and Match Intro.
- Online host no longer starts from arena confirmation alone; host confirms Stage Select, lands in Match Intro, then starts.

## Dependencies

No new runtime dependencies were added.

Existing external dependency:

- `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js` for Online Versus signaling/WebRTC setup.

If PeerJS or the PeerJS cloud is unavailable, local Training and Local Versus remain usable.
