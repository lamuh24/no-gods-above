"""Read-only source measurements; writes a separate comparison artifact."""
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[3]
REV=ROOT/'tools/nga-forge/production/characters/swahili/reviews'
OUT=REV/'new-specials-runtime-v1'
REF=ROOT/'tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png'

def measure(file,ref_width):
    a=np.array(Image.open(file).convert('RGBA'))
    r,g,b,alpha=[a[:,:,i].astype(float) for i in range(4)]
    skin=(alpha>128)&(r>85)&(r>g*1.18)&(b>g*.64)&(b<g*1.13)&(r-b>20)
    lab,n=ndimage.label(ndimage.binary_closing(skin,iterations=1))
    areas=np.bincount(lab.ravel());areas[0]=0
    y,x=np.where(lab==areas.argmax())
    eig=np.linalg.eigvalsh(np.cov(np.stack([x,y])))
    k=ref_width/a.shape[1]
    return {'major':float(4*np.sqrt(eig[-1])*k),'minor':float(4*np.sqrt(eig[0])*k),
      'area':int(areas.max())*k*k,'headBounds':[int(x.min()),int(y.min()),int(x.max()),int(y.max())]}

def main():
    manifest=json.loads((OUT/'manifest.json').read_text())
    anchor=measure(REF,1536)
    print('idle',anchor)
    result={'reference':anchor,'clips':{}}
    inventory=json.loads(subprocess.check_output(['node',str(Path(__file__).with_name('swahili_scale_inventory.cjs'))],text=True))
    panel=Image.new('RGB',(7*340,430),'#26323b'); draw=ImageDraw.Draw(panel)
    after=Image.new('RGB',panel.size,'#26323b'); after_draw=ImageDraw.Draw(after)
    for i,(key,clip) in enumerate(manifest['clips'].items()):
        measurements=[measure(ROOT/f['file'],2048) for f in clip['frames']]
        ratios=[m['major']/anchor['major'] for m in measurements]
        ratio=float(np.median(ratios))
        result['clips'][key]={'headMajorRatioMedian':ratio,'range':[min(ratios),max(ratios)],'frames':measurements}
        correction=inventory['groups'][key]['geometry']['bodyScale']
        result['clips'][key]['runtimeBodyScale']=correction
        # First ready pose avoids a tie-adjusting hand joining the head skin mask.
        first=measurements[0]
        size_ratio=float(np.sqrt(first['major']*first['minor']/(anchor['major']*anchor['minor'])))
        result['clips'][key]['readyHeadSizeRatioBefore']=size_ratio
        result['clips'][key]['readyHeadSizeRatioAfter']=size_ratio*correction
        assert abs(size_ratio*correction-1)<.08, (key,'ready head calibration outside 8 percent')
        print(key,round(ratio,3), 'range',round(min(ratios),3),round(max(ratios),3))
        for j,(img,ref_w,root,x) in enumerate([(Image.open(REF).convert('RGBA'),1536,(773,1406),i*340+80),
           (Image.open(ROOT/clip['frames'][0]['file']).convert('RGBA'),2048,(1024,1800),i*340+245)]):
            scale=.22
            fixed_scale=scale*(correction if j else 1)
            fixed=img.resize((round(ref_w*fixed_scale),round(ref_w*fixed_scale)),Image.Resampling.LANCZOS)
            after.paste(fixed,(round(x-root[0]*fixed_scale),round(355-root[1]*fixed_scale)),fixed)
            img=img.resize((round(ref_w*scale),round(ref_w*scale)),Image.Resampling.LANCZOS)
            panel.paste(img,(round(x-root[0]*scale),round(355-root[1]*scale)),img)
        draw.text((i*340+10,385),key,fill='white')
        draw.text((i*340+10,405),f'idle / new; head x{ratio:.3f}',fill='white')
        after_draw.text((i*340+10,385),key,fill='white')
        after_draw.text((i*340+10,405),f'idle / corrected; head x{size_ratio*correction:.3f}',fill='white')
    panel.save(OUT/'size-before.jpg')
    after.save(OUT/'size-after.jpg')
    (OUT/'size-measurements.json').write_text(json.dumps(result,indent=2)+'\n')

if __name__=='__main__':main()
