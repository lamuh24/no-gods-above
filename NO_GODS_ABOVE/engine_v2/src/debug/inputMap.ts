import { InputFrame } from "../core/types";

export const keyboardMapping = { left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], down: ["KeyS", "ArrowDown"], up: ["KeyW", "ArrowUp"], light: ["KeyJ"], medium: ["KeyK"], heavy: ["KeyL"], special: ["KeyU"], throw: ["KeyI"], block: ["KeyO"], burst: ["KeyP"], pause: ["Escape"] } as const;
export const debugKeyboardMapping = { pause: "Escape", overlay: "F1", step: "Period", reset: "KeyR", mode: "KeyM" } as const;
export const reservedCombatActions = { special: "reserved / inactive", throw: "active / universal forward throw + throw tech", burst: "reserved / inactive" } as const;
export const standardGamepadMapping = { light: 0, medium: 1, heavy: 2, special: 3, throw: 5, block: 4, burst: 8, pause: 9 } as const;
export const defaultDeadZone = 0.35;
export type InputDevice = "keyboard" | "gamepad";
export interface NormalizedDeviceInput { device: InputDevice; frame: InputFrame; connectedGamepad?: string; }
