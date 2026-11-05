"""Short explainer video for each country-course lesson ("Vivir en España", "Vivir en
Colombia"…), in each explanation language.

Reads src/data/courses/<country>/lecciones/*.json (bilingual) and writes
public/videos/<country>/<id>-<lang>.mp4 and .jpg (poster): Britjoy (official avatar,
never redrawn) presents the title and then the key steps (`steps` in the source),
one by one, with the Voz Unida Mundo close. 640x360, 24 fps, silent (the lesson
reads the explanation aloud).

    python3 scripts/espana_videos.py [--country colombia] --font /path/Nunito-Black.ttf --font-regular /path/Nunito.ttf
"""
import argparse, glob, json, os, subprocess, tempfile, math
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--font', required=True)
ap.add_argument('--font-regular', required=True)
ap.add_argument('--only', default='')
ap.add_argument('--langs', default='es,en', help='explanation languages to render, e.g. es')
ap.add_argument('--country', default='espana', choices=['espana', 'colombia', 'consulados', 'migrar-uk', 'ciudades/uk', 'ciudades/es', 'ciudades/co'])
args = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS = 640, 360, 24
NAVY, CREAM, RED, GOLD, WHITE = (29, 45, 92), (251, 246, 236), (179, 38, 30), (201, 162, 39), (255, 255, 255)
lion = Image.open(os.path.join(ROOT, 'src/assets/britjoy-avatar.webp')).convert('RGBA')
B = lambda s: ImageFont.truetype(args.font, s)
R = lambda s: ImageFont.truetype(args.font_regular, s)

def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def ease(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

def frame(src, lang, t, total, steps, n):
    im = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 54], fill=NAVY)
    d.rectangle([0, 54, W, 58], fill=RED)
    label = {'espana': ('Vivir en España', 'Living in Spain'), 'colombia': ('Vivir en Colombia', 'Living in Colombia'), 'consulados': ('Tu consulado en Londres', 'Your consulate in London'), 'migrar-uk': ('Inmigración y empresa en UK', 'Immigration and business in the UK'), 'ciudades/uk': ('Tu ciudad · Reino Unido', 'Your city · UK'), 'ciudades/es': ('Tu ciudad · España', 'Your city · Spain'), 'ciudades/co': ('Tu ciudad · Colombia', 'Your city · Colombia')}[args.country][0 if lang == 'es' else 1]
    d.text((18, 14), f"{src['icon']}  {label} · {n}", font=B(22), fill=WHITE)
    # Britjoy: gentle bob, never redrawn
    size = 190
    l = lion.copy(); l.thumbnail((size * 1.15, size), Image.LANCZOS)
    bob = int(3 * math.sin(t * 2.2))
    im.paste(l, (W - l.width - 8, H - l.height + 6 + bob), l)
    intro, end = 2.6, 2.4
    title = src['title'][lang]
    if t < intro:
        k = ease(t / 0.6)
        y = int(120 - 20 * (1 - k))
        for i, line in enumerate(wrap(d, title, B(34), 400)):
            d.text((24, y + i * 42), line, font=B(34), fill=NAVY)
        d.text((24, 270), 'Voz Unida Mundo Academy', font=R(18), fill=(99, 99, 99))
    elif t < total - end:
        per = (total - intro - end) / len(steps)
        idx = min(len(steps) - 1, int((t - intro) / per))
        d.text((24, 76), title, font=B(20), fill=NAVY)
        for i in range(idx + 1):
            k = ease((t - intro - i * per) / 0.5)
            y = 112 + i * 76
            x = int(24 - 30 * (1 - k))
            d.ellipse([x, y, x + 36, y + 36], fill=RED)
            d.text((x + 12 if i < 9 else x + 6, y + 3), str(i + 1), font=B(24), fill=WHITE)
            for j, line in enumerate(wrap(d, steps[i][lang], R(19), 360)[:3]):
                d.text((x + 48, y + 2 + j * 23), line, font=B(19) if j == 0 else R(19), fill=(40, 40, 40))
    else:
        d.text((24, 120), 'Voz Unida Mundo Academy · te enseña', font=B(24), fill=NAVY)
        d.text((24, 160), 'Tu voz cuenta', font=B(30), fill=RED)
    return im

VIDEO_DIR = args.country.replace('/', '-')  # e.g. ciudades/uk -> public/videos/ciudades-uk
os.makedirs(os.path.join(ROOT, f'public/videos/{VIDEO_DIR}'), exist_ok=True)
srcs = sorted((json.load(open(f)) for f in glob.glob(os.path.join(ROOT, f'src/data/courses/{args.country}/lecciones/*.json'))), key=lambda s: s['order'])
for n, src in enumerate(srcs, 1):
    if args.only and src['id'] != args.only: continue
    for lang in args.langs.split(','):
        steps = src['steps']
        total = 2.6 + 2.4 + 2.6 * len(steps)
        out = os.path.join(ROOT, f"public/videos/{VIDEO_DIR}/{src['id']}-{lang}")
        with tempfile.TemporaryDirectory() as tmp:
            for i in range(int(total * FPS)):
                frame(src, lang, i / FPS, total, steps, f'{n}/{len(srcs)}').save(f'{tmp}/f{i:04d}.png')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{tmp}/f%04d.png',
                            '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-movflags', '+faststart',
                            out + '.mp4'], check=True)
            frame(src, lang, 2.6 + 2.6 * len(steps) - 0.1, total, steps, f'{n}/{len(srcs)}').save(out + '.jpg', quality=82)
        print('video', out, os.path.getsize(out + '.mp4') // 1024, 'KB')
