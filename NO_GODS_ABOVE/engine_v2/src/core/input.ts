import { DeterministicInputBuffer, InputFrame } from "./types";

export const inputActions = ["left", "right", "down", "up", "light", "medium", "heavy", "special", "throw", "block", "burst", "pause", "reset"] as const;
export type InputAction = typeof inputActions[number];

export function makeInputBuffer(max = 18): DeterministicInputBuffer { return { current: {}, previous: {}, pressed: {}, released: {}, history: [], max }; }
export function normalizeInput(input: InputFrame = {}): InputFrame { const out: InputFrame = {}; for (const a of inputActions) if (input[a]) out[a] = true; return out; }
export function pushInput(buffer: DeterministicInputBuffer, input: InputFrame, tick: number, facing: 1 | -1) {
  const current = normalizeInput(input); const pressed: InputFrame = {}; const released: InputFrame = {};
  for (const a of inputActions) { if (current[a] && !buffer.current[a]) pressed[a] = true; if (!current[a] && buffer.current[a]) released[a] = true; }
  buffer.previous = buffer.current; buffer.current = current; buffer.pressed = pressed; buffer.released = released;
  const forward = facing === 1 ? !!current.right : !!current.left; const back = facing === 1 ? !!current.left : !!current.right;
  buffer.history.push({ tick, held: current, pressed, released, facing, forward, back });
  while (buffer.history.length > buffer.max) buffer.history.shift();
}
export function wasPressed(buffer: DeterministicInputBuffer, action: InputAction, leniency = 1) { return buffer.history.slice(-leniency).some((h) => !!h.pressed[action]); }
export function held(buffer: DeterministicInputBuffer, action: InputAction) { return !!buffer.current[action]; }
export function released(buffer: DeterministicInputBuffer, action: InputAction) { return !!buffer.released[action]; }
export function forwardHeld(buffer: DeterministicInputBuffer) { return !!buffer.history.at(-1)?.forward; }
export function backHeld(buffer: DeterministicInputBuffer) { return !!buffer.history.at(-1)?.back; }
export function recentDoubleTap(buffer: DeterministicInputBuffer, direction: "forward" | "back", window = 12) {
  const recent = buffer.history.slice(-window);
  const current = recent.at(-1);
  if (!current) return false;
  const pressedDirection = (entry: typeof current) => direction === "forward"
    ? (entry.pressed.right && entry.facing === 1) || (entry.pressed.left && entry.facing === -1)
    : (entry.pressed.left && entry.facing === 1) || (entry.pressed.right && entry.facing === -1);
  return !!pressedDirection(current) && recent.slice(0, -1).some(pressedDirection);
}
