# Mobile Deployment — iPhone First, From A Windows Laptop

Written 2026-07-02. The game now ships with touch controls, a PWA manifest,
and a service worker. There are three tiers, fastest first. Tier 1 gets the
game on your iPhone today with zero Apple friction; Tier 3 is the real App
Store.

## Tier 1 — PWA on your iPhone TODAY (no Mac, no Apple account)

The game is already PWA-ready. It just needs to be hosted at an HTTPS URL:

1. Host the `NO_GODS_ABOVE/` folder as a static site. Easiest options:
   - **itch.io**: zip the folder, upload as an HTML5 game ("Kind of project:
     HTML"), set `index.html` as the entry, enable fullscreen + mobile.
     Bonus: itch is also a distribution/marketing channel.
   - **Netlify Drop** (drop the folder at app.netlify.com/drop) or
     **GitHub Pages** (push, enable Pages on the repo).
2. On the iPhone: open the URL in **Safari** → Share → **Add to Home
   Screen**.
3. It launches fullscreen with no browser chrome, landscape, with the touch
   controls, and works offline after first load (service worker caches
   assets as you play).

That satisfies "downloadable somewhere so I can play it on my iPhone with no
issues." Do this first; it's also the perfect mobile playtest loop while the
native builds are set up.

## Tier 2 — Native Android (fully possible on Windows)

1. `npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android`
   in a wrapper project; set `webDir` to the game folder.
2. `npx cap add android && npx cap sync` → open in Android Studio (Windows
   OK) → Build APK.
3. Sideload the APK directly, or pay the one-time $25 Google Play fee to
   publish.

## Tier 3 — Native iOS / App Store (from Windows, via cloud Mac)

You cannot run Xcode on Windows, but you don't need to own a Mac:

1. **Apple Developer Program** — enroll at developer.apple.com ($99/year).
   Required for TestFlight and the App Store, no way around it.
2. Wrap the game with **Capacitor iOS** (`npm i @capacitor/ios`,
   `npx cap add ios`) — same wrapper project as Android.
3. Build in the cloud with **Codemagic** (codemagic.io) — free tier includes
   macOS build minutes. Connect the repo, use their Capacitor iOS workflow;
   it compiles, signs (App Store Connect API key), and can upload straight
   to **TestFlight**.
4. TestFlight → install on your iPhone like a real app. When ready, promote
   the same build to App Store review.

Alternates to Codemagic: GitHub Actions `macos` runners (free minutes on
public repos), or Ionic Appflow. Codemagic has the least setup.

### App Store review notes (plan ahead)

- Apple rejects "just a website in a shell" — the PWA wrapper should add
  native touches: haptics on hits (`@capacitor/haptics`, engine hook can go
  in `applyImpactFeedback`), proper icons/splash, Game Center later.
- Age rating: fantasy violence. Provide a support URL + privacy policy page
  (static page, no data collected).

## Engine work already done for mobile

- Touch overlay (`#touch-controls`): d-pad + L/M/H/GRAB/SP/DASH/ULT + pause/
  rematch/AI-toggle, auto-shown on coarse-pointer devices, synthesizes the
  same keyboard events the game already consumes (zero logic forks).
- `manifest.webmanifest` (fullscreen, landscape) + `sw.js` (offline cache) +
  iOS meta tags (`apple-mobile-web-app-*`, safe-area viewport).
- Portrait rotate hint; canvas already letterboxes 16:9 to any screen.

## Still needed (see ASSET_REQUESTS.md)

- App icons: `assets/ui/app/icon_192.png`, `icon_512.png`,
  `apple_touch_icon.png` (180x180), iOS 1024x1024 store icon.
- Mobile performance pass on real hardware: if frame drops appear, first
  candidates are the canvas `filter` hit-flash (swap to a white overlay
  sprite draw) and particle counts on low-power mode.
- Haptics hook once wrapped in Capacitor.
