"""NightGazer social v2 — procedural sound design.

"The plate archive lets you hear space." Everything is synthesised here, in
float64 numpy with fixed seeds: no samples, no models, no network. Running it
twice gives bit-identical WAVs.

    python3 scripts/sound.py            # writes out/audio/*.wav (48 kHz, 24-bit, stereo)

Every cue sits on an exact sample offset computed from its picture frame:
30 fps at 48 kHz is 1600 samples per frame (see CUES and AUDIO.md).
"""
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48_000
FPS = 30
SPF = SR // FPS          # 1600 samples per video frame
DUR = 10.0
N = int(SR * DUR)        # 480 000 samples
OUT = Path("out/audio")

# ── Cue grid: picture frame → sample offset (the picture times live in the compositions) ──
CUES = {
    "start":        0,     # Europe at night, hook — sound present in the first frame
    "lock":         30,    # 1.000 s  crosshair locks onto Utrecht
    "wipe":         43,    # 1.433 s  hook swept off by a hairline
    "cut":          48,    # 1.600 s  match cut: Earth's horizon → planet limb
    "promise":      68,    # 2.267 s  "Ruimtenieuws. Op jouw niveau."
    "promise_out":  114,   # 3.800 s
    "open":         126,   # 4.200 s  camera climbs over the limb, M74 opens
    "layer_mid":    156,   # 5.200 s  second depth layer of the push-in
    "readout":      147,   # 4.900 s  "M74 · Vissen" readout appears
    "layer_stars":  186,   # 6.200 s  third depth layer
    "plate":        216,   # 7.200 s  the view is lifted out as a glass plate
    "lightbox":     219,   # 7.300 s  the lightbox strikes (starter ticks, then hum)
    "stamp":        243,   # 8.100 s  plate number stamped
    "logo":         252,   # 8.400 s  logo exposed: shutter + resolution chord
    "still":        270,   # 9.000 s  everything still
    "end":          300,   # 10.000 s
}
S = {k: f * SPF for k, f in CUES.items()}
t = np.arange(N) / SR

# Key: D. Tension = sus4 (G) and the minor sixth (Bb) over a D/A drone; resolution = D major add9, open voicing.
HZ = {n: 440.0 * 2 ** ((m - 69) / 12) for n, m in
      dict(D1=26, D2=38, A2=45, D3=50, G2=43, Bb2=46, E3=52, A3=57, D4=62, E4=64, Fs3=54, G4=67,
           Bb4=70, A4=69, D5=74, E5=76, Fs5=78, A5=81, D6=86, E6=88, Fs6=90, A6=93, B6=95, D7=98).items()}


# ── small DSP kit ────────────────────────────────────────────────────────────
def rng(seed):
    return np.random.Generator(np.random.PCG64(seed))


def seg(a, b):
    """Envelope helper: 0..1 ramp between samples a and b (raised cosine)."""
    x = np.clip((np.arange(N) - a) / max(1, b - a), 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * x)


def expdecay(start, tau, length=None):
    """Exponential decay starting at sample `start` (0 before)."""
    e = np.zeros(N)
    n = np.arange(N - start) if length is None else np.arange(min(length, N - start))
    e[start:start + len(n)] = np.exp(-n / (tau * SR))
    return e


def click_safe(x, ms=3.0, out_ms=None):
    """Raised-cosine fades at both ends of a burst (no discontinuities). Never shorter than 2 ms;
    `out_ms` sets a longer fade-out for bursts whose tail is still ringing."""
    def win(m):
        k = max(int(SR * 0.002), int(SR * m / 1000))
        return 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k))
    wi, wo = win(ms), win(ms if out_ms is None else out_ms)
    x = x.copy()
    x[:len(wi)] *= wi
    x[-len(wo):] *= wo[::-1]
    return x


def place(buf, burst, at):
    """Add a mono/stereo burst into buf at sample `at` (sample-exact)."""
    end = min(N, at + len(burst))
    buf[at:end] += burst[: end - at]


def pan(mono, p):
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=-1)


def sat(x, drive):
    """Soft saturation: adds odd harmonics so low layers survive phone speakers."""
    return np.tanh(drive * x) / np.tanh(drive)


