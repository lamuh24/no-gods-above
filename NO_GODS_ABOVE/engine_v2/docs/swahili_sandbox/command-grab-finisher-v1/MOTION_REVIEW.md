# Swahili Command Grab Far Launch / Visual Hit V1

Status: `candidate-only`  
Deployable: `false`  
Gate: `awaiting_human_command_grab_far_launch_visual_hit_review`

## Motion Review

- The approved 24-frame Swahili attacker sequence remains byte-identical.
- The victim now accelerates out of the rotational release into a far opposite-side launch instead of hanging near Swahili.
- Shot separation is `305.51` simulation units; maximum separation is `334.51`.
- The victim remains airborne through source tick `64` and lands at source tick `73`.
- The pistol muzzle, tracer, and torso impact are move-specific mirrored sockets.
- Visible shot impacts: `1`. Registered visual shot hits: `1`.
- The corner candidate clamps to the stage-safe margin without losing the opposite-side result.

## Review Note

The weight is carried by the existing scythe swing. This pass changes only the simulation-owned post-release victim trajectory and separate presentation VFX. The launch eases outward after the release impulse, holds the victim far enough away for the pistol shot to read, then converts the one shot into the existing articulated fall. No body art, scythe pixels, damage values, roster files, atlas, or legacy runtime were changed.
