# Kairo V2 — Sprite Handling Rules

To reduce sliding and overlap:

1. Use bottom-center anchoring for grounded animations.
2. Keep Kairo's feet aligned to the same ground baseline for grounded rows.
3. Do not treat pose shifts inside a frame as intended arena travel.
4. Dash distance and special travel should be handled in code, not by large baked sprite displacement.
5. Crop or pad frames to consistent dimensions if needed.
6. If one frame contains a large effect, keep the fighter anchor stable and allow the effect to extend visually without moving the root position.
7. Prefer consistent frame width/height per sheet.
8. Approximate slicing is acceptable if it keeps the game stable.
