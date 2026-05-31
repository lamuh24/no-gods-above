from argparse import ArgumentParser
from pathlib import Path

from PIL import Image


MAGENTA = (255, 0, 255, 255)


def open_rgba(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return Image.open(path).convert("RGBA")


def validate_row_index(name: str, row_index: int, rows: int) -> None:
    if row_index < 0 or row_index >= rows:
        raise ValueError(f"{name} row index {row_index} is outside valid range 0..{rows - 1}")


def validate_strip(name: str, strip: Image.Image, master_width: int, row_height: int) -> None:
    if strip.width != master_width:
        raise ValueError(f"{name} width {strip.width} does not match master row width {master_width}")
    if strip.height != row_height:
        raise ValueError(f"{name} height {strip.height} does not match master row height {row_height}")


def validate_magenta_corners(name: str, image: Image.Image) -> None:
    width, height = image.size
    corners = (
        image.getpixel((0, 0)),
        image.getpixel((width - 1, 0)),
        image.getpixel((0, height - 1)),
        image.getpixel((width - 1, height - 1)),
    )
    if any(pixel != MAGENTA for pixel in corners):
        raise ValueError(f"{name} does not have solid #ff00ff magenta in all four corners")


def paste_row(master: Image.Image, strip: Image.Image, row_index: int, row_height: int) -> None:
    y = row_index * row_height
    master.paste(strip, (0, y))


def parse_args():
    parser = ArgumentParser(description="Patch slide and up+j rows into an existing spritesheet.")
    parser.add_argument("--master", default="master_sheet.png", help="Original full spritesheet path.")
    parser.add_argument("--slide-fix", default="slide_fix.png", help="Corrected 6-frame slide row path.")
    parser.add_argument("--uj-fix", default="uj_fix.png", help="Corrected 6-frame up+j row path.")
    parser.add_argument("--output", default="patched_master_sheet.png", help="Patched output spritesheet path.")
    parser.add_argument("--rows", type=int, default=5, help="Number of rows in the master sheet.")
    parser.add_argument("--slide-row", type=int, required=True, help="Zero-based row index to replace with slide_fix.png.")
    parser.add_argument("--uj-row", type=int, required=True, help="Zero-based row index to replace with uj_fix.png.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    master_path = Path(args.master)
    slide_path = Path(args.slide_fix)
    uj_path = Path(args.uj_fix)
    output_path = Path(args.output)

    master = open_rgba(master_path)
    slide_fix = open_rgba(slide_path)
    uj_fix = open_rgba(uj_path)

    if args.rows <= 0:
        raise ValueError("--rows must be greater than zero")
    if master.height % args.rows != 0:
        raise ValueError(f"Master sheet height {master.height} is not divisible by row count {args.rows}")

    row_height = master.height // args.rows

    validate_row_index("slide", args.slide_row, args.rows)
    validate_row_index("up+j", args.uj_row, args.rows)
    validate_strip("slide_fix.png", slide_fix, master.width, row_height)
    validate_strip("uj_fix.png", uj_fix, master.width, row_height)
    validate_magenta_corners("master_sheet.png", master)
    validate_magenta_corners("slide_fix.png", slide_fix)
    validate_magenta_corners("uj_fix.png", uj_fix)

    patched = master.copy()
    paste_row(patched, slide_fix, args.slide_row, row_height)
    paste_row(patched, uj_fix, args.uj_row, row_height)

    output_path.parent.mkdir(parents=True, exist_ok=True) if output_path.parent != Path(".") else None
    patched.save(output_path)

    print("Patched spritesheet rows successfully.")
    print(f"Master sheet size: {master.width}x{master.height}")
    print(f"Row height: {row_height}")
    print(f"Slide row replaced: {args.slide_row}")
    print(f"Up+J row replaced: {args.uj_row}")
    print(f"Output file path: {output_path}")


if __name__ == "__main__":
    main()
