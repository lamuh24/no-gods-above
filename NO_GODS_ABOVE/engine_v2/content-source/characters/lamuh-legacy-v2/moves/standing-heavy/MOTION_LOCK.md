# Lamuh Legacy V2 Standing Heavy — V1 motion lock

Status: **candidate-only motion source truth**. No V2 motion, timing, combat profile, runtime art, or production approval is implied.

The rebuilt sequence must retain the V1 progression around its fixed gameplay root: low loaded anticipation → weight gather and torso turn → compressed acceleration → right-leg high-kick contact → authored impact exposure → raised-knee recoil → low rotational recovery.

Frames 03 and 04 are byte-identical in V1. V2 preserves the intended impact exposure but resolves the duplicate-art gap with a distinct, no-hit overshoot at frame 04 before the frame-05 recoil. The source audit also identifies multiple impact-like moments: frames 01–02 carry a bright hand effect, while the recovered V2 mapping has only one gameplay contact at frame 03. The rebuild preserves the hand/shoulder rotation and cyan energy gather but removes any early contact read. Visible impacts and engine hits remain 1:1.

## Non-negotiable motion constraints

- Right leg remains the striking limb for the entire clip.
- Root stays authored at `(224, 382)`; body-center movement is not root motion.
- No per-frame recentering, scale fitting, or baseline fitting.
- The strike acceleration between source frames 02 and 03 stays fast.
- Added readability belongs primarily in anticipation, contact exposure, follow-through, and recovery.
- Contact art derives from the exact approved style checkpoint; frame 04 is a distinct no-hit follow-through with no second spark.
- Hair and coat lag must resolve across recoil and recovery.
- One visible kick contact equals one engine hit.

The machine-readable evidence and exact source hashes are in `motion-lock.v1.json`.