def lp(x, fc, order=2):
    sos = signal.butter(order, fc, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def sweep_lp(x, fc_curve, block=240):
    """Time-varying 2-pole low-pass, coefficients per 5 ms block, filter state carried over."""
    y = np.zeros_like(x)
    zi = np.zeros((1, 2)) if x.ndim == 1 else np.zeros((1, 2, x.shape[1]))
    for i in range(0, len(x), block):
        fc = float(np.clip(fc_curve[i], 30, SR * 0.45))
        sos = signal.butter(2, fc, "low", fs=SR, output="sos")
        if x.ndim == 1:
            y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
        else:
            y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], axis=0, zi=zi)
    return y


def saw(f, n_harm=10, detune=0.0, phase_seed=None):
    """Band-limited saw by additive synthesis (1/k), starting at phase 0 (no click at t=0)."""
    out = np.zeros(N)
    for k in range(1, n_harm + 1):
        out += np.sin(2 * np.pi * (f + detune) * k * t) / k
    return out / 1.8


def reverb_ir(seconds, seed, brightness=4500.0, predelay_ms=12.0, width=1.0):
    """Synthetic stereo impulse response: decorrelated, darkening exponential noise (seeded)."""
    n = int(SR * seconds)
    r = rng(seed)
    tt = np.arange(n) / SR
    env = np.exp(-6.91 * tt / seconds)                     # -60 dB at `seconds`
    l = r.standard_normal(n) * env
    rr = r.standard_normal(n) * env
    # darker as it decays: blend a low-passed copy in over time
    mix = np.clip(tt / seconds, 0, 1)
    l = (1 - mix) * lp(l, brightness) + mix * lp(l, brightness * 0.35)
    rr = (1 - mix) * lp(rr, brightness) + mix * lp(rr, brightness * 0.35)
    m = 0.5 * (l + rr)
    l, rr = m + width * (l - m), m + width * (rr - m)        # width < 1 keeps the tail mono-safe
    pre = int(SR * predelay_ms / 1000)
    ir = np.zeros((n + pre, 2))
    ir[pre:, 0], ir[pre:, 1] = l, rr
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir, wet):
    """Stereo convolution reverb, output trimmed to N (tails past 10 s are faded before)."""
    if x.ndim == 1:
        x = np.stack([x, x], axis=-1)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], axis=-1)
    # the tail may be wide, but not in the low end: side signal high-passed at 200 Hz (mono bass)
    mid, side = 0.5 * (y[:, 0] + y[:, 1]), hp(0.5 * (y[:, 0] - y[:, 1]), 200, 4)
    y = np.stack([mid + side, mid - side], axis=-1)
    return x * (1 - wet) + y * wet


def to_stereo(x):
    return np.stack([x, x], axis=-1) if x.ndim == 1 else x


# ── LAYER 1 — SPACE: drones, glitter, granular star cloud ─────────────────────
def orbit_drone():
    """Loopable: every frequency makes a whole number of cycles in 10 s, so sample N equals sample 0."""
    f = [73.4, 110.1, 146.8, 220.2]                        # ≈ D2, A2, D3, A3 (x10 → integers)
    amp = [1.0, 0.55, 0.35, 0.12]
    breath = 0.82 + 0.18 * np.sin(2 * np.pi * 0.1 * t)       # one slow breath per 10 s
    x = sum(a * np.sin(2 * np.pi * fr * t) for fr, a in zip(f, amp)) * breath
    x = sat(0.6 * x, 1.6)                                   # harmonics for small speakers
    # level: full under the Earth and at the end (loop seam), low in between. It only comes back
    # in the last half second, under the chord's tail, so the end card belongs to the chord.
    lvl = 1 - 0.82 * seg(S["cut"], S["cut"] + 40 * SPF) + 0.82 * seg(S["end"] - 15 * SPF, S["end"] - 1 * SPF)
    return to_stereo(0.20 * x * lvl)


