"""Comparison video: the four soundtracks under the same picture, back to back, each announced by a
1 s card (number + name) in the brand style (Archivo, ground #0E1022, plate hairline).

    python3 scripts/compare-video.py      → out/varianten/vergelijking.mp4

Picture from out/hf-render.mp4, audio straight from each master WAV (one AAC encode, 320 kbps).
"""
import subprocess
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from sound import master_path  # noqa: E402

V = Path("out/varianten")
CARDS = V / "cards"
W, H = 1080, 1920
GROUND, INK, MUTED, HAIR = "#0E1022", "#EEF2FB", "#8A93AD", "#2A3050"

ENTRIES = [
    ("huidig",      "0", "Huidig",                     "Het plaatarchief laat de ruimte horen"),
    ("orgel",       "1", "Orgel van de kosmos",        "Groot, warm, filmisch"),
    ("puls",        "2", "Puls van het observatorium", "Ritmisch, 150 BPM, sonic logo"),
    ("sonificatie", "3", "Het instrument antwoordt",   "Sonificatie van de echte beelden"),
]


def ttf(woff2, name):
    out = CARDS / name
    if not out.exists():
        f = TTFont(woff2)
        f.flavor = None
        f.save(out)
    return str(out)


def wrap(draw, text, font, width):
    lines, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    return lines + [cur]


def card(num, title, sub, path):
    big = ImageFont.truetype(ttf("assets/fonts/archivo-latin-700-normal.woff2", "Archivo-700.ttf"), 360)
    head = ImageFont.truetype(ttf("assets/fonts/archivo-latin-600-normal.woff2", "Archivo-600.ttf"), 84)
    mono = ImageFont.truetype(ttf("assets/fonts/jetbrains-mono-latin-500-normal.woff2", "JBMono-500.ttf"), 30)
    im = Image.new("RGB", (W, H), GROUND)
    d = ImageDraw.Draw(im)
    # the plate: a hairline edge with corner ticks, square corners
    x0, y0, x1, y1 = 80, 250, W - 80, 1540
    d.rectangle([x0, y0, x1, y1], outline=HAIR, width=2)
    for cx, cy, sx, sy in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line([cx, cy, cx + 40 * sx, cy], fill=INK, width=2)
        d.line([cx, cy, cx, cy + 40 * sy], fill=INK, width=2)
    d.text((x0 + 56, y0 + 56), f"GELUIDSVARIANT {num} / 3", font=mono, fill=MUTED)
    d.text((x0 + 40, y0 + 150), num, font=big, fill=INK)
    y = y0 + 640
    for line in wrap(d, title, head, x1 - x0 - 112):
        d.text((x0 + 56, y), line, font=head, fill=INK)
        y += 100
    d.text((x0 + 56, y + 30), sub.upper(), font=mono, fill=MUTED)
    d.text((x0 + 56, y1 - 90), "NIGHTGAZER.SPACE · SOCIAL V2", font=mono, fill=MUTED)
    im.save(path)


def main():
    CARDS.mkdir(parents=True, exist_ok=True)
    args, filt = ["ffmpeg", "-v", "error", "-y"], []
    for i, (variant, num, title, sub) in enumerate(ENTRIES):
        png = CARDS / f"{num}-{variant}.png"
        card(num, title, sub, png)
        args += ["-loop", "1", "-framerate", "30", "-t", "1", "-i", str(png),
                 "-f", "lavfi", "-t", "1", "-i", "anullsrc=r=48000:cl=stereo",
                 "-i", "out/hf-render.mp4", "-i", str(master_path(variant))]
        b = 4 * i
        filt.append(f"[{b}:v]format=yuv420p,setsar=1[c{i}];[{b + 2}:v]format=yuv420p,setsar=1[v{i}];"
                    f"[{b + 3}:a]aformat=sample_rates=48000:channel_layouts=stereo[a{i}]")
    seq = "".join(f"[c{i}][{4 * i + 1}:a][v{i}][a{i}]" for i in range(len(ENTRIES)))
    filt.append(f"{seq}concat=n={2 * len(ENTRIES)}:v=1:a=1[v][a]")
    args += ["-filter_complex", ";".join(filt), "-map", "[v]", "-map", "[a]",
             "-c:v", "libx264", "-crf", "21", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30",
             "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", str(V / "vergelijking.mp4")]
    subprocess.run(args, check=True)
    print("wrote", V / "vergelijking.mp4")


if __name__ == "__main__":
    main()
