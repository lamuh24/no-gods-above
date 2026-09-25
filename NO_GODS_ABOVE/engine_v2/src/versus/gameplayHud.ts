import type { FighterId, MatchState } from '../core/types';
import { ROSTER, type CharacterId } from './roster';
import type { Announcement } from './roundDirector';
import swahiliPortrait from '../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png?url';
import './gameplayHud.css';

const sides: FighterId[] = ['p1', 'p2'];

export interface HudSetup { mode: 'training' | 'rounds' | 'stocks'; roundsToWin: number; stocks?: number; controllers: Record<FighterId, 'human' | 'cpu'>; onlineRole?: 'host' | 'guest'; }
export interface HudRoundView {
  round: number; seconds: number; wins: Record<FighterId, number>; announcement: Announcement | null; koFlash: boolean; phase: string;
  results: { winner: string; score: string; rounds: string[]; auto: string } | null;
}
export interface HudStockView { lives: Record<FighterId, number>; phase: string; announcement: Announcement | null; koFlash: boolean; results: HudRoundView['results']; }

export function gameplayHud(chosen: Record<FighterId, CharacterId>, setup: HudSetup = { mode: 'training', roundsToWin: 0, controllers: { p1: 'human', p2: 'human' } }): string {
  const rounds = setup.mode === 'rounds';
  const stocks = setup.mode === 'stocks';
  const tag = (side: FighterId) => setup.onlineRole ? `${side.toUpperCase()} · ${side === 'p1' ? 'HOST' : 'RIVAL'}` : setup.controllers[side] === 'cpu' ? `${side.toUpperCase()} · CPU` : side.toUpperCase();
  const pips = (side: FighterId) => rounds ? `<span class="round-pips" id="${side}Pips" aria-label="${side} rounds won">${Array.from({ length: setup.roundsToWin }, () => '<i></i>').join('')}</span>` : '';
  const lives = (side: FighterId) => stocks ? `<span class="stock-lives" id="${side}Lives" aria-label="${side} lives remaining">${Array.from({ length: setup.stocks ?? 3 }, () => '<i></i>').join('')}</span>` : '';
  const fighter = (side: FighterId) => `<div class="fighter-hud ${side}">
    <div class="portrait ${chosen[side]}"><img alt="${ROSTER[chosen[side]].name}" src="${chosen[side] === 'celeste' ? '/celeste/portrait.svg' : chosen[side] === 'swahili' ? swahiliPortrait : '/lamuh-legacy-v2/movement-v2/idle-00.png'}"></div>
    <div class="fighter-bars"><div class="nameplate"><span class="player-tag">${tag(side)}</span><strong class="fighter-name">${ROSTER[chosen[side]].name}</strong>${pips(side)}${lives(side)}<span class="health-value" id="${side}HealthValue">1000</span></div>
    <div class="health-track" role="meter" aria-label="${side} health" aria-valuemin="0" aria-valuemax="1000" id="${side}HealthMeter"><i class="health-trail" id="${side}Trail"></i><i class="health-fill" id="${side}Health"></i></div>
    <div class="resource-line"><span class="burst-label">BURST</span><div class="burst-track" role="meter" aria-label="${side} burst" aria-valuemin="0" aria-valuemax="100" id="${side}BurstMeter"><i class="burst-fill" id="${side}Burst"></i></div><span class="guard-state" id="${side}Guard">READY</span></div></div></div>`;
  return `<div class="combat-hud ${rounds ? 'is-rounds' : stocks ? 'is-stocks' : 'is-training'}"><div class="hud-top">${fighter('p1')}<div class="match-medallion"><span class="mode-label" id="modeLabel">${rounds ? 'ROUND 1' : stocks ? 'STOCKS' : 'TRAINING'}</span><strong class="clock" id="clock">${rounds ? '99' : stocks ? (setup.stocks ?? 3) : '∞'}</strong><span class="match-state" id="matchState">${rounds || stocks ? 'READY' : 'FREE PLAY'}</span></div>${fighter('p2')}</div>
    <div class="combo-callouts">${sides.map(side => `<div class="combo-readout ${side}" id="${side}Combo"></div>`).join('')}</div>
    <div class="ko-flash" id="koFlash" hidden></div>
    <div class="announcer" id="announcer" hidden><strong id="announcerText"></strong><span id="announcerSub"></span></div>
    <div class="pause-banner" id="pauseBanner" hidden><strong>PAUSED</strong><span>ESC TO RESUME</span></div>
    <div class="match-results" id="matchResults" hidden><p class="results-eyebrow">MATCH OVER</p><h2 id="resultsWinner"></h2><p class="results-score" id="resultsScore"></p><ol class="results-rounds" id="resultsRounds"></ol>
      <div class="results-actions"><button id="resultsRematch" type="button">REMATCH</button><button id="resultsSelect" type="button">CHARACTER SELECT</button></div><p class="results-auto" id="resultsAuto"></p></div>
    <div class="hud-bottom">${sides.map(side => `<div class="super-panel ${side}"><div class="super-title"><span>SUPER</span><span id="${side}SuperValue">0%</span></div><div class="super-track" role="meter" aria-label="${side} super" aria-valuemin="0" aria-valuemax="100" id="${side}SuperMeter"><i class="super-fill" id="${side}Tension"></i><div class="super-ticks"></div></div></div>`).join('')}</div></div>`;
}