def city_glitter():
    """Sparse high pings for the city lights, 0–1.6 s, wide but quiet."""
    r = rng(101)
    out = np.zeros((N, 2))
    notes = [HZ[n] for n in ("D6", "E6", "Fs6", "A6", "B6", "D7")]
    times = np.sort(r.uniform(0.02, 1.55, 26))
    for tm in times:
        f = notes[r.integers(len(notes))] * (1 + r.uniform(-0.002, 0.002))
        L = int(SR * r.uniform(0.25, 0.6))
        n = np.arange(L) / SR
        b = np.sin(2 * np.pi * f * n) * np.exp(-n / r.uniform(0.05, 0.14))
        b += 0.3 * np.sin(2 * np.pi * f * 2.76 * n) * np.exp(-n / 0.03)
        place(out, pan(click_safe(b, 2) * r.uniform(0.25, 1.0), r.uniform(-0.85, 0.85)), int(tm * SR))
    return convolve(out * 0.045, reverb_ir(2.6, 7, 7000, width=1.0), 0.55)


def planet_drone():
    """1.6 s, fading out 4.4–5.4 s: D2/A2 with the sus4 (G) entering; a low-pass follows the
    terminator. No D1 sine: 37 Hz is inaudible on a phone and only eats headroom."""
    x = saw(HZ["D2"], 12) + 0.7 * saw(HZ["A2"], 10)
    x += 0.45 * seg(S["cut"] + 30 * SPF, S["cut"] + 54 * SPF) * saw(HZ["G2"], 10)   # sus4 tension from ~2.6 s
    x = sat(0.5 * x, 2.0)
    # cutoff opens as the lit side sweeps in (1.6 → 4.2 s), then closes as the camera leaves the planet
    fc = 220 + 1500 * seg(S["cut"], S["open"]) - 1300 * seg(S["open"], S["open"] + 24 * SPF)
    y = sweep_lp(x, fc)
    lvl = seg(S["cut"] - 2, S["cut"] + 12 * SPF) * (1 - seg(S["open"] + 6 * SPF, S["open"] + 36 * SPF))
    return to_stereo(0.12 * y * lvl)


def galaxy_pad():
    """4.2–7.2 s: three layers stack during the push-in (a musical build, not picture cues); tension
    (Bb) enters; the space collapses into a room at 7.2 s. A thin, filtered G/Bb stays on "through the
    plate" until the logo, where the chord resolves it (G → F#, Bb → A)."""
    out = np.zeros((N, 2))
    layers = [  # (entry, notes, level)
        (S["open"],        ("D3", "A3"),         0.13),
        (S["layer_mid"],   ("E4", "G4", "Bb4"),  0.04),
        (S["layer_stars"], ("A4", "D5", "E5"),   0.028),
    ]
    hold = np.zeros(N)
    for nm in ("G4", "Bb4"):
        hold += 0.5 * (saw(HZ[nm], 6, detune=-0.1) + saw(HZ[nm], 6, detune=0.1))
    for i, (at, notes, lvl) in enumerate(layers):
        for j, nm in enumerate(notes):
            f = HZ[nm]
            # a detuned pair summed in mono (chorus without phase games between L and R)
            v = 0.5 * (saw(f, 8, detune=-0.12 * (j + 1)) + saw(f, 8, detune=+0.12 * (j + 1)))
            env = seg(at, at + 18 * SPF)
            out[:, 0] += v * env * lvl
            out[:, 1] += v * env * lvl
    # brighten a little as the camera pushes in (capped: a colour change, not a filter-sweep riser)
    fc = 500 + 1700 * seg(S["open"], S["plate"])
    out = np.stack([sweep_lp(out[:, c], fc) for c in range(2)], axis=-1)
    # 7.2 s: space falls away to a room
    out *= (1 - seg(S["plate"], S["plate"] + 9 * SPF))[:, None]
    # the unresolved G/Bb stays, thin and dark, from the plate to the logo, then gives way to the chord
    h_env = seg(S["plate"], S["plate"] + 9 * SPF) * (1 - seg(S["logo"], S["logo"] + 4 * SPF))
    h = lp(hold * h_env, 900) * 0.035
    out += to_stereo(h)
    return convolve(out * 1.5, reverb_ir(3.4, 11, 5000, width=0.3), 0.45)


