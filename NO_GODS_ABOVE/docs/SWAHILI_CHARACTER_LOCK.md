# Swahili Character Lock

Tracking: GitHub Issue #1.

## Status And Stop Line

Swahili is approved in this document only as a gated production target. This change does not implement him, add runtime assets, add him to `selectableCharacterIds`, load him in public mode, or authorize deployment. Runtime work requires a separate implementation Issue and branch after this documentation gate is reviewed and merged.

## Identity

- Name: Swahili.
- Title: Divine Debt Collector.
- Species/body type: anthropomorphic pig (`Sus scrofa`), male-presenting, broad and heavy, approximately 6 ft 2 in / 265 lb in the supplied reference.
- Role: mid-range punish / contract trap / luxury zoner-bruiser.
- Tone: terrifying supernatural broker and executioner; wealthy, bored, precise, and disrespectfully calm.
- Personality rule: he is never comic relief. Pig anatomy is presented with the same seriousness as every other divine fighter.
- Source of truth: the user-supplied `swahili char reference image.png`, including front, back, side, three-quarter, head, pistol, tie, accessory, palette, and full scythe callouts.

## Visual Lock

Swahili has pink pig skin, a broad snout, upright ears, small tusks, a gold nose ring, and a stern unimpressed face. His silhouette is a large tailored torso framed by a long split-tail black coat and a taller scythe arc behind him.

His outfit is fixed:

- black tuxedo jacket and black vest;
- white dress shirt;
- long black necktie with subtle warm-gold floral/ledger ornament, never a bow tie;
- flowing black coat with visible warm-gold floral lining and restrained gold embroidery;
- tailored black trousers;
- black dress shoes with gold toe/side ornament;
- gold rings, pocket chain, pig-emblem belt buckle, nose ring, and small lapel pin.

The palette is black, near-black, dark gray, white, warm old gold/brass, muted brown-gold, and pink skin. Gold is an accent and magic language, not a full-body tint.

## Weapon Lock

Swahili carries two black semi-automatic pistols with restrained gold trim and small pig/contract emblems. Their proportions, slide shape, grip shape, and black-first palette stay consistent. Firing recoil is small and controlled.

The Final Signature is a massive ornate black-and-gold scythe. It must always preserve:

- long black segmented shaft;
- pointed gold lower end cap;
- huge curved black blade with gold cutting-edge trim;
- warm-gold filigree inside the blade;
- boar/pig crest at the blade mount;
- hanging gold chain and charm;
- readable one-piece construction and consistent handedness.

Do not shorten it into a sickle, turn it into a generic polearm, remove the crest/charm, swap blade direction, or let the shape mutate between frames.

## Animation Language

- Right-facing source art.
- Heavy, smug, precise movement with no flailing or acrobatics.
- Controlled scythe arcs with readable anticipation, one held contact pose, follow-through, and committed recovery.
- Coat tails and gold lining trail body motion; they never lead the action or become weapon shapes.
- The long tie stays attached, keeps its front/back pattern, and follows secondary motion without becoming a rope or attack limb.
- Rings and gold details may flash only at contact/hitstop.
- Idle is upright, dangerous, and bored, with subtle coat breathing and an occasional tie adjustment.
- Dash is a short heavy burst; jump is a small heavy hop.
- Same face, skin, body scale, outfit, scythe, pistols, lighting direction, and facing across every clip.

## Gameplay Lock

Swahili is a medium-high difficulty mid-range trap and whiff-punish fighter.

- Health target: 1050, subject to human playtest before final tuning.
- Walk: approximately 0.85 of standard.
- Dash: approximately 0.95 of standard.
- Backdash: approximately 1.10 of standard with only brief, explicitly tested invulnerability.
- Jump height: approximately 0.85 of standard; low air mobility; slightly fast fall; heavy weight.
- Defense modifier target: 1.02.
- Strengths: long-range confirms, anti-air control, whiff punishment, traps, scary mark conversions.
- Weaknesses: large hurtbox, slow heavies, punishable reload/recovery, weak close scramble without meter.

All values are character-local overrides. Do not change shared combat constants or existing fighters while importing Swahili.

## Debt Halo: Final Notice

Debt Marks are opponent-bound timed status instances owned by Swahili.

- Maximum 5 marks.
- Each mark has its own 8-second lifetime.
- A successful marked special refreshes remaining mark lifetimes.
- At 5 marks, the opponent becomes `Defaulted` for 3 seconds.
- The next qualifying scythe special consumes `Defaulted` and gains bonus hitstun plus one wall bounce, respecting the global per-combo bounce cap.
- Swahili knockdown removes 2 seconds from each active mark lifetime.
- Hitstop pauses mark countdown; normal hitstun does not erase marks.
- Explicit consumers remove only the required marks; marks never vanish merely because Swahili whiffed.
- Ultimate consumes all marks and scales its bonus once from the captured pre-cinematic count.

Required sources are 5H counter hit (+1), clean 2H anti-air (+1), Back Special family hit/trigger (+1), Neutral Heavy Special hit (+1), successful Default Judgment (+2), and throw (+1).

Public HUD work must reuse the existing meter layout and add compact gold seals near the marked opponent meter; it must not replace the current health bars or meters. Hidden training mode may expose exact mark count and remaining lifetimes.

## Move Coverage Contract

Swahili requires the full serious-playable surface before public review:

- 15 normals: standing L/M/H, crouching L/M/H, jumping L/M/H, forward L/M/H, back L/M/H.
- 15 specials: Neutral, Forward, Back, Down, and Up families, each with distinct L/M/H variants.
- Forward and back throws plus whiff.
- `Paid in Full` ultimate with hit, whiff, blocked, and cinematic behavior.
- Movement, defense, hit reactions, knockdown/getup, intro, round start, taunt, win, lose, time-over, and mirror intro.
- Sound, voice, VFX, hitbox/hurtbox, cancel-route, AI, move-list, combo-trial, and palette metadata.

