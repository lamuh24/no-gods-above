import type { InputFrame } from '../core/types';

const frames: InputFrame[] = [{}, {}];
export const controllerInput = (seat: number): InputFrame => frames[seat] ?? {};
const down = (pad: Gamepad, button: number) => !!pad.buttons[button]?.pressed;

export function mapController(pad: Gamepad): InputFrame {
  const input: InputFrame = {};
  if (down(pad, 14) || pad.axes[0] < -0.35) input.left = true;
  if (down(pad, 15) || pad.axes[0] > 0.35) input.right = true;
  if (down(pad, 12) || down(pad, 0) || pad.axes[1] < -0.35) input.up = true;
  if (down(pad, 13) || pad.axes[1] > 0.35) input.down = true;
  if (down(pad, 2)) input.light = true;
  if (down(pad, 3)) input.medium = true;
  if (down(pad, 1)) input.heavy = true;
  if (down(pad, 7)) input.special = true;
  if (down(pad, 5)) input.block = true;
  if (down(pad, 6)) input.throw = true;
  if (down(pad, 8)) input.ultimate = true;
  if (down(pad, 10)) input.burst = true;
  if (down(pad, 11)) input.romanCancel = true;
  return input;
}

/** Stable seats survive disconnects; a remaining P2 controller never becomes P1. */
export function initControllers(app: HTMLElement): void {
  const seats: (number | null)[] = [null, null];
  const previous = [new Set<number>(), new Set<number>()];
  let lastRoot: Element | null = null;
  let lastStatus = '';
  const nextMove = [0, 0];
  const lastDirection = ['', ''];
  let wasConnected = false;

  const release = () => {
    frames[0] = {}; frames[1] = {};
    app.querySelector('.match')?.dispatchEvent(new Event('controllerinput'));
    const pause = app.querySelector<HTMLButtonElement>('#hudPause');
    if (wasConnected && pause?.textContent?.startsWith('Pause') && !pause.disabled) pause.click();
  };
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

  function poll(now: number) {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    let disconnected = false;
    for (let seat = 0; seat < 2; seat++) {
      if (seats[seat] !== null && !pads[seats[seat]!] ?.connected) {
        seats[seat] = null;
        disconnected = true;
        previous[seat].clear();
      }
    }
    for (const pad of pads) {
      if (pad?.connected && pad.mapping === 'standard' && !seats.includes(pad.index)) {
        const free = seats.indexOf(null);
        if (free >= 0) seats[free] = pad.index;
      }
    }
    const root = app.firstElementChild;
    if (root !== lastRoot) { lastRoot = root; lastStatus = ''; }
    const match = app.querySelector<HTMLElement>('.match');
    const pause = app.querySelector<HTMLButtonElement>('#hudPause');
    const paused = !!pause?.textContent?.startsWith('Resume');
    const menu = !match || paused;
    const focused = document.hasFocus() && !document.hidden;
    const connected = seats.some(index => index !== null);
    if (disconnected && match && !paused && !pause?.disabled) pause?.click();
    wasConnected = connected;
    const status = seats.map((index, seat) => `P${seat + 1}: ${index === null ? 'keyboard' : 'controller'}`).join(' · ');
    if (status !== lastStatus && root) {
      let hint = root.querySelector<HTMLElement>('[data-controller-help]');
      const host = root.querySelector('.nga-menu-footer, .gameplay-actions');
      if (!hint && host) { hint = document.createElement('p'); hint.dataset.controllerHelp = ''; hint.style.cssText = 'flex-basis:100%;font:12px/1.6 system-ui;color:#dcc89c;white-space:normal;letter-spacing:normal'; (host as HTMLElement).style.flexWrap = 'wrap'; host.append(hint); }
      if (hint) hint.textContent = `${status}. Press a controller button to connect. D-pad / left stick: move · A / Cross: jump · X / Square: Light · Y / Triangle: Medium · B / Circle: Heavy · RT / R2 + attack: special (also in air) · LB / L1: dash · RB / R1: block · LT / L2: throw · View / Share: ultimate · L3: burst · R3: Roman cancel · Start / Options: pause and navigate controls. Menus: A / Cross confirms, B / Circle goes back; left/right adjusts selected settings.`;
      lastStatus = status;
    }
    for (let seat = 0; seat < 2; seat++) {
      const pad = seats[seat] === null ? null : pads[seats[seat]!];
      const pressed = new Set<number>();
      pad?.buttons.forEach((button, index) => { if (button.pressed) pressed.add(index); });
      const edge = (index: number) => pressed.has(index) && !previous[seat].has(index);
      const old = JSON.stringify(frames[seat]);
      frames[seat] = pad && focused && !menu ? mapController(pad) : {};
      if (focused && pad) {
        if (match && edge(9) && !pause?.disabled) pause?.click();
        if (!menu && edge(4)) match?.dispatchEvent(new CustomEvent('controllerdash', { detail: seat }));
        if (menu) {
          const controls = Array.from(app.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), summary, input:not(:disabled)')).filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
          const active = document.activeElement as HTMLElement;
          const direction = down(pad, 12) || pad.axes[1] < -0.5 ? 'up' : down(pad, 13) || pad.axes[1] > 0.5 ? 'down' : down(pad, 14) || pad.axes[0] < -0.5 ? 'left' : down(pad, 15) || pad.axes[0] > 0.5 ? 'right' : '';
          if (direction && (direction !== lastDirection[seat] || now >= nextMove[seat])) {
            nextMove[seat] = now + (direction !== lastDirection[seat] ? 350 : 150);
            const delta = direction === 'up' || direction === 'left' ? -1 : 1;
            if (active instanceof HTMLSelectElement && (direction === 'left' || direction === 'right')) {
              active.selectedIndex = Math.max(0, Math.min(active.options.length - 1, active.selectedIndex + delta));
              active.dispatchEvent(new Event('change', { bubbles: true }));
            } else controls[(Math.max(0, controls.indexOf(active)) + delta + controls.length) % controls.length]?.focus();
          }
          lastDirection[seat] = direction;
          if (edge(0) || (!match && edge(9))) (controls.includes(active) ? active : controls[0])?.click();
          if (!match && edge(1)) app.querySelector<HTMLButtonElement>('#backModes, #backTitle, #onlineBack')?.click();
        }
      }
      previous[seat] = pressed;
      if (old !== JSON.stringify(frames[seat])) match?.dispatchEvent(new Event('controllerinput'));
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
}
