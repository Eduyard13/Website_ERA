"""Exact-source matting and annotation export requested by the Titanium brief.

Equipment pixels/geometry are never generated. Pillow/NumPy implement the approved
alpha composition. Only the empty titanium lighting plate uses image generation.
"""
from pathlib import Path
from hashlib import sha256
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root=Path(__file__).resolve().parents[2]
assets=root/'public/assets'
folder=assets/'lines/separatsiya-01'
records={}

def record(path):
    image=Image.open(path)
    return {'file':str(path.relative_to(assets)), 'width':image.width, 'height':image.height,
            'bytes':path.stat().st_size, 'sha256':sha256(path.read_bytes()).hexdigest()}

# The blue photographic background overlaps the hue of thin pipes. Use the
# explicitly permitted white engineering source instead of damaging its geometry.
source=folder/'hero.webp'
image=Image.open(source).convert('RGB')
rgb=np.asarray(image,dtype=np.float32)
alpha=np.clip((255-rgb.min(axis=2))/24,0,1)
straight=np.clip((rgb-255*(1-alpha[:,:,None]))/np.maximum(alpha[:,:,None],.001),0,255)
subject=Image.fromarray(straight.astype('uint8')).convert('RGBA')
subject.putalpha(Image.fromarray(np.uint8(alpha*255)))
plate=folder/'titanium-gallery-plate.webp'
background=Image.open(plate).convert('RGBA').resize(image.size,Image.Resampling.LANCZOS)
# Diffuse floor contact shadows beneath the original bases and wheels only.
shadow=Image.new('L',image.size)
draw=ImageDraw.Draw(shadow)
for box in [(28,1275,260,1366),(230,1135,438,1225),(490,1150,850,1300),
            (570,990,1100,1200),(940,680,1460,1000),(1330,430,1660,650),
            (1760,460,2040,550)]:
    draw.ellipse(box,fill=55)
shade=Image.new('RGBA',image.size,(61,73,83,0))
shade.putalpha(shadow.filter(ImageFilter.GaussianBlur(30)))
result=Image.alpha_composite(Image.alpha_composite(background,shade),subject).convert('RGB')
hero=folder/'hero-titanium.webp'
result.save(hero,'WEBP',quality=95,method=6)
small=folder/'hero-titanium-768.webp'
result.resize((768,round(result.height*768/result.width)),Image.Resampling.LANCZOS).save(small,'WEBP',quality=92,method=6)
records['hero']={**record(hero),'smallFile':str(small.relative_to(assets)),
                 'small':record(small),'source':record(source),'background':record(plate),
                 'method':'White-matte removal, original equipment pixels, unchanged size and geometry, diffuse floor contact shadows.'}

# Original raster leaders stay untouched. Erase only circular labels, which lie
# entirely outside the equipment, then join live HTML markers to those leaders.
diagram=json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import {fullLineDiagram} from './content/line-diagrams.mjs';console.log(JSON.stringify(fullLineDiagram))"],cwd=root,text=True))
original=assets/diagram['file']
scene=Image.open(original).convert('RGB')
pixels=np.asarray(scene)
gray=(pixels.max(axis=2).astype(int)-pixels.min(axis=2).astype(int)<13)&(pixels.min(axis=2)>140)&(pixels.max(axis=2)<248)
clean=scene.copy()
eraser=ImageDraw.Draw(clean)
radius=46
joins=[]
for part in diagram['parts']:
    for index,pin in enumerate(part['pins']):
        center=np.round(np.array(pin)*diagram['width']/1000,3)
        target=np.array(part['targets'][min(index,len(part['targets'])-1)])*diagram['width']/1000
        direction=(target-center)/np.linalg.norm(target-center)
        # Sample only the original thin leader in a white annulus around its
        # source marker. Do not infer or move an equipment target.
        cx,cy=center
        y0,y1=max(0,int(cy-100)),min(scene.height,int(cy+101))
        x0,x1=max(0,int(cx-100)),min(scene.width,int(cx+101))
        yy,xx=np.mgrid[y0:y1,x0:x1]
        vectors=np.stack([xx-cx,yy-cy],axis=-1)
        distances=np.linalg.norm(vectors,axis=-1)
        alignment=np.sum(vectors*direction,axis=-1)/np.maximum(distances,1)
        candidates=gray[y0:y1,x0:x1]&(distances>50)&(distances<95)&(alignment>.965)
        samples=vectors[candidates]
        if len(samples)>=5:
            _,_,axes=np.linalg.svd(samples,full_matrices=False)
            fitted=axes[0]
            if np.dot(fitted,direction)<0:fitted=-fitted
            direction=fitted
        end=center+direction*(radius+2)
        eraser.ellipse((cx-radius,cy-radius,cx+radius,cy+radius),fill='white')
        joins.append({'number':part['number'],'pinIndex':index,'centerPx':[round(float(x),3) for x in center],
                      'endPx':[round(float(x),3) for x in end],'radiusPx':radius})

out=folder/'layout-interactive.webp'
# Lossless export preserves every source pixel outside the annotation discs.
clean.save(out,'WEBP',lossless=True,method=6)
records['diagram']={**record(out),'source':record(original),'joins':joins,
                    'method':'Only annotation discs removed; original leader pixels and all equipment pixels preserved. Live marker joins stop at the original leader.'}
(root/'content/lines/pro/separatsiya-02-presentation-assets.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
for name,data in records.items():print(name,data['width'],data['height'],data['bytes'],data['sha256'])
