#!/usr/bin/env bash
# Builds one house-style test reel on the LXC (GPU). Run from video/stijl-proef/ as claude-ops.
# ONE heavy job at a time: wrap muziek/render in /opt/nightgazer-social/scripts/render-slot.sh when others may run.
# Never put work dirs in /tmp on the LXC (tmpfs).
#
#   bash klank/bouw-lxc.sh lijnen  <id>   # print the voice-over lines (spreek), one per line → out/<id>/vo/lijnen.txt
#   (make out/<id>/vo/lijn-01.wav … with voice G / VoxCPM2, one take per line)
#   bash klank/bouw-lxc.sh tijden  <id>   # trim + place the takes → out/<id>/vo.wav + tijden.json, sets index.html
#   bash klank/bouw-lxc.sh muziek  <id>   # ACE-Step bed (MUZIEK_BRON=acestep) → out/<id>/muziek.mp3
#   bash klank/bouw-lxc.sh mix     <id>   # voice-over over the bed, ducked, -14 LUFS → out/<id>/master.wav
#   bash klank/bouw-lxc.sh render  <id>   # hyperframes render (GPU) + mux → out/<id>/<id>.mp4, -stil.mp4, cover.png
set -euo pipefail
SOCIAL=/opt/nightgazer-social
HF="npx --yes hyperframes@0.8.162"
cmd="${1:?lijnen|tijden|muziek|mix|render}"; id="${2:?reel id (maan|iss|leoniden)}"
O="out/$id"; mkdir -p "$O/vo"
dur() { python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["dur"])' "$O/tijden.json"; }

case "$cmd" in
  lijnen)
    python3 -I -c 'import json,sys; [print(l["spreek"]) for l in json.load(open(sys.argv[1]))["lijnen"]]' "reels/$id.json" | tee "$O/vo/lijnen.txt"
    ;;
  tijden)
    python3 -I scripts/tijden.py "$O"
    python3 -I scripts/kies.py "$id" "$O/tijden.json"
    ;;
  muziek)
    D=$(python3 -I -c 'import math,sys; print(math.ceil(float(sys.argv[1]))+4)' "$(dur)")
    PROMPT=$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["muziek"])' "reels/$id.json")
    (cd "$SOCIAL" && npm run --silent muziek -- --bron acestep --duur "$D" --uit "$OLDPWD/$O/muziek.mp3" "$PROMPT")
    ;;
  mix)
    D=$(dur)
    # music: no rumble (QA: ACE-Step bass/wide stereo), narrower, ~12 LU under the voice, ducked while speaking,
    # fade in/out. loudnorm upsamples to 192 kHz: resample back to 48k or the ducking drifts.
    # ACE-Step returns ~3 s less than asked, so `muziek` asks 4 s extra. Voice: light presence EQ. Master: -14 LUFS, -1.5 dBTP.
    ffmpeg -y -v error -i "$O/vo.wav" -i "$O/muziek.mp3" -filter_complex "
      [0:a]aresample=48000,highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2,loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,asplit=2[vo][sc];
      [1:a]aresample=48000,atrim=0:${D},asetpts=PTS-STARTPTS,highpass=f=70,lowshelf=f=140:g=-4,extrastereo=m=0.6,
           loudnorm=I=-27:TP=-4:LRA=8,aresample=48000,afade=t=in:d=0.4,afade=t=out:st=$(python3 -I -c "print(max(0,$D-1.6))"):d=1.6[mu];
      [mu][sc]sidechaincompress=threshold=0.03:ratio=3:attack=40:release=380[duck];
      [vo]pan=stereo|c0=c0|c1=c0[vos];
      [vos][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[m]" \
      -map "[m]" -ar 48000 -ac 2 -c:a pcm_s16le "$O/master.wav"
    ffmpeg -v info -i "$O/master.wav" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
    ;;
  render)
    python3 -I scripts/kies.py "$id" "$O/tijden.json"
    $HF check || true
    $HF render . --browser-gpu --crf 14 -o "$O/hf-render.mp4"
    ffmpeg -y -v error -i "$O/hf-render.mp4" -i "$O/master.wav" -map 0:v:0 -map 1:a:0 \
      -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -shortest -movflags +faststart "$O/$id.mp4"
    ffmpeg -y -v error -i "$O/hf-render.mp4" -map 0:v:0 -c:v copy -an -movflags +faststart "$O/$id-stil.mp4"
    ffmpeg -y -v error -ss 0.8 -i "$O/$id.mp4" -frames:v 1 "$O/cover.png"
    ffmpeg -y -v error -i "$O/$id.mp4" -vf "fps=1,scale=270:-1,tile=8x4" -frames:v 1 "$O/contactblad.jpg"
    ;;
  *) echo "gebruik: lijnen|tijden|muziek|mix|render <id>"; exit 1 ;;
esac
