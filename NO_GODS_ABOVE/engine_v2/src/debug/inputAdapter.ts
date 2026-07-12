import { InputFrame } from "../core/types";
import { defaultDeadZone, InputDevice, keyboardMapping, NormalizedDeviceInput, standardGamepadMapping } from "./inputMap";

function fromKeys(keys: Set<string>, codes: readonly string[]) { return codes.some((code) => keys.has(code)); }
function button(g: Gamepad, index: number) { return !!g.buttons[index]?.pressed; }

export class KeyboardInputAdapter {
  private keys = new Set<string>();
  activeDevice: InputDevice = "keyboard";
  connectedGamepad = "none";
  deadZone = defaultDeadZone;
  attach(target: Window) {
    target.addEventListener("keydown", (event) => { this.keys.add(event.code); this.activeDevice = "keyboard"; });
    target.addEventListener("keyup", (event) => this.keys.delete(event.code));
    target.addEventListener("gamepadconnected", (event) => { this.connectedGamepad = event.gamepad.id; this.activeDevice = "gamepad"; });
    target.addEventListener("gamepaddisconnected", () => { this.connectedGamepad = "none"; this.activeDevice = "keyboard"; });
  }
  read(): NormalizedDeviceInput {
    const gamepad = this.readGamepad();
    const keyboard = this.readKeyboard();
    if (Object.values(keyboard).some(Boolean)) { this.activeDevice = "keyboard"; return { device: "keyboard", frame: keyboard, connectedGamepad: this.connectedGamepad }; }
    if (gamepad && Object.values(gamepad.frame).some(Boolean)) return gamepad;
    if (gamepad && this.activeDevice === "gamepad") return gamepad;
    return { device: "keyboard", frame: keyboard, connectedGamepad: this.connectedGamepad };
  }
  readP1(): InputFrame { return this.read().frame; }
  readKeyboard(): InputFrame { return { left: fromKeys(this.keys, keyboardMapping.left), right: fromKeys(this.keys, keyboardMapping.right), down: fromKeys(this.keys, keyboardMapping.down), up: fromKeys(this.keys, keyboardMapping.up), light: fromKeys(this.keys, keyboardMapping.light), medium: fromKeys(this.keys, keyboardMapping.medium), heavy: fromKeys(this.keys, keyboardMapping.heavy), special: fromKeys(this.keys, keyboardMapping.special), throw: fromKeys(this.keys, keyboardMapping.throw), block: fromKeys(this.keys, keyboardMapping.block), burst: fromKeys(this.keys, keyboardMapping.burst), pause: fromKeys(this.keys, keyboardMapping.pause) }; }
  readGamepad(): NormalizedDeviceInput | null { const pads = navigator.getGamepads?.() || []; const g = [...pads].find(Boolean); if (!g) { this.connectedGamepad = "none"; return null; } this.connectedGamepad = g.id; const x = Math.abs(g.axes[0] || 0) >= this.deadZone ? g.axes[0] : 0; const y = Math.abs(g.axes[1] || 0) >= this.deadZone ? g.axes[1] : 0; const frame: InputFrame = { left: x < 0 || button(g, 14), right: x > 0 || button(g, 15), up: y < 0 || button(g, 12), down: y > 0 || button(g, 13), light: button(g, standardGamepadMapping.light), medium: button(g, standardGamepadMapping.medium), heavy: button(g, standardGamepadMapping.heavy), special: button(g, standardGamepadMapping.special), throw: button(g, standardGamepadMapping.throw), block: button(g, standardGamepadMapping.block), burst: button(g, standardGamepadMapping.burst), pause: button(g, standardGamepadMapping.pause) }; if (Object.values(frame).some(Boolean)) this.activeDevice = "gamepad"; return { device: "gamepad", frame, connectedGamepad: g.id }; }
}
export function normalizeMockGamepad(gamepad: Pick<Gamepad, "axes" | "buttons" | "id">, deadZone = defaultDeadZone): NormalizedDeviceInput { const pressed = (i: number) => !!gamepad.buttons[i]?.pressed; const x = Math.abs(gamepad.axes[0] || 0) >= deadZone ? gamepad.axes[0] : 0; const y = Math.abs(gamepad.axes[1] || 0) >= deadZone ? gamepad.axes[1] : 0; return { device: "gamepad", connectedGamepad: gamepad.id, frame: { left: x < 0 || pressed(14), right: x > 0 || pressed(15), up: y < 0 || pressed(12), down: y > 0 || pressed(13), light: pressed(0), medium: pressed(1), heavy: pressed(2), special: pressed(3), block: pressed(4), throw: pressed(5), burst: pressed(8), pause: pressed(9) } }; }
