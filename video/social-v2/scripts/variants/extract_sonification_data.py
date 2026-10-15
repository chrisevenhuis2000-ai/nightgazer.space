"""Reads the data that variant 3 ("Het instrument antwoordt") turns into sound, and stores it in
sonificatie-data.json next to this file (committed, so synthesis needs neither the textures nor a render).

    python3 scripts/variants/extract_sonification_data.py      # needs assets/tex/ and out/hf-render.mp4

Three data sets, each straight from the picture:
  city       NASA Black Marble 2016 (assets/tex/bm-europe.jpg): a west→east scan along Utrecht's
             latitude (52.09° N, band ±0.3°), 5° W → 11.2° E. Per 0.02°: mean and peak radiance (0..1)
             and where in the band the brightest pixel sits (north/south → pan).
  terminator The rendered film (out/hf-render.mp4), frames 48–150: the lit fraction of the frame
             (luma > 0.25) — how far the terminator has swept across the planet.
  m74        The rendered film, frames 126–216 (the dolly into ESA/Webb M74): per frame the galaxy core
             position and a fixed ring of 48 points around it (same angles and radii every frame) with
             luma, blue–red balance and x. The ring does not move relative to the core, so what changes
             under it is the camera's push-in alone: the dolly is the playhead.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).parent
FPS, W, H = 30, 270, 480     # analysis size of the film frames (1/4 of 1080 × 1920)


def city_scan():
    Image.MAX_IMAGE_PIXELS = None
    im = np.asarray(Image.open("assets/tex/bm-europe.jpg").convert("L"), dtype=np.float64) / 255.0
    h, w = im.shape
    ppd_x, ppd_y = w / 75.0, h / 45.0                      # patch: lon −30..45, lat 30..75 (equirectangular)
    lat = 52.09
    y0, y1 = int((75 - lat - 0.3) * ppd_y), int((75 - lat + 0.3) * ppd_y)
    band = im[y0:y1]
    lons = np.round(np.arange(-5.0, 11.2001, 0.02), 2)
    mean, peak, north = [], [], []
    for lon in lons:
        x = int((lon + 30) * ppd_x)
        cell = band[:, max(0, x - 2): x + 3]
        mean.append(round(float(cell.mean()), 4))
        peak.append(round(float(cell.max()), 4))
        row = int(np.argmax(cell.max(axis=1)))
        north.append(round(1 - 2 * row / max(1, cell.shape[0] - 1), 3))   # +1 = north edge of the band
    return {"lat": lat, "lon": lons.tolist(), "mean": mean, "peak": peak, "north": north}


def film_frames():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "out/hf-render.mp4", "-vf", f"scale={W}:{H}",
                          "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float64) / 255.0


def luma(f):
    return 0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2]


def terminator(frames):
    return {"frames": list(range(48, 151)),
            "lit": [round(float((luma(frames[i]) > 0.25).mean()), 4) for i in range(48, 151)]}


def m74(frames):
    """A FIXED ring of 48 points (angle, radius) around the core: the same geometry in every frame, so
    what passes under the points changes only because the camera dollies (the dolly is the playhead)."""
    from scipy.ndimage import gaussian_filter
    angles = np.arange(48) * 2 * np.pi / 48
    radii = 0.08 + 0.30 * ((np.arange(48) * 7) % 48) / 47          # spread over 0.08–0.38 W, interleaved
    out = []
    for i in range(126, 217):
        y = luma(frames[i])
        top = gaussian_filter(y[: int(H * 0.6)], 12)               # the core lies in the upper part of the frame
        cy, cx = np.unravel_index(int(np.argmax(top)), top.shape)
        pts = []
        for k, (a, r) in enumerate(zip(angles, radii * W)):
            px, py = int(cx + r * np.cos(a)), int(cy + r * np.sin(a))
            if not (0 <= px < W and 0 <= py < int(H * 0.6)):        # outside, or over the readout/credit: silent
                pts.append(None)
                continue
            c = frames[i, py, px]
            pts.append([round(float(y[py, px]), 3), round(float(c[2] - c[0]), 3), round(px / W, 3),
                        round(r / W, 3)])
        out.append({"frame": i, "core": [round(cx / W, 3), round(cy / H, 3)], "pts": pts})
    return out


if __name__ == "__main__":
    frames = film_frames()
    data = {"city": city_scan(), "terminator": terminator(frames), "m74": m74(frames)}
    (HERE / "sonificatie-data.json").write_text(json.dumps(data, separators=(",", ":")))
    print("wrote", HERE / "sonificatie-data.json")
