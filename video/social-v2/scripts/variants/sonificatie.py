"""Variant 3 — "Het instrument antwoordt": the picture's own data, played.

Every musical event comes from a number in sonificatie-data.json (see extract_sonification_data.py).
All pitches are quantised to D major pentatonic (D E F♯ A B), and on the logo the last notes the data
produced glide onto the chord tones of D add9: the instrument "answers" in one key.

Data → sound (also in AUDIO.md):
  0–1.6 s   Black Marble scan along 52.09° N, 5° W → 11.2° E (Utrecht passes at 1.0 s, the lock):
            each city (local radiance peak) = a ping; radiance → pitch and level; where the city lies in
            the band (north/south) → pan; band mean radiance → density of a fine grain rustle and the
            level of a low D/A bed (the sea is silent, the Randstad is loud).
  1.6 s     The match cut: a struck low D whose brightness is the lit fraction of the cut frame.
  1.6–5.4 s The planet: a D/A drone whose low-pass cutoff follows the measured lit fraction per frame
            (the terminator sweeping in opens the filter).
  4.2–7.2 s M74, with the camera dolly as playhead: a fixed ring of 48 points around the core of the
            rendered frame; a point sounds when a bright structure moves under it (luma rises past
            0.5): luma → pitch and level, blue−red balance → octave, x → pan, angle → moment within
            the frame; the mean ring brightness sets the level of a soft glow pad.
  7.2 s     The plate: the data stops; the last pitches it produced hang on as a quiet cluster (+ glass).
  8.4 s     The logo: shutter; the cluster glides onto D add9 and resolves.
"""
import json
from pathlib import Path

import numpy as np

from sound import (N, S, SR, bp, click_safe, convolve, glass_on_glass, hp, lp, pan, place, reverb_ir, rng, saw,
                   shutter, sweep_lp, t, to_stereo)
from variants.orgel import note_hz

DATA = json.loads((Path(__file__).parent / "sonificatie-data.json").read_text())

TRANSIENTS = [
    ("cut",   "match-cut: aangeslagen lage D (helderheid = verlicht deel)"),
    ("open",  "M74: speelkop raakt de kern, eerste korrels"),
    ("plate", "glasplaat: data stopt, glas"),
    ("logo",  "logo: sluiter, cluster glijdt naar D add9"),
]

PENTA = [2, 4, 6, 9, 11]          # D E F# A B (pitch classes)


def quantise(v, base_midi, octaves):
    """0..1 → a note of D major pentatonic over `octaves` octaves from base_midi (a D)."""
    steps = [12 * o + (pc - 2) for o in range(octaves) for pc in PENTA] + [12 * octaves]
    m = base_midi + steps[int(np.clip(v, 0, 0.9999) * len(steps))]
    return 440.0 * 2 ** ((m - 69) / 12), m


def ping(f, dur, level, r):
    n = np.arange(int(SR * dur)) / SR
    x = np.sin(2 * np.pi * f * n) * np.exp(-n / (dur / 4)) + 0.25 * np.sin(2 * np.pi * f * 2.0 * n) * np.exp(-n / 0.03)
    return click_safe(x * level, 2, out_ms=10)


