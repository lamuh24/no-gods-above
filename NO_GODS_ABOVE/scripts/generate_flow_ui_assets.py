from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
UI_DIR = ROOT / "assets" / "ui" / "flow"


def ensure_dirs():
    UI_DIR.mkdir(parents=True, exist_ok=True)


def save_png(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print(f"wrote {path.relative_to(ROOT)}")


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGBA", size)
    pix = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        row = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(4))
        for x in range(w):
            pix[x, y] = row
    return img


def add_vignette(img, strength=190):
    w, h = img.size
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    for r in range(max(w, h), 0, -16):
        alpha = int(strength * (1 - r / max(w, h)) ** 1.6)
        draw.ellipse((w / 2 - r, h / 2 - r * 0.65, w / 2 + r, h / 2 + r * 0.65), fill=alpha)
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay.putalpha(mask)
    img.alpha_composite(overlay)
    return img


def draw_frame(size, color=(226, 64, 80), accent=(241, 210, 138), alpha=205, radius=18):
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((3, 3, w - 4, h - 4), radius=radius, outline=accent + (alpha,), width=3)
    draw.rounded_rectangle((10, 10, w - 11, h - 11), radius=max(4, radius - 7), outline=color + (125,), width=2)
    for inset, a in ((18, 42), (28, 22)):
        draw.rounded_rectangle((inset, inset, w - inset, h - inset), radius=max(3, radius - inset // 3), outline=accent + (a,), width=1)
    corner = 42
    for sx, sy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        x0 = 10 if sx == 0 else w - 10 - corner
        y0 = 10 if sy == 0 else h - 10 - corner
        draw.line((x0, y0 + corner, x0, y0, x0 + corner, y0), fill=accent + (165,), width=3)
    glow = img.filter(ImageFilter.GaussianBlur(8))
    base = Image.new("RGBA", size, (0, 0, 0, 0))
    base.alpha_composite(glow)
    base.alpha_composite(img)
    return base


def draw_menu_background():
    w, h = 1600, 900
    img = gradient((w, h), (10, 4, 10, 255), (2, 2, 5, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    for y in range(0, h, 42):
        shade = 20 + int(16 * math.sin(y / 83))
        draw.rectangle((0, y, w, y + 20), fill=(30, 8, 18, shade))
    for i in range(18):
        x = int(w * (i / 17))
        draw.line((x, 0, x - 220, h), fill=(167, 35, 57, 34), width=2)
    draw.ellipse((530, 105, 1070, 645), fill=(201, 57, 65, 24), outline=(241, 210, 138, 42), width=6)
    draw.ellipse((625, 135, 1165, 675), fill=(0, 0, 0, 82))
    for _ in range(90):
        x = random.randrange(w)
        y = random.randrange(40, h - 120)
        a = random.randrange(22, 78)
        draw.rectangle((x, y, x + random.randrange(1, 3), y + random.randrange(1, 3)), fill=(241, 210, 138, a))
    add_vignette(img, 225)
    save_png(img, UI_DIR / "main_menu_background.png")


def draw_mode_panel(name, hue):
    w, h = 780, 360
    img = gradient((w, h), (10, 5, 12, 235), (2, 2, 5, 235))
    draw = ImageDraw.Draw(img, "RGBA")
    for i in range(12):
        y = 36 + i * 24
        draw.line((40, y, w - 40, y + math.sin(i) * 28), fill=hue + (38,), width=4)
    for x in range(60, w - 40, 120):
        draw.rectangle((x, 78, x + 48, h - 48), fill=(hue[0], hue[1], hue[2], 28))
    img.alpha_composite(draw_frame((w, h), color=hue, radius=20))
    save_png(img, UI_DIR / f"mode_panel_{name}.png")


def draw_transparent_assets():
    assets = {
        "character_card_frame.png": (520, 720),
        "fighter_showcase_frame.png": (980, 620),
        "stage_card_frame.png": (620, 380),
        "mode_panel_frame.png": (780, 360),
        "match_intro_overlay.png": (1200, 680),
    }
    for name, size in assets.items():
        save_png(draw_frame(size, radius=20), UI_DIR / name)


def main():
    random.seed(24)
    ensure_dirs()
    draw_menu_background()
    draw_mode_panel("online", (72, 224, 205))
    draw_mode_panel("local", (226, 64, 80))
    draw_mode_panel("training", (214, 154, 68))
    draw_mode_panel("arcade", (150, 92, 214))
    draw_transparent_assets()


if __name__ == "__main__":
    main()
