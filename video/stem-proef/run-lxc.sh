#!/usr/bin/env bash
# Stemproef op de LXC (als claude-ops). Werkmap ~/werk/stem-proef, nooit /tmp. Alle GPU-werk in de render-slot.
#
#   bash run-lxc.sh opzet                 # zoekt de stijl-proef-werkmap (met out/<id>/vo.wav + tijden.json), kopieert hem
#   bash run-lxc.sh diagnose              # metingen van de huidige stem G (controle) → resultaat/diagnose/*.md|json
#   bash run-lxc.sh sweep                 # VoxCPM2: stappen × cfg × prompt op Maan → resultaat/sweep/*/log.json
#   bash run-lxc.sh chatterbox-installeer # Chatterbox Multilingual (MIT) in ~/werk/chatterbox/.venv
#   bash run-lxc.sh chatterbox-sweep      # cfg × exaggeration op Maan
#   bash run-lxc.sh variant <naam> <model> [maak.py-opties]   # op alle drie de reels → resultaat/<naam>/<id>/
#   bash run-lxc.sh film <naam>           # mix + render met dezelfde muziek en scène → resultaat/<naam>/<id>.mp4
#   bash run-lxc.sh controle              # de huidige, goedgekeurde mp4's → resultaat/controle/
set -euo pipefail
HIER=$(cd "$(dirname "$0")" && pwd)
SP=${SP:-$HOME/werk/stem-proef}
STIJL=$SP/stijl
RES=$SP/resultaat
SLOT=/opt/nightgazer-social/scripts/render-slot.sh
VPY=${VPY:-/opt/voicestudio/.venv-voxcpm/bin/python}
CPY=${CPY:-$HOME/werk/chatterbox/.venv/bin/python}
REELS=(maan iss leoniden)
export HF_HOME=${HF_HOME:-/opt/voicestudio/hf} TOKENIZERS_PARALLELISM=false NUMBA_CACHE_DIR=/var/tmp/numba-$(id -un) OPENBLAS_NUM_THREADS=2
mkdir -p "$RES"

vraag_gpu_vrij() {  # ACE-Step houdt ~5 GB vast; dezelfde route als scripts/stem-g.sh
  local v; v=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits | head -1)
  local q=/opt/nightgazer-social/data/opdrachten/acestep.vrij
  if [ "$v" -lt 6400 ] && [ -w "$(dirname "$q")" ]; then
    echo "GPU $v MiB vrij; vraag herstart ACE-Step"; : > "$q"
    for _ in $(seq 60); do sleep 2; v=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits | head -1); [ "$v" -ge 6400 ] && break; done
    rm -f "$q" || true
  fi
  echo "GPU vrij: $v MiB"
}

case "${1:-}" in
  opzet)
    mkdir -p "$SP"
    if [ ! -d "$STIJL" ]; then
      bron=$(find "$HOME/werk" -maxdepth 6 -path '*stijl-proef/out/maan/tijden.json' 2>/dev/null | head -1)
      [ -n "$bron" ] || { echo "geen stijl-proef-werkmap met out/maan/tijden.json gevonden onder ~/werk"; exit 1; }
      src=$(dirname "$(dirname "$(dirname "$bron")")")
      echo "stijl-proef: $src → $STIJL"
      cp -a "$src" "$STIJL"
    fi
    for id in "${REELS[@]}"; do ls -la "$STIJL/out/$id/"{vo.wav,tijden.json,muziek.mp3,master.wav} 2>&1 | sed "s|^|$id: |"; done
    "$VPY" -c 'import faster_whisper' 2>/dev/null && echo "ASR: faster-whisper aanwezig" || echo "ASR: geen faster-whisper in $VPY (score zonder verspreking-check)"
    ;;
  diagnose)
    mkdir -p "$RES/diagnose"
    for id in "${REELS[@]}"; do
      "$VPY" -I "$HIER/scripts/meet.py" "$STIJL/out/$id/vo.wav" "$STIJL/out/$id/tijden.json" "$STIJL/reels/$id.json" \
        --naam "$id (stem G nu)" --json "$RES/diagnose/$id.json" | tee "$RES/diagnose/$id.md"
    done
    # de referentie zelf (de stem waar alles van afgeleid is): tempo is onbekend, maar F0-spreiding en LRA niet
    "$VPY" -I -c "
import sys, numpy as np; sys.path.insert(0, '$HIER/scripts'); import gemeen as G
y = G.lees('${STEM_G:-/opt/voicestudio/stemmen/g}/referentie.flac'); a, b = G.spraakgrenzen(y); t, f = G.f0_contour(y)
print('referentie:', G.zin_maten(y, a, b, t, f), 'LRA/LUFS', G.lra(y))" | tee "$RES/diagnose/referentie.txt"
    ;;
  sweep)
    vraag_gpu_vrij
    for st in 12 24; do for cfg in 1.5 2.0 2.5; do for pr in ja nee; do
      naam="st${st}-cfg${cfg}-p${pr}"; [ -f "$RES/sweep/$naam/log.json" ] && continue
      "$SLOT" "$VPY" -I "$HIER/scripts/maak.py" voxcpm "$HIER/reels/maan.json" "$RES/sweep/$naam" \
        --stappen $st --cfg $cfg --prompt $pr --seeds 2 2>&1 | grep -vE 'it/s\]|%\|' | tail -4
    done; done; done
    "$VPY" -I - "$RES/sweep" <<'PY'
