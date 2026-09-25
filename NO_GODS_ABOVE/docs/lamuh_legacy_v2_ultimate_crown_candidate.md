# Lamuh Legacy V2 — Crown of No Gods

Status: concept approved by the user's "lets make it" following the cinematic camera and celestial transformation requests. Implementation is a local review candidate, not production-approved. Existing fighter and originals remain preserved.

## Evidence and preservation

The existing source audit inventories eight Crown rows: startup6, rush7, cinematic strings8+8, launch7, charge8, beam8, recovery6 (58source poses). Its provenance notes say later charge/beam/recovery rows are not untouched V1 originals; no animation-local collision or gameplay root tracks were recovered. Treat these as references, not approved V2 motion. Historical per-row durations exist but are not adopted as V2 timings. Damage was not recovered in the inspected Crown record.

The old `lamuh_ultimate_crown_of_no_gods.md` is a prior LAMUH design, not a current Legacy V2 engine contract. Preserve the recognizable rush-confirm, martial launch and beam identity; do not import its legacy inputs,448px dimensions or assumed meter subsystem. Current V2 has tension and burst, but no ultimate input/AttackId or cinematic phase in the inspected core types. Those seams need explicit deterministic authoring.

## Proposed identity and sequence

**Crown of No Gods**: a hit-confirm martial finisher culminating in a two-handed diagonal aura beam, not another teleport-kick-ball special. Keep current mature face/beard, proportions and white coat. During charge only, dark locs become white-gold celestial locs and the cyan-white-gold aura flares. No generic spikes, global body tint, size change or permanent form change. Return to the normal form during recovery.

1. Short grounded aura stance and restrained crown-like crest; readable super anticipation.
2. Driving palm rush. Only a real hit starts the cinematic.
3. One close elbow drives the opponent backward, connected through planted body rotation.
4. A rising knee launches the victim diagonally upward. Victim motion begins at this contact, never by arbitrary translation.
5. Lamuh plants both feet and draws both hands to his hip; dense aura gathers into a compact core as the victim travels. Authored view-angle drawings create a cinematic charge orbit; do not spin a flat sprite to fake a camera orbit. Hair transforms during this escalation.
6. He thrusts both palms diagonally upward. The core expands into a broad cyan-white-gold beam, with the same curling aura language as his specials.
7. One decisive beam impact and hard knockdown, then controlled hand/coat recovery to exact idle.

Four authored damage beats total: palm, elbow, knee, beam. No hidden repeated beam damage or decorative extra contacts. Explore roughly four seconds after confirmation to expose the approved transformation and charge orbit, independently authored at60Hz; final timing needs motion review.

## Gameplay proposal

- Full tension cost on activation, no free whiff refund; confirm existing tension cap before selecting units. No new ultimate-specific meter unless separately approved.
- Initial damage budget around280/1000 at unscaled entry, distributed across four real contacts; obey existing scaling when combo-confirmed. Exact numbers need implementation/playtest, not accepted balance.
- Whiff/block: starter ends with punishable recovery, no cinematic or beam. No guard break/chip invented.
- No free universal invulnerability; any protection is restricted to an authored confirmed interaction and ends deterministically.
- New explicit ultimate input: choose a nonconflicting keyboard/controller binding during integration; do not reuse I/O and break throw/block.
- Standard-height humanoid victim class first; reject unsupported classes rather than globally rescaling victims.

## Presentation, assets and interaction

Body clips: startup/rush; elbow-to-knee continuous string; planted charge/release/recoil; finish. Separate source frames under current2048x1536/root768,1360 normalization, with anatomical registration. Separate aura crest, beam origin/extension/decay and impact sprites; no giant beam baked into body art.

Victim: body-hit recoil -> knee launch -> airborne travel -> beam impact -> falling hard knockdown. Explicit attacker/victim anchor tracks, collision-confirm entry, no idle dummy or arbitrary victim teleport. Camera may frame both fighters and accent final impact, but never owns travel or hit resolution. Preserve full-body visibility and avoid repeated full-screen flashes.

Deterministic phase/contact/event IDs, per-beat damage ledger, snapshot/checksum coverage, mirror/corner paths and bounded cleanup. KO cannot skip cleanup; pause freezes simulation; reset removes cinematic and beam state. Renderer cannot trigger damage, lock, time or meter decisions.

## Safe production order / gate

Sequence and transformation are now approved for implementation. Author short motion studies and review pose connections; build normalized source frames and separate VFX; implement starter hit/block/whiff; add confirmed phase/victim tracks; verify damage/meter/rollback/replay/mirror/corners/interruption/KO/reset; open1x/0.5x sandbox review. No deploy, push, merge or silent production promotion.

Applied: NGA Engine V2 and cinematic ultimate production skill. The original concept gate was respected; after explicit approval, V1 local candidate implementation was built. See `tools/nga-forge/review/lamuh-ultimate-v1/README.md` for source, normalization, tests and remaining human motion-review debt. Orbital charge is an authored sprite-angle study, not a free 3D orbit.