def star_cloud():
    """Granular star cloud 4.2–7.2 s: grain density and pitch rise in layers with the push-in."""
    r = rng(202)
    out = np.zeros((N, 2))
    pitches = [HZ[n] for n in ("A5", "D6", "E6", "Fs6", "A6", "B6", "D7")]
    t0, t1 = S["open"] / SR, S["plate"] / SR
    tm = t0
    while tm < t1:
        prog = (tm - t0) / (t1 - t0)
        dens = 18 + 62 * prog                               # grains per second, ≤ 80 (thickens, does not accelerate into a riser)
        f = pitches[r.integers(len(pitches))] * (2 if r.random() < prog * 0.25 else 1)
        L = int(SR * r.uniform(0.012, 0.045))
        n = np.arange(L) / SR
        g = np.sin(2 * np.pi * f * n + r.uniform(0, 2 * np.pi)) * np.hanning(L)
        place(out, pan(g * r.uniform(0.2, 1.0), r.uniform(-1, 1)), int(tm * SR))
        tm += r.exponential(1 / dens)
    out *= (0.07 * (0.6 + 0.5 * seg(S["open"], S["plate"])))[:, None]
    out *= (1 - seg(S["plate"], S["plate"] + 6 * SPF))[:, None]
    return convolve(out, reverb_ir(3.0, 13, 9000, width=1.0), 0.6)


# ── LAYER 2 — ARCHIVE: shutter, lightbox, glass, emulsion, counter ───────────
def counter_tick(level=1.0):
    """The tick of a mono readout: a tiny mechanical click with a short metallic ring."""
    L = int(SR * 0.06)
    n = np.arange(L) / SR
    imp = np.zeros(L)
    imp[0] = 1.0
    body = bp(imp, 1800, 6500, 2) * 6
    ring = 0.35 * np.sin(2 * np.pi * 5200 * n) * np.exp(-n / 0.004)
    second = np.zeros(L)
    second[int(0.011 * SR)] = 0.35                           # the escapement's second, smaller click
    second = bp(second, 2500, 7000, 2) * 6
    return click_safe((body + ring + second) * level, 2)


def emulsion_rustle(dur=0.17, seed=303):
    r = rng(seed)
    L = int(SR * dur)
    x = bp(r.standard_normal(L), 2200, 8500, 2)
    env = np.sin(np.pi * np.arange(L) / L) ** 2
    return click_safe(x * env, 3)


def glass_ting(f0, seed=404, tau=0.55):
    """A glass rim: inharmonic partials, each with its own decay. The burst runs 5x the longest
    decay (≈ −43 dB) and then fades out over 40 ms, so the ring dies away instead of being cut."""
    r = rng(seed)
    L = int(SR * 5 * tau)
    n = np.arange(L) / SR
    ratios = [1.0, 2.32, 4.25, 6.63]
    decays = [tau, tau * 0.45, tau * 0.22, tau * 0.11]
    x = sum(np.sin(2 * np.pi * f0 * k * n + r.uniform(0, 1)) * np.exp(-n / d) / (i + 1)
            for i, (k, d) in enumerate(zip(ratios, decays)))
    return click_safe(x, 2, out_ms=40)


def glass_on_glass():
    """Two plates touching: a bright clink and a smaller second contact 45 ms later."""
    a = glass_ting(2637.0, 505) * 0.9
    b = glass_ting(3135.0, 506, tau=0.45) * 0.45
    k = int(0.045 * SR)
    out = np.zeros(max(len(a), k + len(b)))
    out[:len(a)] += a
    out[k:k + len(b)] += b
    return out


def lightbox():
    """The lightbox strikes: two starter ticks, then a low ballast hum that settles. The hum is tuned
    to A (55/110/220/330 Hz), the fifth of D, so it stays in key, and it ducks under the chord."""
    out = np.zeros(N)
    for k, at in enumerate((S["lightbox"], S["lightbox"] + 2 * SPF)):
        place(out, counter_tick(0.6 + 0.2 * k) * 0.8, at)
    hum = (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220 * t)
           + 0.25 * np.sin(2 * np.pi * 330 * t) + 0.1 * np.sin(2 * np.pi * 55 * t))
    hum = sat(hum * 0.5, 1.5)
    env = (seg(S["lightbox"] + 2 * SPF, S["lightbox"] + 10 * SPF)
           * (1 - 0.7 * seg(S["logo"], S["logo"] + 6 * SPF)) * (1 - seg(S["still"], S["end"] - 6 * SPF)))
    flick = 1 + 0.25 * seg(S["lightbox"] + 2 * SPF, S["lightbox"] + 4 * SPF) * (1 - seg(S["lightbox"] + 4 * SPF, S["lightbox"] + 7 * SPF))
    return out + hum * env * flick * 0.022


