#!/usr/bin/env python3
"""Render YUNNIAN's silent 22-second product-image film.

Run with Python 3 + Pillow and ffmpeg/ffprobe on PATH.
Existing product imagery only. No generated scene or synthetic performance claim.
"""
from pathlib import Path
import argparse, json, math, shutil, subprocess, hashlib
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/v7-media'
OUT = ROOT / 'public/videos'
W,H,FPS = 1280,720,24
DURATION = 22
# Each source frame is an authorized existing website image. Crop coordinates are
# normalized to its actual dimensions. The light movement animates still images;
# it is not represented as captured camera footage or a product test.
SCENES = [
 dict(id='brand', image='color-library.webp', duration=5.5,
      crop=[0.00,0.00,1.00,0.5625], zoom=[1.015,1.055], focus=[.52,.10,.48,.12],
      role='YUNNIAN branded color sample wall', source='https://www.ynfilm.com/'),
 dict(id='clear', image='clear-ppf-application.webp', duration=5.0,
      crop=[0.00,0.19,1.00,0.94], zoom=[1.025,1.075], focus=[.46,.48,.54,.55],
      role='Existing TPU paint-protection application photo',
      source='https://www.ynfilm.com/products/yunnian-premium-tpu-ppf-lubrizol-sm301-substrate'),
 dict(id='color', image='green-ppf.webp', duration=5.5,
      crop=[.675,.266,.982,.604], zoom=[1.015,1.045], focus=[.50,.47,.54,.53],
      role='Metallic Dark Green vehicle-panel detail cropped from existing product sheet',
      source='https://www.ynfilm.com/products/tpu-color-ppf-classic-oem-color-series'),
 dict(id='window', image='window-film.webp', duration=6.0,
      crop=[0.00,0.25,1.00,1.00], zoom=[1.015,1.06], focus=[.54,.50,.48,.53],
      role='Existing Chameleon Aurora window-film product image; no UV or heat claim',
      source='https://www.ynfilm.com/products/chameleon-aurora-series-window-film-dynamic-color-shift-high-heat-rejection'),
]

def ease(x):
    x=max(0,min(1,x));return x*x*(3-2*x)

def load_assets():
    assets=[]
    for s in SCENES:
        p=ROOT/'public/images'/s['image']; im=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
        sw,sh=im.size;s['source_dimensions']=[sw,sh]
        s['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
        l,t,r,b=s['crop']; im=im.crop((round(l*sw),round(t*sh),round(r*sw),round(b*sh)))
        assets.append(im)
    return assets

def scene_frame(s, im, progress):
    e=ease(progress);zoom=s['zoom'][0]+(s['zoom'][1]-s['zoom'][0])*e
    iw,ih=im.size
    scale=max(W/iw,H/ih)*zoom
    # Continuous floating source crop, one resample, unchanged proportions.
    cw,ch=W/scale,H/scale
    fx=s['focus'][0]+(s['focus'][2]-s['focus'][0])*e
    fy=s['focus'][1]+(s['focus'][3]-s['focus'][1])*e
    x=(iw-cw)*fx;y=(ih-ch)*fy
    return im.resize((W,H),Image.Resampling.LANCZOS,box=(x,y,x+cw,y+ch))

def frame_at(t, assets):
    start=0
    for index,s in enumerate(SCENES):
        duration=s['duration']
        if t<start+duration or index==len(SCENES)-1:
            local=t-start
            current=scene_frame(s,assets[index],local/duration)
            # The last ~0.8 seconds link the next material. A short periodic return
            # ends on the exact opening composition for a quiet homepage loop.
            fade=.8
            if local>duration-fade:
                ni=(index+1)%len(SCENES)
                incoming=scene_frame(SCENES[ni],assets[ni],0)
                current=Image.blend(current,incoming,ease((local-(duration-fade))/fade))
            return current
        start+=duration
    raise RuntimeError('frame outside authored sequence')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--preview-only',action='store_true');args=parser.parse_args()
    WORK.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    assets=load_assets()
    for label,t in [('brand',1.0),('clear',7.0),('color',12.0),('window',18.0),('transition',5.1)]:
        frame_at(t,assets).save(WORK/f'{label}-preview.webp',quality=92)
    frame_at(0,assets).save(OUT/'yunnian-introduction-poster.webp',quality=88,method=6)
    manifest=dict(title='YUNNIAN — Film in focus',style='Quiet editorial product imagery',
       width=W,height=H,fps=FPS,authored_duration_seconds=DURATION,audio='Intentionally silent; no audio stream',
       sources=SCENES,transition='0.8-second smooth image dissolves; periodic return to opening',
       source_scope='Existing YUNNIAN product images; not location footage and not a test demonstration',
       overlays='None; localized brand and product copy is supplied by the homepage HTML',
       render_command='python3 scripts/media/render-intro.py')
    (ROOT/'scripts/media/introduction-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    if args.preview_only:return
    output=OUT/'yunnian-introduction.mp4'
    cmd=[shutil.which('ffmpeg') or 'ffmpeg','-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pixel_format','rgb24',
         '-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an',
         '-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
         '-c:v','libx264','-preset','medium','-crf','22','-profile:v','high','-level','3.1',
         '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv',
         '-movflags','+faststart',str(output)]
    with (WORK/'render.log').open('wb') as log:
        process=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
        try:
            for f in range(DURATION*FPS):
                process.stdin.write(frame_at(f/FPS,assets).tobytes())
                if f%120==0:print(f'{f}/{DURATION*FPS} frames',flush=True)
        finally:process.stdin.close()
        code=process.wait()
        if code:raise RuntimeError(f'ffmpeg exited {code}; see work/v7-media/render.log')
    probe=subprocess.run([shutil.which('ffprobe') or 'ffprobe','-v','error','-show_streams','-show_format','-of','json',str(output)],capture_output=True,text=True,check=True)
    (WORK/'probe.json').write_text(probe.stdout)
    p=json.loads(probe.stdout);v=p['streams'][0]
    assert len(p['streams'])==1 and v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
    assert (v['width'],v['height'])==(W,H) and abs(float(p['format']['duration'])-DURATION)<1/FPS
    subprocess.run([shutil.which('ffmpeg') or 'ffmpeg','-v','error','-i',str(output),'-f','null','-'],check=True)
    print(json.dumps({'output':str(output),'bytes':output.stat().st_size,'seconds':p['format']['duration'],'frames':v.get('nb_frames')},indent=2))

if __name__=='__main__':main()
