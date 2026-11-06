#!/usr/bin/env bash
# Builds the Ko-fi intro on the LXC (GPU). Run from video/kofi-intro/ as claude-ops, ONE heavy job at a time.
#   bash klank/bouw-lxc.sh muziek   # 3 ACE-Step takes (34 s) -> out/muziek/take{1,2,3}.mp3
#   bash klank/bouw-lxc.sh mix N    # engine 7 (film) on take N -> out/audio/kofi-intro-master.wav + stems
#   bash klank/bouw-lxc.sh render   # hyperframes render (GPU) + mux -> out/kofi-intro.mp4, out/kofi-intro-stil.mp4, out/cover.png
set -euo pipefail
SOCIAL=/opt/nightgazer-social
HF="npx --yes hyperframes@0.8.162"
PROMPT="cinematic ambient electronic brand trailer, warm analog synth pads, soft felt piano motif, gentle pulse that builds and opens into an uplifting wide drop around 13 seconds, hopeful and calm, airy shimmer, deep sub, wide stereo, 96 bpm, polished modern production"
mkdir -p out/muziek out/audio out/stems

case "${1:-}" in
  muziek)
    cd "$SOCIAL"
    for i in 1 2 3; do
      # The CLI derives the seed from prompt+duration, so each take gets a slightly different prompt tail.
      npm run --silent muziek -- --bron acestep --duur 34 --uit "$OLDPWD/out/muziek/take$i.mp3" "$PROMPT, take $i"
    done
    ;;
  mix)
    n="${2:?take nummer}"
    sed "s#MUZIEK_PAD#$PWD/out/muziek/take$n.mp3#" klank/draaiboek.json > out/draaiboek.json
    (cd "$SOCIAL" && .venv/bin/python3 -I templates/_gedeeld/klank/motor.py "$OLDPWD/out/draaiboek.json" "$OLDPWD/out/audio/kofi-intro-master.wav" --stems "$OLDPWD/out/stems")
    ;;
  render)
    $HF check
    $HF render . --browser-gpu --crf 14 -o out/hf-render.mp4
    ffmpeg -y -i out/hf-render.mp4 -i out/audio/kofi-intro-master.wav -map 0:v:0 -map 1:a:0 \
      -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart out/kofi-intro.mp4
    ffmpeg -y -i out/hf-render.mp4 -map 0:v:0 -c:v copy -an -movflags +faststart out/kofi-intro-stil.mp4
    ffmpeg -y -ss 0 -i out/kofi-intro.mp4 -frames:v 1 out/cover.png
    $HF audio out/kofi-intro.mp4 || true
    ;;
  *) echo "gebruik: muziek | mix N | render"; exit 1 ;;
esac
