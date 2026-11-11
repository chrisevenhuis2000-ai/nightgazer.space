#!/usr/bin/env bash
# Downloads the original public images this video is built from into assets/src/.
# Sources, licences and credits: see ../SOURCES.md. Run from video/social-v2/.
set -euo pipefail
mkdir -p assets/src
cd assets/src

BM=https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898
for f in BlackMarble_2016_3km.jpg BlackMarble_2016_B1.jpg BlackMarble_2016_C1.jpg; do
  [ -s "$f" ] || curl -fL --retry 3 -o "$f" "$BM/$f"
done

# ESA/Webb potm2208b — the Large JPEG is the full 5047 x 3136 px image.
[ -s potm2208b.jpg ] || curl -fL --retry 3 -o potm2208b.jpg https://cdn.esawebb.org/archives/images/large/potm2208b.jpg

ls -la
