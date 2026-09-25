"""Package existing Claim Check and headbutt art for local playtest."""
import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
from build_swahili_new_specials import clean
ROOT=Path(__file__).resolve().parents[3];REV=ROOT/'tools/nga-forge/production/characters/swahili/reviews'
OUT=REV/'neutral-light-medium-runtime-v1';OUT.mkdir(exist_ok=True)
specs=[('special_neutral_light','special-neutral-light-claim-check-motion-v4/source-v2-magenta.png',[0,385,745,1086],335,list(range(12))),('special_neutral_medium','special-neutral-heavy-writ-enforcement-motion-v4/source-v2-magenta.png',[0,512,1024],330,[0,1,2,4,5,6,7])]
report={'status':'local_playtest_candidate','cell':[448,448],'referenceCanvasWidth':2048,'root':{'x':1024,'y':1800},'clips':{},'knownLimits':['Existing source scythe proportions/connectors remain flagged. Medium omits separate shaft-strike pose to retain one headbutt contact.']}
for key,source,bands,bh,order in specs:
 im=Image.open(REV/source);dest=OUT/key;dest.mkdir(exist_ok=True);frames=[];scale=1035/bh
 for j,i in enumerate(order):
  row,col=divmod(i,4);x=round(col*im.width/4);xr=round((col+1)*im.width/4);y=bands[row];yr=bands[row+1]
  cell=clean(im.crop((x,y,xr,yr)));a=np.array(cell)
  if key=='special_neutral_light':
   # Gutter separates prior footwear from the next scythe crown.
   if row==0: a[max(0,381-y):,:,3]=0
   if row==1: a[max(0,741-y):,:,3]=0
   labels,count=ndimage.label(a[:,:,3]>0)
   sizes=np.bincount(labels.ravel());sizes[0]=0
   # Remove disconnected neighboring-row fragments, not character pixels.
   a[labels!=sizes.argmax(),3]=0
  dark=(a[:,:,:3].max(2)<150)&(a[:,:,3]>128);dark[:int(cell.height*.7)]=False
  yy,xx=np.where(dark);fy=int(np.percentile(yy,99.8))+1;fx=float(np.median(xx[yy>=fy-12]))
  cell=Image.fromarray(a);big=Image.new('RGBA',(2048,2048));scaled=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
  big.alpha_composite(scaled,(round(1024-fx*scale),round(1800-fy*scale)))
  bbox=big.getbbox();assert bbox and min(bbox[0],bbox[1],2048-bbox[2],2048-bbox[3])>5,(key,i,bbox)
  small=big.resize((448,448),Image.Resampling.LANCZOS);small.save(dest/f'{j+1:02}.png');frames.append(small)
 atlas=Image.new('RGBA',(448*len(frames),448));contact=Image.new('RGB',(1792,448*((len(frames)+3)//4)),'#26303e');d=ImageDraw.Draw(contact)
 for j,frame in enumerate(frames):
  atlas.alpha_composite(frame,(j*448,0));x=j%4*448;y=j//4*448;contact.paste(frame,(x,y),frame);d.text((x+10,y+10),str(j+1),fill='white')
 atlas.save(dest/'atlas.png');contact.save(dest/'contact.jpg');report['clips'][key]={'source':source,'sourceFrames':[i+1 for i in order],'frames':len(frames)}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2));print('PASS: 19 transparent448px frames; original sheets preserved.')
