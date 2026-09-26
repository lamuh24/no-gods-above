import type { FighterKind, InputFrame, MatchState } from '../core/types';
import './tutorial.css';

export type TutorialKind = 'basics' | 'combos';

interface LessonStep { title: string; instruction: string; tip: string; }

function controlHints(text: string): string {
  const buttons: Record<string, string> = { A: 'Left', D: 'Right', W: 'Up / A / Cross', S: 'Down', J: 'X / Square', K: 'Y / Triangle', L: 'B / Circle', U: 'RT / R2', O: 'RB / R1', 'Left Shift': 'LB / L1' };
  return text.replace(/Left Shift|\b[ADWSJKLUO]\b/g, key => `${key} (${buttons[key]})`);
}

const basics: LessonStep[] = [
    { title: 'Find your footing', instruction: 'Move with A and D. Try walking toward the other fighter to reach attack range.', tip: 'You can walk in either direction. The move list below the arena has your fighter’s full commands.' },
    { title: 'Leave the ground', instruction: 'Press W to jump. Hold A or D with W to jump toward or away from your rival.', tip: 'S crouches. Hold O to block; hold S and O to defend against low attacks.' },
    { title: 'Close the distance', instruction: 'Press Left Shift to dash forward. You can also double tap toward your opponent.', tip: 'A dash covers space quickly. Backward movement and blocking help you escape pressure.' },
    { title: 'Land your first strike', instruction: 'Get close and press J to land a standing Light attack.', tip: 'K is Medium and L is Heavy. Light is fast and can chain into Medium on a hit.' }
];
const groundCombos: LessonStep[] = [
    { title: 'Start with Light', instruction: 'Get close and land a standing Light with J.', tip: 'A combo starts only when your strike connects. The live hit counter appears over the arena.' },
    { title: 'Link into Medium', instruction: 'After Light connects, press K before the opponent recovers: J → K.', tip: 'You can press K during the Light hit animation. Watch for 2 HITS.' },
    { title: 'Finish the ground chain', instruction: 'Chain a standing Heavy after Medium: J → K → L.', tip: 'Press each button once in order after the prior hit connects. Watch for 3 HITS.' }
];

const airSpecials: Record<Exclude<FighterKind, 'training_dummy'>, { id: string; name: string; tip: string }> = {
  lamuh_legacy_v2: { id: 'legacy_radiant_dive_medium', name: 'Radiant Dive Medium', tip: 'A clean hit rebounds Lamuh into another air jump, letting you continue the combo.' },
  lamuh_proto: { id: 'special_air_medium', name: 'Air Scythe Medium', tip: 'The hook and pull-through can both hit. Stay near the airborne opponent.' },
  celeste_proto: { id: 'ovation_descant', name: 'Ovation Descant', tip: 'This air special fires a downward projectile. Watch for the hit, not just the animation.' }
};
const airRoute = ['crouching_heavy', 'air_light', 'air_medium'];

function comboLessons(fighterKind: FighterKind): LessonStep[] {
  const special = airSpecials[fighterKind === 'training_dummy' ? 'lamuh_legacy_v2' : fighterKind];
  const steps: LessonStep[] = [
    ...groundCombos,
    { title: 'Launch a new combo', instruction: 'Start a fresh attempt. Move close and press S + L to launch your rival with crouching Heavy.', tip: 'Use Reset above if the fighters are far apart. This launcher starts a new combo after the J → K → L lesson.' },
    { title: 'Chase the launch', instruction: 'As soon as S + L connects, press W + D to jump forward after the airborne rival.', tip: 'The launcher can be jump-cancelled on hit. Keep holding toward the rival to stay in range.' },
    { title: 'Connect air Light', instruction: 'While airborne, press J to hit with air Light.', tip: 'Air attacks use the same J/K/L keys as ground attacks. Keep moving toward the rival.' },
    { title: 'Chain air Medium', instruction: 'After air Light connects, press K to continue the same juggle.', tip: 'Watch the hit counter. Air Light → air Medium must remain one combo.' },
    { title: `Hit with ${special.name}`, instruction: `While still airborne, press U + K to connect ${special.name} after air Medium.`, tip: special.tip }
  ];
  if (fighterKind === 'lamuh_legacy_v2') steps.push(
    { title: 'Use the rebound', instruction: 'After Radiant Dive Medium hits, press J during the rebound to land another air Light.', tip: 'Stay close to the launched rival. The rebound grants Lamuh another air follow-up.' },
    { title: 'End in the air', instruction: 'Press L after that air Light to finish with air Heavy.', tip: 'The complete route is S+L → W+D → air J → K → U+K → J → L.' }
  );
  if (fighterKind === 'lamuh_proto') steps.push(
    { title: 'Complete the pull-through', instruction: 'Keep the rival in range until Air Scythe Medium lands its second hit.', tip: 'The first hook and later pull-through are separate real contacts in the same special.' }
  );
  return steps;
}

