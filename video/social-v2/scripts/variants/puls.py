"""Variant 2 — "Puls van het observatorium": rhythmic, modern, precise.

Tempo: 150 BPM, constant. One 16th note is exactly 0.1 s = 3 video frames = 4800 samples, so every
cue that sits on a multiple of 3 frames lies exactly on the grid (no ramp needed):

    bar = 1.6 s (4/4); bars start at 0.0, 1.6, 3.2, 4.8, 6.4, 8.0, 9.6
    1.6  match cut  = bar 2, beat 1          (16th #16)
    4.2  M74 opens  = bar 3, beat 3, "and"   (16th #42, an 8th-note anticipation of beat 4)
    7.2  plate      = bar 5, beat 3          (16th #72)
    8.4  logo       = bar 6, beat 2          (16th #84)
    1.0 lock, 4.9 readout, 8.1 stamp also land on 16ths; 1.4333 and 2.2667 sit 1 frame off the grid.

Percussion is an instrument, not a drum kit: escapement ticks, a telescope's stepper motor, a soft dome
"thock" on the beat. A warm bass (saw through a low-pass, saturated for phone speakers) follows
D → B♭ → C → G → Asus4 → D. A four-note motif (A–D–E … F♯) is the sonic logo: twice unresolved
(1.6 ends on E, 4.2 on G), complete only on the logo (8.4: A–D–E–F♯).
"""
import numpy as np

from sound import (HZ, N, S, SR, click_safe, convolve, counter_tick, glass_on_glass, hp, lp, place, reverb_ir,
                   rng, sat, shutter, sweep_lp, to_stereo)
from variants.orgel import note_hz

TRANSIENTS = [
    ("cut",   "match-cut: maat 2 tel 1, bas + motief"),
    ("open",  "M74 gaat open: groove valt in (8e voor tel 4)"),
    ("plate", "glasplaat: groove stopt, glas"),
    ("logo",  "logo: sonic logo + akkoord"),
]

BPM = 150
SIX = int(SR * 15 / BPM)         # 4800 samples per 16th
assert SIX * 10 == SR, "a 16th must be exactly 0.1 s"


def at16(k):
    return k * SIX


def tick(level, bright=1.0):
    x = counter_tick(level) * 1.6
    return hp(x, 2500) if bright > 1 else x


def stepper(f0=740.0, dur=0.07, seed=0):
    """A telescope's stepper motor taking one step: a short pitched buzz with a falling whine."""
    n = np.arange(int(SR * dur)) / SR
    f = f0 * (1 + 0.25 * np.exp(-n / 0.015))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.25 + 0.5 * np.sin(2 * ph)
    x = lp(x, 3500) * np.exp(-n / 0.02)
    return click_safe(x, 2, out_ms=10)


THOCK = 0.7      # dome motor against the ticks (the ticks carry the pulse on a phone)


def thock(f=62.0):
    """The dome motor: a soft step on the beat. The body sits at 190 Hz with a 450 Hz knock, and only a
    little weight below; it is saturated before it is shaped, so a phone speaker still plays the beat."""
    n = np.arange(int(SR * 0.22)) / SR
    sub = np.sin(2 * np.pi * f * n * (1 + 0.6 * np.exp(-n / 0.012))) * np.exp(-n / 0.06) * 0.45
    body = np.sin(2 * np.pi * 190 * n * (1 + 0.3 * np.exp(-n / 0.01))) * np.exp(-n / 0.05)
    knock = np.sin(2 * np.pi * 450 * n) * np.exp(-n / 0.012) * 0.9
    x = sat((sub + body + knock) * 1.5, 2.2)
    return click_safe(lp(x, 2500), 2, out_ms=20) * THOCK


def pluck(f, dur=0.35, bright=4000, decay=0.18):
    """A clean bell-ish pluck for the motif: sine + a few inharmonic partials, fast attack."""
    n = np.arange(int(SR * dur)) / SR
    x = (np.sin(2 * np.pi * f * n) + 0.35 * np.sin(2 * np.pi * f * 2.0 * n) * np.exp(-n / 0.06)
         + 0.12 * np.sin(2 * np.pi * f * 3.01 * n) * np.exp(-n / 0.03))
    return click_safe(lp(x * np.exp(-n / decay), bright), 2, out_ms=15)


