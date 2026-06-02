# No Gods Above Agent Skills

These repo-local playbooks capture production lessons from Kairo, Vanta, Nyx, Sol, Seris, LAMUH, UI packs, VFX passes, local versus, deployment, and commit hygiene.

They are Markdown skills for future Codex/ChatGPT agents working inside this repo. Load the relevant file before changing code, art, UI, VFX, or deployment state.

## Skill Index

- [Playable Character Production Skill](playable_character_production_skill.md): use when creating a new fighter from concept lock through hidden runtime and public roster.
- [Sprite Sheet Validation Skill](sprite_sheet_validation_skill.md): use before packaging or wiring any generated sprite, corrected row, VFX atlas, or body sheet.
- [Character Visual Consistency Skill](character_visual_consistency_skill.md): use when checking whether later sheets still match the approved identity anchor.
- [VFX Integration Audit Skill](vfx_integration_audit_skill.md): use when importing, anchoring, enabling, disabling, or reviewing VFX.
- [Cinematic Ultimate Production Skill](cinematic_ultimate_production_skill.md): use for staged cinematic supers, body/VFX asset planning, hit-confirm runtime, and victim choreography.
- [Local Versus Feature Skill](local_versus_feature_skill.md): use for P1/P2 select state, inputs, meter, ultimate, same-character mirror, and local-versus smoke.
- [Fighting Game Balance Pass Skill](fighting_game_balance_pass_skill.md): use only for explicit gameplay tuning requests.
- [UI Asset Pack Integration Skill](ui_asset_pack_integration_skill.md): use when importing generated HUD, select, menu, overlay, or UI accent packs.
- [Deployment Readiness Skill](deployment_readiness_skill.md): use before public/demo deploys and live verification.
- [Git Checkpoint Safety Skill](git_checkpoint_safety_skill.md): use before any checkpoint commit in this dirty asset-heavy repo.

## Recommended Order For A New Character

1. Character visual consistency skill.
2. Playable character production skill.
3. Sprite sheet validation skill.
4. Hidden runtime test.
5. Public enablement.
6. Git checkpoint.

## Recommended Order For A Cinematic Ultimate

1. Cinematic ultimate production skill.
2. Sprite sheet validation skill.
3. VFX integration audit skill.
4. Hidden runtime test.
5. Git checkpoint.

## Recommended Order Before Deployment

1. Deployment readiness skill.
2. Local versus smoke.
3. Git checkpoint.

## General Guardrails

- Read `SESSION_CONTEXT.md` before any work.
- Do not change gameplay during docs/art/import-only passes.
- Do not start controller support or online multiplayer unless explicitly requested.
- Do not restore Seris Sheet 8 regular gameplay VFX without explicit approval.
- Do not add missing/future assets to runtime paths.
- Do not stage cache, pycache, Chrome profiles, loose screenshots, rejected art, or unrelated debug files.

