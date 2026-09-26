# Stage loading release — September 25, 2026

The match now stays on a preparation screen until the selected stage renders. Fighters, HUD, and tutorial content are hidden during loading, and the simulation does not advance until the first visible stage frame. Failed stage art produces an explicit fallback. The selected flat training arena remains supported.

- Source commit: `296d3701dfafaa32148166e13f44c8ca84f50640`.
- GitHub: [PR 13](https://github.com/lamuh24/no-gods-above/pull/13), [issue 14](https://github.com/lamuh24/no-gods-above/issues/14). PR remains unmerged.
- Production: [nogodsabove.netlify.app](https://nogodsabove.netlify.app/versus-playtest.html).
- Netlify site: `4bc048d7-e9cc-4eba-96f5-59ce01bb5f90`.
- Deploy: `6ab71bc8c9d95d681d521d92`.
- Public bundle: `playtest-index-Bk2MnlMT-optimized-f24bc6368008.js`.

`npm.cmd run build:online-playtest` passed. Local and public Chrome checks passed for delayed stage art, menu-to-combo-tutorial entry, failed stage fallback, and the selected flat arena, with zero page errors. The screenshots in this folder show the public loading and ready states.

The existing guided tutorials, full air combo lessons, air specials, and Swahili Paid cinematic remain included. The two selected Suno tracks are integrated and tested on the separate local branch `codex/nga-v2-suno-music-loading-2026-09-25`, commit `7ab95e31`; their public release is pending rights clarification. No music files were included in this deployment.
