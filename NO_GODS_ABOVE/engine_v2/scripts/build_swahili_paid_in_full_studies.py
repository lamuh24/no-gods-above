"""Preserve generated art; user-authorized chroma removal and fixed-grid slicing.

These are cinematic study assets, deliberately NOT registered in gameplay.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from build_swahili_new_specials import clean

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'

def main():
    report = {'status': 'shot_studies_not_runtime', 'clips': {}, 'rejected': {
        'rejected-gunfire-source.png': 'Firing-arm swaps between adjacent poses; not used in playback.'}}
    for name, size in [('opening', 768), ('near-shot', 448), ('body-recoil', 448)]:
        source = Image.open(BASE / f'{name}-source.png')
        dest = BASE / name
        dest.mkdir(exist_ok=True)
        frames = []
        records = []
        # A single scale for the entire clip. No per-pose bounding-box stretching.
        nominal_w, nominal_h = source.width / 4, source.height / 2
        scale = (size - 24) / max(nominal_w, nominal_h)
        for i in range(8):
            col, row = i % 4, i // 4
            bounds = (round(col * nominal_w) + 2, round(row * nominal_h) + 2,
                      round((col+1) * nominal_w) - 2, round((row+1) * nominal_h) - 2)
            cell = clean(source.crop(bounds))
            cell = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (size, size))
            frame.alpha_composite(cell, ((size-cell.width)//2, size-12-cell.height))
            frame.save(dest / f'{i+1:02}.png')
            alpha = np.asarray(frame)[:,:,3]
            assert alpha.max() == 255 and np.count_nonzero(alpha == 0) > size*size*.12
            bbox = frame.getbbox()
            assert bbox and min(bbox[0], bbox[1], size-bbox[2], size-bbox[3]) >= 10
            records.append({'frame': i+1, 'sourceCrop': bounds, 'bbox': bbox})
            frames.append(frame)
        atlas = Image.new('RGBA', (size*8, size))
        contact = Image.new('RGB', (size*4, size*2), '#202632')
        for i, frame in enumerate(frames):
            atlas.alpha_composite(frame, (i*size, 0))
            contact.paste(frame, (i%4*size, i//4*size), frame)
            ImageDraw.Draw(contact).text((i%4*size+12, i//4*size+12), str(i+1), fill='white')
        atlas.save(dest / 'atlas.png')
        contact.thumbnail((1536,768))
        contact.save(dest / 'contact.jpg')
        report['clips'][name] = {'cell': size, 'scale': scale, 'frames': records,
            'limits': ['Eight source poses; additional connectors may be needed.',
                       'Portrait/body shot scales are independent; not arena body normalization.']}
    (BASE / 'validation.json').write_text(json.dumps(report, indent=2))
    print('PASS: 24 isolated RGBA study frames; constant scale within each clip; transparent padding; rejected takes excluded.')

if __name__ == '__main__':
    main()
