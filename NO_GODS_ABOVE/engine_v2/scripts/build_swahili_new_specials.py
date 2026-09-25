"""User-authorized deterministic slicing/chroma cleanup; originals remain untouched."""
import json
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
REV = ROOT / 'tools/nga-forge/production/characters/swahili/reviews'
OUT = REV / 'new-specials-runtime-v1'
# Per-sheet measured bands, rather than assuming the generated grid is exact.
SPECS = {
 'special_up_light': ('special-up-light-ceiling-tax-alternating-v1/source-v3-face-polish-magenta.png', [0,280,550,824,1106], 242),
 'special_neutral_heavy': ('special-neutral-heavy-golden-injunction-v1/source-v1-magenta.png', [0,365,716,1106], 310),
 'special_back_light': ('special-back-light-fine-print-v1/source-v1-magenta.png', [0,373,715,1086], 320),
 'special_back_medium': ('special-back-medium-hidden-clause-v1/source-v1-magenta.png', [0,362,724,1086], 320),
 'special_back_heavy': ('special-back-heavy-default-judgment-v1/stance-source.png', [0,512,1024], 442),
 'special_back_heavy_response': ('special-back-heavy-default-judgment-v1/retaliation-draft.png', [0,362,724,1086], 305),
 'special_down_light': ('special-down-light-kneecap-notice-v1/source-v1-magenta.png', [0,512,1024], 418),
}

def clean(img):
    a = np.array(img.convert('RGBA'))
    r,g,b = [a[:,:,i].astype(float) for i in range(3)]
    matte = (r > g * 1.25 + 16) & (b > g * 1.25 + 16) & (b > 40)
    a[matte,3] = 0
    # Tiny isolated compression flecks, not largest-component body deletion.
    labels,n = ndimage.label(a[:,:,3] > 0)
    areas = np.bincount(labels.ravel())
    a[areas[labels] < 5,3] = 0
    edge = (a[:,:,3] > 0) & ndimage.binary_dilation(a[:,:,3] == 0, iterations=1)
    spill = edge & (b > g) & (r > g*1.1)
    a[:,:,2][spill] = np.minimum(b[spill], g[spill]).astype('uint8')
    a[a[:,:,3] == 0,:3] = 0
    return Image.fromarray(a)

def main():
    OUT.mkdir(exist_ok=True)
    report = {'status':'local_playtest_candidate','cell':[448,448], 'referenceCanvas':[2048,2048], 'root':[1024,1800], 'clips':{}}
    for key,(src,bands,body_h) in SPECS.items():
        img = Image.open(REV/src).convert('RGBA')
        dest = OUT/key
        dest.mkdir(exist_ok=True)
        scale = 1035/body_h
        frames=[]; records=[]
        for row in range(len(bands)-1):
            for col in range(4):
                i=row*4+col
                x0=round(col*img.width/4); x1=round((col+1)*img.width/4)
                y0=bands[row]; y1=bands[row+1]
                if key=='special_back_medium': x0+=2; x1-=2; y0+=2; y1-=2
                if key=='special_up_light' and i==5: x1+=8
                if key=='special_up_light' and i==11: y0=520
                if key=='special_back_heavy' and row==1:
                    if col>0: x0+=14
                    if col<3: x1+=14
                if key=='special_back_heavy_response':
                    if i==2: x1=1125
                    if i==3: x0=1125
                    if i==8: x1=382
                    if i==9: x0=382; x1=742
                    if i==10: x0=742
                cell=clean(img.crop((x0,y0,x1,y1)))
                arr=np.array(cell)
                if key=='special_up_light' and i==11:
                    arr[:550-y0,:1320-x0]=0 # previous row's feet, preserve raised shot
                if key=='special_up_light' and i==7:
                    arr[520-y0:,1320-x0:]=0 # next row's raised muzzle flash
                if key=='special_neutral_heavy' and col>0:
                    arr[:,:10]=0 # source seam sparks from neighboring cell
                if key=='special_back_light' and i>=7:
                    arr[290:,255:]=0 # detached ground seal is a world-layer asset below
                if key=='special_back_heavy_response' and i in [2,6,7]:
                    if row==1: arr[716-y0:,325:]=0
                    else: arr[355:,300:]=0
                cell=Image.fromarray(arr)
                # Anchor from dark/gold footwear in lower third, excluding gold seals.
                rgb=arr[:,:,:3].astype(float)
                dark=(rgb.max(axis=2)<155)&(arr[:,:,3]>128)
                dark[:int(cell.height*.65)]=False
                yy,xx=np.where(dark)
                if not len(xx): raise ValueError(key)
                foot_y=int(np.percentile(yy,99.8))+1
                foot_x=float(np.median(xx[yy>=foot_y-12]))
                resized=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
                canvas=Image.new('RGBA',(2048,2048))
                canvas.alpha_composite(resized,(round(1024-foot_x*scale),round(1800-foot_y*scale)))
                bbox=canvas.getbbox()
                if not bbox: raise ValueError('empty '+key)
                if min(bbox[0],bbox[1],2048-bbox[2],2048-bbox[3]) < 8:
                    raise ValueError('output edge clipping '+key+str(i))
                # Expanded transparent canvas protects long scythes without shrinking the body.
                small=canvas.resize((448,448),Image.Resampling.LANCZOS)
                file=dest/f'{i+1:02}.png'; small.save(file)
                frames.append(small)
                records.append({'frame':i+1,'sourceRect':[x0,y0,x1,y1], 'foot':[foot_x,foot_y], 'bounds1536':bbox,'file':str(file.relative_to(ROOT)).replace('\\','/')})
        atlas=Image.new('RGBA',(448*len(frames),448))
        contact=Image.new('RGB',(448*4,478*((len(frames)+3)//4)), '#25313b')
        draw=ImageDraw.Draw(contact)
        for i,frame in enumerate(frames):
            atlas.alpha_composite(frame,(448*i,0))
            x=(i%4)*448; y=(i//4)*478
            contact.paste(frame,(x,y),frame)
            draw.text((x+12,y+450),f'{key} / {i+1:02}',fill='white')
        atlas.save(dest/'atlas.png'); contact.save(dest/'contact.jpg')
        report['clips'][key]={'source':src,'sourceSha256':hashlib.sha256((REV/src).read_bytes()).hexdigest(),
            'frameCount':len(frames),'scale':scale,'frames':records}
        print(key,len(frames))
    seal=clean(Image.open(REV/SPECS['special_back_light'][0]).crop((1350,1028,1445,1068)))
    seal.save(OUT/'ground-seal.png')
    report['technicalValidation']={'realAlpha':True,'outputEdgeClipping':False,'uniformClipScale':True,'sourceFilesPreserved':True}
    report['knownArtLimits']=['Default Judgment response retains source scythe proportion variation and remount discontinuity, flagged by user.',
      'Golden Injunction and Kneecap muzzle effects reach their original source-cell boundary; no missing pixels invented.',
      'Not a final character identity or release approval. Debt stacks and wall splat remain unfinished.']
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__': main()
