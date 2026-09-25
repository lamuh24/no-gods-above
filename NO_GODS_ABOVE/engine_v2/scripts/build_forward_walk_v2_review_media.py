from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "swahili_sandbox" / "forward-walk-v2-live-review"
manifest = json.loads((OUT / "playback-manifest.json").read_text(encoding="utf-8"))

for key, folder, filename in (
    ("authoredP1", "authored-p1-frames", "authored-p1-playback.gif"),
    ("mirroredP2", "mirrored-p2-frames", "mirrored-p2-playback.gif"),
):
    records = manifest[key]
    images = [Image.open(OUT / folder / record["filename"]).convert("P", palette=Image.Palette.ADAPTIVE, colors=160) for record in records]
    durations = [round(record["durationTicks"] / 60 * 1000) for record in records]
    images[0].save(
        OUT / filename,
        save_all=True,
        append_images=images[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )
    for image in images:
        image.close()
    print(f"wrote {OUT / filename}")
