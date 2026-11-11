"""Builds the render textures in assets/tex/ from the originals in assets/src/.

Run from video/social-v2/ after scripts/fetch-sources.sh:
    python3 scripts/prep-textures.py

Only resampling, cropping and layer separation happen here; no pixels are
invented. Colour grading is done in the composition, not baked in.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops

Image.MAX_IMAGE_PIXELS = None
SRC, OUT = Path("assets/src"), Path("assets/tex")
OUT.mkdir(parents=True, exist_ok=True)
MAX = 8192  # MAX_TEXTURE_SIZE of the render GPU


def black_marble():
    # Global night lights, 13500 x 6750 (3 km) -> 8192 x 4096.
    g = Image.open(SRC / "BlackMarble_2016_3km.jpg").convert("RGB")
    g.resize((MAX, MAX // 2), Image.LANCZOS).save(OUT / "bm-global.jpg", quality=92)

    # Europe patch from the 500 m tiles: lon -30..45, lat 30..75.
    # Tile B1 covers lon -90..0, lat 0..90; C1 covers lon 0..90, lat 0..90 (21600 px each, 240 px/deg).
    # Decoding at half scale (draft) gives 120 px/deg.
    ppd = 120
    lon0, lon1, lat0, lat1 = -30, 45, 30, 75
    patch = Image.new("RGB", ((lon1 - lon0) * ppd, (lat1 - lat0) * ppd))
    for name, tile_lon0 in (("BlackMarble_2016_B1.jpg", -90), ("BlackMarble_2016_C1.jpg", 0)):
        t = Image.open(SRC / name)
        t.draft("RGB", (10800, 10800))
        t = t.convert("RGB")
        s = t.width / 90.0  # px per degree after draft
        a = max(lon0, tile_lon0)
        b = min(lon1, tile_lon0 + 90)
        box = (round((a - tile_lon0) * s), round((90 - lat1) * s), round((b - tile_lon0) * s), round((90 - lat0) * s))
        piece = t.crop(box).resize((round((b - a) * ppd), (lat1 - lat0) * ppd), Image.LANCZOS)
        patch.paste(piece, (round((a - lon0) * ppd), 0))
    w = MAX
    h = round(patch.height * MAX / patch.width)
    patch.resize((w, h), Image.LANCZOS).save(OUT / "bm-europe.jpg", quality=92)
    print("bm-europe", (w, h), "bounds lon", (lon0, lon1), "lat", (lat0, lat1))


def phantom_layers():
    # The whole frame (5047 x 3136), so the galaxy can be seen as an object before the push-in.
    im = Image.open(SRC / "potm2208b.jpg").convert("RGB")
    w, h = im.size

    # Stars / compact knots: what a median filter removes.
    med = im.filter(ImageFilter.MedianFilter(9))
    hp = ImageChops.subtract(im, med)
    mask = hp.convert("L").point(lambda v: 0 if v < 18 else min(255, (v - 18) * 4))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    stars = im.copy()
    stars.putalpha(mask)
    stars.save(OUT / "m74-stars.png")

    # Mid layer: the structure with the compact sources taken out. Back layer: the diffuse disc light.
    med.save(OUT / "m74-mid.jpg", quality=92)
    im.filter(ImageFilter.GaussianBlur(48)).save(OUT / "m74-back.jpg", quality=92)

    # Feather mask: the image edges fade to black, so the frame never shows as a rectangle.
    fw, fh = 1024, round(1024 * h / w)
    feather = Image.new("L", (fw, fh))
    px = feather.load()
    # Elliptical, so the galaxy floats as an object instead of reading as a soft-edged rectangle.
    for y in range(fh):
        for x in range(fw):
            r = (((x + 0.5) / fw - 0.5) / 0.5) ** 2 + (((y + 0.5) / fh - 0.5) / 0.5) ** 2
            e = max(0.0, min(1.0, (1.0 - r ** 0.5) / 0.42))
            px[x, y] = round(255 * e * e * (3 - 2 * e))
    feather.save(OUT / "m74-feather.png")
    print("m74 layers", (w, h))


if __name__ == "__main__":
    black_marble()
    phantom_layers()
