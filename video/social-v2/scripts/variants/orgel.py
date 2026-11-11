"""Variant 1 — "Orgel van de kosmos": big, warm, cinematic, quiet inside.

An additive pipe organ (16', 8', 4', 2' and a mixture, each pipe a harmonic series with its own tiny
detuning and a breathy "chiff" on the attack) in a cathedral-length reverb. One harmonic progression
in D runs the full 10 s and only resolves on the logo:

    Dsus2 (0) → B♭ (1.6, match cut) → Gm/B♭ (2.9) → C (4.2, M74) → G (5.7) → Asus4 (7.2, plate) → D add9 (8.4, logo)

The swell box (level + brightness) peaks just before the plate (≈ 7.0 s), stays back under both text
moments, and opens warm again for the logo. Archive sounds stay subtle: glass at 7.2, shutter at 8.4.
"""
import numpy as np

from sound import (HZ, N, S, SPF, SR, click_safe, convolve, glass_on_glass, lp, place, reverb_ir, rng,
                   shutter, sweep_lp, t, to_stereo)

TRANSIENTS = [
    ("cut",   "match-cut: B♭ op het pedaal, chiff"),
    ("open",  "M74 gaat open: C, chiff"),
    ("plate", "glasplaat: Asus4 + glas"),
    ("logo",  "logo: D add9 + sluiter"),
]


