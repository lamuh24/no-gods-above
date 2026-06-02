# Playable Character Production Skill

Purpose: produce a new No Gods Above fighter from concept lock to public roster without breaking existing fighters.

Use this when adding or planning a playable character. Do not use it for balance-only tuning, controller support, online multiplayer, or combat-system rewrites.

## Non-Negotiable Guardrails

- Do not change existing fighters unless the task explicitly asks for a shared fix.
- Do not add a character to `selectableCharacterIds` until hidden runtime smoke passes and the select portrait is approved.
- Do not generate multiple sheets ahead of validation unless the user explicitly accepts batch risk.
- Do not use old/rejected art folders as runtime sources.
- Do not change global combat values while importing a character; use character config overrides.
- Keep P1 and P2 mappings in scope from the first runtime pass.
- Keep hidden helpers URL-gated and out of public mode.

## Production Pipeline

1. Create a character lock document under `NO_GODS_ABOVE/docs/`.
2. Lock identity: name, role, silhouette, palette, outfit, hair/weapon rules, power source, and "never do" rules.
3. Choose runtime format:
   - Legacy Kairo/Vanta style only for legacy repair.
   - New-generation Sol/Nyx/Seris/LAMUH profile-driven style for new fighters.
4. Write exact sheet contracts before generation:
   - folder
   - file names
   - atlas size
   - grid
   - cell size
   - baselineY
   - frame counts
   - right-facing source art
   - fixed source cells
   - no trimming
5. Produce Sheet 1 as the identity anchor.
6. Validate Sheet 1 before moving on.
7. Produce remaining body sheets in safe order:
   - Sheet 2 air movement
   - Sheet 3 ground normals
   - Sheet 4 air normals
   - Sheet 5 specials
   - Sheet 6 defense/hit reactions
   - Sheet 7 knockdown/recovery/flavor
8. Generate contact sheets and row GIFs for every sheet.
9. Package transparent runtime atlases.
10. Add hidden/dev runtime implementation only.
11. Smoke test hidden P1 and P2.
12. Add or import select portrait.
13. Public-enable only after portrait and hidden runtime pass.
14. Run public smoke.
15. Create checkpoint commit with scoped staging.

## Character Lock Checklist

- Identity summary is explicit.
- Visual lock includes hair, outfit, palette, silhouette, and power language.
- Weapon/power rules say what must never happen.
- Runtime format is stated.
- Sheet production order is stated.
- Sheet 1 exact contract is stated.
- Public enablement stop line is stated.

LAMUH lesson: locs were locked as hair only. That rule prevented later VFX/ultimate passes from turning hair into generic spikes, whips, or attack shapes.

Seris lesson: chain/VFX identity can poison body readability if not separated early. Lock whether a power is body art, attached VFX, detached VFX, or reference-only before runtime.

Nyx lesson: final art should use dedicated `*_final` folders and clear select portraits; do not leave placeholders half-public.

Sol lesson: new-generation fighters should use clean 448px prepared cells and row-specific frame counts when that format is chosen.

## Hidden Runtime Implementation Checklist

- Add asset paths and sheet metadata.
- Add profile config with raw attack data.
- Hydrate player and enemy move maps.
- Map every animation key and enemy-prefixed counterpart.
- Keep the character out of public `selectableCharacterIds`.
- Add hidden helper only behind a URL flag such as `?lamuhTest`.
- Confirm public mode does not request hidden assets if the character is not enabled.

## Public Enablement Checklist

- Select portrait exists and matches roster format.
- Character card text, role, and portrait are wired.
- Character is added to `selectableCharacterIds`.
- P1 select works.
- P2 select works.
- Match starts against existing roster.
- Character can hit and be hit.
- No failed asset requests.
- No console errors.
- Public hidden helpers are not exposed.

## P1/P2 Smoke

- P1 idle, walk, dash, jump, crouch.
- P2 idle, walk, dash, jump, crouch.
- P1 normals and specials.
- P2 normals and specials.
- Both sides can damage and take damage.
- Facing and mirroring work left and right.
- P2 air dash animation is not mismapped.
- Meter and ultimate are safe, even if placeholder.

## Commit Checkpoints

Use separate commits for:

- character planning contract
- approved sheet packaging
- hidden runtime implementation
- public enablement
- directional specials or unique kit work
- accepted gameplay documentation

## Prompt Template

```text
Create a locked character planning document for [NAME].
Do not implement runtime yet.
Use the current new-generation fighter pipeline.
Return the sheet contracts, guardrails, and safe implementation order.
```

```text
Implement [NAME] hidden runtime only.
Do not add to selectableCharacterIds yet.
Run P1/P2 hidden smoke and report missing assets or animation gaps.
```

