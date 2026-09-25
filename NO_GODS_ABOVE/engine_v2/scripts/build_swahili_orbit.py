from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage
import json,hashlib
base=Path(__file__).resolve().parents[3]/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
out=base/'orbit-six';out.mkdir(exist_ok=True)
a=np.array(Image.open(base/'orbit-six-source.png').convert('RGBA'));rgb=a[:,:,:3].astype(float)
key=(rgb[:,:,0]>140)&(rgb[:,:,2]>140)&(rgb[:,:,1]<110)&(np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]>75);a[key,3]=0
labels,n=ndimage.label(a[:,:,3]>32);areas=np.bincount(labels.ravel());areas[0]=0;ids=np.argsort(areas)[-6:];boxes=ndimage.find_objects(labels)
ids=sorted(ids,key=lambda k:(int((boxes[k-1][0].start+boxes[k-1][0].stop)/2>=512),boxes[k-1][1].start))
contact=Image.new('RGB',(1536,1024),'#24242e');records=[]
for i,k in enumerate(ids):
 ys,xs=boxes[k-1];part=a[ys,xs].copy();part[labels[ys,xs]!=k,3]=0;im=Image.fromarray(part);size=(round(im.width*.86),round(im.height*.86));assert max(size)<500
 frame=Image.new('RGBA',(512,512));frame.alpha_composite(im.resize(size,Image.Resampling.LANCZOS),((512-size[0])//2,(512-size[1])//2));frame.save(out/f'{i+1:02}.png')
 xy=(i%3*512,i//3*512);contact.paste(frame,xy,frame);ImageDraw.Draw(contact).text((xy[0]+10,xy[1]+10),str(i+1),fill='white');records.append({'frame':i+1,'bbox':frame.getbbox(),'hash':hashlib.sha256(frame.tobytes()).hexdigest()})
contact.save(out/'contact.jpg');assert len({r['hash'] for r in records})==6
(out/'manifest.json').write_text(json.dumps({'status':'REFERENCE_ONLY','count':6,'cell':[512,512],'scale':.86,'frames':records,'notes':['New drawn camera angles, not runtime 3D camera','Grip and blade scale remain human review items']},indent=2))
print('Six distinct alpha frames packaged')
