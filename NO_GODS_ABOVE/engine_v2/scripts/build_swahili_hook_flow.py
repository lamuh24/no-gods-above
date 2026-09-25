"""Package12 isolated connector poses; previous six-pose assets remain untouched."""
import json
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
from build_swahili_new_specials import clean
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/special-neutral-medium-hook-headbutt-v2'
OUT=BASE/'runtime-flow-v2';OUT.mkdir(exist_ok=True)
im=Image.open(BASE/'attacker-flow-source-v2.png');frames=[];report=[]
for i in range(12):
 col,row=i%4,i//4;left=max(0,col*362-30);right=min(im.width,(col+1)*362+30)
 cell=clean(im.crop((left,row*362,right,(row+1)*362)));a=np.array(cell)
 labels,_=ndimage.label(a[:,:,3]>0);sizes=np.bincount(labels.ravel());sizes[0]=0
 # Character is the large connected component; remove neighboring-cell fragments.
 a[labels!=sizes.argmax(),3]=0
 dark=(a[:,:,:3].max(2)<150)&(a[:,:,3]>128);dark[:280]=False
 yy,xx=np.where(dark);fy=int(np.percentile(yy,99.8))+1
 low=xx[yy>=fy-38];fx=(float(low.min())+float(low.max()))/2
 scale=1035/256
 canvas=Image.new('RGBA',(2560,2560))
 cell=Image.fromarray(a);scaled=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
 canvas.alpha_composite(scaled,(round(1024-fx*scale),round(2300-fy*scale)))
 bbox=canvas.getbbox();assert bbox and min(bbox[0],bbox[1],2560-bbox[2],2560-bbox[3])>8,(i,bbox)
 f=canvas.resize((448,448),Image.Resampling.LANCZOS);f.save(OUT/f'{i+1:02}.png');frames.append(f)
 alpha=np.array(f)[:,:,3];assert (alpha==0).sum()>90000
 report.append({'frame':i+1,'bbox':bbox,'sourceFoot':[fx,fy],'alphaZeroPixels':int((alpha==0).sum())})
atlas=Image.new('RGBA',(5376,448));contact=Image.new('RGB',(1792,1344),'#26303e');d=ImageDraw.Draw(contact)
for i,f in enumerate(frames):
 atlas.alpha_composite(f,(448*i,0));contact.paste(f,(i%4*448,i//4*448),f);d.text((i%4*448+8,i//4*448+8),str(i+1),fill='white')
atlas.save(OUT/'atlas.png');contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'local_playtest_candidate','cell':[448,448],'referenceCanvasWidth':2560,'root':[1024,2300],'frameStarts':[0,4,7,11,14,18,22,26,30,32,38,45],'frames':report,'knownLimits':['Grip transition and blade proportions still need human polish review.']},indent=2))
print('PASS12 transparent448px frames, padded weapon bounds, fixed body scale, old assets preserved')