The move names, intent, frame targets, cancel routes, voice lines, AI priorities, and combo examples in the user brief are the design source. Frame values are implementation targets, not accepted balance, until human playtest evidence exists.

## Runtime Atlas Contract

The brief permits another layout if the current engine standard has changed. The current new-generation No Gods Above standard is therefore authoritative:

- 448 x 448 prepared cells.
- 6 columns x 5 rows per clean runtime body atlas.
- Exact atlas dimensions: 2688 x 2240.
- Six source frames per row; row-specific runtime frame counts may be lower, with unused cells transparent rather than invented motion.
- Final runtime PNGs are transparent RGBA with real alpha.
- Candidate generation may use a uniform removable chroma background, but chroma sources remain in review and never become runtime assets.
- Right-facing source art, bottom-center anchor, fixed source cells, no runtime trimming, and shared grounded baseline target `baselineY: 382` unless Sheet 1 validation proves a character-specific adjustment is necessary.
- No text, labels, numbers, grid lines, UI, debug marks, or neighboring-frame overlap.
- Travel for dash, projectiles, traps, lunges, knockback, and camera movement is code-driven.

The user brief's 8 x 6 layout is not the active runtime format because the current new-generation engine pipeline uses 6 x 5 sheets. Do not mix 8 x 6 and 6 x 5 sheets in Swahili's active folder.

## Exact Sheet Map

Each row is one six-cell clip. Produce and validate exactly one sheet at a time.

1. `swahili_sheet_1_core_movement_atlas.png`: idle; walk forward; walk backward; dash forward; dash backward.
2. `swahili_sheet_2_air_crouch_movement_atlas.png`: jump start/up; jump forward; jump backward/fall; land; crouch/crouch idle.
3. `swahili_sheet_3_ground_normals_a_atlas.png`: stand light; stand medium; stand heavy; crouch light; crouch medium.
4. `swahili_sheet_4_ground_air_normals_b_atlas.png`: crouch heavy; jump light; jump medium; jump heavy; forward light.
5. `swahili_sheet_5_directional_normals_atlas.png`: forward medium; forward heavy; back light; back medium; back heavy.
6. `swahili_sheet_6_neutral_forward_specials_atlas.png`: neutral L; neutral M; neutral H; forward L; forward M.
7. `swahili_sheet_7_forward_back_specials_atlas.png`: forward H; back L; back M; back H counter stance/retaliation; counter success recovery.
8. `swahili_sheet_8_down_up_specials_atlas.png`: down L; down M; down H; up L; up M.
9. `swahili_sheet_9_up_throw_actions_atlas.png`: up H; forward throw; back throw; throw whiff; taunt tie adjust.
10. `swahili_sheet_10_defense_reactions_atlas.png`: stand/crouch/air block; high hit; low hit; air hit/launch; stagger/guard break.
11. `swahili_sheet_11_knockdown_flavor_atlas.png`: wall/ground bounce; knockdown/hard knockdown; getup/wakeup; intro/round start; win/perfect win/lose.
12. `swahili_sheet_12_ultimate_body_atlas.png`: startup/flash body; shadow shots; ledger/tie beat; scythe contact; finish/recovery.

Where a row groups closely related state clips, the animation manifest must define exact occupied cells and frame ranges. No runtime code may guess them.

Detached assets live separately under `NO_GODS_ABOVE/assets/effects/swahili/`: pistol projectiles/muzzle flashes, contract seals, trap, counter shield, ledger, black-gold slash, impact shockwave, and optional super flash. Body sheets must remain body-first and readable.

## Production Order And Gates

1. Copy the supplied reference into a traceable review/source folder with provenance; never load from Downloads at runtime.
2. Generate Sheet 1 only as the identity anchor.
3. Normalize to the runtime contract without overwriting the source.
4. Produce a full contact sheet, numbered row strips, row GIFs, measurement report, and scale comparison.
5. Run the frame-scrub check at gameplay and half speed.
6. Require human/Claude approval of Sheet 1 before any later body sheet.
7. Produce remaining sheets one at a time in numbered order, repeating the same gates.
8. Keep generated work in review; integrate only validated atlases and intended aliases.
9. Implement hidden runtime behind `?swahiliTest`; public mode must not request Swahili assets.
10. Run P1/P2, both-facing, hit/be-hit, move-matrix, Debt Mark, trap, counter, projectile, ultimate hit/whiff/block, console, and network smokes.
11. Add a select portrait only after hidden runtime passes.
12. Public enablement requires a separate approved Issue, approved portrait, public smoke, and human instruction.

## Automatic Rejection Rules

Reject any frame, row, or sheet with identity drift, humanized facial redesign, comic expression, bow tie, missing long tie, missing coat lining, weapon shape drift, swapped pistols, scythe blade flip, missing crest/charm, cropped body/weapon, neighboring-cell bleed, duplicated body, detached anatomy, scale pumping, facing/lighting flip, prop teleport, unreadable contact, extra visible hits, fake transparency, text, labels, or instant recovery snap.

Generated source art is never sufficient proof by itself. A sheet becomes runtime-eligible only after technical validation, visual consistency review, frame-scrub approval, and hidden smoke.

## Implementation Boundaries

- Do not change existing fighters, global combat values, shared input routing, public roster, health bars, or deployment files.
- Do not implement air Back Special traps.
- Do not convert single-hit moves to multi-hit to match accidental artwork.
- Do not expose boss-mode advantages in normal versus play.
- Do not add voice recordings or paid generation without separate approval; create hooks and line manifests first.
- Preserve old/fallback assets until the replacement is validated and approved.
