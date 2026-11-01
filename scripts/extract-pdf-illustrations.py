"""Optional source preparation: extract original PDF graphics, not page screenshots.

Requires PyMuPDF and Pillow; the website build itself remains dependency-free.
Numbered raster diagrams are cleaned separately; this script never erases pixels.
"""
from pathlib import Path
from copy import deepcopy
import json,subprocess,xml.etree.ElementTree as ET
import fitz
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {documentManifest} from './content/document-manifest.mjs';console.log(JSON.stringify(documentManifest))"],cwd=ROOT,text=True))
def document(slug):
 entry=next(d for d in manifest if d['slug']==slug and d['category']=='technical')
 return fitz.open(ROOT/'public/documents'/entry['file'])
def embedded(slug,page,xref,name):
 doc=document(slug);p=doc[page-1];items=p.get_images(full=True);item=next(i for i in items if i[0]==xref)
 pix=fitz.Pixmap(doc,xref)
 if item[1]:pix=fitz.Pixmap(pix,fitz.Pixmap(doc,item[1]))
 if pix.colorspace and pix.colorspace.n>3:pix=fitz.Pixmap(fitz.csRGB,pix)
 im=Image.frombytes('RGBA' if pix.alpha else 'RGB',(pix.width,pix.height),pix.samples)
 out=ROOT/'public/assets/diagrams'/slug/(name+'.webp');out.parent.mkdir(parents=True,exist_ok=True)
 im.save(out,lossless=True,method=6)
 return {'file':out.relative_to(ROOT/'public/assets').as_posix(),'width':im.width,'height':im.height,'sourcePage':page,'method':'original-pdf-image'}
def vector(slug,page,box,name,minimum=3000):
 doc=document(slug);svg=ET.fromstring(doc[page-1].get_svg_image(text_as_path=False));ns='http://www.w3.org/2000/svg'
 x,y,w,h=box;root=ET.Element('{'+ns+'}svg',{'viewBox':f'{x} {y} {w} {h}','width':str(w),'height':str(h)})
 parents={child:parent for parent in svg.iter() for child in parent}
 paths=[p for p in svg.iter() if p.tag=='{'+ns+'}path' and len(p.get('d',''))>=minimum]
 assert paths,slug
 for p in paths:
  node=deepcopy(p);parent=parents.get(p)
  while parent is not None and parent is not svg:
   wrapper=ET.Element('{'+ns+'}g',{k:v for k,v in parent.attrib.items() if k in ['transform','fill','stroke','opacity','style']});wrapper.append(node);node=wrapper;parent=parents.get(parent)
  root.append(node)
 ET.register_namespace('',ns);data=ET.tostring(root,encoding='utf-8',xml_declaration=True)
 out=ROOT/'public/assets/diagrams'/slug/(name+'.svg');out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
 return {'file':out.relative_to(ROOT/'public/assets').as_posix(),'width':w,'height':h,'sourcePage':page,'method':'original-pdf-vector'}

if __name__=='__main__':
 config=[('predvaritelnyy-izmelchitel',1,43),('predvaritelnyy-raspushitel',1,7),('ballisticheskiy-separator',1,23),('rotornyy-raspushitel',8,35),('bunker-nakopitel',1,5),('vertikalno-rotornyy-izmelchitel',1,32),('rotornaya-tsentrifuga',1,46),('ochistka-stokov',1,3)]
 cards={slug:embedded(slug,page,xref,'catalog') for slug,page,xref in config}
 cards['vintovoy-press']=embedded('vintovoy-press',1,6,'catalog')
 vector('vintovoy-press',3,[150,550,170,103],'working')
 cards['rama-napolnitel']=vector('rama-napolnitel',2,[46,230,327,397],'catalog')
 # The coloured capsule-press CAD contains hundreds of thousands of segments.
 # Preserve its extracted source in the preparation workspace, serve a 2200px
 # lossless raster to keep scrolling and fullscreen smooth on older computers.
 model=vector('kapsulyator',4,[62,225,488,275],'catalog-source')
 src=ROOT/'public/assets'/model['file'];svg=fitz.open(src);pix=svg[0].get_pixmap(matrix=fitz.Matrix(2200/488,2200/488),alpha=True)
 im=Image.frombytes('RGBA',(pix.width,pix.height),pix.samples);out=src.with_name('catalog.webp');im.save(out,lossless=True,method=6)
 Path('/tmp/era-v9-sources/kapsulyator-original-vector.svg').write_bytes(src.read_bytes());src.unlink()
 cards['kapsulyator']={**model,'file':out.relative_to(ROOT/'public/assets').as_posix(),'width':im.width,'height':im.height,'method':'original-pdf-vector-render'}
 Path('/tmp/era-v9-sources/catalogue-originals.json').write_text(json.dumps(cards,ensure_ascii=False,indent=2))
 print('Extracted clean PDF illustrations:',len(cards))
