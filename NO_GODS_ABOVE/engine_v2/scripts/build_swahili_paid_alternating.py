"""Package the four-shot candidate without changing arena mappings."""
import json
import sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from build_swahili_new_specials import clean
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
repair='--arm-fix' in sys.argv
OUT=BASE/('alternating-heavy-arm-fix' if repair else 'alternating-heavy');OUT.mkdir(exist_ok=True)
im=Image.open(BASE/('alternating-heavy-arm-fix-source.png' if repair else 'alternating-heavy-source.png'))
assert im.size==(1536,1024),im.size
bands=[0,267,522,777,1024]
frames=[];records=[]
for i in range(16):
 col,row=i%4,i//4
 cell=clean(im.crop((col*384,max(0,bands[row]-14),(col+1)*384,min(1024,bands[row+1]+14))))
 pixels=np.array(cell)
 labels,_=ndimage.label(pixels[:,:,3]>0);areas=np.bincount(labels.ravel());areas[0]=0
 pixels[labels!=areas.argmax()]=0
 cell=Image.fromarray(pixels)
 bbox=cell.getbbox();assert bbox
 # One constant scale. Align soles, not coat/scythe extrema, vertically.
 a=np.array(cell);dark=(a[:,:,:3].max(2)<150)&(a[:,:,3]>128);dark[:int(cell.height*.75)]=False
 yy,xx=np.where(dark);foot=int(np.percentile(yy,99.8))+1
 scale=1.08
 scaled=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
 f=Image.new('RGBA',(448,448));f.alpha_composite(scaled,(16,round(414-foot*scale)))
 if repair and i+1 not in (3,10,14):
  f=Image.open(BASE/'alternating-heavy'/f'{i+1:02}.png').convert('RGBA')
 b=f.getbbox();assert b and min(b[0],b[1],448-b[2],448-b[3])>=8,(i,b)
 f.save(OUT/f'{i+1:02}.png');frames.append(f)
 records.append({'frame':i+1,'bbox':b,'soleSourceY':foot,'shotHand':['right','left','right','left'][row]})
atlas=Image.new('RGBA',(7168,448));contact=Image.new('RGB',(1792,1792),'#242935')
for i,f in enumerate(frames):
 atlas.alpha_composite(f,(448*i,0));contact.paste(f,(i%4*448,i//4*448),f)
 ImageDraw.Draw(contact).text((i%4*448+12,i//4*448+12),f'{i+1} / '+records[i]['shotHand'],fill='white')
atlas.save(OUT/'atlas.png');contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'REFERENCE_ONLY','frames':records,'cell':[448,448],'atlas':[7168,448],'scale':1.08,'shots':[3,6,10,14],'limits':['Sparse arm hand-off connectors','Face detail and scythe proportions need polish','No victim/VFX or arena integration']},indent=2))
print('PASS16 RGBA frames, padded bounds, fixed scale, sole alignment; candidate only; arm repair='+str(repair))
