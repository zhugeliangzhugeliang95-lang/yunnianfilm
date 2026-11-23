#!/usr/bin/env python3
"""Prepare a user-supplied video for the YUNNIAN homepage without retiming it.

Requires Python 3 + Pillow and ffmpeg/ffprobe on PATH.
Example: python3 scripts/media/prepare-production-film.py --source /path/to/video.mp4
The original is read-only. Both MP4 outputs retain the original video bitstream;
the full film also retains its original AAC audio. The background version removes
the audio stream rather than substituting a silent track.
"""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'public/videos'
WORK = ROOT / 'work/v7-media/production'
FFMPEG = shutil.which('ffmpeg') or 'ffmpeg'
FFPROBE = shutil.which('ffprobe') or 'ffprobe'

def run(args):
    return subprocess.run(args, check=True, capture_output=True)

def probe(path):
    return json.loads(run([FFPROBE,'-v','error','-show_streams','-show_format','-of','json',str(path)]).stdout)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def decoded_hash(path, stream):
    return run([FFMPEG,'-v','error','-i',str(path),'-map',stream,'-f','hash','-hash','sha256','pipe:1']).stdout.decode().strip()

def atoms(path):
    result=[]
    with path.open('rb') as f:
        size=path.stat().st_size
        while f.tell()<size:
            start=f.tell(); header=f.read(8)
            if len(header)<8:break
            length=int.from_bytes(header[:4],'big'); kind=header[4:8].decode('ascii','replace')
            if length==1:length=int.from_bytes(f.read(8),'big')
            elif length==0:length=size-start
            if length<8:raise ValueError('Invalid MP4 box')
            result.append({'type':kind,'offset':start,'bytes':length})
            f.seek(start+length)
    return result

def summary(path,p):
    video=next(s for s in p['streams'] if s['codec_type']=='video')
    audio=[s for s in p['streams'] if s['codec_type']=='audio']
    boxes=atoms(path); names=[b['type'] for b in boxes]
    return {'path':str(path.relative_to(ROOT)), 'size_bytes':path.stat().st_size,
            'duration_seconds':float(p['format']['duration']),
            'video_duration_seconds':float(video['duration']),
            'width':video['width'],'height':video['height'],
            'fps':video['avg_frame_rate'],'video_codec':video['codec_name'],
            'pixel_format':video['pix_fmt'],'video_frames':int(video['nb_frames']),
            'audio_streams':len(audio),'audio_codec':audio[0]['codec_name'] if audio else None,
            'audio_sample_rate':int(audio[0]['sample_rate']) if audio else None,
            'audio_channels':audio[0]['channels'] if audio else 0,
            'audio_duration_seconds':float(audio[0]['duration']) if audio else None,
            'faststart':names.index('moov')<names.index('mdat')}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--poster-time',type=float,default=2.0)
    args=ap.parse_args();source=args.source.resolve()
    if not source.is_file():raise FileNotFoundError(source)
    DEST.mkdir(parents=True,exist_ok=True);WORK.mkdir(parents=True,exist_ok=True)
    original_sha=sha(source);p=probe(source)
    v=next(s for s in p['streams'] if s['codec_type']=='video')
    a=next(s for s in p['streams'] if s['codec_type']=='audio')
    assert v['codec_name']=='h264' and a['codec_name']=='aac', 'Expected the supplied H.264/AAC MP4'
    full=DEST/'yunnian-production-film.mp4';loop=DEST/'yunnian-production-loop.mp4'
    assert source not in [full,loop]
    common=[FFMPEG,'-nostdin','-y','-v','error','-i',str(source)]
    run(common+['-map','0:v:0','-map','0:a:0','-c','copy','-map_metadata','-1','-movflags','+faststart',str(full)])
    run(common+['-map','0:v:0','-an','-c:v','copy','-map_metadata','-1','-movflags','+faststart',str(loop)])
    # Extract the equipment shot at 2.0 s. The earlier 1.5 and 1.8 s frames show a building.
    raw=run([FFMPEG,'-v','error','-ss',str(args.poster_time),'-i',str(source),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']).stdout
    poster=DEST/'yunnian-production-poster.webp'
    Image.frombytes('RGB',(v['width'],v['height']),raw).save(poster,format='WEBP',quality=92,method=6)
    outputs=[]
    for path in [full,loop]:
        result=probe(path); outputs.append(summary(path,result))
        run([FFMPEG,'-v','error','-i',str(path),'-f','null','-'])
        assert outputs[-1]['faststart'] and outputs[-1]['video_frames']==int(v['nb_frames'])
        assert outputs[-1]['width']==v['width'] and outputs[-1]['height']==v['height']
    video_hash=decoded_hash(source,'0:v:0');audio_hash=decoded_hash(source,'0:a:0')
    assert decoded_hash(full,'0:v:0')==video_hash
    assert decoded_hash(loop,'0:v:0')==video_hash
    assert decoded_hash(full,'0:a:0')==audio_hash
    assert sha(source)==original_sha,'The original file must not be modified'
    manifest={
      'title':'YUNNIAN user-supplied presentation video',
      'source':{'original_filename':source.name,'sha256':original_sha,'source_type':'Video supplied by the user for their website',
                'duration_seconds':float(p['format']['duration']),'unchanged':True},
      'provenance_note':'The user supplied this recording. Its use does not independently establish factory ownership, production capacity, certifications or performance.',
      'editing':{'full_film':'Lossless stream copy of complete original video and original audio, with fast-start MP4 metadata',
                 'background':'Complete original video bitstream, no audio stream, fast-start MP4; no speed change, trim, crop, color change or synthetic scene',
                 'loop_note':'Prepared for repeated homepage playback. The original end-to-start edit is retained; no claim of a seamless visual loop.'},
      'outputs':outputs,
      'poster':{'path':str(poster.relative_to(ROOT)),'source_time_seconds':args.poster_time,'width':v['width'],'height':v['height'],'format':'WebP','size_bytes':poster.stat().st_size,'description':'Equipment scene extracted from the supplied recording'},
      'validation':{'full_decode':'Both MP4 files passed complete decode without errors','decoded_video_sha256_equal_to_source':True,
                    'full_film_decoded_audio_sha256_equal_to_source':True,'original_sha256_unchanged':True,
                    'poster_review':'Inspected 1.5, 1.8 and 2.0 s source frames; 2.0 s selected for the equipment view',
                    'listening_review':'Not performed; audio preserved without modification. Decoding and hashes are technical checks, not listening approval.',
                    'continuous_playback_review':'Not performed by this resource-preparation task; final homepage playback remains the integration check.'},
      'reproduce':'python3 scripts/media/prepare-production-film.py --source /path/to/the/supplied-video.mp4'
    }
    (ROOT/'scripts/media/production-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (WORK/'source-probe.json').write_text(json.dumps(p,indent=2)+'\n')
    for path in [full,loop]:(WORK/(path.stem+'-probe.json')).write_text(json.dumps(probe(path),indent=2)+'\n')
    print(json.dumps({'outputs':outputs,'poster':manifest['poster'],'validation':manifest['validation']},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
