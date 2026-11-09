#!/bin/bash
# kern.sh <id> <onthul-zin> <onthul-fractie> [uitmap]: key-stills (0, 0.5, 1.5, onthulling, slot) uit het schetsproject + strook
set -e
id=$1; zin=$2; f=$3; uit=${4:-/home/user/werk/kern}
proj=/home/user/werk/schets/$id/project
read t_onthul t_slot < <(node -e '
const s=require("fs").readFileSync(process.argv[1],"utf8"); const w={}; new Function("window",s)(w);
const R=w.__NG.draaiboek.regie; const [a,b]=R.lijnen[+process.argv[2]]; const t=a+(b-a)*(+process.argv[3]);
const last=R.lijnen[R.lijnen.length-1]; console.log(t.toFixed(3), ((last[0]+last[1])/2).toFixed(3));' $proj/assets/post.js $zin $f)
mkdir -p $uit/$id; rm -rf $uit/$id/s
cd /home/user/nightgazer-social
npx --yes hyperframes@0.8.162 snapshot $proj --at 0,0.5,1.5,$t_onthul,$t_slot --no-end --describe false --no-browser-gpu -o $uit/$id/s >/dev/null 2>&1
ls $uit/$id/s/frame-*.png | sort -V > $uit/$id/lijst
python3 - "$uit/$id" "$id" 0 0.5 1.5 $t_onthul $t_slot <<'EOF'
import sys, subprocess
from PIL import Image, ImageDraw, ImageFont
d, id, *ts = sys.argv[1:]
files = [l.strip() for l in open(d + "/lijst")]
namen = ["frame 0", "0,5 s", "1,5 s", "onthulling", "slot"]
W, H = 432, 768
im = Image.new("RGB", (W * 5 + 40, H + 70), (10, 12, 26))
dr = ImageDraw.Draw(im)
try: fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
except Exception: fnt = None
for i, f in enumerate(files[:5]):
    im.paste(Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS), (10 + i * (W + 5), 60))
    dr.text((14 + i * (W + 5), 16), f"{namen[i]} ({float(ts[i]):.1f} s)", fill=(230, 235, 250), font=fnt)
im.save(d + f"/{id}-kern.jpg", quality=88)
print(d + f"/{id}-kern.jpg")
EOF
