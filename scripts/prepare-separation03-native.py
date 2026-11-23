#!/usr/bin/env python3
"""Derive the transparent PREMIUM assembly from the unchanged numbered source WebP.

The website-owned WebP is already registered pixel-for-pixel to the SolidWorks
PDF. This program removes only the PDF's 42 numbered callouts and thin annotation
strokes; the CAD hardware and its camera perspective are never rescaled or moved.
Each native SVG/HTML leader is added later by scripts/line-diagram.mjs.

This is a deterministic publishing derivative, not a replacement for the source.
Requires: python -m pip install numpy==1.26.4 opencv-python-headless==4.10.0.84
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"public/assets/lines/separatsiya-03/layout-numbered.webp"
OUTPUT=ROOT/"public/assets/lines/separatsiya-03/layout-native.webp"
DATA=ROOT/"content/separation-03-markers.json"
GEOMETRY=ROOT/"content/separation-03-native-targets.json"

def main():
    markers=json.loads(DATA.read_text(encoding="utf8"))
    reference=json.loads(GEOMETRY.read_text(encoding="utf8"))
    img=cv2.imread(str(SOURCE), cv2.IMREAD_COLOR)
    if img is None or (img.shape[1],img.shape[0]) != (1452,830):
        raise ValueError("PREMIUM numbered source must be 1452x830 pixels")
    if (reference["width"],reference["height"]) != (1452,830):
        raise ValueError("Incorrect source geometry")
    leaders=reference["callouts"]
    h,w=img.shape[:2]
    leader_mask=np.zeros((h,w),np.uint8)
    badge_mask=np.zeros((h,w),np.uint8)
    seen=set()
    for position in markers["positions"]:
        for instance in position["instances"]:
            id_=instance["id"]
            if id_ in seen or id_ not in leaders:
                raise ValueError("Unknown/repeated position "+id_)
            seen.add(id_)
            bx,by=instance["badge"]
            tx,ty=leaders[id_]
            circle=(int(round(bx)),int(round(by)))
            target=(int(round(tx)),int(round(ty)))
            if not (0 <= target[0] < w and 0 <= target[1] < h):
                raise ValueError("Out-of-bounds endpoint "+id_)
            cv2.circle(badge_mask,circle,22,255,-1,lineType=cv2.LINE_AA)
            start=reference["lineStarts"].get(id_)
            if start is None: raise ValueError("Missing exact PDF leader origin "+id_)
            cv2.line(leader_mask,tuple(round(v) for v in start),target,255,7,lineType=cv2.LINE_AA)
    if len(seen)!=42 or len(leaders)!=42:raise ValueError("Expected 42 matched PDF callouts")
    union=cv2.bitwise_or(leader_mask,badge_mask)
    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    # Unlike the old algorithm, erase the COMPLETE original leader line even
    # near the equipment, where stale grey annotation strokes survived.
    result=cv2.inpaint(img,badge_mask,3,cv2.INPAINT_TELEA)
    grayscale=(hsv[:,:,1]<45)
    result[(badge_mask!=0)&grayscale]=255
    machinery=cv2.inpaint(result,leader_mask,2,cv2.INPAINT_TELEA)
    result[(leader_mask!=0)&(~grayscale)]=machinery[(leader_mask!=0)&(~grayscale)]
    result[(leader_mask!=0)&grayscale]=255
    alpha=np.uint8(np.clip((255-result.min(axis=2).astype(np.float32))/20.0,0.0,1.0)*255)
    pixels=np.dstack((result,alpha))
    if not cv2.imwrite(str(OUTPUT),pixels,[cv2.IMWRITE_WEBP_QUALITY,94]):
        raise RuntimeError("Failed to export native line artwork")
    sample=cv2.imread(str(OUTPUT),cv2.IMREAD_UNCHANGED)
    if sample is None or sample.shape!=(830,1452,4) or sample[0,0,3]>10:
        raise ValueError("Transparent diagram output is invalid")
    print(f"PREMIUM native diagram: {w}x{h}, {len(seen)} matched labels, {OUTPUT.stat().st_size} bytes")

if __name__=="__main__":
    main()
