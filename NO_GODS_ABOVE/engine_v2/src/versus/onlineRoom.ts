import type { InputFrame, MatchState } from "../core/types";

type Listener = (...args: any[]) => void;
interface Connection { open: boolean; peer: string; on(event: string, listener: Listener): void; send(data: unknown): void; close(): void; }
interface PeerHandle { on(event: string, listener: Listener): void; connect(id: string, options?: object): Connection; destroy(): void; }
type PeerConstructor = new (id?: string) => PeerHandle;

export type OnlineMessage =
  | { type: "lobby"; p1: string; p2: string; mode: "rounds" | "stocks"; arena: string; stocks: number; rounds: number; time: number; ready: boolean }
  | { type: "pick"; character: string; ready: boolean }
  | { type: "start"; seed: number }
  | { type: "loaded" }
  | { type: "input"; frame: InputFrame; sequence: number }
  | { type: "dash" }
  | { type: "snapshot"; state: MatchState; director: unknown; sequence: number }
  | { type: "rematch" }
  | { type: "pause"; playing: boolean }
  | { type: "select" };

const peerId = (code: string) => `nga-v2-${code.toLowerCase()}`;
export const normalizeRoomCode = (value: string) => value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
export const newRoomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
};

export class OnlineRoom {
  peer: PeerHandle | null = null;
  connection: Connection | null = null;
  role: "host" | "guest" | null = null;
  code = "";
  status = "OFFLINE";
  private generation = 0;
  onStatus: (status: string) => void = () => {};
  onMessage: (message: OnlineMessage) => void = () => {};
  onClosed: () => void = () => {};
  get connected() { return !!this.connection?.open; }

  host(code = newRoomCode()) {
    this.close();
    this.role = "host"; this.code = code;
    this.setStatus("OPENING ROOM");
    const generation = this.generation;
    void this.openHost(code, generation);
  }

  private async openHost(code: string, generation: number) {
    const Peer = await this.waitForPeer();
    if (generation !== this.generation) return;
    if (!Peer) { this.setStatus("ONLINE SERVICE DID NOT LOAD"); return; }
    const peer = this.peer = new Peer(peerId(code));
    peer.on("open", () => this.setStatus("ROOM OPEN · WAITING FOR RIVAL"));
    peer.on("connection", (connection: Connection) => {
      if (this.connection?.open) { connection.close(); return; }
      this.bind(connection);
    });
    peer.on("error", (error: Error) => this.setStatus(error.message || "ROOM ERROR"));
  }

  join(rawCode: string) {
    const code = normalizeRoomCode(rawCode);
    if (code.length !== 6) { this.setStatus("ENTER A SIX-CHARACTER ROOM CODE"); return; }
    this.close();
    this.role = "guest"; this.code = code;
    this.setStatus("CONNECTING TO ROOM");
    const generation = this.generation;
    void this.openGuest(code, generation);
  }

  private async openGuest(code: string, generation: number) {
    const Peer = await this.waitForPeer();
    if (generation !== this.generation) return;
    if (!Peer) { this.setStatus("ONLINE SERVICE DID NOT LOAD"); return; }
    const peer = this.peer = new Peer();
    peer.on("open", () => this.bind(peer.connect(peerId(code), { reliable: true })));
    peer.on("error", (error: Error) => this.setStatus(error.message || "CONNECTION ERROR"));
  }

  send(message: OnlineMessage) { if (this.connection?.open) this.connection.send(message); }
  close() {
    this.generation++;
    this.connection?.close(); this.peer?.destroy();
    this.connection = null; this.peer = null; this.role = null; this.code = "";
  }
  private setStatus(value: string) { this.status = value; this.onStatus(value); }
  private async waitForPeer(): Promise<PeerConstructor | undefined> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const Peer = (window as unknown as { Peer?: PeerConstructor }).Peer;
      if (Peer) return Peer;
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
    return undefined;
  }
  private bind(connection: Connection) {
    this.connection = connection;
    connection.on("open", () => this.setStatus("RIVAL CONNECTED"));
    connection.on("data", (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const message = data as OnlineMessage;
      if (typeof message.type !== "string") return;
      this.onMessage(message);
    });
    connection.on("close", () => { this.connection = null; this.setStatus("RIVAL DISCONNECTED"); this.onClosed(); });
    connection.on("error", (error: Error) => this.setStatus(error.message || "CONNECTION ERROR"));
  }
}

/** Send bounded live state; growing diagnostics are local-only and never travel over WebRTC. */
export function onlineSnapshot(state: MatchState): MatchState {
  return { ...state, inputLog: [], checksums: [], debugWarnings: [], presentationEventLedger: [] };
}
