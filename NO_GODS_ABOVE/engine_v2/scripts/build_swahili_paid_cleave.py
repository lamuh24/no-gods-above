"""Normalize eight-pose cleave candidate, preserving rejected takes."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from build_swahili_new_specials import clean
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
OUT=BASE/'cleave'; OUT.mkdir(exist_ok=True)
source=Image.open(BASE/'cleave-source-v3.png').convert('RGBA')
w,h=source.size; cw,ch=w//2,h//4
atlas=Image.new('RGBA',(448*8,448)); contact=Image.new('RGB',(448*4,448*2),'#242935'); records=[]
scale=400/cw
for i in range(8):
    x,y=i%2*cw,i//2*ch
    cell=clean(source.crop((x,y,x+cw,y+ch)))
    a=np.array(cell); dark=(a[:,:,:3].max(2)<150)&(a[:,:,3]>128); dark[:int(ch*.7)]=False
    yy,xx=np.where(dark); foot=int(np.percentile(yy,99.8))+1
    f=Image.new('RGBA',(448,448)); f.alpha_composite(cell.resize((400,round(ch*scale)),Image.Resampling.LANCZOS),(24,round(414-foot*scale)))
    b=f.getbbox(); assert b and min(b[0],b[1],448-b[2],448-b[3])>=8,(i,b)
    assert f.getextrema()[3][0]==0
    f.save(OUT/f'{i+1:02}.png'); atlas.alpha_composite(f,(i*448,0)); contact.paste(f,(i%4*448,i//4*448),f)
    ImageDraw.Draw(contact).text((i%4*448+10,i//4*448+8),str(i+1),fill='white')
    records.append({'frame':i+1,'bbox':b,'soleSourceY':foot})
atlas.save(OUT/'atlas.png'); contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'REFERENCE_ONLY','cell':[448,448],'atlas':[3584,448],'scale':scale,'frames':records,'limits':['Overhead-to-downswing spacing still needs review','Holster/draw transition not joined','No arena integration or VFX']},indent=2))
print('PASS 8 padded RGBA frames with fixed scale and sole alignment')
