# NO GODS ABOVE

A 2D browser fighting game — 8 playable fighters, 3 arenas, local versus, and a multiplayer backend — built end-to-end through a multi-agent AI development workflow.

## The game

- **8 fighters**, each with distinct movement and combat profiles: Kairo, Vanta, Nyx, Sol, Seris, Lamuh, Lamuh Legacy, Celeste
- **3 arenas** with their own platform layouts and tuning: Standard Arena, Platform Arena, Eclipse Rooftop
- Per-arena physics tuning (e.g., jump-force multipliers scoped to a single stage so balance changes never leak across arenas)
- Camera system that tracks multi-fighter spread across platforms

## The interesting part: how it's built

This project is an experiment in **agent-driven game development with real QA gates**. Every change ships through a pipeline:

1. Agents (Claude Code / Codex) coordinate through `SESSION_CONTEXT.md` and repo-local skill files (`fighting_game_balance_pass_skill.md`, `deployment_readiness_skill.md`, etc.)
2. Changes are scoped — an Eclipse Rooftop tweak can't touch Standard Arena tuning
3. **Automated browser QA over Chrome DevTools Protocol**: real keyboard input (`KeyW` jumps) is replayed for every fighter against every modified platform, measuring actual apex clearance in pixels
4. Syntax checks, smoke tests (`node scripts/smoke_platform_arena_test.js`), and QA reports (`docs/*_qa_report.json` + screenshots) gate every merge

The result: balance changes are validated the way a player would experience them, not just eyeballed.

## Run it

Open `NO_GODS_ABOVE/index.html` in a browser. No build step — vanilla JS by design.

---

A [LAMUH](https://github.com/lamuh24) experiment in what solo developers can ship when they orchestrate AI agents instead of just prompting them.
