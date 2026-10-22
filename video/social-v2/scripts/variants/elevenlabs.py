"""Variant "elevenlabs": the music is an ElevenLabs Music generation, the archive sounds come from the engine.

The music file is generated once in ElevenLabs (eleven_music_v2_5, instrumental, 10 s) and committed in
assets/audio/ as FLAC, so the build stays reproducible without network access or credits. It is decoded,
resampled to 48 kHz, cut to exactly 10.0 s, given a 2 ms fade-in and a 20 ms fade-out (300 ms when the take
ran longer), narrowed (side −4,4 dB, mono below 150 Hz) and levelled to −18 LUFS. Over it go the
template's own sync sounds (counter ticks, emulsion rustle, glass, lightbox, stamp, shutter and the match-cut
impact), placed sample-exact on the cue grid as in the default soundtrack.

    ELEVENLABS_MUSIC=assets/audio/<file>.flac python3 scripts/sound.py --variant elevenlabs   # try another take
"""
import os
from math import gcd
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

from sound import N, SR, archive_layer, hp, impact

MUSIC = Path(os.environ.get("ELEVENLABS_MUSIC", "assets/audio/elevenlabs-music.flac"))
MUSIC_LUFS = -18.0         # takes differ by up to 17 LU; each is levelled first, ≈ 7 LU above the archive sounds
SIDE_LEVEL = 0.6          # the takes are very wide (mono correlation ≈ 0.3); narrowed for phone speakers
SIDE_HP = 150.0           # and mono below 150 Hz, like the reverbs in the engine
ARCHIVE_LEVEL = 1.0
IMPACT_LEVEL = 0.6         # the generated music has its own weight at the cut; the thump only marks it

TRANSIENTS = [
    ("cut",   "match-cut: impact"),
    ("plate", "glasplaat: glas op glas"),
    ("logo",  "logo: sluiter"),
]


def music():
    x, sr = sf.read(MUSIC, always_2d=True)
    x = x[:, :2] if x.shape[1] >= 2 else np.repeat(x, 2, axis=1)
    if sr != SR:
        g = gcd(sr, SR)
        x = resample_poly(x, SR // g, sr // g, axis=0)
    out = np.zeros((N, 2))
    out[: min(N, len(x))] = x[:N]
    # a take longer than 10 s is cut, so it gets a longer fade-out than one that already ends in time
    fade_in, fade_out = int(0.002 * SR), int((0.300 if len(x) > N else 0.020) * SR)
    out[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    out[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    mid, side = (out[:, 0] + out[:, 1]) / 2, (out[:, 0] - out[:, 1]) / 2
    side = hp(side, SIDE_HP) * SIDE_LEVEL
    out = np.stack([mid + side, mid - side], axis=1)
    return out * 10 ** ((MUSIC_LUFS - pyln.Meter(SR).integrated_loudness(out)) / 20)


def stems():
    return {
        "muziek": music(),
        "archiefgeluiden": archive_layer() * ARCHIVE_LEVEL,
        "impacts": impact() * IMPACT_LEVEL,
    }, None, None
