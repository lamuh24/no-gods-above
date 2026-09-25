"""Resize already-transparent V10 cells without changing body or weapon artwork."""
import json, hashlib
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'tools/nga-forge/production/characters/swahili/reviews/special-air-medium-blade-only-v10'
OUT=SRC/'runtime-v1'
OUT.mkdir(exist_ok=True)
atlas=Image.new('RGBA',(5376,448));contact=Image.new('RGB',(1792,1344),'#26303e');draw=ImageDraw.Draw(contact)
report={'status':'local_playtest_candidate','alias':'special_air_medium','frameCount':12,'cell':[448,448],
        'referenceCanvasWidth':2048,'root':{'x':1024,'y':1800},'frameStarts':[0,3,6,9,10,13,16,19,20,24,29,34],
        'preserved':['original twelve body drawings','V10 blade-only corrections','Air Light','Air Heavy','air normals','combat'],
        'knownLimits':['Blade-root seams and source connector gaps remain marked for polish.'],'frames':[]}
for i in range(12):
    source=SRC/f'frame-{i+1:02}.png';im=Image.open(source)
    assert im.mode=='RGBA' and im.size==(672,672)
    assert im.getchannel('A').getextrema()==(0,255)
    frame=im.resize((448,448),Image.Resampling.LANCZOS);bbox=frame.getbbox()
    assert bbox and min(bbox[0],bbox[1],448-bbox[2],448-bbox[3])>1,(i,bbox)
    frame.save(OUT/f'{i+1:02}.png');atlas.alpha_composite(frame,(448*i,0))
    x=i%4*448;y=i//4*448;contact.paste(frame,(x,y),frame);draw.text((x+10,y+10),str(i+1),fill='white')
    report['frames'].append({'frame':i+1,'source':source.name,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'bounds':bbox})
atlas.save(OUT/'atlas.png');contact.save(OUT/'contact.jpg')
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
print('PASS: twelve RGBA448 cells, real alpha, no output edge clipping, source files retained.')
