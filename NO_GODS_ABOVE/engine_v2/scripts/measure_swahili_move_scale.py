"""Measure Swahili's head independently of scythe/coat extents; never edit art."""
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ENGINE = Path(__file__).resolve().parents[1]
inventory = json.loads(subprocess.check_output(['node', str(ENGINE / 'scripts/swahili_scale_inventory.cjs')], text=True))
ROOT = Path(inventory['repo'])
OUT = ENGINE / 'docs/versus_playtest/swahili-scale-v1'
OUT.mkdir(parents=True, exist_ok=True)

def measure(file):
    with Image.open(ROOT / file) as img:
        rgba = np.asarray(img.convert('RGBA'))
    # Warm pink skin: gold and the black suit are excluded. Use the largest
    # connected skin region (head), never total skin area including both hands.
    r, g, b, a = [rgba[:, :, i].astype(np.int16) for i in range(4)]
    skin = (a > 128) & (r > 85) & (r > g * 1.18) & (b > g * .64) & (b < g * 1.13) & (r - b > 20)
    mask = ndimage.binary_closing(skin, iterations=2)
    labels, count = ndimage.label(mask)
    areas = np.bincount(labels.ravel()); areas[0] = 0
    label = int(areas.argmax())
    ys, xs = np.nonzero(labels == label)
    cov = np.cov(np.stack([xs, ys])); values = np.linalg.eigvalsh(cov)
    yy, xx = np.nonzero(a > 8)
    return {'width': rgba.shape[1], 'height': rgba.shape[0],
            'alphaBounds': [int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1],
            'headBounds': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
            'headArea': int(areas[label]), 'headMajor': round(float(np.sqrt(values[-1]) * 4), 3),
            'headMinor': round(float(np.sqrt(values[0]) * 4), 3)}

files = sorted({file for group in inventory['groups'].values() for file in group['urls']})
measures = {file: measure(file) for file in files}
report = {'method': 'largest pink skin component, rotation-invariant PCA; manual review required', 'groups': inventory['groups'], 'frames': measures}
(OUT / 'source-measurements.json').write_text(json.dumps(report, indent=2) + '\n')
anchor = measures[inventory['groups']['idle']['urls'][0]]
print(f"Measured {len(files)} unique frames in {len(inventory['groups'])} clips; idle head major {anchor['headMajor']}, area {anchor['headArea']}")
for name, group in inventory['groups'].items():
    frames = [measures[file] for file in group['urls']]
    ratios = [f['headMajor'] / anchor['headMajor'] for f in frames]
    print(f"{name:36} {len(frames):2d} frames head ratio {min(ratios):.2f}..{max(ratios):.2f} median {np.median(ratios):.2f}; sizes {sorted(set((f['width'], f['height']) for f in frames))}")
