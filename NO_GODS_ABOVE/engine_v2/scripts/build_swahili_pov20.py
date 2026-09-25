"""Extract twenty authored transparent POV poses; no duplicated filler frames."""
from pathlib import Path
import json, hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
OUT=BASE/'pov20';OUT.mkdir(exist_ok=True)
frames=[];records=[]
for filename in ['pov-rush-10-source.png','pov-slash-10-source.png']:
 im=Image.open(BASE/filename).convert('RGBA');a=np.array(im)
 labels,count=ndimage.label(a[:,:,3]>32)
 areas=np.bincount(labels.ravel());areas[0]=0
 ids=np.argsort(areas)[-10:]; assert min(areas[ids])>2500
 boxes=ndimage.find_objects(labels)
 ids=sorted(ids,key=lambda k: (round(((boxes[k-1][0].start+boxes[k-1][0].stop)/2-im.height/10)/(im.height/5)),(boxes[k-1][1].start+boxes[k-1][1].stop)/2))
 print(filename,im.size,[(int(k),int(areas[k])) for k in ids])
 for k in ids:
  ys,xs=boxes[k-1]; x0=max(0,xs.start-3);y0=max(0,ys.start-3);x1=min(im.width,xs.stop+3);y1=min(im.height,ys.stop+3)
  cell=im.crop((x0,y0,x1,y1))
  # Remove only other large body components inside this crop, retain small detail islands.
  local=np.array(cell); ll=labels[y0:y1,x0:x1];other=np.isin(ll,[n for n in ids if n!=k]);local[other]=0;cell=Image.fromarray(local)
  scale=400/(im.width/2)
  size=(round(cell.width*scale),round(cell.height*scale))
  assert max(size)<=490,(filename,size)
  f=Image.new('RGBA',(512,512));f.alpha_composite(cell.resize(size,Image.Resampling.LANCZOS),((512-size[0])//2,(512-size[1])//2))
  i=len(frames)+1;f.save(OUT/f'{i:02}.png');frames.append(f)
  records.append({'frame':i,'source':filename,'crop':[x0,y0,x1,y1],'bbox':f.getbbox(),'sourceEdgeContact':x0==0 or y0==0 or x1==im.width or y1==im.height,'sha256':hashlib.sha256(f.tobytes()).hexdigest()})
assert len(frames)==20 and len({r['sha256'] for r in records})==20
atlas=Image.new('RGBA',(512*5,512*4));contact=Image.new('RGB',atlas.size,'#303743')
for i,f in enumerate(frames):
 xy=(i%5*512,i//5*512);atlas.alpha_composite(f,xy);contact.paste(f,xy,f);ImageDraw.Draw(contact).text((xy[0]+12,xy[1]+12),str(i+1),fill='white')
atlas.save(OUT/'atlas.png');contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'CANDIDATE','frames':records,'cell':[512,512],'atlas':[2560,2048],'count':20,'uniquePixelHashes':20,'limits':['Source-edge contacts flagged per frame','Weapon proportions and shot seam need visual approval','Not yet integrated with actual 3D stage camera']},indent=2))
print('PASS twenty unique nonempty RGBA poses, no duplicate filler')
