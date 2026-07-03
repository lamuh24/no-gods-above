# Sable Style 4 Redo Prompt: crouch

Preview-only candidate art. Do not promote to live roster.

## Goal

Redo only Sable's `crouch` animation in the correct Sable anchor style.

This replacement must preserve the approved Sable identity from the current preview anchors:

- `assets/characters/sable/normalized/idle/v20260627-015723/sable_idle_normalized_strip.png`
- `assets/characters/sable/normalized/block/v20260628-181327/sable_block_normalized_strip.png`
- `assets/characters/sable/normalized/hit_stun/v20260628-182024/sable_hit_stun_normalized_strip.png`

The older crouch and walk are useful only as style-family references. They are not approval references:

- crouch must be redone because the effects read as placeholder-like.
- walk must be redone later because it reads more like a skip than a walk.

## Output Contract

Return exactly one sprite sheet image:

- horizontal strip only
- exact size: `3584x448`
- exactly 8 equal frames
- each frame: `448x448`
- transparent RGBA background with real alpha
- Sable faces right in every frame
- feet/ground contact aligned to baselineY `382`
- body centered around frame center x `224`
- full character stays inside every cell
- no second row, no grid, no visible cell borders
- no labels, text, watermark, UI, background, floor, scenery, or frame numbers

## Locked Sable Identity

Sable is a dark-skinned Black female fighter with mature HD pixel anime fighter proportions.

Preserve all of these:

- short tight rounded curls with subtle light/silver tips, never long hair
- silver eyes and focused elegant fighter face
- sleek navy-black bodysuit
- subtle silver and obsidian fracture panel lines
- athletic 2.5D fighting-game silhouette
- obsidian forearm wraps and void-crystal hand/forearm accents
- crisp dark outline
- clean Style 4 HD pixel anime fighter shading
- no weapons, no coat, no gold pendant, no Lamuh visual language

## Motion Direction

Create a loopable crouching guard animation:

- frame 1 begins in a clear low crouching guard pose
- frames 2-7 show subtle breathing, shoulder/hand readiness, and small weight shifts
- frame 8 returns cleanly toward frame 1 for a seamless loop
- Sable remains low and grounded for the entire strip
- both feet or the crouch contact points stay visually stable on the baseline
- keep the head, torso, hips, and legs proportional to the approved idle/block/hitstun style
- do not turn this into a jump, dodge, slide, attack, or standing idle

## Effect Rules

The previous crouch failed because the effects looked placeholder-like. Fix that.

Allowed:

- tiny attached obsidian crystal glints near forearms and hands
- restrained silver fracture highlights along gloves/forearm wraps
- subtle cool violet rim accents that stay attached to the character

Forbidden:

- flat purple placeholder shapes
- simple circles, rectangles, stick shapes, or UI-like geometry
- large detached shards or debris
- body-sized VFX blobs
- copied fragments from previous frames
- duplicate limbs, duplicate heads, detached hands, detached feet, or stray body pieces
- afterimages that look like another Sable
- effects that hide the crouch pose or replace body readability

If a VFX element cannot stay attached and subtle, omit it.

## Frame Cleanliness Requirements

Every cell must be clean by itself:

- no artifacts from neighboring frames
- no leftover body pieces from earlier/later frames
- no edge bleed
- no cropped hair, hands, feet, or forearm crystals
- no frame-to-frame body scale drift
- no sudden costume, skin tone, hair, or face drift
- no painterly render, no realistic concept-art finish

## Rejection Conditions

Reject the output if any frame:

- does not read as the same Sable from the approved anchor clips
- uses placeholder effects
- has detached body fragments or duplicated body parts
- lets Sable leave the frame
- changes Sable into a different outfit, age, body type, palette, or power system
- includes a background, grid, label, border, or text

## Save Location For Manual Provider

After generation, save the PNG or WEBP candidate under:

`assets/characters/sable/generated/inbox/crouch/<new-run-folder>/`

Do not write to live roster folders.
Do not overwrite approved preview strips.
Do not modify manifests manually.

SpriteForge should validate, normalize, smoke-test, and preview-approve only if all gates pass.

Return only the sprite sheet image.