def stamp_thock():
    L = int(SR * 0.16)
    n = np.arange(L) / SR
    r = rng(606)
    body = np.sin(2 * np.pi * 180 * n) * np.exp(-n / 0.035) + 0.6 * np.sin(2 * np.pi * 410 * n) * np.exp(-n / 0.018)
    hit = lp(r.standard_normal(L), 1400) * np.exp(-n / 0.008) * 0.8
    return click_safe(sat(body + hit, 1.4), 2)


def shutter():
    """A leaf shutter: open click, close click 52 ms later, a faint spring after."""
    L = int(SR * 0.25)
    n = np.arange(L) / SR
    out = np.zeros(L)

    def clk(level):
        imp = np.zeros(L)
        imp[0] = 1
        b = bp(imp, 900, 7000, 2) * 7
        res = (np.sin(2 * np.pi * 2140 * n) * np.exp(-n / 0.012) + 0.6 * np.sin(2 * np.pi * 3420 * n) * np.exp(-n / 0.008))
        return (b + 0.35 * res) * level

    out += clk(1.0)
    k = int(0.052 * SR)
    out[k:] += clk(0.7)[: L - k]
    out += 0.05 * np.sin(2 * np.pi * 1180 * n) * np.exp(-n / 0.08)
    return click_safe(out, 2)


def archive_events():
    """(cue, dry burst) pairs; each is placed at exactly frame x 1600 samples."""
    return [
        ("lock", counter_tick() * 0.42),
        ("wipe", emulsion_rustle() * 0.10),
        ("promise", glass_ting(HZ["A5"] * 2) * 0.05),        # A6: a quiet accent, not louder than the text
        ("readout", counter_tick() * 0.30),
        ("plate", glass_on_glass() * 0.15),                  # restrained: a touch of glass, not a hit
        ("stamp", stamp_thock() * 0.30),
        ("logo", shutter() * 0.36),
    ]


def archive_layer():
    out = np.zeros(N)
    for key, burst in archive_events():
        place(out, burst, S[key])
    out += lightbox()                                        # starter ticks at "lightbox" (+2 frames), then hum
    # archive sounds live in a small room, not in space
    return convolve(to_stereo(out), reverb_ir(0.45, 17, 6000, predelay_ms=4, width=0.3), 0.22)


# ── LAYER 3 — IMPACT: the match cut ──────────────────────────────────────────
def impact_burst():
    """The dry match-cut burst: a short damped thump, not a trailer sub-drop. Its tail is gone
    (≈ −35 dB) before text 2 at 2.27 s."""
    L = int(SR * 2.2)
    n = np.arange(L) / SR
    f = 42 + 14 * np.exp(-n / 0.05)                       # 56 → 42 Hz: a slight settle, not a dive
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-n / 0.25)
    body = sat(sub * 1.4, 2.2)                            # tanh: odd harmonics (3rd/5th), audible on a phone
    r = rng(707)
    thump = lp(r.standard_normal(L), 180, 4) * np.exp(-n / 0.03) * 0.9
    tone = 0.25 * np.sin(2 * np.pi * HZ["D2"] * n) * (1 - np.exp(-n / 0.15)) * np.exp(-n / 0.9)
    return click_safe(body + thump + tone, 2, out_ms=20)


def impact():
    """1.6 s: deep, short and damped; the D2 tail hands over to the planet drone."""
    out = np.zeros(N)
    place(out, impact_burst(), S["cut"])
    out = lp(out, 900) * 0.39                             # −3 dB against v1
    wet = convolve(to_stereo(hp(out, 120)), reverb_ir(2.4, 19, 2500, width=0.2), 1.0)
    return to_stereo(out) * 0.7 + wet * 0.3               # reverb fed from 120 Hz up only


