#!/bin/bash
# meet.sh <id> [stap]: bouw de schets met de echte stemtijden, verberg alle tekst, snapshot rond elke grens (±8 frames)
# en paren (f, f+1) elke <stap> frames; reken doorloop en sprong uit zoals render:qa (qa/beweging.py).
set -e
id=$1; stap=${2:-6}; W=/home/user/werk/eval/$id
cd /home/user/nightgazer-social
if [ -z "$NOBOUW" ]; then
  timeout 1500 npm run -s vrij:schets -- /home/user/werk/concepten/concepten-lokaal.yaml $id --uit /home/user/werk/schets-echt >/dev/null 2>&1 || { echo "schets mislukte"; exit 1; }
fi
P=/home/user/werk/schets-echt/$id/project
rm -rf $W; mkdir -p $W; cp -r $P $W/project
sed -i 's|</head>|<style>#ru-labels,#ru-onder,#ru-eind{visibility:hidden!important}</style></head>|' $W/project/index.html
node -e '
const s=require("fs").readFileSync(process.argv[1],"utf8"); const w={}; new Function("window",s)(w);
const D=w.__NG.draaiboek; const tv=D.tekstvensters; const st=+process.argv[2];
const g=[...new Set(tv.flatMap(([a,b],i)=>i===tv.length-1?[a]:[a,b]))];
const eind = tv[tv.length-1][1];
const f=new Set(); g.forEach(x=>{f.add(x-8);f.add(x+8)});
for(let k=0;k<eind;k+=st){f.add(k);f.add(k+1)}
const fr=[...f].filter(x=>x>=0&&x<D.frames).sort((a,b)=>a-b);
require("fs").writeFileSync(process.argv[3], JSON.stringify({grenzen:g, frames:fr, fps:D.fps||30}));
' $P/assets/post.js $stap $W/plan.json
T=$(python3 -c "import json;d=json.load(open('$W/plan.json'));print(','.join(f'{f/d[\"fps\"]:.4f}' for f in d['frames']))")
npx --yes hyperframes@0.8.162 snapshot $W/project --at $T --no-end --describe false --no-browser-gpu -o $W/s >/dev/null 2>&1
python3 /home/user/werk/eval/meet.py $W