export function updateGameplayHud(app: HTMLElement, state: MatchState, playing: boolean, round?: HudRoundView, stock?: HudStockView): void {
  for (const side of sides) {
    const f = state.fighters[side];
    const meter = (key: string, value: number, max: number, fill: string) => {
      const clamped = Math.max(0, Math.min(max, value));
      app.querySelector<HTMLElement>(`#${side}${fill}`)!.style.width = `${clamped / max * 100}%`;
      app.querySelector(`#${side}${key}Meter`)!.setAttribute('aria-valuenow', String(clamped));
    };
    meter('Health', f.health, 1000, 'Health'); meter('Burst', f.burst, 100, 'Burst'); meter('Super', f.tension, 100, 'Tension');
    // The trail holds recent damage while the defender is still being hit, then drains.
    const trail = app.querySelector<HTMLElement>(`#${side}Trail`)!;
    const opponent = state.fighters[side === 'p1' ? 'p2' : 'p1'];
    const trailWidth = Number(trail.dataset.value ?? '100');
    const healthWidth = Math.max(0, Math.min(1000, f.health)) / 10;
    const setTrail = (value: number) => { trail.dataset.value = String(value); trail.style.width = `calc((100% - 6px) * ${value / 100})`; };
    if (healthWidth > trailWidth) { trail.classList.add('is-refill'); setTrail(healthWidth); }
    else if (opponent.comboCount === 0 && f.hitstun === 0) { trail.classList.remove('is-refill'); setTrail(healthWidth); }
    app.querySelector(`#${side}HealthValue`)!.textContent = String(Math.max(0, Math.ceil(f.health)));
    app.querySelector(`#${side}SuperValue`)!.textContent = `${Math.floor(f.tension)}%`;
    app.querySelector(`#${side}Guard`)!.textContent = f.blocking || f.blockstun > 0 ? 'GUARDING' : f.burst >= 100 ? 'READY' : 'CHARGING';
    app.querySelector(`.fighter-hud.${side}`)!.classList.toggle('is-critical', f.health <= 250);
    app.querySelector(`#${side}Guard`)!.classList.toggle('is-active', f.blocking || f.blockstun > 0);
    app.querySelector(`.super-panel.${side}`)!.classList.toggle('is-ready', f.tension >= 100);
    app.querySelector(`#${side}Combo`)!.textContent = f.comboCount >= 2 ? `${f.comboCount} HITS · ${f.comboDamage} DAMAGE` : '';
    if (round) app.querySelectorAll(`#${side}Pips i`).forEach((pip, index) => pip.classList.toggle('is-won', index < round.wins[side]));
    if (stock) app.querySelectorAll(`#${side}Lives i`).forEach((pip, index) => pip.classList.toggle('is-lost', index >= stock.lives[side]));
  }
  const view = round ?? stock;
  app.querySelector<HTMLElement>('#pauseBanner')!.hidden = playing || !!view?.results;
  if (stock) {
    app.querySelector('#modeLabel')!.textContent = 'STOCKS';
    app.querySelector('#clock')!.textContent = `${stock.lives.p1}·${stock.lives.p2}`;
    app.querySelector('#matchState')!.textContent = !playing ? 'PAUSED' : stock.phase === 'fight' ? 'FIGHT' : stock.phase === 'match_end' ? 'MATCH OVER' : stock.phase === 'loss' ? 'STOCK LOST' : 'READY';
  } else if (!round) {
    app.querySelector('#matchState')!.textContent = playing ? 'FREE PLAY' : 'PAUSED';
    return;
  } else {
    app.querySelector('#modeLabel')!.textContent = `ROUND ${round.round}`;
    const clock = app.querySelector<HTMLElement>('#clock')!;
    clock.textContent = String(round.seconds);
    clock.classList.toggle('is-low', round.seconds <= 10 && round.phase === 'fight');
    app.querySelector('#matchState')!.textContent = !playing ? 'PAUSED' : round.phase === 'fight' ? 'FIGHT' : round.phase === 'match_end' ? 'MATCH OVER' : round.phase === 'intro' ? 'READY' : 'ROUND OVER';
  }
  app.querySelector('.combat-hud')!.classList.toggle('is-between-rounds', view!.phase !== 'fight');
  app.querySelector<HTMLElement>('#koFlash')!.hidden = !view!.koFlash;
  const announcer = app.querySelector<HTMLElement>('#announcer')!;
  const call = view!.announcement;
  announcer.hidden = !call;
  if (call && announcer.dataset.key !== call.key) {
    announcer.dataset.key = call.key;
    announcer.dataset.tone = call.tone;
    app.querySelector('#announcerText')!.textContent = call.text;
    app.querySelector('#announcerSub')!.textContent = call.sub ?? '';
    // Restart the entrance animation for each new call.
    announcer.classList.remove('is-live'); void announcer.offsetWidth; announcer.classList.add('is-live');
  }
  const results = app.querySelector<HTMLElement>('#matchResults')!;
  results.hidden = !view!.results;
  if (view!.results) {
    app.querySelector('#resultsWinner')!.textContent = view!.results.winner;
    app.querySelector('#resultsScore')!.textContent = view!.results.score;
    const list = app.querySelector<HTMLElement>('#resultsRounds')!;
    const markup = view!.results.rounds.map((line) => `<li>${line}</li>`).join('');
    if (list.innerHTML !== markup) list.innerHTML = markup;
    app.querySelector('#resultsAuto')!.textContent = view!.results.auto;
  }
}
