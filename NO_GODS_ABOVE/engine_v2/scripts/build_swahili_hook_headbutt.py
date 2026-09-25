"""Normalize the isolated six-pose hook/headbutt draft; preserve the source."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from build_swahili_new_specials import clean
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/special-neutral-medium-hook-headbutt-v2'
OUT=BASE/'runtime-v1';OUT.mkdir(exist_ok=True)
im=Image.open(BASE/'attacker-source-v1.png')
frames=[];report=[]
for i in range(6):
 x=i%3*512;y=i//3*512
 cell=clean(im.crop((x,y,x+512,y+512)));a=np.array(cell)
 dark=(a[:,:,:3].max(2)<150)&(a[:,:,3]>128);dark[:350]=False
 yy,xx=np.where(dark);fy=int(np.percentile(yy,99.8))+1
 fx=float(np.median(xx[yy>=fy-14]))
 # Constant body scale; do not fit each scythe bounding box independently.
 scale=1035/344
 canvas=Image.new('RGBA',(2560,2560))
 scaled=cell.resize((round(512*scale),round(512*scale)),Image.Resampling.LANCZOS)
 canvas.alpha_composite(scaled,(round(1024-fx*scale),round(2300-fy*scale)))
 bbox=canvas.getbbox();assert bbox and min(bbox[0],bbox[1],2560-bbox[2],2560-bbox[3])>8,(i,bbox)
 frame=canvas.resize((448,448),Image.Resampling.LANCZOS);frame.save(OUT/f'{i+1:02}.png');frames.append(frame)
 report.append({'frame':i+1,'sourceFoot':[fx,fy],'bbox':bbox})
atlas=Image.new('RGBA',(448*6,448));contact=Image.new('RGB',(448*3,448*2),'#26303e');d=ImageDraw.Draw(contact)
for i,f in enumerate(frames):
 atlas.alpha_composite(f,(i*448,0));contact.paste(f,(i%3*448,i//3*448),f);d.text((i%3*448+8,i//3*448+8),str(i+1),fill='white')
atlas.save(OUT/'atlas.png');contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'local_playtest_draft','cell':[448,448],'root':[1024,2300],'referenceCanvasWidth':2560,'frames':report,'knownLimits':['Six key poses; connectors and grip/weapon proportions remain rough. Not final animation.']},indent=2))
print('PASS six RGBA448 cells, common body scale/root, safe margins')
