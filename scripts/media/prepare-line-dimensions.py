"""Reproduce real A0 website projections; coordinates are PDF points, never a redraw.

Requires PyMuPDF and Pillow. Original PDF and the approved crop manifest are inputs.
"""
import hashlib
import io
import json
from pathlib import Path

import fitz
from PIL import Image

root = Path(__file__).resolve().parents[2]
manifest = json.loads((root / 'content/lines/pro/separatsiya-02-dimensions.json').read_text())
source = root / 'public' / manifest['source']
assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest['sourceSha256']
doc = fitz.open(source)
assert len(doc) == 1
page = doc[manifest['page'] - 1]
assert all(abs(a-b) < .01 for a, b in zip(page.rect[2:], manifest['pageSizePt']))
outputs = []
for view in manifest['views']:
    clip = fitz.Rect(view['clipPt'])
    assert page.rect.contains(clip)
    scale = manifest['outputWidth'] / clip.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    image = Image.open(io.BytesIO(pixmap.tobytes('png'))).convert('RGB')
    dest = root / 'public/assets' / view['file']
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, 'WEBP', quality=95, method=6)
    outputs.append({**view, 'width': image.width, 'height': image.height,
                    'bytes': dest.stat().st_size, 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()})
    print(view['id'], image.size, dest.stat().st_size)
(root / 'content/lines/pro/separatsiya-02-dimensions-assets.json').write_text(
    json.dumps({'sourceSha256': manifest['sourceSha256'], 'page': manifest['page'], 'views': outputs}, ensure_ascii=False, indent=2) + '\n')