def city_layer():
    c = DATA["city"]
    lon, mean, peak, north = (np.array(c[k]) for k in ("lon", "mean", "peak", "north"))
    # playhead: lon(t) = −5° + 10.12°·t, so Utrecht (5.12° E) passes at exactly 1.0 s
    t_of = (lon + 5.0) / 10.12
    out = np.zeros((N, 2))
    r = rng(3101)
    # cities: local maxima of the band mean (≥ 0.1° apart)
    for i in range(3, len(lon) - 3):
        if mean[i] >= 0.09 and mean[i] == mean[i - 5: i + 6].max():
            f, _ = quantise(mean[i] / 0.45, 74, 2)                    # brighter city → higher, D5..D7
            lvl = 0.16 * (mean[i] / 0.45) ** 0.8
            place(out, pan(ping(f, 0.5 + 0.8 * mean[i], lvl, r), 0.4 * north[i]), int(t_of[i] * SR))
    # density: a fine grain rustle, rate ∝ band mean radiance
    tt = 0.0
    while tt < 1.6:
        m = float(np.interp(tt, t_of, mean))
        if m > 0.02:
            g = bp(r.standard_normal(int(0.006 * SR)), 5000, 11000, 2) * np.hanning(int(0.006 * SR))
            place(out, pan(g * 0.03 * m / 0.4, r.uniform(-0.5, 0.5)), int(tt * SR))
        tt += 1.0 / (8 + 380 * m)
    # bed: land vs sea — a low D/A whose level follows the (smoothed) band radiance
    lvl = np.interp(t, t_of, np.convolve(mean, np.hanning(41) / np.hanning(41).sum(), "same"))
    lvl *= (t < 1.6)
    bed = (saw(note_hz("D2"), 8) + 0.6 * saw(note_hz("A2"), 8)) * (0.15 + 1.6 * lvl)
    bed = lp(bed, 900) * (1 - np.clip((t - 1.55) / 0.08, 0, 1))
    return out, to_stereo(bed * 0.05)


def lit_curve():
    d = DATA["terminator"]
    return np.interp(t, np.array(d["frames"]) / 30.0, d["lit"])


def cut_strike(lit):
    """1.6 s: the cut frame's lit fraction sets how bright the struck D is (0.02 → dark)."""
    L = int(SR * 2.5)
    n = np.arange(L) / SR
    f = note_hz("D2")
    x = sum(np.sin(2 * np.pi * f * h * n) * np.exp(-n / (1.2 / h)) / h for h in range(1, 10))
    r = rng(3103)
    hit = lp(r.standard_normal(L), 1200) * np.exp(-n / 0.01) * 0.6
    x = lp(x + hit, 400 + 6000 * float(lit[S["cut"]]) + 600)
    out = np.zeros(N)
    place(out, click_safe(x, 2, out_ms=40), S["cut"])
    return to_stereo(out * 0.30)


def planet_layer(lit):
    x = saw(note_hz("D2"), 12) + 0.7 * saw(note_hz("A2"), 10) + 0.4 * saw(note_hz("D3"), 8)
    fc = 160 + 3400 * lit                                        # the terminator opens the filter
    y = sweep_lp(x, fc)
    lvl = np.clip((t - 1.6) / 0.25, 0, 1) * (1 - np.clip((t - 4.4) / 1.0, 0, 1))
    return to_stereo(y * lvl * 0.07)


def m74_layer():
    """Grains are event-triggered, not random: a point of the fixed ring sounds when a bright structure
    moves under it (its luma rises past 0.5 from one frame to the next). The point's angle sets when in
    the frame it sounds (the ring is read as a rotating scan, once per frame)."""
    r = rng(3105)
    out = np.zeros((N, 2))
    glow = np.zeros(N)
    last = []
    prev = None
    for fr in DATA["m74"]:
        i = fr["frame"]
        pts = fr["pts"]
        live = [p for p in pts if p]
        glow[i * 1600:(i + 1) * 1600] = float(np.mean([p[0] for p in live])) if live else 0.0
        first = i == 126
        events = []
        for k, p in enumerate(pts):
            if not p:
                continue
            before = prev[k][0] if (prev and prev[k]) else 0.0
            if first or (p[0] > 0.5 and before <= 0.5):
                events.append((k, p))
        if first:
            events = sorted(events, key=lambda e: -e[1][0])[:5]    # the playhead touches the core: 5 brightest at once
        for k, (lu, chroma, x, rad) in events:
            f, m = quantise((lu - 0.3) / 0.6, 74, 2)               # luma → pitch (D5..D7)
            if chroma > 0.24:
                f *= 2                                             # bluest points (young stars) an octave up
            dur = 0.05 + 0.25 * rad                                # outer ring → longer grains
            n = np.arange(int(SR * dur)) / SR
            g = ping(f, 0.9, 1.0, r) if first else np.sin(2 * np.pi * f * n) * np.hanning(len(n))
            lvl = (0.16 if first else 0.30) * lu ** 1.5
            at = i * 1600 + (0 if first else int(k / 48 * 1600))   # angle → moment within the frame
            place(out, pan(g * lvl, 0.35 * (2 * x - 1)), at)
            last.append(m)
        prev = pts
    # the glow pad: mean ring brightness → level (D3/A3/E4, low-passed)
    glow = np.convolve(glow, np.hanning(9601) / np.hanning(9601).sum(), "same")
    pad = saw(note_hz("D3"), 6) + 0.6 * saw(note_hz("A3"), 6) + 0.35 * saw(note_hz("E4"), 5)
    pad = lp(pad, 1500) * glow * 0.30
    win = (np.clip((t - 4.2) / 0.3, 0, 1) * (1 - np.clip((t - 7.2) / 0.3, 0, 1)))
    out *= win[:, None]
    return out + to_stereo(pad * win), last[-6:]


