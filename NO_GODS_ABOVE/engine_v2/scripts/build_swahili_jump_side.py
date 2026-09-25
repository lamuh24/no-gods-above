"""Candidate-only existing-art cleanup and slicing; no generated replacement pixels."""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
BASE=Path(__file__).resolve().parents[3]/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
allframes=[]
for name,source,bands in [('jump-side','jump-side-source.png',[0,318,625,935,1215,1536]),('side-slash','side-slash-chroma-source.png',[0,310,610,900,1190,1536])]:
 out=BASE/name;out.mkdir(exist_ok=True)
 sheet=Image.open(BASE/source).convert('RGBA');records=[]
 for row in range(5):
  for col in range(2):
   i=row*2+col;crop=sheet.crop((col*512,bands[row],(col+1)*512,bands[row+1]))
   if True:
    a=np.array(crop);rgb=a[:,:,:3].astype(float);key=(rgb[:,:,0]>140)&(rgb[:,:,2]>140)&(rgb[:,:,1]<100)&(np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]>80)
    a[key,3]=0
    # Reject disconnected chroma speckles; preserve all substantial foreground islands.
    labels,n=ndimage.label(a[:,:,3]>32);areas=np.bincount(labels.ravel());areas[0]=0
    a[areas[labels]<150,3]=0;clean=Image.fromarray(a)
   box=clean.getbbox();assert box
   pose=clean.crop(box);size=(round(pose.width*.87),round(pose.height*.87));frame=Image.new('RGBA',(512,512))
   frame.alpha_composite(pose.resize(size,Image.Resampling.LANCZOS),((512-size[0])//2,(512-size[1])//2))
   frame.save(out/f'{i+1:02}.png');allframes.append(frame)
   records.append({'frame':i+1,'sourceBox':[col*512,bands[row],(col+1)*512,bands[row+1]],'foregroundBox':box,'sha256':hashlib.sha256(frame.tobytes()).hexdigest(),'alphaBounds':frame.getbbox()})
  print(name,'row',row+1,flush=True)
 (out/'manifest.json').write_text(json.dumps({'status':'REFERENCE_ONLY','frames':records,'count':10,'cell':[512,512],'scale':.87,'limits':['Generated grip and weapon continuity requires review','Body-centered preview registration, not runtime pivot','No gameplay integration']},indent=2))
contact=Image.new('RGB',(512*5,512*4),'#272733')
for i,f in enumerate(allframes):
 xy=(i%5*512,i//5*512);contact.paste(f,xy,f);ImageDraw.Draw(contact).text((xy[0]+10,xy[1]+10),f'{i+1}',fill='white')
contact.save(BASE/'jump-side-contact.jpg')
assert len({hashlib.sha256(f.tobytes()).hexdigest() for f in allframes})==20
print('20 distinct cleaned candidate frames')
