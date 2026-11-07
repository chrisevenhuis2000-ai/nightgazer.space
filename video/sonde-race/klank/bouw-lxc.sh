#!/usr/bin/env bash
# Builds the sonde-race reel on the LXC (GPU). Run from video/sonde-race/ as claude-ops, ONE heavy job at a time
# (wrap in /opt/nightgazer-social/scripts/render-slot.sh when other renders may run).
#   bash klank/bouw-lxc.sh muziek   # 3 ACE-Step takes (31 s) -> out/muziek/take{1,2,3}.mp3
#   bash klank/bouw-lxc.sh mix N    # engine 7 (film) on take N -> out/audio/sonde-race-master.wav + stems
#   bash klank/bouw-lxc.sh render   # hyperframes render (GPU) + mux -> out/sonde-race.mp4, -stil.mp4, cover.png
set -euo pipefail
SOCIAL=/opt/nightgazer-social
HF="npx --yes hyperframes@0.8.162"
# Hits land on the beat grid in index.html: impacts at 3.4 / 6.3 / 7.6 / 9.3 s, riser 11.6 -> drop 13.4 s, lift 24.2 s.
PROMPT="cinematic electronic racing trailer score in space, ticking hi-hat pulse and driving arpeggiated synths, rising tension, short riser into a big impact and drop at 13 seconds, second lift at 24 seconds into a triumphant wide finale, epic and hopeful, no vocals, tight controlled low end, mono compatible bass, no sub rumble, clean mix with no noise or hiss, sparkling high end, 128 bpm, polished modern production"
mkdir -p out/muziek out/audio out/stems

case "${1:-}" in
  muziek)
    cd "$SOCIAL"
    for i in 1 2 3; do
      npm run --silent muziek -- --bron acestep --duur 31 --uit "$OLDPWD/out/muziek/take$i.mp3" "$PROMPT, take $i"
    done
    ;;
  mix)
    n="${2:?take nummer}"
    sed -e "s#MUZIEK_PAD#$PWD/out/muziek/take$n.mp3#" klank/draaiboek.json > out/draaiboek.json
    MOTOR="${MOTOR:-$SOCIAL/templates/_gedeeld/klank/motor.py}"
    (cd "$SOCIAL" && .venv/bin/python3 -I "$MOTOR" "$OLDPWD/out/draaiboek.json" "$OLDPWD/out/audio/sonde-race-master.wav" --stems "$OLDPWD/out/stems")
    ;;
  render)
    $HF check || true
    $HF render . --browser-gpu --crf 14 -o out/hf-render.mp4
    ffmpeg -y -i out/hf-render.mp4 -i out/audio/sonde-race-master.wav -map 0:v:0 -map 1:a:0 \
      -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart out/sonde-race.mp4
    ffmpeg -y -i out/hf-render.mp4 -map 0:v:0 -c:v copy -an -movflags +faststart out/sonde-race-stil.mp4
    ffmpeg -y -ss 0.6 -i out/sonde-race.mp4 -frames:v 1 out/cover.png
    $HF audio out/sonde-race.mp4 || true
    ;;
  *) echo "gebruik: muziek | mix N | render"; exit 1 ;;
esac