def answer(last_midis):
    """7.2–8.4: the last data pitches hang on, quiet; 8.4: they glide (80 ms) onto D add9 and resolve,
    with a firm low D/A/F# under them."""
    chord_pcs = [2, 4, 6, 9]                                       # D E F# A
    out = np.zeros((N, 2))
    s0 = S["plate"]
    n = np.arange(N - s0) / SR
    glide = np.clip((n - (S["logo"] - s0) / SR) / 0.08, 0, 1)
    glide = glide * glide * (3 - 2 * glide)
    for k, m in enumerate(sorted(set(last_midis))):
        target = min((m + d for d in range(-6, 7) if (m + d) % 12 in chord_pcs), key=lambda z: abs(z - m))
        target = target - 12 if target > 86 else target
        f0, f1 = 440 * 2 ** ((m - 69) / 12), 440 * 2 ** ((target - 69) / 12)
        f = f0 * (f1 / f0) ** glide
        ph = 2 * np.pi * np.cumsum(f) / SR
        hold = 0.35 + 0.65 * np.clip((n - (S["logo"] - s0) / SR) / 0.07, 0, 1)
        env = np.clip(n / 0.2, 0, 1) * hold * np.exp(-np.clip(n - 1.2, 0, None) / 1.8)
        x = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * env * 0.13
        out[s0:] += pan(x, -0.3 + 0.6 * k / max(1, len(set(last_midis)) - 1))
    # the low support of the chord arrives with the logo
    n2 = np.arange(N - S["logo"]) / SR
    low = sum(np.sin(2 * np.pi * note_hz(nm) * h * n2) / h ** 1.5 for nm in ("D2", "A2", "Fs3") for h in range(1, 6))
    low = low * np.clip(n2 / 0.02, 0, 1) * np.exp(-n2 / 1.8) * 0.15
    out[S["logo"]:] += to_stereo(lp(low, 1800))
    out *= (1 - np.clip((t - 9.45) / 0.5, 0, 1))[:, None]
    return out


def stems():
    lit = lit_curve()
    city, bed = city_layer()
    m74, last = m74_layer()
    arch = np.zeros(N)
    place(arch, glass_on_glass() * 0.14, S["plate"])
    place(arch, shutter() * 0.40, S["logo"])
    space = reverb_ir(3.2, 3107, 7000, width=0.45)
    return {
        "data-stad": convolve(city, space, 0.45) + bed,
        "data-planeet": cut_strike(lit) + planet_layer(lit),
        "data-m74": convolve(m74, space, 0.5),
        "antwoord": convolve(answer(last), reverb_ir(2.8, 3109, 5000, width=0.5), 0.35)
                    + convolve(to_stereo(arch), reverb_ir(0.5, 3111, 6000, predelay_ms=4, width=0.3), 0.22),
    }, None, None
