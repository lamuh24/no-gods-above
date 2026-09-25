# Swahili Moveset Goal V1 - Combat Concept Review

Status: `awaiting_grouped_human_move_concept_review`  
Candidate-only: `true`  
Deployable: `false`  

These requirements are the maximum safe autonomous progress before move-concept approval. No artwork, authoritative timing, combat values, package promotion, roster entry, or deployment is authorized by this document.

## Core Special Families

### Scythe Control - Heavy

- Animation ID: `special_backward_heavy`
- Intent: Rearward-loaded scythe control that catches forward movement and manipulates close-range spacing.
- Key-pose direction: rear-foot load with weapon lag; canonical hook remains outside the victim volume until contact; recovery preserves scythe mounting and both pistols.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Deep-load control candidate with the greatest range and recovery; any side switch requires separate approval.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Scythe Control - Light

- Animation ID: `special_backward_light`
- Intent: Rearward-loaded scythe control that catches forward movement and manipulates close-range spacing.
- Key-pose direction: rear-foot load with weapon lag; canonical hook remains outside the victim volume until contact; recovery preserves scythe mounting and both pistols.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Quick hook check with minimal displacement and no victim pull.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Scythe Control - Medium

- Animation ID: `special_backward_medium`
- Intent: Rearward-loaded scythe control that catches forward movement and manipulates close-range spacing.
- Key-pose direction: rear-foot load with weapon lag; canonical hook remains outside the victim volume until contact; recovery preserves scythe mounting and both pistols.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Slower hook-and-reel candidate with modest victim displacement pending combat approval.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Low Control Sweep - Heavy

- Animation ID: `special_down_heavy`
- Intent: Grounded low-control family that forces close-range respect without replacing the approved Crouching Light shot.
- Key-pose direction: deep grounded load with stance-aware support; low contact remains visually separate from floor and VFX; planted recovery preserves root and weapon geometry.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Full committed sweep with hard-knockdown candidate, longest startup/recovery, and strict single-hit parity.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Low Control Sweep - Light

- Animation ID: `special_down_light`
- Intent: Grounded low-control family that forces close-range respect without replacing the approved Crouching Light shot.
- Key-pose direction: deep grounded load with stance-aware support; low contact remains visually separate from floor and VFX; planted recovery preserves root and weapon geometry.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Fast low scythe-shaft check; no knockdown; shortest recovery.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Low Control Sweep - Medium

- Animation ID: `special_down_medium`
- Intent: Grounded low-control family that forces close-range respect without replacing the approved Crouching Light shot.
- Key-pose direction: deep grounded load with stance-aware support; low contact remains visually separate from floor and VFX; planted recovery preserves root and weapon geometry.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Broader low hook-control sweep with moderate startup and positional push candidate.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Advancing Weapon Control - Heavy

- Animation ID: `special_forward_heavy`
- Intent: Forward-moving close-range weapon control that carries Swahili into grappler pressure instead of projectile keep-away.
- Key-pose direction: visible planted launch before travel; simulation-owned advance with no sprite-driven collision; braked recovery that remains punishable on whiff.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Longest committed advance with hook-control finish, longest recovery, and no unapproved armor.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Advancing Weapon Control - Light

- Animation ID: `special_forward_light`
- Intent: Forward-moving close-range weapon control that carries Swahili into grappler pressure instead of projectile keep-away.
- Key-pose direction: visible planted launch before travel; simulation-owned advance with no sprite-driven collision; braked recovery that remains punishable on whiff.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Short pistol-frame or forearm entry; fastest recovery; no launch result.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Advancing Weapon Control - Medium

- Animation ID: `special_forward_medium`
- Intent: Forward-moving close-range weapon control that carries Swahili into grappler pressure instead of projectile keep-away.
- Key-pose direction: visible planted launch before travel; simulation-owned advance with no sprite-driven collision; braked recovery that remains punishable on whiff.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Scythe-shaft shoulder drive with moderate travel and body-control hit result candidate.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Pistol Pressure - Heavy