# ── LAYER 4 — CHORD: resolution at the logo ──────────────────────────────────
def chord():
    """D major add9, open voicing; a soft attack so the shutter is the transient.
    Decays naturally into the end; the orbit drone carries the loop seam."""
    voicing = [("D2", 0.9), ("A2", 0.7), ("Fs3", 0.55), ("E4", 0.32), ("A4", 0.28), ("D5", 0.2)]
    out = np.zeros((N, 2))
    for i, (nm, a) in enumerate(voicing):
        f = HZ[nm]
        v = 0.5 * (saw(f, 9, detune=-0.08 * (i + 1)) + saw(f, 9, detune=+0.08 * (i + 1)))
        out[:, 0] += v * a
        out[:, 1] += v * a
    att = seg(S["logo"], S["logo"] + int(0.07 * SR))
    dec = np.ones(N)
    k = np.arange(N - S["logo"])
    dec[S["logo"]:] = np.exp(-k / (1.8 * SR))             # long, warm tail: ≈ −7.7 dB by 10.0 s
    env = att * dec * (1 - seg(S["end"] - 18 * SPF, S["end"] - 1 * SPF))   # hands over to the drone for the loop
    env[: S["logo"]] = 0
    out *= env[:, None]
    out = np.stack([lp(out[:, c], 2400) for c in range(2)], axis=-1)
    out = sat(out * 0.5, 1.3) * 0.36
    out = convolve(out, reverb_ir(3.0, 23, 4500, width=0.3), 0.35)
    return out


# ── Master ──────────────────────────────────────────────────────────────────
def truepeak_limit(x, ceiling_db=-1.5, release_ms=80.0, look_ms=1.5):
    """Lookahead limiter on the 4x-oversampled peak (inter-sample peaks included)."""
    ceil = 10 ** (ceiling_db / 20)
    os_ = signal.resample_poly(x, 4, 1, axis=0)
    peak = np.max(np.abs(os_), axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-12))
    look = int(SR * look_ms / 1000)
    # look ahead: the gain must already be down when the peak arrives
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    need = minimum_filter1d(need, size=2 * look + 1, origin=0)
    # smooth attack: averaging over ±look/2 of a ±look minimum never rises above the need at the peak
    need = uniform_filter1d(need, size=look + 1)
    g = np.empty_like(need)
    a_rel = np.exp(-1 / (SR * release_ms / 1000))
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else v + (cur - v) * a_rel
        g[i] = cur
    return x * g[:, None]


def build():
    space_drone = orbit_drone()
    stems = {
        "ruimte-drones": city_glitter() + planet_drone() + galaxy_pad() + star_cloud(),
        "archiefgeluiden": archive_layer(),
        "impacts": impact(),
        "akkoord": chord(),
    }
    # Loop seam: in the last 20 ms everything except the orbit drone fades to zero, so 10.0 s → 0.0 s
    # joins drone to drone. The drone itself completes whole cycles in 10 s (sample N == sample 0).
    k = int(0.020 * SR)
    seam = np.ones(N)
    seam[-k:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k))
    for name in stems:
        stems[name] = stems[name] * seam[:, None]
    stems["ruimte-drones"] = stems["ruimte-drones"] + space_drone
    mix = sum(stems.values())
    mix = mix - mix.mean(axis=0)                             # no DC offset
    meter = pyln.Meter(SR)
    gain = 1.0
    for _ in range(5):                                       # loudness → -14 LUFS under a -1.5 dBTP ceiling
        out = truepeak_limit(mix * gain)
        gain *= 10 ** ((-14.0 - meter.integrated_loudness(out)) / 20)
    return stems, truepeak_limit(mix * gain), gain


def write(path, x, subtype="PCM_24"):
    sf.write(path, x.astype(np.float64), SR, subtype=subtype)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    stems, master, gain = build()
    for name, x in stems.items():
        # same master gain, before the limiter (24-bit: float WAVs carry a timestamped PEAK chunk,
        # which would break bit-identical output)
        stem = (x - x.mean(axis=0)) * gain
        assert np.abs(stem).max() < 1.0, f"stem {name} would clip"
        write(OUT / f"stem-{name}.wav", stem)
    write(OUT / "nightgazer-social-v2-master.wav", master)
    meter = pyln.Meter(SR)
    mix = sum(stems.values()) * gain
    pre = 20 * np.log10(np.abs(mix).max())
    blk = lambda x: np.abs(x[: N // 480 * 480]).max(axis=1).reshape(-1, 480).max(axis=1)   # 10 ms block peaks
    gr = 20 * np.log10(np.max(blk(mix) / np.maximum(blk(master), 1e-12)))
    print(f"master gain {20*np.log10(gain):+.2f} dB · integrated {meter.integrated_loudness(master):.2f} LUFS"
          f" · pre-limiter peak {pre:+.2f} dBFS · max gain reduction {gr:.2f} dB")
