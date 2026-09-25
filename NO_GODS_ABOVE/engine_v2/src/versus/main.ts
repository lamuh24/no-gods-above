import "./style.css";
import { createFrontEnd } from "./frontEnd";
import { gameplayHud, updateGameplayHud } from "./gameplayHud";
import {
  createMatch, fighterExtendedHurtboxes, fighterPushbox, projectileWorldRect, resolveAttackDefinition, tick
} from "../core/engine";
import type { FighterId, FighterState, InputFrame, MatchState, Rect } from "../core/types";
import { ROSTER, ROSTER_ORDER, TARGET_BODY_UNITS, WORLD_SCALE, type CharacterId } from "./roster";
import { createPresenter, type Presenter } from "./presentation";
import { LamuhTribunalArena } from "../lamuhlegacy/tribunalArena";
import { FallenCapitalArena } from "../stage/fallenCapital/fallenCapitalArena";
import { CpuBrain } from "./cpu/cpuBrain";
import { defaultMatchOptions, matchOptionsFromQuery, type MatchOptions } from "./matchOptions";
import { ROUNDS_RULES, STOCK_RULES, TRAINING_RULES } from "./matchRules";
import { RoundDirector } from "./roundDirector";
import { StockDirector } from "./stockDirector";
import { OnlineRoom, onlineSnapshot, normalizeRoomCode, type OnlineMessage } from "./onlineRoom";
import { createPaidRehearsal } from "./swahiliPaidRehearsal";
import { createTutorial, type TutorialKind } from "./tutorial";
import swahiliPortrait from '../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png?url';

// Canvas geometry is dictated by the Tribunal renderer, which maps this flat combat
// canvas onto a fixed world-space plane at PIXELS_PER_SIM = WORLD_SCALE and treats
// `height - 80` as the floor line. Matching it here is what lets the same canvas be
// used both flat and inside the 3D arena.
const STAGE_W = 1600, STAGE_H = 900;
const GROUND_Y = STAGE_H - 80;

type Selection = Record<FighterId, CharacterId>;
type ControlScheme = Record<string, keyof InputFrame>;

// P1 keeps the mapping the Lamuh sandbox already uses, so muscle memory carries over.
const P1_KEYS: ControlScheme = {
  KeyA: "left", KeyD: "right", KeyS: "down", KeyW: "up",
  KeyJ: "light", KeyK: "medium", KeyL: "heavy", KeyU: "special", KeyI: "throw", KeyO: "block", KeyP: "ultimate", KeyY: "burst", KeyT: "romanCancel"
};
// P2 gets arrows plus both a numpad cluster and a punctuation cluster, so the
// second player works on a laptop with no numeric keypad.
const P2_KEYS: ControlScheme = {
  ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "up",
  Numpad1: "light", Numpad2: "medium", Numpad3: "heavy", Numpad5: "special", Numpad4: "throw", Numpad6: "block", Numpad0: "ultimate", Numpad8: "burst",
  Comma: "light", Period: "medium", Slash: "heavy", Semicolon: "special", Quote: "throw", ShiftRight: "block", Backslash: "ultimate", BracketRight: "burst"
};
const P1_DASH = "ShiftLeft", P2_DASH = "Numpad7";