import json, sys
from pathlib import Path
rij = []
for p in sorted(Path(sys.argv[1]).glob('*/log.json')):
    j = json.loads(p.read_text()); s = sum(b['score'] for b in j['blokken'])
    rij.append((s, p.parent.name, j['meting'], j['seconden']))
for s, n, m, sec in sorted(rij, reverse=True):
    print(f"{n:22s} score {s:7.2f}  wpm {m['wpm']}  f0sd {m['f0_sd_st_gem']}  eind {m['eind_st_gem']}  LRA {m['lra_lu']}  {sec}s")
PY
    ;;
  chatterbox-installeer)
    mkdir -p "$HOME/werk/chatterbox"; cd "$HOME/werk/chatterbox"
    UV=$(command -v uv || echo /opt/voicestudio/python/bin/uv)
    [ -x "$CPY" ] || "$UV" venv --python 3.11 .venv
    "$UV" pip install --python .venv/bin/python chatterbox-tts librosa soundfile faster-whisper
    HF_HOME=$HOME/werk/chatterbox/hf HF_HUB_DISABLE_XET=1 .venv/bin/python -c "
from chatterbox.mtl_tts import ChatterboxMultilingualTTS as C
try: C.from_pretrained(device='cpu', t3_model='v3')
except TypeError: C.from_pretrained(device='cpu')
print('chatterbox klaar')"
    ;;
  chatterbox-sweep)
    vraag_gpu_vrij
    export HF_HOME=$HOME/werk/chatterbox/hf HF_HUB_OFFLINE=1
    for cfg in 0.3 0.5; do for ex in 0.5 0.7; do
      naam="cb-cfg${cfg}-ex${ex}"; [ -f "$RES/sweep/$naam/log.json" ] && continue
      "$SLOT" "$CPY" -I "$HIER/scripts/maak.py" chatterbox "$HIER/reels/maan.json" "$RES/sweep/$naam" \
        --cfg $cfg --exag $ex --seeds 2 2>&1 | tail -4
    done; done
    ;;
  variant)
    naam=${2:?naam}; model=${3:?voxcpm|chatterbox}; shift 3
    py=$VPY; [ "$model" = chatterbox ] && { py=$CPY; export HF_HOME=$HOME/werk/chatterbox/hf HF_HUB_OFFLINE=1; }
    vraag_gpu_vrij
    for id in "${REELS[@]}"; do
      [ -f "$RES/$naam/$id/log.json" ] && continue
      "$SLOT" "$py" -I "$HIER/scripts/maak.py" "$model" "$HIER/reels/$id.json" "$RES/$naam/$id" "$@" 2>&1 | tail -3
    done
    ;;
  film)
    naam=${2:?naam}
    cd "$STIJL"
    for id in "${REELS[@]}"; do
      V=$RES/$naam/$id; [ -f "$V/vo.wav" ] || { echo "$naam/$id: geen vo.wav"; continue; }
      [ -f "$RES/$naam/$id.mp4" ] && continue
      bk=$SP/bak/$id; mkdir -p "$bk"
      [ -f "$bk/vo.wav" ] || cp -a "out/$id/vo.wav" "out/$id/tijden.json" "reels/$id.json" "$bk/"
      cp "$V/vo.wav" "$V/tijden.json" "out/$id/"
      # ondertitels uit de spreektaal-versie, de rest (muziekprompt, bronnen) blijft
      python3 -I - "reels/$id.json" "$HIER/reels/$id.json" <<'PY'
import json, sys
oud, nieuw = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
assert len(oud['lijnen']) == len(nieuw['lijnen'])
oud['lijnen'] = [dict(tekst=n['tekst'], spreek=n['spreek']) for n in nieuw['lijnen']]
json.dump(oud, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
PY
      bash klank/bouw-lxc.sh mix "$id"
      "$SLOT" bash klank/bouw-lxc.sh render "$id"
      cp "out/$id/$id.mp4" "$RES/$naam/$id.mp4"; cp "out/$id/cover.png" "$RES/$naam/$id-cover.png"
      cp "out/$id/master.wav" "$RES/$naam/$id-master.wav"
      cp "$bk/vo.wav" "$bk/tijden.json" "out/$id/"; cp "$bk/$id.json" "reels/$id.json"
    done
    ;;
  controle)
    mkdir -p "$RES/controle"
    for id in "${REELS[@]}"; do
      cp "$STIJL/out/$id/$id.mp4" "$RES/controle/$id.mp4"; cp "$STIJL/out/$id/cover.png" "$RES/controle/$id-cover.png" || true
      mkdir -p "$RES/controle/$id"; cp "$STIJL/out/$id/vo.wav" "$STIJL/out/$id/tijden.json" "$RES/controle/$id/"
    done
    ;;
  *) sed -n '2,13p' "$0"; exit 1 ;;
esac
