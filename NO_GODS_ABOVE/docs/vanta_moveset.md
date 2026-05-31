# VANTA REIGN — Moveset

Vanta Reign uses the same control architecture as Kairo but has a heavier crimson-energy style.

## Controls

```txt
J = light attack
K = medium attack
L = heavy attack
U + J = special 1
U + K = special 2
U + L = special 3
I + O = ultimate
```

## Normal Attacks

```txt
neutral_light
neutral_medium
neutral_heavy
forward_light
forward_medium
forward_heavy
back_light
back_medium
back_heavy
down_light
down_medium
down_heavy
jump_light
jump_medium
jump_heavy
```

## Special Moves

```txt
special_1 = crimson dash slash
special_2 = red energy projectile / blade shot
special_3 = spinning red energy slash / anti-air
```

## Ultimate

```txt
ultimate = crimson overload finisher
```

## Training Mode Behavior

For initial integration, Vanta should work as a passive enemy dummy:

1. idle
2. damaged
3. death
4. stable facing left
5. health decreases when hit

After that, add attacks, block, specials, and ultimate.