function main() {
  if (!document.querySelector("#app")) throw new Error("Missing #app");
  const app = document.querySelector("#app") as HTMLElement;

  // Review deep links name the character they are meant to exercise.  Honor
  // that contract so `?character=swahili&air-specials-v1=1` never silently
  // leaves Swahili on the dummy side (or on the character-select screen).
  const query = new URLSearchParams(location.search);
  type ArenaChoice = "fallen-capital" | "tribunal" | "flat";
  let arenaChoice: ArenaChoice = query.get("arena") === "flat" ? "flat" : query.get("arena") === "tribunal" ? "tribunal" : "fallen-capital";
  const requestedCharacter = query.get("character") as CharacterId | null;
  const hasRequestedCharacter = !!requestedCharacter && ROSTER_ORDER.includes(requestedCharacter);
  const selection: Selection = hasRequestedCharacter
    ? { p1: requestedCharacter!, p2: requestedCharacter! }
    : { p1: "lamuh", p2: "swahili" };
  let requestedTutorial: TutorialKind | null = null;
  const frontEnd = createFrontEnd(app, {
    selection,
    arena: () => arenaChoice,
    setArena: (value: string) => { arenaChoice = value as ArenaChoice; },
    onFight: (options: MatchOptions) => { requestedTutorial = null; void startMatch(options); },
    onOnline: () => showOnlineLobby(),
    onTutorial: (lesson) => { requestedTutorial = lesson; void startMatch(defaultMatchOptions('training')); }
  });
  // ?p2char= lets a scripted check pick a non-mirror pairing alongside ?character=.
  const requestedP2 = query.get("p2char") as CharacterId | null;
  if (requestedP2 && ROSTER_ORDER.includes(requestedP2)) selection.p2 = requestedP2;
  const autoAirSpecialPlaytest = requestedCharacter === "swahili" && query.get("air-specials-v1") === "1";
  if (autoAirSpecialPlaytest || query.get("autostart") === "1") {
    void startMatch(matchOptionsFromQuery(query));
  } else if (query.has('online')) {
    showOnlineLobby();
  } else if (hasRequestedCharacter || query.get("screen") === "select") {
    frontEnd.showSelect(query.get("mode") === "rounds" ? "rounds" : query.get("mode") === "stocks" ? "stocks" : "training");
  } else if (query.get("screen") === "modes") {
    frontEnd.showModes();
  } else {
    frontEnd.showTitle();
  }

  // -------------------------------------------------------------------------
  // Character select
  // -------------------------------------------------------------------------
  function renderSelect() { frontEnd.showSelect(); }

  function showOnlineLobby() {
    const room = new OnlineRoom();
    let lobbyActive = true;
    const lobby = { p1: selection.p1, p2: selection.p2, mode: 'stocks' as 'rounds' | 'stocks', arena: arenaChoice, stocks: 3, rounds: 2, time: 99, ready: false };
    const image = (id: CharacterId) => id === 'celeste' ? '/celeste/portrait.svg' : id === 'swahili' ? swahiliPortrait : '/lamuh-legacy-v2/movement-v2/idle-00.png';
    const sendLobby = () => room.send({ type: 'lobby', ...lobby });
    const render = () => {
      const role = room.role;
      const setup = role === 'host' ? `<label>RULESET<select id="onlineMode"><option value="stocks" ${lobby.mode === 'stocks' ? 'selected' : ''}>STOCKS · OPEN PLATFORM</option><option value="rounds" ${lobby.mode === 'rounds' ? 'selected' : ''}>ROUNDS · WALLED ARENA</option></select></label><label>STAGE<select id="onlineArena"><option value="fallen-capital" ${lobby.arena === 'fallen-capital' ? 'selected' : ''}>THE FALLEN CAPITAL</option><option value="tribunal" ${lobby.arena === 'tribunal' ? 'selected' : ''}>THE TRIBUNAL</option></select></label><label>${lobby.mode === 'stocks' ? 'LIVES' : 'ROUNDS TO WIN'}<select id="onlineCount">${[1,2,3,4,5].map(n => `<option value="${n}" ${n === (lobby.mode === 'stocks' ? lobby.stocks : lobby.rounds) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : `<p class="online-rules-readout">${lobby.mode.toUpperCase()} · ${lobby.mode === 'stocks' ? `${lobby.stocks} LIVES · OPEN PLATFORM` : `FIRST TO ${lobby.rounds} · ${lobby.time} SEC`} · ${lobby.arena === 'tribunal' ? 'THE TRIBUNAL' : 'THE FALLEN CAPITAL'}</p>`;
      const fighter = (side: FighterId) => `<div class="online-fighter ${side}"><span class="nga-eyebrow">${side === 'p1' ? 'P1 · HOST' : 'P2 · RIVAL'}</span><img src="${image(lobby[side])}" alt="${ROSTER[lobby[side]].name}"><strong>${ROSTER[lobby[side]].name}</strong><div class="online-picks">${ROSTER_ORDER.map(id => `<button type="button" data-online-pick="${id}" data-side="${side}" ${role === (side === 'p1' ? 'host' : 'guest') ? '' : 'disabled'} aria-pressed="${lobby[side] === id}">${ROSTER[id].name}</button>`).join('')}</div></div>`;
      app.innerHTML = `<section class="nga-front nga-online"><div class="nga-menu-art"></div><div class="nga-menu-shade"></div><div class="nga-menu-frame"></div><header class="nga-menu-header"><button class="nga-back" id="onlineBack">← MODES</button><span class="nga-eyebrow">PRIVATE ONLINE DUEL</span><span class="nga-chapter">IV / IV</span></header><main class="online-lobby"><p class="nga-eyebrow">NO GODS ABOVE Ⅱ</p><h1>THE RIVAL BEYOND</h1><p class="online-intro">One room. Two fighters. The host keeps the match in sync.</p><div class="online-connect"><button id="onlineHost" type="button" ${role ? 'disabled' : ''}>HOST ROOM</button><span>OR</span><label><span class="sr-only">Room code</span><input id="onlineCode" maxlength="6" autocomplete="off" placeholder="ROOM CODE" value="${room.code && role === 'guest' ? room.code : ''}" ${role ? 'disabled' : ''}></label><button id="onlineJoin" type="button" ${role ? 'disabled' : ''}>JOIN ROOM</button>${role ? '<button id="onlineCancel" type="button">CLOSE ROOM</button>' : ''}</div><div class="online-room-code">${room.code ? `ROOM <strong>${room.code}</strong><button id="onlineCopy" type="button">COPY INVITE LINK</button>` : 'CREATE OR JOIN A ROOM'}</div><p class="online-status" id="onlineStatus" role="status">${room.status}</p>${role ? `<div class="online-versus">${fighter('p1')}<div class="online-center"><span class="online-vs">VS</span>${setup}${role === 'guest' ? `<button class="nga-primary" id="onlineReady" type="button" ${!room.connected ? 'disabled' : ''}>${lobby.ready ? 'READY ✓' : 'READY TO FIGHT'}</button>` : `<button class="nga-primary" id="onlineStart" type="button" ${!room.connected || !lobby.ready ? 'disabled' : ''}>START MATCH →</button>`}<small>${role === 'host' ? 'WAIT FOR YOUR RIVAL TO READY UP' : 'YOUR RIVAL CONTROLS THE RULESET · USE P1 KEYS TO PLAY P2'}</small></div>${fighter('p2')}</div>` : ''}</main><footer class="nga-menu-footer"><span>NO GODS ABOVE <b>Ⅱ</b></span><span>ROOM CODES ARE PRIVATE · TWO BROWSERS</span></footer></section>`;
      app.querySelector<HTMLElement>('.nga-menu-art')!.style.backgroundImage = "url('/ui/online-stock/lobby-background.webp')";
      app.querySelector<HTMLButtonElement>('#onlineBack')!.onclick = () => { lobbyActive = false; room.close(); frontEnd.showModes(); };
      app.querySelector<HTMLButtonElement>('#onlineCancel')?.addEventListener('click', () => { room.close(); room.status = 'OFFLINE'; lobby.ready = false; render(); });
      app.querySelector<HTMLButtonElement>('#onlineHost')!.onclick = () => room.host();
      app.querySelector<HTMLButtonElement>('#onlineJoin')!.onclick = () => room.join(app.querySelector<HTMLInputElement>('#onlineCode')!.value);
      app.querySelector<HTMLInputElement>('#onlineCode')!.onkeydown = event => { if (event.key === 'Enter') room.join((event.target as HTMLInputElement).value); };
      app.querySelector<HTMLButtonElement>('#onlineCopy')?.addEventListener('click', () => { void navigator.clipboard.writeText(`${location.origin}${location.pathname}?online=${room.code}`); });
      app.querySelectorAll<HTMLButtonElement>('[data-online-pick]').forEach(button => button.onclick = () => {
        const side = button.dataset.side as FighterId, id = button.dataset.onlinePick as CharacterId;
        if (!ROSTER_ORDER.includes(id)) return;
        lobby[side] = id; selection[side] = id;
        if (room.role === 'host') sendLobby(); else { lobby.ready = false; room.send({ type: 'pick', character: id, ready: false }); }
        render();
      });
      app.querySelector<HTMLSelectElement>('#onlineMode')?.addEventListener('change', event => { lobby.mode = (event.target as HTMLSelectElement).value as 'rounds' | 'stocks'; lobby.ready = false; sendLobby(); render(); });
      app.querySelector<HTMLSelectElement>('#onlineArena')?.addEventListener('change', event => { lobby.arena = (event.target as HTMLSelectElement).value as ArenaChoice; arenaChoice = lobby.arena; lobby.ready = false; sendLobby(); render(); });
      app.querySelector<HTMLSelectElement>('#onlineCount')?.addEventListener('change', event => { const count = Number((event.target as HTMLSelectElement).value); if (lobby.mode === 'stocks') lobby.stocks = count; else lobby.rounds = count; lobby.ready = false; sendLobby(); render(); });
      app.querySelector<HTMLButtonElement>('#onlineReady')?.addEventListener('click', () => { lobby.ready = !lobby.ready; room.send({ type: 'pick', character: lobby.p2, ready: lobby.ready }); render(); });
      app.querySelector<HTMLButtonElement>('#onlineStart')?.addEventListener('click', () => {
        if (!room.connected || !lobby.ready) return;
        const seed = 1 + Math.floor(Math.random() * 900000);
        room.send({ type: 'start', seed });
        launch(seed);
      });
    };
    const launch = (seed: number) => {
      lobbyActive = false;
      selection.p1 = lobby.p1; selection.p2 = lobby.p2; arenaChoice = lobby.arena;
      const options = defaultMatchOptions(lobby.mode);
      options.controllers = { p1: 'human', p2: 'human' };
      options.stocks = lobby.stocks; options.roundsToWin = lobby.rounds; options.roundSeconds = lobby.time;
      void startMatch(options, room, seed);
    };
    room.onStatus = status => { if (!lobbyActive) return; const target = app.querySelector<HTMLElement>('#onlineStatus'); if (target) target.textContent = status; if (status === 'RIVAL CONNECTED') { if (room.role === 'host') sendLobby(); else room.send({ type: 'pick', character: lobby.p2, ready: false }); render(); } else if (room.role && !app.querySelector('.match')) render(); };
    room.onMessage = message => {
      if (room.role === 'guest' && message.type === 'lobby') {
        if (!ROSTER_ORDER.includes(message.p1 as CharacterId) || !ROSTER_ORDER.includes(message.p2 as CharacterId)) return;
        lobby.p1 = message.p1 as CharacterId; lobby.p2 = message.p2 as CharacterId;
        lobby.mode = message.mode === 'rounds' ? 'rounds' : 'stocks';
        lobby.arena = message.arena === 'tribunal' ? 'tribunal' : 'fallen-capital';
        lobby.stocks = Math.max(1, Math.min(5, Number(message.stocks) || 3));
        lobby.rounds = Math.max(1, Math.min(5, Number(message.rounds) || 2));
        lobby.time = Math.max(10, Math.min(999, Number(message.time) || 99));
        lobby.ready = false; render();
      } else if (room.role === 'host' && message.type === 'pick' && ROSTER_ORDER.includes(message.character as CharacterId)) {
        lobby.p2 = message.character as CharacterId; lobby.ready = !!message.ready; selection.p2 = lobby.p2; render();
      } else if (room.role === 'guest' && message.type === 'start' && Number.isInteger(message.seed)) launch(message.seed);
    };
    room.onClosed = () => { if (!lobbyActive) return; lobby.ready = false; render(); };
    const shared = normalizeRoomCode(query.get('online') ?? '');
    if (shared.length === 6) room.join(shared);
    render();
  }

  // -------------------------------------------------------------------------
  // Match
  // -------------------------------------------------------------------------
  async function startMatch(options: MatchOptions, room?: OnlineRoom, onlineSeed?: number) {
    const chosen: Record<FighterId, CharacterId> = { ...selection };
    app.innerHTML = `
      <section class="match">
        <div class="loading"><h2>Preparing fighters…</h2><progress id="progress" max="100" value="0"></progress><p id="progressLabel" class="fine"></p></div>
      </section>`;
    const label = app.querySelector<HTMLElement>("#progressLabel")!;
    const progress = app.querySelector<HTMLProgressElement>("#progress")!;

    const presenters: Record<FighterId, Presenter> = {
      p1: createPresenter(chosen.p1),
      p2: createPresenter(chosen.p2)
    };
    // A mirror match shares one presenter's cache by loading the same set twice;
    // load sequentially so the progress bar is meaningful and memory stays flat.
    for (const side of ["p1", "p2"] as FighterId[]) {
      label.textContent = `Loading ${ROSTER[chosen[side]].name} frames…`;
      await presenters[side].preload((done, total) => {
        progress.value = total ? Math.round((side === "p1" ? 0 : 50) + (done / total) * 50) : 0;
      });
    }

    renderMatch(chosen, presenters, options, room, onlineSeed);
  }

  function renderMatch(chosen: Record<FighterId, CharacterId>, presenters: Record<FighterId, Presenter>, options: MatchOptions, room?: OnlineRoom, onlineSeed?: number) {
    const initialTutorial = requestedTutorial;
    requestedTutorial = null;
    const rounds = options.mode === "rounds";
    const stocks = options.mode === "stocks";
    // The full stock slab spans 1,800 simulation units. Keep the established
    // pixel density while giving the combat texture room for both far ledges.
    const combatCanvasWidth = stocks && arenaChoice === "fallen-capital" ? 2700 : STAGE_W;
    const competitive = rounds || stocks;
    app.innerHTML = `
      <section class="match">
        <div class="gameplay-viewport">
        <canvas id="stage" width="${combatCanvasWidth}" height="${STAGE_H}"></canvas>
        ${gameplayHud(chosen, { mode: options.mode, roundsToWin: options.roundsToWin, stocks: options.stocks, controllers: options.controllers, onlineRole: room?.role ?? undefined })}
        </div>
        ${room ? `<div class="online-status-strip" id="onlineMatchStatus">ONLINE · ${room.role?.toUpperCase()} · ${room.code}</div>` : ''}
        <div class="gameplay-actions"><span>NO GODS ABOVE <small>ENGINE V2 · ${rounds ? `ROUNDS · FIRST TO ${options.roundsToWin}` : stocks ? `STOCKS · ${options.stocks} LIVES` : "TRAINING"}</small></span>${competitive || room ? '' : '<button id="hudTutorialBasics" type="button">How to play</button><button id="hudTutorialCombos" type="button">Combo tutorial</button>'}<button id="hudPause">Pause <kbd>ESC</kbd></button><button id="hudReset">${competitive ? "Restart match" : "Reset"}</button><button id="hudSelect">${room ? 'Leave room' : 'Character select'}</button></div>
        ${competitive || room ? '' : `<section class="tutorial-panel" id="tutorialPanel" aria-label="Guided tutorial" hidden><div class="tutorial-top"><span>TRAINING · P1 KEYBOARD</span><span id="tutorialProgress" aria-live="polite"></span></div><h2 id="tutorialTitle"></h2><p id="tutorialInstruction"></p><p class="tutorial-tip" id="tutorialTip"></p><div class="tutorial-bottom"><output id="tutorialStatus" aria-live="polite"></output><div class="tutorial-launch"><button type="button" id="tutorialBasics" data-tutorial="basics">Basics</button><button type="button" id="tutorialCombos" data-tutorial="combos">Combos</button></div><button type="button" id="tutorialRestart">Restart lesson</button><button type="button" id="tutorialClose">Close</button></div><p class="tutorial-tip">P1: A/D move · W jump · S crouch · Left Shift dash · J/K/L attacks · U + attack special · O block · I throw · P super · Y burst · T Roman Cancel</p><p class="tutorial-tip">P2: Arrow keys move · 1/2/3 attack · 5 + attack special · 6 block · 4 throw · 0 super · 8 burst · 7 dash (numpad).</p></section>`}
        <details class="training-tools"><summary>${competitive ? "Match tools &amp; move list" : "Training tools &amp; move list"}</summary>
        <div class="toolbar">
          <span id="arenaLabel">${arenaChoice === "fallen-capital" ? "01 · THE FALLEN CAPITAL" : arenaChoice === "tribunal" ? "THE LAST TRIBUNAL" : "TRAINING GRID"}</span>
          <button id="pause">Pause</button>
          <button id="step">+1 tick</button>
          <button id="reset">${competitive ? "Restart match" : "Reset positions"}</button>
          <label class="ai" ${competitive ? "hidden" : ""}><input id="aiToggle" type="checkbox" ${options.controllers.p2 === "cpu" ? "checked" : ""}> <b>AI opponent</b></label>
          <label ${competitive ? "hidden" : ""}>Dummy
            <select id="dummy">
              <option value="stand">Stand</option>
              <option value="crouch">Crouch</option>
              <option value="jump">Jump</option>
              <option value="block_all">Block all</option>
              <option value="block_after_hit">Block after first hit</option>
            </select>
          </label>
          <label ${competitive ? "hidden" : ""}>AI
            <select id="aiLevel">
              ${(["easy", "normal", "hard", "master"] as const).map((level) => `<option value="${level}" ${options.cpuLevel.p2 === level ? "selected" : ""}>${level[0].toUpperCase()}${level.slice(1)}</option>`).join("")}
            </select>
          </label>
          <label ${competitive ? "hidden" : ""}><input id="infiniteHealth" type="checkbox" ${competitive ? "" : "checked"}> Infinite health</label>
          <label ${competitive ? "hidden" : ""}><input id="infiniteMeter" type="checkbox"> Infinite meter</label>
          <label><input id="boxes" type="checkbox" ${options.showBoxes ? "checked" : ""}> boxes</label>
          <label><input id="envelopeToggle" type="checkbox" ${options.envelope ? "checked" : ""}> full-body hitboxes</label>
          <label><input id="half" type="checkbox"> 0.5&times;</label>
          <button id="swap">Swap sides</button>
          <button id="back">Character select</button>
        </div>
        ${(["p1", "p2"] as FighterId[]).filter((side) => !competitive && chosen[side] === "swahili").map((side) => `
          <div class="air-practice" data-air-side="${side}">
            <span><b>Swahili air-special gameplay rehearsal (${side.toUpperCase()})</b> · jump, then U + strength · NEW Medium V10: overhead swing → tuck → outward-blade roll · original Light and retained Heavy unchanged</span>
            <button data-air-strength="light">Air Light <kbd>U + J</kbd></button>
            <button data-air-strength="medium">Air Medium <kbd>U + K</kbd></button>
            <button data-air-strength="heavy">Air Heavy <kbd>U + L</kbd></button>
          </div>`).join("")}
        ${(["p1", "p2"] as FighterId[]).filter(side => !competitive && chosen[side] === 'swahili').map(side => `
          <div class="air-practice new-special-practice" data-new-side="${side}">
            <span><b>NEW specials installed (${side.toUpperCase()})</b> · buttons perform the real move · Back is relative to facing · Default Judgment button cues a dummy strike to show the counter</span>
            <button data-new-move="ceiling">Ceiling Tax · U+W+J</button>
            <button data-new-move="claim">Claim Check · U+J</button>
            <button data-new-move="headbutt">Headbutt · U+K</button>
            <button data-new-move="vertical">Vertical Audit · U+W+K</button>
            <button data-new-move="death">Death &amp; Interest · U+W+L</button>
            <button data-new-move="golden">Golden Injunction · U+L</button>
            <button data-new-move="fine">Fine Print · Back+U+J</button>
            <button data-new-move="hidden">Hidden Clause · Back+U+K</button>
            <button data-new-move="judgment">Default Judgment · Back+U+L</button>
            <button data-new-move="kneecap">Kneecap Notice · S+U+J</button>
          </div>`).join('')}
        <div class="panels">
          <article class="panel"><h3>Training readout</h3><div id="readout" class="readout"></div></article>
          <article class="panel"><h3>Move list</h3><div id="moveList" class="movelist"></div></article>
          <article class="panel"><h3>Animation coverage</h3><div id="coverage" class="coverage"></div></article>
          <article class="panel wide"><h3>Body check</h3><div id="bodyCheck" class="readout"></div></article>
        </div>
        </details>
      </section>`;

    const canvas = app.querySelector<HTMLCanvasElement>("#stage")!;
    const context = canvas.getContext("2d")!;
    const checked = (id: string) => app.querySelector<HTMLInputElement>(`#${id}`)!.checked;
    if (room) {
      for (const id of ['step', 'swap', 'envelopeToggle', 'half']) app.querySelector<HTMLButtonElement | HTMLInputElement>(`#${id}`)!.disabled = true;
      if (room.role === 'guest') for (const id of ['pause', 'hudPause', 'reset', 'hudReset', 'resultsRematch']) app.querySelector<HTMLButtonElement>(`#${id}`)!.disabled = true;
    }

    // Stage presentation consumes the same combat canvas; simulation stays authoritative.
    // Existing Tribunal and flat review routes remain selectable.
    let tribunal: LamuhTribunalArena | FallenCapitalArena | null = null;
    let arenaReady = false;
    const disposeArena = () => { if (tribunal instanceof FallenCapitalArena) tribunal.dispose(); };
    if (arenaChoice !== "flat") {
      const host = document.createElement("div");
      host.id = "tribunalStage";
      host.style.cssText = "width:100%;aspect-ratio:1600/900;position:relative;overflow:hidden;border-radius:10px;border:1px solid #1e2836";
      // Keep the flat combat canvas visible until every arena texture is ready.
      host.style.display = 'none';
      canvas.before(host);
      try {
        tribunal = arenaChoice === "fallen-capital" ? new FallenCapitalArena(host) : new LamuhTribunalArena(host);
        void tribunal.ready.then(() => {
          if (!host.isConnected) { disposeArena(); return; }
          arenaReady = true;
          host.dataset.arenaReady = "true";
          host.style.display = '';
          canvas.style.display = "none";
        }).catch((error: unknown) => {
          if (!host.isConnected) return;
          console.warn("Arena assets unavailable; using training grid", error);
          disposeArena(); tribunal = null; host.remove(); canvas.style.display = "";
          const arenaLabel = app.querySelector<HTMLElement>("#arenaLabel");
          if (arenaLabel) arenaLabel.textContent = "TRAINING GRID · stage unavailable";
        });
      } catch (error) {
        console.warn("Arena unavailable; training-grid fallback", error);
        tribunal = null; host.remove();
      }
    }

    // Rounds use a fresh seed per session so CPU vs CPU plays out differently each time;
    // ?seed= pins it, and every round and CPU decision derives from it deterministically.
    const requestedSeed = Number(query.get("seed"));
    const matchSeed = onlineSeed ?? (Number.isInteger(requestedSeed) && requestedSeed > 0 ? requestedSeed : competitive ? 1 + Math.floor(Math.random() * 90000) : 1);
    let rematches = 0;
    const director = rounds
      ? new RoundDirector({ roundsToWin: options.roundsToWin, roundSeconds: options.roundSeconds }, { p1: ROSTER[chosen.p1].name, p2: ROSTER[chosen.p2].name })
      : null;
    const stockDirector = stocks ? new StockDirector(options.stocks, { p1: ROSTER[chosen.p1].name, p2: ROSTER[chosen.p2].name }) : null;
    const brainSeed = (side: FighterId) => matchSeed * (side === "p1" ? 7 : 13) + (director?.round ?? 0) * 977 + rematches * 31;
    const brains: Record<FighterId, CpuBrain> = {
      p1: new CpuBrain("p1", chosen.p1, options.cpuLevel.p1, brainSeed("p1")),
      p2: new CpuBrain("p2", chosen.p2, options.cpuLevel.p2, brainSeed("p2"))
    };
    let state = newMatch(matchSeed);
    const tutorial = !competitive && !room ? createTutorial(app, initialTutorial, () => state) : null;
    app.querySelector<HTMLButtonElement>('#hudTutorialBasics')?.addEventListener('click', () => tutorial?.open('basics'));
    app.querySelector<HTMLButtonElement>('#hudTutorialCombos')?.addEventListener('click', () => tutorial?.open('combos'));
    let playing = room?.role === 'host' ? false : true, halfAccumulator = 0, active = true;
    const heldKeys = new Set<string>();
    const queued: Record<FighterId, InputFrame[]> = { p1: [], p2: [] };
    let remoteInput: InputFrame = {};
    let remotePresses: InputFrame = {};
    let inputSequence = 0;
    let receivedSequence = -1;
    let loadedRetry: number | undefined;
    if (room) {
      room.onMessage = (message: OnlineMessage) => {
        if (room.role === 'host') {
          if (message.type === 'input' && message.sequence > receivedSequence && message.frame && typeof message.frame === 'object') {
            receivedSequence = message.sequence;
            for (const key of Object.keys(message.frame) as (keyof InputFrame)[]) {
              if (message.frame[key] && !remoteInput[key]) remotePresses[key] = true;
            }
            remoteInput = message.frame;
          }
          if (message.type === 'dash') queueDash('p2');
          if (message.type === 'loaded') { playing = true; syncPause(); }
        } else {
          if (message.type === 'snapshot' && message.sequence > receivedSequence && message.state?.fighters) {
            receivedSequence = message.sequence;
            if (loadedRetry !== undefined) { window.clearInterval(loadedRetry); loadedRetry = undefined; }
            state = message.state;
            startPaidSuper();
            if (director && message.director) Object.assign(director, message.director);
            if (stockDirector && message.director) Object.assign(stockDirector, message.director);
          }
          if (message.type === 'rematch') { restartMatch(); }
          if (message.type === 'pause') { playing = message.playing; syncPause(); }
        }
      };
      room.onClosed = () => {
        playing = false; remoteInput = {}; remotePresses = {}; syncPause();
        const strip = app.querySelector<HTMLElement>('#onlineMatchStatus');
        if (strip) { strip.dataset.state = 'disconnected'; strip.textContent = 'RIVAL DISCONNECTED · LEAVE ROOM TO RECONNECT'; }
      };
    }
    const paidRehearsal = createPaidRehearsal(app, chosen.p1 === 'swahili' || chosen.p2 === 'swahili', () => { heldKeys.clear(); queued.p1=[]; queued.p2=[]; }, !competitive && query.get('paid-rehearsal') === '1');
    let lastPaidSuperEvent = '';
    function startPaidSuper() {
      const event = state.lastProjectileEvent;
      if(event?.attackId !== 'swahili_paid_super' || event.type !== 'hit' || event.eventId === lastPaidSuperEvent) return false;
      lastPaidSuperEvent = event.eventId;
      paidRehearsal.start(event.owner, true);
      return true;
    }
    if(!competitive&&query.get('paid-rehearsal')==='1'){
      const cast=document.createElement('button');cast.textContent='Cast contract seal · P · hit-confirm test';
      const status=document.createElement('output');status.id='paidSealStatus';status.textContent=' Seal ready';
      cast.style.cssText='padding:12px;margin:8px;color:#ffe4a0;background:#35250e;border:1px solid #b58b45';
      cast.onclick=()=>{if(!paidRehearsal.active){const side=chosen.p1==='swahili'?'p1':'p2';queued[side].push({ultimate:true},{});}};
      app.querySelector('.match')?.prepend(cast);
      cast.after(status);
    }

    function newMatch(seed = 1): MatchState {
      const useEnvelope = app.querySelector<HTMLInputElement>("#envelopeToggle")?.checked ?? options.envelope;
      const created = createMatch(seed, {
        p1Kind: ROSTER[chosen.p1].kind,
        p2Kind: ROSTER[chosen.p2].kind,
        p1X: -110, p2X: 110,
        // Both characters' Swahili air specials ride the same match-level flag.
        swahiliAirSpecialsV1: ROSTER[chosen.p1].swahiliAirSpecialsV1 || ROSTER[chosen.p2].swahiliAirSpecialsV1,
        versusRules: rounds ? ROUNDS_RULES : stocks ? STOCK_RULES : TRAINING_RULES,
        ...(useEnvelope ? { p1BodyEnvelope: ROSTER[chosen.p1].envelope, p2BodyEnvelope: ROSTER[chosen.p2].envelope } : {})
      });
      if(!competitive&&query.get('paid-rehearsal')==='1')for(const side of ['p1','p2'] as FighterId[])if(chosen[side]==='swahili')created.fighters[side].paidSealStarterTest=true;
      return created;
    }

    /** A new round: fresh positions and health, super meter carried over, CPUs re-seeded. */
    function beginRound(carryMeter: boolean) {
      const carried = { p1: state.fighters.p1.tension, p2: state.fighters.p2.tension };
      state = newMatch(matchSeed + (director?.round ?? 0) * 101 + rematches * 7919);
      if (carryMeter) { state.fighters.p1.tension = carried.p1; state.fighters.p2.tension = carried.p2; }
      for (const side of ["p1", "p2"] as FighterId[]) brains[side].reset(brainSeed(side));
      queued.p1 = []; queued.p2 = [];
      impactTick = -1;
    }
    function restartMatch() {
      paidRehearsal.stop();
      lastPaidSuperEvent = '';
      if (!director && !stockDirector) return;
      rematches += 1;
      if (director) { director.rematch(); director.pendingReset = false; beginRound(false); }
      if (stockDirector) { stockDirector.rematch(); state = newMatch(matchSeed + rematches * 7919); queued.p1 = []; queued.p2 = []; }
      playing = true;
      if (room?.role === 'host') room.send({ type: 'rematch' });
      syncPause();
    }

    // --- input ---
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => { heldKeys.clear(); sendGuestInput(); });

    function sendGuestInput(frame = readKeys(P1_KEYS)) {
      if (room?.role === 'guest') room.send({ type: 'input', frame, sequence: ++inputSequence });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (paidRehearsal.active) { if(event.code === 'Escape' && paidRehearsal.canCancel) paidRehearsal.stop(); event.preventDefault(); return; }
      if (event.code === "Escape") { if (room?.role !== 'guest') { playing = !playing; if (room) room.send({ type: 'pause', playing }); syncPause(); } event.preventDefault(); return; }
      if (event.code === P1_DASH && !event.repeat) { queueDash("p1"); event.preventDefault(); return; }
      if (event.code === P2_DASH && !event.repeat) { queueDash("p2"); event.preventDefault(); return; }
      if (P1_KEYS[event.code] || P2_KEYS[event.code]) { heldKeys.add(event.code); sendGuestInput(); event.preventDefault(); }
    }
    function onKeyUp(event: KeyboardEvent) { heldKeys.delete(event.code); sendGuestInput(); }

    function readKeys(scheme: ControlScheme): InputFrame {
      const input: InputFrame = {};
      for (const code of heldKeys) { const action = scheme[code]; if (action) (input as any)[action] = true; }
      return input;
    }
    /** A dash is a deterministic forward-tap, gap, forward-tap; queue it as real frames. */
    function queueDash(side: FighterId) {
      if (competitive && options.controllers[side] === "cpu") return;
      if (room?.role === 'guest' && side === 'p1') { room.send({ type: 'dash' }); return; }
      const f = state.fighters[side];
      const tap: InputFrame = f.facing === 1 ? { right: true } : { left: true };
      queued[side].push(tap, {}, tap);
    }

    const select = (id: string) => app.querySelector<HTMLSelectElement>(`#${id}`)!.value;
    let dummyHasBeenHit = false;

    /**
     * CPU input. The brain plays through the same input path as a player and reads frame
     * data from the live move definitions; its randomness derives from the match seed.
     * Training's AI level select swaps the brain's difficulty in place.
     */
    function cpuInput(side: FighterId): InputFrame {
      const level = (competitive ? options.cpuLevel[side] : select("aiLevel")) as MatchOptions["cpuLevel"]["p1"];
      if (brains[side].level !== level) brains[side] = new CpuBrain(side, chosen[side], level, brainSeed(side));
      return brains[side].input(state);
    }

    /** Recording dummy behaviour: a fixed stance so a combo can be practised. */
    function dummyInput(): InputFrame {
      switch (select("dummy")) {
        case "crouch": return { down: true };
        case "jump": return state.fighters.p2.grounded && state.tick % 40 === 0 ? { up: true } : {};
        case "block_all": return { block: true, ...(state.fighters.p2.crouchBlocking ? {} : {}) };
        case "block_after_hit": return dummyHasBeenHit ? { block: true } : {};
        default: return {};
      }
    }

    function inputFor(side: FighterId): InputFrame {
      // Round intros and results hold both fighters still; nothing buffers through them.
      if (director?.inputsLocked || stockDirector?.inputsLocked) { queued[side] = []; return {}; }
      if (queued[side].length) return queued[side].shift()!;
      if (room?.role === 'host' && side === 'p2') { const frame = { ...remoteInput, ...remotePresses }; remotePresses = {}; return frame; }
      if (competitive) return options.controllers[side] === "cpu" ? cpuInput(side) : readKeys(side === "p1" ? P1_KEYS : P2_KEYS);
      // P2 is the training dummy unless a second player takes it over. Any P2 key
      // press wins over the dummy/AI for that frame, so two-player still works.
      if (side === "p2") {
        const human = readKeys(P2_KEYS);
        if (Object.keys(human).length) return human;
        return checked("aiToggle") ? cpuInput("p2") : dummyInput();
      }
      return readKeys(P1_KEYS);
    }

    /** Training conveniences applied after each tick, never inside the simulation. */
    function applyTrainingRules() {
      if (competitive) return;
      const p1 = state.fighters.p1, p2 = state.fighters.p2;
      if (state.lastCombatEvent?.defender === "p2" && state.lastCombatEvent.outcome === "hit") dummyHasBeenHit = true;
      if (checked("infiniteHealth")) {
        // Refill only once the fighter is out of hitstun, so damage still reads.
        if (p1.hitstun === 0 && p1.blockstun === 0 && p1.phase !== "hit_reaction") p1.health = 1000;
        if (p2.hitstun === 0 && p2.blockstun === 0 && p2.phase !== "hit_reaction") p2.health = 1000;
      }
      if (checked("infiniteMeter")) { p1.tension = 100; p2.tension = 100; }
    }

    // --- loop ---
    let engineFaults = 0, lastFault = "";
    /**
     * Runs one simulation tick.
     *
     * The engine asserts that pushboxes never overlap outside a throw, but it skips
     * push resolution on the tick a throw interaction ends. Throw an opponent into a
     * corner and that assertion fires and would otherwise kill the loop. That is a
     * pre-existing engine bug (it reproduces with the body envelope disabled), so it
     * is NOT patched here — training mode just refuses to die on it: the fighters are
     * separated the way resolvePush would have, and the fault is surfaced in the
     * readout instead of being swallowed.
     */
    function stepSimulation() {
      if (paidRehearsal.active) return;
      if (room?.role === 'guest') { room.send({ type: 'input', frame: queued.p1.shift() ?? readKeys(P1_KEYS), sequence: ++inputSequence }); return; }
      try {
        const p1Input = inputFor("p1");
        tick(state, { p1: p1Input, p2: inputFor("p2") });
        tutorial?.update(p1Input, state);
        const sealHit=state.lastProjectileEvent;
        if(sealHit?.attackId==='swahili_paid_seal'){const status=app.querySelector('#paidSealStatus');if(status)status.textContent=` Seal: ${sealHit.type}`;}
        if(sealHit?.tick===state.tick-1&&sealHit.attackId==='swahili_paid_seal'&&sealHit.type==='hit')paidRehearsal.start(sealHit.owner);
        if(startPaidSuper()) {
          if(room?.role === 'host')room.send({type:'snapshot',state:onlineSnapshot(state),director:null,sequence:state.tick});
          return;
        }
      } catch (error) {
        engineFaults += 1;
        lastFault = error instanceof Error ? error.message : String(error);
        separateFighters();
      }
      applyTrainingRules();
      trackImpact();
      if (director) {
        director.afterTick(state);
        if (director.phase === "ko" && director.phaseTicks === 1) { impactTick = state.tick; impactPower = 2.2; }
        if (director.pendingReset) { director.pendingReset = false; beginRound(true); }
        // CPU vs CPU keeps going on its own: a short results hold, then the rematch.
        if (director.phase === "match_end" && autoRematch && director.phaseTicks >= AUTO_REMATCH_TICKS) restartMatch();
      }
      if (stockDirector) {
        stockDirector.afterTick(state);
        for (const side of stockDirector.takeRespawns()) {
          const fresh = newMatch(matchSeed + state.tick + rematches * 7919);
          state.fighters[side] = fresh.fighters[side];
          state.fighters[side].wakeupInvuln = 90;
          state.throwInteraction = null;
          state.ultimateInteraction = undefined;
          queued[side] = [];
        }
      }
      if (room?.role === 'host' && state.tick % 3 === 0) room.send({ type: 'snapshot', state: onlineSnapshot(state), director: director ? { phase: director.phase, phaseTicks: director.phaseTicks, round: director.round, wins: director.wins, timerTicks: director.timerTicks, lastRound: director.lastRound, history: director.history, matchWinner: director.matchWinner } : stockDirector ? { phase: stockDirector.phase, phaseTicks: stockDirector.phaseTicks, lives: stockDirector.lives, lossNumber: stockDirector.lossNumber, matchWinner: stockDirector.matchWinner } : null, sequence: state.tick });
    }

    // --- impact feel: a short, decaying camera shake on heavy contact, wall bounces and KOs ---
    let impactTick = -1, impactPower = 0;
    const autoRematch = rounds && options.controllers.p1 === "cpu" && options.controllers.p2 === "cpu";
    const AUTO_REMATCH_TICKS = 8 * 60;
    function trackImpact() {
      const event = state.lastCombatEvent;
      if (event && event.tick === state.tick - 1 && event.outcome === "hit") {
        const power = Math.min(1.4, event.damage / 70) * (event.counterHit ? 1.35 : 1);
        if (power >= 0.6) { impactTick = state.tick; impactPower = power; }
      }
      if (state.lastWallBounce && state.lastWallBounce.tick === state.tick - 1) { impactTick = state.tick; impactPower = 1.5; }
    }
    function currentShake(): { x: number; y: number } {
      const age = state.tick - impactTick;
      if (impactTick < 0 || age < 0 || age > 14) return { x: 0, y: 0 };
      const amplitude = impactPower * (1 - age / 14);
      return { x: Math.sin(age * 2.4) * amplitude * 3.2, y: Math.cos(age * 3.3) * amplitude * 2 };
    }

    function separateFighters() {
      const p1 = state.fighters.p1, p2 = state.fighters.p2;
      const a = fighterPushbox(p1), b = fighterPushbox(p2);
      const left = a.x <= b.x ? p1 : p2, right = left === p1 ? p2 : p1;
      const leftBox = left === p1 ? a : b, rightBox = left === p1 ? b : a;
      const depth = Math.max(0, leftBox.x + leftBox.w - rightBox.x) + 0.5;
      if (depth <= 0) return;
      const leftRoom = Math.max(0, left.x - state.stage.left);
      const rightRoom = Math.max(0, state.stage.right - right.x);
      const leftShift = Math.min(depth / 2, leftRoom);
      const rightShift = Math.min(depth - leftShift, rightRoom);
      left.x = Math.max(state.stage.left, left.x - leftShift);
      right.x = Math.min(state.stage.right, right.x + Math.max(rightShift, depth - leftShift));
    }

    // Fixed-timestep accumulator: the simulation only ever advances in whole
    // deterministic 60 Hz ticks, and a stall is clamped rather than replayed.
    let lastFrame = performance.now(), accumulator = 0, lastRafAt = performance.now();

    function advance(now: number) {
      const delta = Math.min(250, now - lastFrame);
      lastFrame = now;
      if (playing && !paidRehearsal.active) {
        accumulator += delta;
        const stepMs = (checked("half") ? 1000 / 30 : 1000 / 60) / (director?.timeScale ?? 1);
        let steps = 0;
        while (accumulator >= stepMs && steps < 6) { stepSimulation(); accumulator -= stepMs; steps += 1; }
        if (accumulator > stepMs * 6) accumulator = 0;
      }
      render();
    }

    function loop(now: number) {
      if (!active) return;
      lastRafAt = now;
      advance(now);
      requestAnimationFrame(loop);
    }

    // Animation frames stop arriving when the host pane is not compositing, even
    // though document.hidden stays false. Without this the match silently freezes
    // whenever the preview pane is hidden. The watchdog only takes over once
    // frames have actually stopped, so it never double-drives the simulation.
    const watchdog = window.setInterval(() => {
      const now = performance.now();
      if (active && now - lastRafAt > 100) advance(now);
    }, 100);

    // --- draw ---
    const worldX = (x: number) => combatCanvasWidth / 2 + x * WORLD_SCALE;
    const worldY = (y: number) => GROUND_Y + y * WORLD_SCALE;

    function rectWorld(f: FighterState, rect: Rect, facing = f.phase === "attack" ? f.attackFacing : f.facing): Rect {
      return { x: f.x + rect.x * facing - (facing < 0 ? rect.w : 0), y: f.y + rect.y, w: rect.w, h: rect.h };
    }
    function strokeRect(rect: Rect, colour: string, width = 2) {
      context.strokeStyle = colour; context.lineWidth = width;
      context.strokeRect(worldX(rect.x), worldY(rect.y), rect.w * WORLD_SCALE, rect.h * WORLD_SCALE);
    }

    const world = { x: worldX, y: worldY };
    function drawFighter(side: FighterId) {
      presenters[side].draw(context, state.fighters[side], state, world);
    }

    function drawBoxes(side: FighterId) {
      const f = state.fighters[side];
      strokeRect(fighterPushbox(f), "rgba(120,200,255,.55)", 1);
      for (const box of fighterExtendedHurtboxes(f)) strokeRect(box, "#4ade80");
      if (f.phase === "attack" && f.currentAttack) {
        const attack = resolveAttackDefinition(f);
        for (const hitbox of attack.hitboxes) {
          if (f.phaseTick < hitbox.start || f.phaseTick > hitbox.end) continue;
          strokeRect(rectWorld(f, hitbox.rect, f.attackFacing), "#ef4444", 3);
        }
      }
    }

    /**
     * A flat, cheap stand-in for The Last Tribunal. Deliberately 2D: the 3D
     * Tribunal renderer uploads the whole combat plane as a texture every frame,
     * which is the path that previously cost most of the frame budget. This
     * playtest is about how the two fighters read against each other.
     */
    function drawArena() {
      const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#0d1119"); sky.addColorStop(.65, "#161f2e"); sky.addColorStop(1, "#20293a");
      context.fillStyle = sky; context.fillRect(0, 0, combatCanvasWidth, GROUND_Y);
      // Back wall columns
      for (let i = 0; i <= 8; i += 1) {
        const x = (combatCanvasWidth / 8) * i;
        context.fillStyle = i % 2 ? "rgba(70,88,116,.13)" : "rgba(70,88,116,.07)";
        context.fillRect(x - 26, GROUND_Y - 330, 52, 330);
      }
      context.fillStyle = "rgba(233,196,106,.05)";
      context.beginPath(); context.arc(combatCanvasWidth / 2, GROUND_Y - 250, 190, 0, Math.PI * 2); context.fill();
      // Floor
      const floor = context.createLinearGradient(0, GROUND_Y, 0, STAGE_H);
      floor.addColorStop(0, "#283145"); floor.addColorStop(1, "#111722");
      const platform = stocks ? STOCK_RULES.openPlatform : undefined;
      const floorLeft = platform ? worldX(platform.left) : 0;
      const floorRight = platform ? worldX(platform.right) : combatCanvasWidth;
      context.fillStyle = floor; context.fillRect(floorLeft, GROUND_Y, floorRight - floorLeft, STAGE_H - GROUND_Y);
      context.strokeStyle = "rgba(150,175,210,.35)"; context.lineWidth = 2;
      context.beginPath(); context.moveTo(floorLeft, GROUND_Y); context.lineTo(floorRight, GROUND_Y); context.stroke();
      if (platform) {
        for (const edge of [floorLeft, floorRight]) {
          context.fillStyle = '#a58956'; context.fillRect(edge - 4, GROUND_Y, 8, STAGE_H - GROUND_Y);
          context.fillStyle = '#352b24'; context.fillRect(edge + (edge === floorLeft ? -15 : 7), GROUND_Y + 4, 8, STAGE_H - GROUND_Y);
        }
        for (const surface of platform.upperPlatforms ?? []) {
          const left = worldX(surface.left), right = worldX(surface.right), top = worldY(surface.y);
          const stone = context.createLinearGradient(0, top, 0, top + 19);
          stone.addColorStop(0, '#a39a8d'); stone.addColorStop(.22, '#675d55'); stone.addColorStop(1, '#24252d');
          context.fillStyle = stone; context.fillRect(left, top, right - left, 19);
          context.fillStyle = '#ba995f'; context.fillRect(left, top, right - left, 3);
          context.fillStyle = '#4a4140';
          for (let seam = left + 44; seam < right; seam += 48) context.fillRect(seam, top + 4, 2, 10);
        }
      }
      // Floor perspective lines, so travel distance is readable
      context.strokeStyle = "rgba(120,145,180,.12)"; context.lineWidth = 1;
      for (let u = -400; u <= 400; u += 80) {
        context.beginPath(); context.moveTo(worldX(u), GROUND_Y); context.lineTo(worldX(u * 1.6), STAGE_H); context.stroke();
      }
      // Stage walls
      for (const edge of platform ? [] : [state.stage.left, state.stage.right]) {
        context.strokeStyle = "rgba(233,196,106,.28)"; context.lineWidth = 2;
        context.beginPath(); context.moveTo(worldX(edge), 0); context.lineTo(worldX(edge), GROUND_Y); context.stroke();
      }
    }

    /**
     * Draw order keeps every move readable: the fighter who is committing an action is drawn in
     * front, a fighter reeling, blocking or downed goes behind. With no difference the previous
     * front fighter stays in front, so two fighters standing still never flicker.
     */
    let frontSide: FighterId = "p2";
    function presence(f: FighterState): number {
      if (f.phase === "attack" || f.phase === "dive_landing" || f.phase === "throw_startup" || f.phase === "throw_active" || f.phase === "throw_whiff") return f.attackConnected ? 4 : 3;
      if (f.phase === "hit_reaction" || f.phase === "knockdown" || f.phase === "getup" || f.phase === "thrown" || f.blockstun > 0 || f.knockedOut) return 0;
      if (!f.grounded) return 2;
      return 1;
    }
    function drawOrder(): FighterId[] {
      const p1 = presence(state.fighters.p1), p2 = presence(state.fighters.p2);
      if (p1 !== p2) frontSide = p1 > p2 ? "p1" : "p2";
      return frontSide === "p1" ? ["p2", "p1"] : ["p1", "p2"];
    }

    function render() {
      context.clearRect(0, 0, combatCanvasWidth, STAGE_H);
      const shake = currentShake();
      const flatShake = !tribunal || !arenaReady;
      context.save();
      if (flatShake) context.translate(shake.x * WORLD_SCALE, shake.y * WORLD_SCALE);
      // Inside the Tribunal the canvas IS the combat plane: it must stay transparent
      // so the real 3D stage shows through. The flat backdrop is only for ?arena=flat.
      if (!tribunal || !arenaReady) drawArena();
      // A shared height ruler makes the "same height" claim checkable on screen.
      if (checked("boxes")) {
        context.strokeStyle = "rgba(233,196,106,.35)"; context.setLineDash([6, 6]); context.lineWidth = 1;
        const headY = worldY(-TARGET_BODY_UNITS);
        context.beginPath(); context.moveTo(0, headY); context.lineTo(combatCanvasWidth, headY); context.stroke();
        context.setLineDash([]);
        context.fillStyle = "rgba(233,196,106,.7)"; context.font = "12px ui-monospace, monospace";
        context.fillText(`shared body height ${TARGET_BODY_UNITS}u`, 12, headY - 6);
      }

      // Hook blade passes behind the victim for either facing; do not bake a victim into attacker art.
      const hook = state.throwInteraction?.throwId === "swahili_hook_headbutt" ? state.throwInteraction : null;
      const celesteThrow = state.throwInteraction?.result === "connected" && state.fighters[state.throwInteraction.attacker].kind === "celeste_proto" ? state.throwInteraction : null;
      const order: FighterId[] = paidRehearsal.visible ? [] : celesteThrow ? [celesteThrow.defender, celesteThrow.attacker] : hook ? [hook.attacker, hook.defender] : drawOrder();
      for (const side of order) drawFighter(side);
      const paidCamera = paidRehearsal.draw(context, state, presenters, world, chosen.p1 === 'swahili' ? 'p1' : 'p2');
      for (const projectile of (state as any).projectiles ?? []) {
        const owner = (projectile.owner ?? projectile.attacker) as FighterId | undefined;
        const drew = owner && presenters[owner]?.drawProjectile?.(context, projectile, world, WORLD_SCALE);
        if (!drew) {
          const rect = projectileWorldRect(projectile);
          context.fillStyle = "rgba(255,220,140,.75)";
          context.fillRect(worldX(rect.x), worldY(rect.y), rect.w * WORLD_SCALE, rect.h * WORLD_SCALE);
        }
      }
      for (const side of order) presenters[side].drawEffects?.(context, state, world, WORLD_SCALE, side);
      if (checked("boxes")) for (const side of order) drawBoxes(side);
      context.restore();
      drawCinematicBars();

      // Present. The arena re-uploads this canvas as the combat plane every frame and
      // drives its own camera from state.ultimateInteraction.
      if (tribunal && arenaReady) {
        try { tribunal instanceof FallenCapitalArena ? tribunal.render(state, canvas, shake, paidCamera) : tribunal.render(state, canvas); }
        catch (error) {
          console.warn("Arena render failed; using training grid", error);
          disposeArena(); tribunal = null; arenaReady = false;
          document.querySelector("#tribunalStage")?.remove(); canvas.style.display = "";
          const arenaLabel = app.querySelector<HTMLElement>("#arenaLabel");
          if (arenaLabel) arenaLabel.textContent = "TRAINING GRID · stage unavailable";
        }
      }
      updateHud();
    }

    /**
     * Ultimate letterbox.
     *
     * In the Tribunal the canvas is a textured plane inside the 3D scene, so bars
     * painted onto it would tilt and slide with the camera. They belong in screen
     * space, so there they are a DOM overlay; in the flat fallback the canvas IS
     * the screen and painting them is correct.
     */
    function drawCinematicBars() {
      const shot = (state as any).ultimateInteraction;
      if (tribunal) { toggleDomBars(!!shot); return; }
      if (!shot) return;
      const height = Math.round(STAGE_H * 0.09);
      context.save();
      context.fillStyle = "rgba(2,6,12,.94)";
      context.fillRect(0, 0, combatCanvasWidth, height);
      context.fillRect(0, STAGE_H - height, combatCanvasWidth, height);
      context.fillStyle = "#e5dba9";
      context.font = "600 18px system-ui";
      context.fillText("CROWN OF NO GODS · CELESTIAL CANDIDATE", 28, Math.round(height * 0.62));
      context.restore();
    }

    let domBars: HTMLElement | null = null;
    function toggleDomBars(show: boolean) {
      const host = document.querySelector<HTMLElement>("#tribunalStage");
      if (!host) return;
      if (show && !domBars) {
        domBars = document.createElement("div");
        domBars.className = "cinematic-bars";
        domBars.innerHTML = `<i></i><span>CROWN OF NO GODS · CELESTIAL CANDIDATE</span><i></i>`;
        host.append(domBars);
      } else if (!show && domBars) { domBars.remove(); domBars = null; }
    }

    function roundView() {
      if (!director) return undefined;
      const names = { p1: ROSTER[chosen.p1].name, p2: ROSTER[chosen.p2].name };
      const method = { ko: "K.O.", double_ko: "DOUBLE K.O.", time: "TIME", perfect: "PERFECT" } as const;
      const results = director.phase === "match_end" && director.matchWinner ? {
        winner: `${names[director.matchWinner]} WINS`,
        score: `${director.wins.p1} — ${director.wins.p2}`,
        rounds: director.history.map((r) => `ROUND ${r.round} · ${r.winner === "draw" ? "DRAW" : names[r.winner]} · ${method[r.method]} · ${r.seconds}s`),
        auto: autoRematch ? `NEXT MATCH IN ${Math.max(0, Math.ceil((AUTO_REMATCH_TICKS - director.phaseTicks) / 60))}` : ""
      } : null;
      return { round: director.round, seconds: director.secondsLeft, wins: director.wins, announcement: director.announcement(), koFlash: director.koFlash, phase: director.phase, results };
    }
    function stockView() {
      if (!stockDirector) return undefined;
      const winner = stockDirector.matchWinner;
      return {
        lives: stockDirector.lives, phase: stockDirector.phase,
        announcement: stockDirector.announcement(), koFlash: stockDirector.koFlash,
        results: stockDirector.phase === 'match_end' && winner ? {
          winner: winner === 'draw' ? 'DRAW' : `${ROSTER[chosen[winner]].name} WINS`,
          score: `${stockDirector.lives.p1} — ${stockDirector.lives.p2} LIVES`,
          rounds: [`${options.stocks} STOCKS · OPEN PLATFORM`], auto: ''
        } : null
      };
    }

    function updateHud() {
      updateGameplayHud(app, state, playing, roundView(), stockView());
      const rows = (["p1", "p2"] as FighterId[]).map((side) => {
        const f = state.fighters[side];
        const boxes = fighterExtendedHurtboxes(f);
        const top = boxes.length ? Math.min(...boxes.map((b) => b.y)) : 0;
        const bottom = boxes.length ? Math.max(...boxes.map((b) => b.y + b.h)) : 0;
        return { side, name: ROSTER[chosen[side]].name, f, span: (bottom - top).toFixed(0), top: top.toFixed(0) };
      });
      // The ✓ compares each fighter's CONFIGURED standing envelope, not the live box:
      // a crouching or downed fighter is meant to be shorter, and that must not read
      // as the two characters having mismatched heights.
      const standing = (side: FighterId) => {
        const boxes = ROSTER[chosen[side]].envelope.standing;
        return Math.max(...boxes.map((b) => b.y + b.h)) - Math.min(...boxes.map((b) => b.y));
      };
      const matched = standing("p1") === standing("p2") && standing("p1") === TARGET_BODY_UNITS;
      app.querySelector<HTMLElement>("#bodyCheck")!.innerHTML = rows.map((r) => `
        <div class="row"><span>${r.name}</span><span>drawn ${TARGET_BODY_UNITS}u · standing ${standing(r.side)}u · live ${r.span}u (head ${r.top}u)${r.f.phase === "crouch" || r.f.phase === "knockdown" || r.f.phase === "getup" || r.f.crouchBlocking ? " · low profile" : ""}</span></div>`).join("")
        + `<div class="row note">${matched ? `✓ both fighters share one ${TARGET_BODY_UNITS}u standing body and full-body hitboxes` : "△ standing envelopes differ"}</div>`;

      const event = state.lastCombatEvent;
      app.querySelector<HTMLElement>("#readout")!.innerHTML = rows.map((r) => `
        <div class="row"><span>${r.name}</span><span>${r.f.phase}${r.f.currentAttack ? ` · ${r.f.currentAttack}` : ""}</span></div>
        <div class="row sub"><span>hp ${Math.round(r.f.health)} · meter ${Math.round(r.f.tension)}</span><span>combo ${r.f.comboCount} · dmg ${Math.round(r.f.comboDamage)}</span></div>
        <div class="row sub"><span>${r.f.phase === "attack" ? `frame ${r.f.phaseTick}` : r.f.hitstun ? `hitstun ${r.f.hitstun}` : r.f.blockstun ? `blockstun ${r.f.blockstun}` : "neutral"}</span><span>${r.f.airActionsRemaining ? `air ${r.f.airActionsRemaining}` : ""}</span></div>`).join("")
        + `<div class="row sub"><span>tick ${state.tick}</span><span>gap ${Math.abs(state.fighters.p1.x - state.fighters.p2.x).toFixed(0)}u</span></div>`
        + (event ? `<div class="row note">last: ${event.attacker} ${event.attackId} — ${event.outcome}${event.damage ? ` ${Math.round(event.damage)}` : ""}</div>` : "")
        + (engineFaults ? `<div class="row fault">engine fault x${engineFaults}: ${lastFault}</div>` : "");
    }

    app.querySelector<HTMLElement>("#moveList")!.innerHTML = (["p1", "p2"] as FighterId[]).map((side) => `
      <div class="cov-block"><h4 style="color:${ROSTER[chosen[side]].accent}">${ROSTER[chosen[side]].name}${competitive ? (options.controllers[side] === "cpu" ? " (CPU)" : "") : side === "p2" ? " (dummy)" : ""}</h4>
      ${presenters[side].moveList().map((m) => `<div class="cov-row ${m.animated ? "animated" : "placeholder"}"><span>${m.command}</span><span>${m.name}</span></div>`).join("")}</div>`).join("");

    app.querySelector<HTMLElement>("#coverage")!.innerHTML = (["p1", "p2"] as FighterId[]).map((side) => `
      <div class="cov-block"><h4 style="color:${ROSTER[chosen[side]].accent}">${ROSTER[chosen[side]].name}</h4>
      ${presenters[side].coverage().map((row) => `<div class="cov-row ${row.status}"><span>${row.label}</span><span>${row.detail}</span></div>`).join("")}</div>`).join("");

    // --- controls ---
    function syncPause() { app.querySelector<HTMLElement>("#pause")!.textContent = playing ? "Pause" : "Play"; app.querySelector<HTMLElement>("#hudPause")!.textContent = playing ? "Pause · ESC" : "Resume · ESC"; updateGameplayHud(app, state, playing, roundView(), stockView()); }
    app.querySelector<HTMLButtonElement>("#resultsRematch")!.addEventListener("click", () => restartMatch());
    app.querySelector<HTMLButtonElement>("#resultsSelect")!.addEventListener("click", () => app.querySelector<HTMLButtonElement>("#back")!.click());
    for (const [visible, original] of [["hudPause", "pause"], ["hudReset", "reset"], ["hudSelect", "back"]]) {
      app.querySelector<HTMLButtonElement>(`#${visible}`)!.addEventListener("click", () => app.querySelector<HTMLButtonElement>(`#${original}`)!.click());
    }
    app.querySelector<HTMLButtonElement>("#pause")!.addEventListener("click", () => { if (room?.role === 'guest') return; playing = !playing; if (room) room.send({ type: 'pause', playing }); syncPause(); });
    app.querySelector<HTMLButtonElement>("#step")!.addEventListener("click", () => { if (room) return; playing = false; syncPause(); stepSimulation(); render(); });
    app.querySelector<HTMLButtonElement>("#reset")!.addEventListener("click", () => {
      if (room?.role === 'guest') return;
      if (director || stockDirector) { restartMatch(); return; }
      state = newMatch(state.seed + 1); queued.p1 = []; queued.p2 = []; dummyHasBeenHit = false;
      for (const side of ["p1", "p2"] as FighterId[]) brains[side].reset(brainSeed(side) + state.seed);
    });
    app.querySelector<HTMLInputElement>("#envelopeToggle")!.addEventListener("change", () => { if (room) return; state = newMatch(state.seed); queued.p1 = []; queued.p2 = []; });
    app.querySelector<HTMLButtonElement>("#swap")!.addEventListener("click", () => {
      if (room) return;
      const swapped = { p1: chosen.p2, p2: chosen.p1 };
      const swappedPresenters = { p1: presenters.p2, p2: presenters.p1 };
      requestedTutorial = tutorial?.kind ?? null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(watchdog);
      if (loadedRetry !== undefined) window.clearInterval(loadedRetry);
      active = false; playing = false;
      paidRehearsal.dispose();
      disposeArena();
      const controllers = competitive ? { p1: options.controllers.p2, p2: options.controllers.p1 } : { p1: "human" as const, p2: checked("aiToggle") ? "cpu" as const : "human" as const };
      const cpuLevel = competitive ? { p1: options.cpuLevel.p2, p2: options.cpuLevel.p1 } : { p1: options.cpuLevel.p1, p2: select("aiLevel") as MatchOptions["cpuLevel"]["p2"] };
      renderMatch(swapped, swappedPresenters, { ...options, controllers, cpuLevel, envelope: checked("envelopeToggle"), showBoxes: checked("boxes") });
    });
    app.querySelector<HTMLButtonElement>("#back")!.addEventListener("click", () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(watchdog);
      if (loadedRetry !== undefined) window.clearInterval(loadedRetry);
      active = false;
      playing = false;
      paidRehearsal.dispose();
      disposeArena();
      room?.close();
      document.querySelector("#tribunalStage")?.remove();
      delete (window as any).__versus;
      room ? frontEnd.showModes() : renderSelect();
    });

    /**
     * Deterministic one-click air-special rehearsal.  It uses the same real
     * input path as the keyboard: jump startup, four neutral ticks, then the
     * simultaneous special/strength chord.  Resetting first keeps the clip
     * visible even when the previous attempt ended in recovery or hitstun.
     */
    function queueAirSpecial(side: FighterId, strength: "light" | "medium" | "heavy") {
      state = newMatch(state.seed + 1);
      queued.p1 = []; queued.p2 = []; dummyHasBeenHit = false;
      const chord = { special: true, [strength]: true } as InputFrame;
      queued[side].push({ up: true }, {}, {}, {}, {}, chord);
      playing = true;
      syncPause();
    }
    // The side marker lives on the practice strip; strength lives on each
    // button. Select the latter, then walk up to the strip in the handler.
    app.querySelectorAll<HTMLButtonElement>(".air-practice [data-air-strength]").forEach((button) => {
      button.addEventListener("click", () => {
        const host = button.closest<HTMLElement>("[data-air-side]");
        const side = host?.dataset.airSide as FighterId | undefined;
        const strength = button.dataset.airStrength as "light" | "medium" | "heavy" | undefined;
        if (side && strength) queueAirSpecial(side, strength);
      });
    });

    app.querySelectorAll<HTMLButtonElement>('[data-new-move]').forEach(button => {
      button.addEventListener('click', () => {
        const side = button.closest<HTMLElement>('[data-new-side]')!.dataset.newSide as FighterId;
        state = newMatch(state.seed + 1);
        queued.p1 = []; queued.p2 = []; dummyHasBeenHit = false;
        const f = state.fighters[side];
        const back = f.facing === 1 ? { left: true } : { right: true };
        const commands: Record<string, InputFrame> = {
          ceiling: { special: true, up: true, light: true }, golden: { special: true, heavy: true },
          claim: { special: true, light: true }, headbutt: { special: true, medium: true },
          vertical: { special: true, up: true, medium: true }, death: { special: true, up: true, heavy: true },
          fine: { ...back, special: true, light: true }, hidden: { ...back, special: true, medium: true },
          judgment: { ...back, special: true, heavy: true }, kneecap: { down: true, special: true, light: true }
        };
        queued[side].push(commands[button.dataset.newMove!]);
        if (button.dataset.newMove === 'headbutt') {
          state.fighters.p1.x = -75; state.fighters.p2.x = 75;
        }
        if (button.dataset.newMove === 'judgment') {
          // Practice setup only: ordinary incoming input triggers the real counter.
          state.fighters.p1.x = -45; state.fighters.p2.x = 45;
          const opponent: FighterId = side === 'p1' ? 'p2' : 'p1';
          queued[opponent].push(...Array.from({ length: 18 }, () => ({})), { heavy: true });
        }
        app.querySelector<HTMLElement>('.match')?.scrollIntoView({ block: 'start', behavior: 'instant' });
        playing = true; syncPause();
      });
    });

    // Playtest inspection hook: lets a smoke script drive and read a real match
    // without simulating key hardware. Read-only apart from `queue`.
    (window as any).__versus = {
      get state() { return state; },
      get chosen() { return chosen; },
      get presenters() { return presenters; },
      get director() { return director; },
      get stockDirector() { return stockDirector; },
      get online() { return room ? { role: room.role, connected: room.connected, status: room.status } : null; },
      get onlineInput() { return { remoteInput, remotePresses, inputSequence, receivedSequence, playing, held: [...heldKeys] }; },
      get brains() { return brains; },
      get options() { return options; },
      restartMatch,
      get arena() { return tribunal?.diagnostics() ?? { arenaId: "flat", ready: true }; },
      project: (x: number, y: number) => tribunal?.project(x, y) ?? { x: combatCanvasWidth / 2 + x * WORLD_SCALE, y: GROUND_Y + y * WORLD_SCALE },
      queue: (side: FighterId, ...frames: InputFrame[]) => queued[side].push(...frames),
      pause: (value: boolean) => { playing = value; syncPause(); },
      step: () => { stepSimulation(); render(); }
    };

    void halfAccumulator;
    syncPause();
    if (room?.role === 'guest') {
      room.send({ type: 'loaded' });
      loadedRetry = window.setInterval(() => { if (room.connected && receivedSequence < 0) room.send({ type: 'loaded' }); }, 500);
    }
    requestAnimationFrame(loop);
  }
}

main();
