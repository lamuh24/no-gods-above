# Lamuh Legacy V2 animation-feel benchmark

Status: **candidate-only**. This benchmark describes the first-playable review bar; it does not approve production art, combat values, grabs, throws, roster integration, or deployment.

Lamuh V2 succeeds only when motion continuity survives the architecture migration. The seven-frame Standing Heavy candidate therefore retains the V1 order of intent: loaded stance, weight gather, launch, contact, overshoot, same-leg recoil, and rotational settle. The approved style checkpoint guides rendering, while the protected V1 cells remain the choreography authority.

## Motion bar

- Momentum must pass through the hips, torso, striking limb, coat, and locs without pose teleporting.
- The screen-right leg stays the striking leg through chamber, contact, overshoot, and recoil.
- Intentional compression, extension, lean, smear, and follow-through remain allowed.
- Gameplay root remains fixed. Body-center movement is visible counterbalance, not hidden root travel.
- P2 is a lossless runtime mirror of P1; no mirrored filler frames are authored.
- Character scale is sequence-wide. Normalization may align authored root landmarks but may not visually recenter or independently rescale frames.
- Contact must not create an apparent camera zoom: launch, contact, and overshoot must keep comparable head, torso, planted-leg, and costume-detail scale even though the extended kick widens the silhouette.

## Timing bar

- Historical V1 duration is 31 ticks. Its displayed per-pose holds are reconstructed evidence, not recovered authored timing.
- Candidate A is the current Legacy runtime rhythm at 32 ticks, not historical V1.
- Candidate B is the 37-tick readability pass. It exposes anticipation, follow-through, and recovery while keeping the frame-02-to-03 strike acceleration fast.
- Candidate C is the 42-tick heavier alternate. It must not make Lamuh feel like Swahili.
- Hitstop and pose exposure are orthogonal. Review 8, 9, and 10 hitstop ticks without changing damage, hitstun, blockstun, knockback, cancels, or recovery.

## Impact bar

- One visible boot impact equals one gameplay hit.
- Frames 01–02 may gather restrained energy but must not resemble an early palm contact. The retained frame 01 uses a guarded half-closed lead hand with no burst or detached droplets.
- The contact body is used on whiff. The hit composite is allowed only after a real hit or block outcome.
- Frame 04 is a distinct no-hit overshoot, not the duplicated V1 contact cell and not a second impact.
- Frame 05 exposes recoil; frame 06 visibly approaches neutral so the exit does not pop.

## Transition bar

Internal motion is insufficient by itself. Human review must exercise both facings and relevant center/corner setups for idle, walk, dash, crouch, jump/air-light/landing, block, hit recovery, normal recovery, grab whiff, each throw, and Ascend Step return. No transition blend may add gameplay frames.

## Technical bar

- Deterministic 60 Hz simulation owns attack phases, collision, hitstop, events, replay, checksum, and state return.
- Individual normalized source frames and metadata remain candidate source truth. The renderer never advances gameplay.
- Presentation event IDs remain deterministic and deduplicated under repeat, replay, and snapshot restore.
- All seven normalized frames have real alpha, cleared background, safe padding, a fixed normalized root, distinct hashes, and no purple/magenta contour.
- Candidate, deployable, production, roster, and approval boundaries remain explicit.

The final human question is unchanged: **did V2 retain or improve the smoothness of V1?** If not, the correct status is `REJECTED_V2_LOST_V1_FLOW` or the narrower requested rejection enum.
