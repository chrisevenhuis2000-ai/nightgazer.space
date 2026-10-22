#!/usr/bin/env bash
# Builds the five soundtracks (the ElevenLabs default plus the four synthesized ones), muxes each under the same picture and makes the comparison video.
#   bash scripts/varianten.sh          (in video/social-v2/, after `npx hyperframes render . --crf 14 -o out/hf-render.mp4`)
set -euo pipefail
PY=${PYTHON:-python3}
V=out/varianten
mkdir -p "$V"
mux() {  # picture from the HyperFrames render (copied), audio from the master (AAC 320k, 48 kHz)
  ffmpeg -v error -y -i out/hf-render.mp4 -i "$1" -map 0:v:0 -map 1:a:0 -c:v copy \
    -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart "$2"
}
for name in elevenlabs huidig orgel puls sonificatie; do
  "$PY" scripts/sound.py --variant "$name"
  case $name in elevenlabs) file=elevenlabs;; huidig) file=0-huidig;; orgel) file=1-orgel;; puls) file=2-puls;; sonificatie) file=3-sonificatie;; esac
  master=$("$PY" -c "import sys; sys.path.insert(0,'scripts'); from sound import master_path; print(master_path('$name'))")
  mux "$master" "$V/$file.mp4"
  "$PY" scripts/audio-verify.py --variant "$name" "$V/$file.mp4" > "$(dirname "$master")/verify.json"
  cp "$(dirname "$master")/spectrogram.png" "$V/$file-spectrogram.png"
done
"$PY" scripts/compare-video.py
