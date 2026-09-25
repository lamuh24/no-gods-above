import type { FighterId } from '../core/types';
import { ROSTER, ROSTER_ORDER, type CharacterId } from './roster';
import { CPU_LEVELS, defaultMatchOptions, type MatchMode, type MatchOptions } from './matchOptions';
import swahiliPortrait from '../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png?url';
import './frontEnd.css';

interface FrontEndConfig {
  selection: Record<FighterId, CharacterId>;
  arena: () => string;
  setArena: (value: string) => void;
  onFight: (options: MatchOptions) => void;
  onOnline: () => void;
  onTutorial: (lesson: 'basics' | 'combos') => void;
}
const sides: FighterId[] = ['p1', 'p2'];
const characters = ROSTER_ORDER;
const portrait = (id: CharacterId) => id === 'celeste' ? '/celeste/portrait.svg' : id === 'swahili' ? swahiliPortrait : '/lamuh-legacy-v2/movement-v2/idle-00.png';
const levelName = (level: string) => level.toUpperCase();

/** Native, accessible navigation; every live fighter and match value comes from the game. */
export function createFrontEnd(app: HTMLElement, config: FrontEndConfig) {
  const options: Record<MatchMode, MatchOptions> = { training: defaultMatchOptions('training'), rounds: defaultMatchOptions('rounds'), stocks: defaultMatchOptions('stocks') };
  let mode: MatchMode = 'training';
  const shell = (screen: string, body: string) => {
    app.innerHTML = `<section class="nga-front nga-${screen}" aria-label="${screen === 'title' ? 'Title screen' : screen === 'modes' ? 'Game mode select' : 'Character select'}">
      <div class="nga-menu-art" aria-hidden="true"></div><div class="nga-menu-shade" aria-hidden="true"></div><div class="nga-menu-frame" aria-hidden="true"></div>${body}
      <footer class="nga-menu-footer"><span>NO GODS ABOVE <b>Ⅱ</b></span><span>${screen === 'select' ? (mode === 'rounds' ? 'ROUNDS · LOCAL PLAY' : 'TRAINING · LOCAL PLAY') : 'THRONES BREAK. STILL WE FIGHT.'}</span></footer></section>`;
    const root = app.querySelector<HTMLElement>('.nga-front')!;
    const image = new Image();
    image.onload = () => { if (root.isConnected) root.querySelector<HTMLElement>('.nga-menu-art')!.style.backgroundImage = `url("${image.src}")`; };
    image.src = `/ui/front-end/${screen === 'title' ? 'title' : screen === 'modes' ? 'modes' : 'select'}-v1.png`;
    root.onkeydown = event => {
      if (event.key === 'Escape' && screen !== 'title') { event.preventDefault(); screen === 'select' ? showModes() : showTitle(); }
    };
  };
  const focus = (selector: string) => app.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  function showTitle() {
    shell('title', `<div class="nga-title-content"><p class="nga-eyebrow">A WORLD WITHOUT GODS</p>
      <div class="nga-title-sigil" aria-hidden="true">✧</div><h1>NO GODS<span>ABOVE</span></h1>
      <p class="nga-title-line">The throne is empty. The fight is yours.</p>
      <button class="nga-primary nga-title-start" id="enterGame">ENTER THE FALLEN CAPITAL <span aria-hidden="true">→</span></button>
      <button class="nga-title-learn" id="startTutorial" type="button">NEW TO THE GAME? LEARN THE BASICS →</button>
      <p class="nga-input-hint">PRESS ENTER TO BEGIN</p></div>`);
    app.querySelector<HTMLButtonElement>('#enterGame')!.onclick = showModes;
    app.querySelector<HTMLButtonElement>('#startTutorial')!.onclick = () => config.onTutorial('basics');
    focus('#enterGame');
  }
  function showModes() {
    shell('modes', `<header class="nga-menu-header"><button class="nga-back" id="backTitle">← TITLE</button><span class="nga-eyebrow">CHOOSE YOUR BATTLE</span><span class="nga-chapter">I / III</span></header>
      <div class="nga-mode-content"><h1>THE PATH TO DEFIANCE</h1><p class="nga-subtitle">Every fight begins with a choice.</p>
      <div class="nga-mode-grid"><button class="nga-mode-card nga-mode-training" id="modeTraining"><span class="nga-mode-number">01</span><span class="nga-mode-symbol" aria-hidden="true">✧</span><span class="nga-mode-kicker">ENTER THE ARENA</span><strong>TRAINING</strong><span class="nga-mode-description">Master your movement, find your combos, and face a local rival, a training dummy, or the CPU.</span><span class="nga-mode-action">SELECT MODE <b aria-hidden="true">→</b></span></button>
      <button class="nga-mode-card nga-mode-rounds" id="modeRounds"><span class="nga-mode-number">02</span><span class="nga-mode-symbol" aria-hidden="true">♜</span><span class="nga-mode-kicker">BEST OF THREE</span><strong>ROUNDS</strong><span class="nga-mode-description">Enclosed arena, 99-second rounds, first to two. Juggled bodies bounce off the walls. Player or CPU on either side.</span><span class="nga-mode-action">SELECT MODE <b aria-hidden="true">→</b></span></button>
      <button class="nga-mode-card nga-mode-stocks" id="modeStocks"><span class="nga-mode-number">03</span><span class="nga-mode-symbol nga-stock-symbol" aria-hidden="true"></span><span class="nga-mode-kicker">LAST LIFE STANDING</span><strong>STOCKS</strong><span class="nga-mode-description">Open platform. Knock your rival beyond the edge or blast line. Each loss costs a life.</span><span class="nga-mode-action">SELECT MODE <b aria-hidden="true">→</b></span></button>
      <button class="nga-mode-card nga-mode-online" id="modeOnline"><span class="nga-mode-number">04</span><span class="nga-mode-symbol" aria-hidden="true">✥</span><span class="nga-mode-kicker">ROOM CODE · TWO PLAYERS</span><strong>ONLINE</strong><span class="nga-mode-description">Host a private room or join a rival. Choose Rounds or Stocks and fight across two devices.</span><span class="nga-mode-action">OPEN LOBBY <b aria-hidden="true">→</b></span></button>
      <button class="nga-mode-card nga-mode-tutorial" id="modeBasics"><span class="nga-mode-number">05</span><span class="nga-mode-symbol" aria-hidden="true">✦</span><span class="nga-mode-kicker">LEARN THE CONTROLS</span><strong>HOW TO PLAY</strong><span class="nga-mode-description">A guided practice match for movement, jumping, dashing, and your first hit.</span><span class="nga-mode-action">START BASICS <b aria-hidden="true">→</b></span></button>
      <button class="nga-mode-card nga-mode-tutorial" id="modeCombos"><span class="nga-mode-number">06</span><span class="nga-mode-symbol" aria-hidden="true">✧</span><span class="nga-mode-kicker">BUILD A ROUTE</span><strong>COMBO TUTORIAL</strong><span class="nga-mode-description">Chain ground hits, launch a rival, then finish an air combo with your fighter’s air special.</span><span class="nga-mode-action">START COMBOS <b aria-hidden="true">→</b></span></button></div></div>`);
    app.querySelector<HTMLButtonElement>('#backTitle')!.onclick = showTitle;
    app.querySelector<HTMLButtonElement>('#modeTraining')!.onclick = () => showSelect('training');
    app.querySelector<HTMLButtonElement>('#modeRounds')!.onclick = () => showSelect('rounds');
    app.querySelector<HTMLButtonElement>('#modeStocks')!.onclick = () => showSelect('stocks');
    app.querySelector<HTMLButtonElement>('#modeOnline')!.onclick = config.onOnline;
    app.querySelector<HTMLButtonElement>('#modeBasics')!.onclick = () => config.onTutorial('basics');
    app.querySelector<HTMLButtonElement>('#modeCombos')!.onclick = () => config.onTutorial('combos');
    focus(mode === 'rounds' ? '#modeRounds' : '#modeTraining');
  }
  function showSelect(nextMode: MatchMode = mode) {
    mode = nextMode;
    const current = options[mode];
    const roleLabel = (side: FighterId) => current.controllers[side] === 'cpu' ? `CPU · ${levelName(current.cpuLevel[side])}` : side === 'p1' ? 'YOUR FIGHTER' : mode !== 'training' ? 'PLAYER TWO' : 'LOCAL RIVAL';
    const hero = (side: FighterId) => {
      const id = config.selection[side];
      const controls = mode !== 'training' ? `<div class="nga-controller" role="group" aria-label="${side.toUpperCase()} controller">
          <button class="nga-controller-choice ${current.controllers[side] === 'human' ? 'is-selected' : ''}" data-controller-side="${side}" data-controller="human" aria-pressed="${current.controllers[side] === 'human'}">PLAYER</button>
          <button class="nga-controller-choice ${current.controllers[side] === 'cpu' ? 'is-selected' : ''}" data-controller-side="${side}" data-controller="cpu" aria-pressed="${current.controllers[side] === 'cpu'}">CPU</button>
          <select class="nga-cpu-level" data-level-side="${side}" aria-label="${side.toUpperCase()} CPU level" ${current.controllers[side] === 'cpu' ? '' : 'disabled'}>${CPU_LEVELS.map((level) => `<option value="${level}" ${current.cpuLevel[side] === level ? 'selected' : ''}>${levelName(level)}</option>`).join('')}</select></div>` : '';
      return `<article class="nga-fighter-choice ${side}"><div class="nga-fighter-heading"><span class="nga-player-mark">${side.toUpperCase()}</span><span>${roleLabel(side)}</span></div>
        <div class="nga-fighter-art ${id}"><div class="nga-hero-ring" aria-hidden="true"></div><img src="${portrait(id)}" alt="${ROSTER[id].name}" draggable="false"></div>
        <h2>${ROSTER[id].name}</h2><div class="nga-roster" role="group" aria-label="${side.toUpperCase()} character selection">${characters.map(character => `<button class="nga-roster-choice ${config.selection[side] === character ? 'is-selected picked' : ''}" data-side="${side}" data-character="${character}" data-pick="${character}" aria-pressed="${config.selection[side] === character}"><span class="nga-roster-icon ${character}"><img src="${portrait(character)}" alt="" draggable="false"></span><span>${ROSTER[character].name}</span></button>`).join('')}</div>${controls}</article>`;
    };
    const roundsSetup = `<div class="nga-rounds-setup"><label for="roundsToWin">ROUNDS TO WIN</label><select id="roundsToWin">${[1, 2, 3].map((n) => `<option value="${n}" ${current.roundsToWin === n ? 'selected' : ''}>${n === 1 ? 'SINGLE ROUND' : n === 2 ? 'BEST OF THREE' : 'BEST OF FIVE'}</option>`).join('')}</select>
      <label for="roundSeconds">ROUND TIMER</label><select id="roundSeconds">${[99, 60, 45].map((n) => `<option value="${n}" ${current.roundSeconds === n ? 'selected' : ''}>${n} SECONDS</option>`).join('')}</select>
      <button class="nga-watch" id="watchCpu" type="button">WATCH CPU VS CPU</button></div>`;
    const trainingSetup = `<details class="nga-match-options"><summary>TRAINING OPTIONS</summary><label><input type="checkbox" id="cpu" ${current.controllers.p2 === 'cpu' ? 'checked' : ''}> CPU opponent</label><label>CPU level <select id="trainingLevel">${CPU_LEVELS.map((level) => `<option value="${level}" ${current.cpuLevel.p2 === level ? 'selected' : ''}>${levelName(level)}</option>`).join('')}</select></label><label><input type="checkbox" id="envelope" ${current.envelope ? 'checked' : ''}> Body-envelope collision</label><label><input type="checkbox" id="boxes" ${current.showBoxes ? 'checked' : ''}> Show hitboxes</label></details>`;
    const stocksSetup = `<div class="nga-rounds-setup"><label for="stockCount">LIVES PER FIGHTER</label><select id="stockCount">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${current.stocks === n ? 'selected' : ''}>${n} ${n === 1 ? 'LIFE' : 'LIVES'}</option>`).join('')}</select><p class="nga-battle-note">OPEN PLATFORM · FALLS AND K.O.s COST ONE LIFE</p></div>`;
    shell('select', `<header class="nga-menu-header"><button class="nga-back" id="backModes">← MODES</button><span class="nga-eyebrow">CHOOSE YOUR FIGHTER</span><span class="nga-chapter">${mode.toUpperCase()}</span></header>
      <div class="nga-selection-layout">${hero('p1')}<div class="nga-battle-setup"><p class="nga-eyebrow">NO GODS ABOVE</p><div class="nga-versus" aria-hidden="true">VS</div><div class="nga-arena-choice"><label for="arenaChoice">BATTLEGROUND</label><select id="arenaChoice"><option value="fallen-capital">The Fallen Capital</option><option value="tribunal">The Tribunal</option><option value="flat">Training Ground</option></select></div>
      <button class="nga-primary" id="fight">FIGHT <span aria-hidden="true">→</span></button><p class="nga-battle-note">${mode === 'rounds' ? `ROUNDS · FIRST TO ${current.roundsToWin} · ${current.roundSeconds} SEC` : mode === 'stocks' ? `STOCKS · ${current.stocks} LIVES · NO TIMER` : 'TRAINING · UNLIMITED TIME'}</p>
      ${mode === 'rounds' ? roundsSetup : mode === 'stocks' ? stocksSetup : trainingSetup}
      <p class="nga-controls-hint">P1: A/D move · W jump · S crouch · J/K/L attack · U special · I throw · P super · Y burst · Shift dash<br>P2: arrows · 1/2/3 attack · 5 special · 4 throw · 0 super · 8 burst · 7 dash</p></div>${hero('p2')}</div>`);
    const arena = app.querySelector<HTMLSelectElement>('#arenaChoice')!;
    arena.value = config.arena();
    arena.onchange = () => config.setArena(arena.value);
    app.querySelector<HTMLButtonElement>('#backModes')!.onclick = showModes;
    for (const button of app.querySelectorAll<HTMLButtonElement>('[data-character]')) button.onclick = () => {
      config.selection[button.dataset.side as FighterId] = button.dataset.character as CharacterId;
      const target = `[data-side="${button.dataset.side}"][data-character="${button.dataset.character}"]`;
      showSelect(); focus(target);
    };
    for (const button of app.querySelectorAll<HTMLButtonElement>('[data-controller]')) button.onclick = () => {
      current.controllers[button.dataset.controllerSide as FighterId] = button.dataset.controller as 'human' | 'cpu';
      showSelect(); focus(`[data-controller-side="${button.dataset.controllerSide}"][data-controller="${button.dataset.controller}"]`);
    };
    for (const select of app.querySelectorAll<HTMLSelectElement>('[data-level-side]')) select.onchange = () => {
      current.cpuLevel[select.dataset.levelSide as FighterId] = select.value as MatchOptions['cpuLevel']['p1'];
      const heading = app.querySelector(`.nga-fighter-choice.${select.dataset.levelSide} .nga-fighter-heading > span:last-child`);
      if (heading) heading.textContent = roleLabel(select.dataset.levelSide as FighterId);
    };
    if (mode !== 'training') {
      if (mode === 'stocks') app.querySelector<HTMLSelectElement>('#stockCount')!.onchange = event => { current.stocks = Number((event.target as HTMLSelectElement).value); showSelect(); focus('#stockCount'); };
      else {
      app.querySelector<HTMLSelectElement>('#roundsToWin')!.onchange = (event) => { current.roundsToWin = Number((event.target as HTMLSelectElement).value); showSelect(); focus('#roundsToWin'); };
      app.querySelector<HTMLSelectElement>('#roundSeconds')!.onchange = (event) => { current.roundSeconds = Number((event.target as HTMLSelectElement).value); showSelect(); focus('#roundSeconds'); };
      app.querySelector<HTMLButtonElement>('#watchCpu')!.onclick = () => config.onFight({ ...current, controllers: { p1: 'cpu', p2: 'cpu' } });
      }
    } else {
      app.querySelector<HTMLInputElement>('#cpu')!.onchange = event => {
        current.controllers.p2 = (event.target as HTMLInputElement).checked ? 'cpu' : 'human';
        app.querySelector('.nga-fighter-choice.p2 .nga-fighter-heading > span:last-child')!.textContent = roleLabel('p2');
      };
      app.querySelector<HTMLSelectElement>('#trainingLevel')!.onchange = event => { current.cpuLevel.p2 = (event.target as HTMLSelectElement).value as MatchOptions['cpuLevel']['p2']; };
      app.querySelector<HTMLInputElement>('#envelope')!.onchange = event => { current.envelope = (event.target as HTMLInputElement).checked; };
      app.querySelector<HTMLInputElement>('#boxes')!.onchange = event => { current.showBoxes = (event.target as HTMLInputElement).checked; };
    }
    app.querySelector<HTMLButtonElement>('#fight')!.onclick = () => config.onFight({ ...current, controllers: { ...current.controllers }, cpuLevel: { ...current.cpuLevel } });
    focus('[data-side="p1"].is-selected');
  }
  return { showTitle, showModes, showSelect, get mode() { return mode; } };
}
