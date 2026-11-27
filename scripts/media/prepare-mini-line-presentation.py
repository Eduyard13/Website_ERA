"""Source-pixel matting and composition explicitly requested by the mini-line brief.

Uses the same matte removal and existing titanium plate as Separation 02. No
equipment pixels are generated; the numbered source sheet stays unchanged.
"""
from pathlib import Path
from hashlib import sha256
import base64
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[2]
assets = root / 'public/assets'
folder = assets / 'lines/separatsiya-01-mini'
source = folder / 'overview.webp'
plate = assets / 'lines/separatsiya-01/titanium-gallery-plate.webp'

def record(path):
    image = Image.open(path)
    return {'file': str(path.relative_to(assets)), 'width': image.width,
            'height': image.height, 'bytes': path.stat().st_size,
            'sha256': sha256(path.read_bytes()).hexdigest()}

image = Image.open(source).convert('RGB')
rgb = np.asarray(image, dtype=np.float32)
alpha = np.clip((255 - rgb.min(axis=2)) / 24, 0, 1)
straight = np.clip((rgb - 255 * (1 - alpha[:, :, None])) /
                   np.maximum(alpha[:, :, None], .001), 0, 255)
subject = Image.fromarray(straight.astype('uint8')).convert('RGBA')
subject.putalpha(Image.fromarray(np.uint8(alpha * 255)))

background = Image.open(plate).convert('RGBA').resize(image.size, Image.Resampling.LANCZOS)
shadow = Image.new('L', image.size)
draw = ImageDraw.Draw(shadow)
# Contact footprints of the source supports, rotor, conveyors and bag frame.
feet = [(65, 667, 240, 738), (270, 778, 500, 860), (470, 818, 650, 889),
        (570, 457, 680, 504), (850, 619, 1130, 728),
        (1210, 328, 1435, 391), (860, 902, 1100, 1005)]
for box in feet:
    draw.ellipse(box, fill=46)
shade = Image.new('RGBA', image.size, (61, 73, 83, 0))
shade.putalpha(shadow.filter(ImageFilter.GaussianBlur(21)))
result = Image.alpha_composite(Image.alpha_composite(background, shade), subject).convert('RGB')
hero = folder / 'hero-titanium.webp'
small = folder / 'hero-titanium-768.webp'
result.save(hero, 'WEBP', quality=95, method=6)
result.resize((768, 517), Image.Resampling.LANCZOS).save(small, 'WEBP', quality=92, method=6)

# Uniform source registration, refined against coloured equipment pixels on p.5.
# This keeps the existing source coordinates of all 11 callouts unchanged.
scale = 1.2520274454340496
dx, dy = 68.17629278355454, 34.55781503840613
native = subject.transform((2042, 1350), Image.Transform.AFFINE,
                           (1 / scale, 0, -dx / scale, 0, 1 / scale, -dy / scale),
                           Image.Resampling.BICUBIC)
layout = folder / 'layout-native.webp'
native.save(layout, 'WEBP', lossless=True, method=6)

# Conservative 20px tiles: a tile is occupied if any source alpha is nonzero.
columns, rows = 103, 68
pixels = np.asarray(native.getchannel('A'))
occupied = np.zeros((rows, columns), dtype=np.uint8)
for y in range(rows):
    y0, y1 = y * native.height // rows, ((y + 1) * native.height + rows - 1) // rows
    for x in range(columns):
        x0, x1 = x * native.width // columns, ((x + 1) * native.width + columns - 1) // columns
        occupied[y, x] = bool(pixels[y0:y1, x0:x1].any())
mask = {'imageSha256': sha256(layout.read_bytes()).hexdigest(),
        'columns': columns, 'rows': rows,
        'occupiedTilesBase64': base64.b64encode(np.packbits(occupied.ravel(), bitorder='little')).decode()}
(root / 'content/lines/base/separatsiya-01-occupancy.json').write_text(json.dumps(mask, indent=2) + '\n')
manifest = {
    'hero': {**record(hero), 'smallFile': str(small.relative_to(assets)),
             'small': record(small), 'source': record(source), 'background': record(plate),
             'contactShadows': feet,
             'method': 'Same white-matte removal as Separation 02; original equipment pixels on the existing titanium plate.'},
    'diagram': {**record(layout), 'source': record(source),
                'numberedSource': record(folder / 'layout.webp'),
                'registration': {'scale': scale, 'translate': [dx, dy]},
                'method': 'Unnumbered source, white-matte removal, uniform scale onto the original 2042x1350 drawing canvas.'},
}
(root / 'content/lines/base/separatsiya-01-presentation-assets.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
for key, item in manifest.items():
    print(key, item['width'], item['height'], item['bytes'], item['sha256'])