def note_hz(name):
    """Pitch by name, also outside sound.HZ (MIDI from note name + octave)."""
    if name in HZ:
        return HZ[name]
    pcs = {"C": 0, "Cs": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Fs": 6, "G": 7, "Gs": 8, "A": 9, "Bb": 10, "B": 11}
    pc, octv = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((12 * (octv + 1) + pcs[pc] - 69) / 12)


# Stops: (pitch multiplier, spectrum) — principal = bright series, flute = nearly pure.
PRINCIPAL = [1.0, 0.55, 0.35, 0.22, 0.15, 0.10, 0.07, 0.05, 0.035, 0.025]
FLUTE = [1.0, 0.12, 0.06, 0.02]
STOPS = {
    "16": (0.5, PRINCIPAL[:6]),   # pedal / bourdon: harmonics carry it on a phone speaker
    "8":  (1.0, PRINCIPAL),
    "8f": (1.0, FLUTE),
    "4":  (2.0, PRINCIPAL[:6]),
    "2":  (4.0, PRINCIPAL[:4]),
    "mix": (6.0, PRINCIPAL[:3]),  # mixture rank (the 12th two octaves up): the "silver" of the plenum
}
STOP_LEVEL = {"16": 0.7, "8": 1.0, "8f": 0.9, "4": 0.5, "2": 0.28, "mix": 0.16}

# (start sample, end sample, manual notes, pedal notes, stops, level)
PROGRESSION = [
    (0,                    S["cut"],             ("D3", "A3", "E4"),               ("D2",),  ("8f", "4"),                 1.10),
    (S["cut"],             int(2.9 * SR),        ("Bb2", "D3", "F3", "Bb3", "D4"), ("Bb1",), ("16", "8", "4"),            0.85),
    (int(2.9 * SR),        S["open"],            ("G3", "Bb3", "D4"),              ("Bb1",), ("16", "8f", "4"),           0.70),
    (S["open"],            int(5.7 * SR),        ("C3", "G3", "C4", "E4"),         ("C2",),  ("16", "8", "4", "2"),       0.90),
    (int(5.7 * SR),        S["plate"],           ("G3", "B3", "D4", "G4"),         ("G1",),  ("16", "8", "4", "2", "mix"), 1.00),
    (S["plate"],           S["logo"],            ("A2", "D3", "E3", "A3", "D4"),   ("A1",),  ("16", "8f", "4"),           0.75),
    (S["logo"],            N,                    ("A2", "Fs3", "E4", "A4", "D5"),  ("D2",),  ("16", "8", "4"),            0.95),
]

# Swell box: one expression curve for the whole piece (time s, 0..1). Back under the text moments
# (0–1.43, 2.27–3.8, 8.4–10), the peak just before the plate.
SWELL = [(0.0, 0.42), (1.4, 0.46), (1.59, 0.46), (1.60, 0.70), (2.2, 0.52), (3.8, 0.46), (4.19, 0.46),
         (4.20, 0.70), (5.7, 0.82), (6.9, 1.00), (7.2, 0.62), (8.39, 0.56), (8.40, 0.74), (8.9, 0.74), (10.0, 0.55)]
# The steps at 1.6, 4.2 and 8.4 are the cue accents; they are smoothed over 10 ms below (no zipper, no click).


def pipe_note(f, stops, start, end, r, release=0.35, pan=0.0, attack=0.06, chiff=1.6):
    """One sustained organ note: every stop is a harmonic series; pipes are detuned by a fraction of a cent."""
    att = int(attack * SR)
    rel = int(release * SR)
    s0, s1 = start, min(N, end + rel)
    n = np.arange(s1 - s0) / SR
    env = np.clip(n / (att / SR), 0, 1) ** 1.5
    off = (end - start) / SR
    env *= np.where(n < off, 1.0, np.exp(-(n - off) / (release / 4)))
    x = np.zeros(s1 - s0)
    for st in stops:
        mult, spec = STOPS[st]
        for h, a in enumerate(spec, start=1):
            fh = f * mult * h * (1 + r.uniform(-0.5, 0.5) / 1731)      # ±0.5 cent per pipe
            if fh > 14000:
                break
            x += STOP_LEVEL[st] * a * np.sin(2 * np.pi * fh * n + r.uniform(0, 2 * np.pi))
    # chiff: the breath of the pipe speaking, a short band of noise around the 3rd harmonic
    k = int(0.045 * SR)
    ch = r.standard_normal(k) * np.exp(-np.arange(k) / (0.012 * SR))
    lo, hi = min(f * 2.0, 8000), min(f * 5.0, 15000)
    from sound import bp
    ch = bp(ch, lo, hi, 2) * chiff
    x[:k] += ch
    x = click_safe(x * env, 2, out_ms=10)
    out = np.zeros((N, 2))
    a = (pan + 1) * np.pi / 4
    out[s0:s1, 0] += x * np.cos(a)
    out[s0:s1, 1] += x * np.sin(a)
    return out


def organ():
    r = rng(1001)
    out = np.zeros((N, 2))
    for i, (s0, s1, manual, pedal, stops, lvl) in enumerate(PROGRESSION):
        # on the cue chords the pipes speak faster and with more breath: the accent lands inside one frame
        cue = s0 in (S["cut"], S["open"], S["logo"])
        kw = {"attack": 0.025, "chiff": 3.2} if cue else {}
        for j, nm in enumerate(manual):
            # the organ case: ranks spread a little left/right, the low end stays central
            p = (-0.25 + 0.5 * j / max(1, len(manual) - 1)) if len(manual) > 1 else 0.0
            out += pipe_note(note_hz(nm), stops, s0, s1, r, pan=p, **kw) * lvl / len(manual) ** 0.5
        for nm in pedal:
            out += pipe_note(note_hz(nm), ("16", "8"), s0, s1, r, release=0.5) * lvl * 0.8
    tt, vv = zip(*SWELL)
    swell = np.interp(t, tt, vv)
    from scipy.ndimage import uniform_filter1d
    swell = uniform_filter1d(swell, size=int(0.010 * SR))
    # the swell box: louder AND brighter as it opens
    fc = 900 + 7000 * swell ** 2
    out = np.stack([sweep_lp(out[:, c], fc) for c in range(2)], axis=-1) * swell[:, None]
    # the end: the D add9 lets go into the loop (the start is D/A/E, so the loop stays in key)
    out *= (1 - 0.6 * np.clip((t - 9.4) / 0.6, 0, 1))[:, None]
    return out


def stems():
    org = organ()
    hall = reverb_ir(5.5, 1011, brightness=3500, predelay_ms=28, width=0.45)   # wide enough to be a hall, narrow enough for mono
    org = convolve(org * 0.09, hall, 0.42)
    arch = np.zeros(N)
    place(arch, glass_on_glass() * 0.10, S["plate"])
    place(arch, shutter() * 0.24, S["logo"])
    arch = convolve(to_stereo(arch), reverb_ir(2.2, 1013, 6000, predelay_ms=12, width=0.4), 0.35)
    return {"orgel": org, "archiefgeluiden": arch}, None, None
