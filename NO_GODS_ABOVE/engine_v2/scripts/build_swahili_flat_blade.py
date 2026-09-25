from pathlib import Path
import shutil,json,hashlib
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage
base=Path(__file__).resolve().parents[3]/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
out=base/'orbit-flat';out.mkdir(exist_ok=True)
for i in range(1,4):shutil.copy2(base/'orbit-six'/f'{i:02}.png',out/f'{i:02}.png')
specs=[('orbit-flat-source.png',(0,512,450,1024),.86),('flat-contacts-source.png',(0,0,1024,750),.50),('flat-contacts-source.png',(0,750,1024,1536),.50)]
for i,(src,box,scale) in enumerate(specs,4):
 a=np.array(Image.open(base/src).convert('RGBA').crop(box));rgb=a[:,:,:3].astype(float);key=(rgb[:,:,0]>140)&(rgb[:,:,2]>140)&(rgb[:,:,1]<110)&(np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]>75);a[key,3]=0
 labels,n=ndimage.label(a[:,:,3]>32);areas=np.bincount(labels.ravel());areas[0]=0;k=areas.argmax();a[labels!=k,3]=0;im=Image.fromarray(a);im=im.crop(im.getbbox());size=(round(im.width*scale),round(im.height*scale));assert max(size)<500
 f=Image.new('RGBA',(512,512));f.alpha_composite(im.resize(size,Image.Resampling.LANCZOS),((512-size[0])//2,(512-size[1])//2));f.save(out/f'{i:02}.png')
contact=Image.new('RGB',(1536,1024),'#24242e');records=[]
for i in range(6):
 f=Image.open(out/f'{i+1:02}.png');xy=(i%3*512,i//3*512);contact.paste(f,xy,f);ImageDraw.Draw(contact).text((xy[0]+10,xy[1]+10),str(i+1),fill='white');records.append({'frame':i+1,'bbox':f.getbbox(),'hash':hashlib.sha256(f.tobytes()).hexdigest()})
contact.save(out/'contact.jpg');(out/'manifest.json').write_text(json.dumps({'status':'CANDIDATE','frames':records,'preservedFrames':[1,2,3],'editedFrames':[4,5,6],'runtimeIntegrated':False},indent=2));print('Flat blade4-6 packaged, first3 preserved')
