"""Prepare finisher review cells; no gameplay integration."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'tools/nga-forge/production/characters/swahili/reviews/ultimate-paid-in-full-v1'
OUT=BASE/'finisher'; OUT.mkdir(exist_ok=True)
source=Image.open(BASE/'finisher-source-v2.png').convert('RGBA')
w,h=source.size; cw,ch=w//4,h//4
atlas=Image.new('RGBA',(448*16,448)); contact=Image.new('RGB',(1792,1792),'#242935'); records=[]
for i in range(16):
    x,y=i%4*cw,i//4*ch
    cell=source.crop((x,y,x+cw,y+ch))
    cell.save(OUT/f'source-{i+1:02}.png')
    f=Image.new('RGBA',(448,448))
    f.alpha_composite(cell.resize((400,400),Image.Resampling.LANCZOS),(24,24))
    assert f.getbbox() and f.getextrema()[3][0]==0
    f.save(OUT/f'{i+1:02}.png')
    atlas.alpha_composite(f,(i*448,0)); contact.paste(f,(i%4*448,i//4*448),f)
    ImageDraw.Draw(contact).text((i%4*448+10,i//4*448+8),str(i+1),fill='white')
    records.append({'frame':i+1,'bbox':f.getbbox(),'sourceEdgeContact':bool(cell.getbbox() and (cell.getbbox()[0]==0 or cell.getbbox()[1]==0 or cell.getbbox()[2]==cw or cell.getbbox()[3]==ch))})
atlas.save(OUT/'atlas.png'); contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps({'status':'REFERENCE_ONLY','cell':[448,448],'sourceSize':[w,h],'frames':records,'limits':['Weapon continuity and grips require human review','No arena integration']},indent=2))
print(json.dumps(records))
