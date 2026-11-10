import sys, json, glob, re, importlib.util, numpy as np
from PIL import Image
W = sys.argv[1]
plan = json.load(open(W + "/plan.json"))
files = sorted(glob.glob(W + "/s/frame-*.png"), key=lambda p: [int(x) if x.isdigit() else x for x in re.split(r"(\d+)", p)])
assert len(files) == len(plan["frames"]), (len(files), len(plan["frames"]))
src = open("/home/user/nightgazer-social/templates/_gedeeld/qa/beweging.py").read()
i0 = src.index("def rel_lum"); i1 = src.index("vorige = None")
ns = {"np": np}; exec(src[i0:i1], ns)
exec("def correlatie(x, y):\n    return float(np.corrcoef(x, y)[0, 1]) if x.std() > 0 and y.std() > 0 else 0.0", ns)
ns["doorloopscore"].__globals__["correlatie"] = ns["correlatie"]
fr = {}
for f, p in zip(plan["frames"], files):
    rgb = np.asarray(Image.open(p).convert("RGB").resize((270, 480), Image.BOX)).astype(np.float64)
    fr[f] = (rgb @ np.array([0.299, 0.587, 0.114]), ns["rel_lum"](rgb))
vrij = np.ones((32, 18), bool)
uit = {"doorloop": [], "sprong": []}
for g in plan["grenzen"]:
    if g - 8 in fr and g + 8 in fr:
        s = ns["doorloopscore"](ns["klein"](np.sqrt(fr[g - 8][1]), 18, 32), ns["klein"](np.sqrt(fr[g + 8][1]), 18, 32), vrij)
        uit["doorloop"].append((g, round(s, 2)))
for f in plan["frames"]:
    if f + 1 in fr and f in fr:
        p, q = fr[f][0], fr[f + 1][0]
        v = 4 * max(ns["blokverschuiving"](p, q), 2 * ns["blokverschuiving"](ns["half"](p), ns["half"](q)), ns["lijnsprong"](p, q))
        uit["sprong"].append((f + 1, round(v, 1)))
zwak = [d for d in uit["doorloop"] if d[1] < 0.6]
snel = sorted(uit["sprong"], key=lambda x: -x[1])[:6]
print("doorloop:", " ".join(f"{g}:{s}" for g, s in uit["doorloop"]))
print("ZWAK (<0.6):", zwak)
print("snelste sprongen:", snel)
# Contrast-schatting: mediaan van de relatieve luminantie onder de ondertitel (y 1130-1215) en de haak/labels (y 330-560);
# witte letters halen 4,5:1 als de mediaan <= 0,18 is.
med = []
for f in plan["frames"]:
    lum = fr[f][1]
    med.append((f, round(float(np.median(lum[282:304, 27:218])), 3), round(float(np.median(lum[82:140, 40:230])), 3)))
print("ondergrond max (ondertitel):", sorted(med, key=lambda x: -x[1])[:4])
print("ondergrond max (boven):", sorted(med, key=lambda x: -x[2])[:4])
json.dump(uit, open(W + "/meting.json", "w"))
