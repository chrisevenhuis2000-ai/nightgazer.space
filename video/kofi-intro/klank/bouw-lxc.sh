#!/usr/bin/env bash
# Builds the Ko-fi intro (v2, voice-over) on the LXC (GPU). Run from video/kofi-intro/ as claude-ops, ONE heavy job at a time.
#   bash klank/bouw-lxc.sh muziek   # 3 ACE-Step takes (39 s) -> out/muziek/take{1,2,3}.mp3
#   bash klank/bouw-lxc.sh mix N    # engine 7 (film) on take N -> out/audio/kofi-intro-master.wav + stems
#   bash klank/bouw-lxc.sh render   # hyperframes render (GPU) + mux -> out/kofi-intro.mp4, out/kofi-intro-stil.mp4, out/cover.png
set -euo pipefail
SOCIAL=/opt/nightgazer-social
HF="npx --yes hyperframes@0.8.162"
PROMPT="cinematic ambient electronic brand trailer bed for a voice-over, warm analog synth pads, soft felt piano motif, gentle pulse that lifts at 8 seconds and opens into a wide uplifting swell at 18 seconds, warm and hopeful, clean mix with no noise or hiss, sparkling high end, 96 bpm, polished modern production"
mkdir -p out/muziek out/audio out/stems

case "${1:-}" in
  muziek)
    cd "$SOCIAL"
    for i in 1 2 3; do
      # The CLI derives the seed from prompt+duration, so each take gets a slightly different prompt tail.
      npm run --silent muziek -- --bron acestep --duur 39 --uit "$OLDPWD/out/muziek/take$i.mp3" "$PROMPT, take $i"
    done
    ;;
  mix)
    n="${2:?take nummer}"
    ffmpeg -loglevel error -y -i assets/audio/voiceover.flac -ar 48000 out/audio/voiceover.wav
    sed -e "s#MUZIEK_PAD#$PWD/out/muziek/take$n.mp3#" -e "s#VOICEOVER_PAD#$PWD/out/audio/voiceover.wav#" klank/draaiboek.json > out/draaiboek.json
    # klank.kamer=false needs the 3-line kamer-uit patch on motor.py (run from a patched copy until it is in nightgazer-social main)
    MOTOR="${MOTOR:-$SOCIAL/templates/_gedeeld/klank/motor.py}"
    (cd "$SOCIAL" && .venv/bin/python3 -I "$MOTOR" "$OLDPWD/out/draaiboek.json" "$OLDPWD/out/audio/kofi-intro-master.wav" --stems "$OLDPWD/out/stems")
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
