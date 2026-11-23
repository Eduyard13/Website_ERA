#!/usr/bin/env python3
"""Render the supplied numbered SolidWorks PDFs without their annotation paint.

Install PyMuPDF, Pillow, NumPy and SciPy. Run once per authoritative source:
    python scripts/prepare-separation03-native.py premium PREMIUM_numbered_AUTHORITATIVE.pdf
    python scripts/prepare-separation03-native.py hot-wash HOT_WASH_numbered_AUTHORITATIVE.pdf
"""
import argparse
import hashlib
import json
from pathlib import Path

import fitz
import numpy as np
from PIL import Image
from scipy.ndimage import binary_propagation


ROOT = Path(__file__).resolve().parents[1]


def remove_annotations(pdf, kind):
    if kind == 'premium':
        # Contents 7–9 contain the original color strips. The 328797 CAD
        # outlines begin at this transform and continue through 13–15.
        # Only text, printed circles, leaders and arrowheads precede it.
        content = pdf.xref_stream(10)
        model = content.index(b'q 1 0 0 1 209.6 574.5 cm\n')
        pdf.update_stream(10, b'Q\n0 0 0 RG\n0.709 w\n1 j 1 J\n' + content[model:])
    else:
        # The colored model, platform and its outlines are in the 36 inline
        # RGB strips. Keep them and both registered model image objects.
        content = pdf.xref_stream(41)
        annotations = content.index(b'\nBT\n')
        model_images = content.index(b'\n\nQ\nq\nq\n30.296 0.000', annotations)
        pdf.update_stream(41, content[:annotations] + content[model_images:])


def render(page, geometry):
    (scale_x, shift_x), (scale_y, shift_y) = geometry['pdfToImage']
    width, height = geometry['width'], geometry['height']
    matrix = fitz.Matrix(scale_x, 0, 0, scale_y, shift_x, shift_y)
    clip = fitz.Rect(0, 0, width, height) * (~matrix)
    pixmap = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
    crop = Image.new('RGB', (width, height), 'white')
    crop.paste(Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples), (pixmap.x, pixmap.y))

    colors = np.asarray(crop)
    white = np.all(colors == 255, axis=2)
    paper = np.zeros(white.shape, dtype=bool)
    paper[[0, -1], :] = white[[0, -1], :]
    paper[:, [0, -1]] = white[:, [0, -1]]
    # Checked gaps in the PREMIUM conveyor supports are enclosed by strokes.
    # Seed only those paper components; retain white faces elsewhere.
    for x, y in geometry.get('paperSeeds', []):
        if not white[y, x]:
            raise ValueError(f'Paper seed is no longer on the sheet: {x},{y}')
        paper[y, x] = True
    paper = binary_propagation(paper, mask=white)
    return Image.fromarray(np.dstack((colors, np.where(paper, 0, 255).astype(np.uint8))))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=['premium', 'hot-wash'])
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    stem = 'separation-03' if args.kind == 'premium' else 'moyka-plenki'
    geometry = json.loads((ROOT / 'content' / f'{stem}-native-targets.json').read_text())
    source = args.source.read_bytes()
    if hashlib.sha256(source).hexdigest() != geometry['pdfSha256']:
        raise SystemExit(f'Expected the authoritative numbered PDF: {geometry["reference"]}')
    with fitz.open(stream=source, filetype='pdf') as pdf:
        remove_annotations(pdf, args.kind)
        artwork = render(pdf[0], geometry)
    destination = ROOT / 'public/assets' / geometry['file']
    artwork.save(destination, lossless=True, method=6)
    print(f'{destination.name}: {artwork.width} × {artwork.height}, SHA-256 {hashlib.sha256(destination.read_bytes()).hexdigest()}')


if __name__ == '__main__':
    main()