- Animation ID: `special_neutral_heavy`
- Intent: Short-to-mid-range pistol pressure that supports approach and confirms; never a runaway zoning loop.
- Key-pose direction: close guarded presentation with pistols retained; separate muzzle/smoke/shell VFX sockets; recovery returns to close-range threat rather than retreat.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Committed short burst with the longest startup/recovery and strongest close-range push result; never full-screen.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Pistol Pressure - Light

- Animation ID: `special_neutral_light`
- Intent: Short-to-mid-range pistol pressure that supports approach and confirms; never a runaway zoning loop.
- Key-pose direction: close guarded presentation with pistols retained; separate muzzle/smoke/shell VFX sockets; recovery returns to close-range threat rather than retreat.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Fast single pressure shot; shortest reach and recovery; low commitment; no movement.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Pistol Pressure - Medium

- Animation ID: `special_neutral_medium`
- Intent: Short-to-mid-range pistol pressure that supports approach and confirms; never a runaway zoning loop.
- Key-pose direction: close guarded presentation with pistols retained; separate muzzle/smoke/shell VFX sockets; recovery returns to close-range threat rather than retreat.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Two-beat pressure string with a small advancing step; moderate recovery; confirms at close-mid range.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Anti-Air Upward Control - Heavy

- Animation ID: `special_up_heavy`
- Intent: Close-range upward control that protects the grappler's approach space without becoming a vertical projectile.
- Key-pose direction: low loaded anticipation; upward contact silhouette clear from the body; grounded or explicitly authored airborne recovery.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Committed launcher candidate with largest vertical reach and landing/recovery liability; no automatic follow-up.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Anti-Air Upward Control - Light

- Animation ID: `special_up_light`
- Intent: Close-range upward control that protects the grappler's approach space without becoming a vertical projectile.
- Key-pose direction: low loaded anticipation; upward contact silhouette clear from the body; grounded or explicitly authored airborne recovery.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Fast upward pistol-frame check; narrow range; stays grounded.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Anti-Air Upward Control - Medium

- Animation ID: `special_up_medium`
- Intent: Close-range upward control that protects the grappler's approach space without becoming a vertical projectile.
- Key-pose direction: low loaded anticipation; upward contact silhouette clear from the body; grounded or explicitly authored airborne recovery.
- Required phases: distinct anticipation and startup; single readable active/contact role unless later multi-hit approval is explicit; impact exposure with VFX kept separate; variant-specific follow-through; recovery proportional to range, movement, and reward.
- Variant delta: Rising scythe-shaft hook with broader vertical coverage and moderate recovery.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

## Directional And Air Normals

### Air Heavy - committed descending hook sweep

- Animation ID: `air_heavy`
- Intent: High-commitment air normal with a broad downward hook-control silhouette and explicit attack-landing recovery.
- Key-pose direction: clear airborne anticipation; descending hook sweep with rigid scythe continuity; attack-landing recovery branch.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Air Light - compact airborne check

- Animation ID: `air_light`
- Intent: Fast air-to-air check with low commitment and no projectile behavior.
- Key-pose direction: compact airborne chamber; short boot or pistol-frame contact; return to existing falling pose.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Air Medium - cross-body scythe-shaft strike

- Animation ID: `air_medium`
- Intent: Moderate airborne space-control strike that commits torso rotation while preserving facing and landing compatibility.
- Key-pose direction: airborne cross-body load; shaft contact separated from body silhouette; fall-compatible unwind.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Backward Heavy - committed drag-control denial

- Animation ID: `backward_normal_heavy`
- Intent: Slow, high-risk retreating hook-control strike that denies reckless chase and visibly yields space.
- Key-pose direction: large rearward anticipation; single committed drag-control contact; long recovery with no automatic pull or throw.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Backward Light - retreating guard check

- Animation ID: `backward_normal_light`
- Intent: Quick retreat-compatible check that interrupts pursuit while preserving close-range identity.
- Key-pose direction: rearward weight shift; compact elbow or pistol-frame check; guarded recovery without root teleportation.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Backward Medium - retreating low hook check

- Animation ID: `backward_normal_medium`
- Intent: Measured retreating scythe check that discourages forward pursuit without creating full-screen control.
- Key-pose direction: rear-foot load; low shaft or hook threat within close-mid range; weapon-led recovery back to guard.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Forward Heavy - advancing hook-control strike

