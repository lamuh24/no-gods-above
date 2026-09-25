import { InputFrame } from "../core/types";

export const keyboardMapping = { left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], down: ["KeyS", "ArrowDown"], up: ["KeyW", "ArrowUp"], light: ["KeyJ"], medium: ["KeyK"], heavy: ["KeyL"], special: ["KeyU"], romanCancel: ["KeyH"], throw: ["KeyI"], block: ["KeyO"], burst: ["KeyP"], pause: ["Escape"] } as const;
export const debugKeyboardMapping = { pause: "Escape", overlay: "F1", step: "Period", reset: "KeyR", mode: "KeyM", dummyBurst: "KeyB" } as const;
export const reservedCombatActions = { special: "U alone / no action; U+K / Neutral Medium control strike; S+U+J / Down Light Stamped Shaft Check V3; S+U+K / Down Medium Crossdraw Reprisal V6 two-hit process; S+U+L / Down Heavy Grounded Verdict two-hit process; W+U+K / Up Medium rising scythe hook; D+U+J / Forward Light V3; D+U+K / Forward Medium V3 two-hit process; D+U+L / Forward Heavy V3; W+L / Grave Furrow V7; U+L / airborne ender; U+I Command Grab", romanCancel: "H / active after a connected or blocked attack", throw: "I / universal throw; hold back for back throw; U+I Command Grab", burst: "P / active while P1 is in hitstun; B queues dummy Burst" } as const;
export const standardGamepadMapping = { light: 0, medium: 1, heavy: 2, special: 3, throw: 5, block: 4, romanCancel: 6, burst: 8, pause: 9 } as const;
export const defaultDeadZone = 0.35;
export type InputDevice = "keyboard" | "gamepad";
export interface NormalizedDeviceInput { device: InputDevice; frame: InputFrame; connectedGamepad?: string; }
