"""Preserve source art; prepare the user-requested local Up-special playtest."""
import json, re, hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT/'tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1'
OUT = SRC/'runtime-v1'

def main():
    html = (SRC/'motion.html').read_text(encoding='utf-8')
    rects = [json.loads(x) for x in re.findall(r'crops:(\[\[.*?\]\])', html)]
    report = {'status':'local_playtest_candidate', 'cell':[448,448], 'referenceCanvas':[2048,2048],
              'root':[1024,1800], 'knownLimits':['Original weapon orientation and abrupt connectors remain flagged; not final animation approval.'], 'clips':{}}
    specs = [('special_up_medium','up-medium-source-v1.png',315,
              [162,530,888,1240,162,530,905,1250,160,535,905,1265],
              [353,353,353,353,741,735,730,735,1048,1058,1058,1060]),
             ('special_up_heavy','up-heavy-source-v2.png',345,
              [170,480,807,1100,205,505,803,1090,170,490,800,1100],
              [433,424,429,423,858,858,858,858,1236,1236,1240,1240])]
    for n,(key,source,body_h,roots_x,roots_y) in enumerate(specs):
        initial = re.search(r'clips\['+str(n)+r'\]\.polygons=(.*?);',html).group(1)
        polys=json.loads(re.sub(r'(\{|,)(\d+):',r'\1"\2":',initial))
        for index,points in re.findall(r'clips\['+str(n)+r'\]\.polygons\[(\d+)\]=(.*?);',html): polys[index]=json.loads(points)
        image=Image.open(SRC/source).convert('RGBA'); dest=OUT/key; dest.mkdir(parents=True,exist_ok=True)
        frames=[]; records=[]; scale=1035/body_h # approved idle head-to-feet reference height
        for i,(x,y,w,h) in enumerate(rects[n]):
            a=np.array(image.crop((x,y,x+w,y+h)))
            mask=Image.new('L',(w,h)); d=ImageDraw.Draw(mask)
            p=polys.get(str(i),[[x,y],[x+w,y],[x+w,y+h],[x,y+h]])
            d.polygon([(px-x,py-y) for px,py in p],fill=255)
            inside=np.array(mask)>0
            rgb=a[:,:,:3].astype(float)
            neutral=(rgb.max(2)-rgb.min(2)<22)&(rgb.min(2)>150)
            # Connected checkerboard only: preserve isolated white shirt/cuff details.
            allowed=neutral|~inside
            seed=np.zeros_like(allowed); seed[0]=allowed[0];seed[-1]=allowed[-1];seed[:,0]=allowed[:,0];seed[:,-1]=allowed[:,-1]
            bg=ndi.binary_propagation(seed,mask=allowed)
            labels,count=ndi.label(neutral & ~bg)
            areas=np.bincount(labels.ravel()); enclosed=(areas[labels]>110);enclosed[labels==0]=False
            a[:,:,3]=np.where(inside&~bg&~enclosed,255,0)
            if n==1 and i==7: a[max(0,855-y):,:max(0,1050-x),3]=0
            if n==1 and i==9: a[:,:max(0,358-x),3]=0
            # Remove tiny detached matte flecks, retain separate weapon/chain components.
            labels,count=ndi.label(a[:,:,3]>0); areas=np.bincount(labels.ravel())
            a[areas[labels]<6,3]=0
            edge=(a[:,:,3]>0)&ndi.binary_dilation(a[:,:,3]==0)
            pale=edge&(rgb.max(2)-rgb.min(2)<28)&(rgb.min(2)>145)
            a[pale,3]=0
            a[a[:,:,3]==0,:3]=0
            cell=Image.fromarray(a); big=Image.new('RGBA',(2048,2048))
            resized=cell.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
            big.alpha_composite(resized,(round(1024-(roots_x[i]-x)*scale),round(1800-(roots_y[i]-y)*scale)))
            bbox=big.getbbox(); assert bbox and min(bbox[0],bbox[1],2048-bbox[2],2048-bbox[3])>8,(key,i,bbox)
            frame=big.resize((448,448),Image.Resampling.LANCZOS)
            frame.save(dest/f'{i+1:02}.png');frames.append(frame)
            records.append({'frame':i+1,'sourceRect':[x,y,w,h],'bounds2048':bbox,'alphaZeroPixels':int((np.array(frame)[:,:,3]==0).sum())})
        atlas=Image.new('RGBA',(5376,448));contact=Image.new('RGB',(1344,1792),'#26303e');d=ImageDraw.Draw(contact)
        for i,frame in enumerate(frames):
            atlas.alpha_composite(frame,(448*i,0));cx=i%3*448;cy=i//3*448
            contact.paste(frame,(cx,cy),frame);d.text((cx+12,cy+12),str(i+1),fill='white')
        atlas.save(dest/'atlas.png');contact.save(dest/'contact.jpg')
        report['clips'][key]={'source':source,'sourceSHA256':hashlib.sha256((SRC/source).read_bytes()).hexdigest(),'frames':records,'scale':scale}
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2))
    print('Prepared 24 transparent 448px frames and two 5376x448 atlases; source art preserved.')

if __name__=='__main__':main()