- Animation ID: `forward_normal_heavy`
- Intent: High-commitment advancing control strike with strong reach and whiff risk; not a replacement for Standing Heavy.
- Key-pose direction: deep loaded step; broad readable hook-control contact; long planted recovery with no side switch.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Forward Light - advancing pistol-frame check

- Animation ID: `forward_normal_light`
- Intent: Fast, close advancing check that supports approach and confirms without becoming a zoning shot.
- Key-pose direction: small forward weight transfer; pistol-frame or forearm contact kept close to the body; short guarded recovery.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Forward Medium - scythe-shaft body control

- Animation ID: `forward_normal_medium`
- Intent: Committed mid-strength advancing body check using the rigid scythe shaft as close-range position control.
- Key-pose direction: hip-led step; shaft contact outside Swahili's body; opponent-facing recoil with weapon geometry unchanged.
- Required phases: clear anticipation/startup silhouette; one readable active/contact pose; impact exposure without baked VFX; follow-through that preserves opponent-facing intent; planted recovery compatible with idle, walk, block, and throw startup.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

## Grabs And Victim Contracts

### Throw corner behavior

- Animation ID: `throw_corner_behavior`
- Intent: Stage-safe resolution contract for forward throw, backward throw, and command grab without sprite scaling or clipping.
- Key-pose direction: capture; corner-aware root resolution; release/impact; recovery.
- Required phases: simulation clamps roots; back throw side switch occurs only if space resolves safely; mirrored parity; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Throw-tech response

- Animation ID: `throw_tech`
- Intent: Mutual break response before capture lock with readable separation and deterministic neutral return.
- Key-pose direction: pre-lock clash; attacker recoil; victim recoil; neutral spacing restore.
- Required phases: command grab remains non-techable unless separately approved; tech window and advantage require combat approval; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Unsupported victim-class variants

- Animation ID: `unsupported_victim_variants`
- Intent: Explicit requirements for small, large, non-humanoid, and extreme-proportion victims.
- Key-pose direction: class-specific capture anchor; class-specific carry/release pose track; class-specific landing result.
- Required phases: standard-height package remains valid only for its declared class; no arbitrary whole-sprite scaling; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

## Reaction Results

### Delayed recovery option

- Animation ID: `delayed_recovery`
- Intent: Simulation-selected delayed wake-up path using a held approved downed pose before the approved rise.
- Key-pose direction: downed hold; wake-up tell; approved rise; neutral return.
- Required phases: hold duration is simulation-owned; no new downed art unless human review finds a visual need; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Ground-bounce compatibility

- Animation ID: `ground_bounce_reaction`
- Intent: Optional combat-result branch with one readable floor impact and deterministic recovery handoff.
- Key-pose direction: descending victim pose; floor impact compression; single rebound; fall/knockdown handoff.
- Required phases: single-bounce default; no rotated idle; stage floor and root remain simulation-owned; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Quick recovery option

- Animation ID: `quick_recovery`
- Intent: Simulation-selected faster recovery path that reuses approved compatible get-up poses.
- Key-pose direction: downed eligibility; quick brace; rise; neutral return.
- Required phases: timing and invulnerability require balance approval; no skipped visual discontinuity; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Soft knockdown result

- Animation ID: `soft_knockdown`
- Intent: Shorter knockdown result reusing approved landing/recovery language without changing hard-knockdown art.
- Key-pose direction: soft impact; brief downed hold; quick recovery handoff.
- Required phases: combat-result selector owns choice; approved hard-knockdown sequence remains unchanged; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

### Wall-bounce compatibility

- Animation ID: `wall_bounce_reaction`
- Intent: Optional combat-result branch for supported victims; not an automatic property of existing attacks.
- Key-pose direction: impact compression; wall contact; outbound tumble; fall/landing handoff.
- Required phases: combat system selects branch; real victim poses only; corner clamp and mirrored parity; authored/mirrored transition compatibility and deterministic replay.
- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.

## Approval boundary

Concept approval authorizes candidate key-pose production only. Key-pose direction, motion quality, game feel, authoritative timing, combat balance, and final production promotion remain separate human gates.