def percussion():
    out = np.zeros((N, 2))
    r = rng(2002)
    for k in range(0, 100):                         # 16ths 0..99 (0.0–9.9 s)
        s = at16(k)
        beat = k % 4 == 0
        # sections: hook = sparse 8ths; 1.6–4.2 = 8ths + motor on 2&4; 4.2–7.2 = full 16ths; break 7.2–8.4 = quarters
        if s < S["cut"]:
            if k % 2 == 0:
                place(out, to_stereo(tick(0.30 + 0.12 * beat)), s)
            if beat:
                place(out, to_stereo(thock()) * 0.55, s)      # the dome motor idles under the hook
        elif s < S["open"]:
            if k % 2 == 0:
                place(out, to_stereo(tick(0.24 + 0.1 * beat)), s)
            if k % 8 == 4:
                place(out, to_stereo(stepper(740, seed=k)) * 0.30, s)
            if beat:
                place(out, to_stereo(thock()) * 0.55, s)
        elif s < S["plate"]:
            acc = 0.48 if beat else (0.30 if k % 2 == 0 else 0.18)
            p = 0.18 * (1 if k % 2 else -1)          # 16ths alternate a touch left/right
            place(out, np.stack([tick(acc) * (1 - p), tick(acc) * (1 + p)], -1), s)
            if k % 4 == 2:
                place(out, to_stereo(stepper(740 if (k // 4) % 2 else 988, seed=k)) * 0.34, s)
            if beat or k == 42:                    # 4.2 is an 8th before beat 4: the groove "falls in" there
                place(out, to_stereo(thock()) * 0.85, s)
        elif s < S["logo"]:
            if beat:
                place(out, to_stereo(tick(0.22)), s)
        else:
            if k in (84, 88):
                place(out, to_stereo(thock(55.0)) * 0.3, s)
            if k % 4 == 0 and k <= 92:
                place(out, to_stereo(tick(0.14)), s)
    return out


BASS = [  # (start s, end s, note)
    (1.6, 3.2, "D2"), (3.2, 4.2, "Bb1"), (4.2, 5.6, "C2"), (5.6, 7.2, "G1"), (7.2, 8.4, "A1"), (8.4, 10.0, "D2"),
]


def bass():
    """8th-note bass, warm: a band-limited saw through a low-pass with a short filter blip per note."""
    out = np.zeros(N)
    for a, b, nm in BASS:
        f = note_hz(nm)
        s0, s1 = int(a * SR), int(b * SR)
        held = s0 >= S["plate"]                        # the break and the logo: one long note, no pulse
        starts = [s0] if held else range(s0, s1, 2 * SIX)
        for i, s in enumerate(starts):
            L = (s1 - s0) if held else 2 * SIX
            n = np.arange(L) / SR
            oct_ = 2 if (i % 4 == 3 and S["open"] <= s < S["plate"]) else 1
            x = sum(np.sin(2 * np.pi * f * oct_ * h * n) / h for h in range(1, 9))
            env = np.exp(-n / (0.9 if held else 0.12)) * (0.55 if held else 1.0)
            # saturate first (harmonics up to ~1 kHz), then the low-pass: floor 950 Hz + a blip per note,
            # so the bass line is still a line on a phone speaker
            x = sweep_lp(sat(x * env * 0.9, 2.2), 950 + 1600 * np.exp(-n / 0.03), block=48)
            place(out, click_safe(x * 0.8, 2, out_ms=6), s)
    return to_stereo(out)


MOTIF = [  # (16th offset, note, length s) — the sonic logo
    (0, "A4", 0.3), (1, "D5", 0.3), (2, "E5", 0.3), (4, "Fs5", 1.4),
]


def motif():
    out = np.zeros((N, 2))
    # 1.6: low and unresolved (stops on E); 4.2: an octave up, turns to G (sus); 8.4: complete, lands on F#
    statements = [
        (S["cut"],  [(0, "A3", 0.25), (1, "D4", 0.25), (2, "E4", 0.6)], 0.35),
        (S["open"], [(0, "A4", 0.25), (1, "D5", 0.25), (2, "E5", 0.25), (4, "G5", 0.6)], 0.22),
        (S["logo"], MOTIF, 0.17),
    ]
    for start, notes, lvl in statements:
        for off, nm, L in notes:
            x = pluck(note_hz(nm), dur=L + 0.3, decay=L * 0.6)
            place(out, to_stereo(x * lvl), start + at16(off))
    return convolve(out, reverb_ir(1.6, 2021, 6000, predelay_ms=20, width=0.6), 0.3)


def chord_pad():
    """Asus4 under the break (tension), D add9 on the logo (resolution); soft attacks, no melody."""
    out = np.zeros((N, 2))
    for s0, s1, notes, lvl in ((S["plate"], S["logo"], ("A2", "D3", "E3", "A3"), 0.05),
                               (S["logo"], N, ("D3", "A3", "Fs3", "E4", "A4"), 0.08)):
        n = np.arange(s1 - s0) / SR
        env = np.clip(n / 0.06, 0, 1) * np.exp(-n / 1.6)
        x = sum(sum(np.sin(2 * np.pi * note_hz(nm) * h * n) / h ** 1.6 for h in range(1, 6)) for nm in notes)
        out[s0:s1] += to_stereo(lp(x * env * lvl, 2200))
    out *= (1 - np.clip((np.arange(N) / SR - 9.5) / 0.45, 0, 1))[:, None]
    return convolve(out, reverb_ir(2.4, 2023, 4500, width=0.5), 0.35)


def stems():
    arch = np.zeros(N)
    place(arch, glass_on_glass() * 0.14, S["plate"])
    place(arch, shutter() * 0.22, S["logo"])
    room = reverb_ir(0.5, 2025, 6000, predelay_ms=4, width=0.4)
    return {
        # high-pass at 42 Hz: loudness normalisation stops spending headroom on sub a phone cannot play
        "percussie": hp(convolve(percussion(), room, 0.18), 42),
        "bas": hp(bass() * 0.38, 42),
        "motief": motif(),
        "akkoord": chord_pad() + convolve(to_stereo(arch), room, 0.22),
    }, None, None