function hasRoute(route: string[], expected: string[]) {
  return route.some((_, start) => expected.every((move, index) => route[start + index] === move));
}

/** Read-only coach: progress comes from the real simulated fighter and hit ledger. */
export function createTutorial(host: HTMLElement, initial: TutorialKind | null, getState: () => MatchState) {
  let kind: TutorialKind | null = null;
  let step = 0;
  let startX = getState().fighters.p1.x;
  const fighterKind = getState().fighters.p1.kind;
  const special = airSpecials[fighterKind === 'training_dummy' ? 'lamuh_legacy_v2' : fighterKind];
  const lessons: Record<TutorialKind, LessonStep[]> = { basics, combos: comboLessons(fighterKind) };
  const panel = host.querySelector<HTMLElement>('#tutorialPanel')!;
  const progress = host.querySelector<HTMLElement>('#tutorialProgress')!;
  const title = host.querySelector<HTMLElement>('#tutorialTitle')!;
  const instruction = host.querySelector<HTMLElement>('#tutorialInstruction')!;
  const tip = host.querySelector<HTMLElement>('#tutorialTip')!;
  const status = host.querySelector<HTMLElement>('#tutorialStatus')!;

  function render() {
    panel.hidden = !kind;
    if (!kind) return;
    const items = lessons[kind];
    const done = step >= items.length;
    const item = items[Math.min(step, items.length - 1)];
    progress.textContent = done ? `${items.length} / ${items.length} COMPLETE` : `${step + 1} / ${items.length}`;
    title.textContent = done ? (kind === 'basics' ? 'Basics complete' : 'Combo tutorial complete') : item.title;
    instruction.textContent = done ? (kind === 'basics' ? 'You can move, jump, dash, and connect a strike. Try the Combo Tutorial next.' : `You completed the ground chain and a real launcher → air Light → air Medium → ${special.name} combo. Keep exploring your fighter’s move list.`) : controlHints(item.instruction);
    tip.textContent = done ? 'Try other directions with the same attack buttons. Your fighter has more moves in the list below.' : item.tip;
    status.textContent = done ? 'Lesson complete' : 'Waiting for your move';
    for (const button of host.querySelectorAll<HTMLButtonElement>('[data-tutorial]')) button.setAttribute('aria-pressed', String(button.dataset.tutorial === kind));
  }

  function open(next: TutorialKind) {
    kind = next;
    step = 0;
    startX = getState().fighters.p1.x;
    render();
  }

  host.querySelector<HTMLButtonElement>('#tutorialBasics')!.onclick = () => open('basics');
  host.querySelector<HTMLButtonElement>('#tutorialCombos')!.onclick = () => open('combos');
  host.querySelector<HTMLButtonElement>('#tutorialRestart')!.onclick = () => { if (kind) open(kind); };
  host.querySelector<HTMLButtonElement>('#tutorialClose')!.onclick = () => { kind = null; render(); host.querySelector<HTMLButtonElement>('#tutorialBasics')!.focus(); };

  if (initial) open(initial);
  return {
    get kind() { return kind; },
    open,
    update(input: InputFrame, state: MatchState) {
      if (!kind || step >= lessons[kind].length) return;
      const p1 = state.fighters.p1;
      const event = state.lastCombatEvent;
      const lightHit = event?.tick === state.tick - 1 && event.attacker === 'p1' && event.outcome === 'hit' && event.attackId === 'standing_light';
      const route = p1.comboRoute;
      const specialRoute = [...airRoute, special.id];
      const comboChecks = [
        lightHit,
        hasRoute(route, ['standing_light', 'standing_medium']),
        hasRoute(route, ['standing_light', 'standing_medium', 'standing_heavy']),
        hasRoute(route, ['crouching_heavy']) && event?.tick === state.tick - 1 && event.attacker === 'p1' && event.outcome === 'hit' && event.attackId === 'crouching_heavy',
        hasRoute(route, ['crouching_heavy']) && !p1.grounded && !state.fighters.p2.grounded && p1.phase === 'jump',
        hasRoute(route, ['crouching_heavy', 'air_light']),
        hasRoute(route, airRoute),
        hasRoute(route, specialRoute),
        ...(fighterKind === 'lamuh_legacy_v2' ? [hasRoute(route, [...specialRoute, 'air_light']), hasRoute(route, [...specialRoute, 'air_light', 'air_heavy'])] : []),
        ...(fighterKind === 'lamuh_proto' ? [hasRoute(route, [...specialRoute, special.id])] : [])
      ];
      const complete = kind === 'basics'
        ? [Math.abs(p1.x - startX) > 18 && (input.left || input.right), !p1.grounded, p1.phase === 'dash', lightHit][step]
        : comboChecks[step];
      if (complete) { step++; render(); }
    }
  };
}
