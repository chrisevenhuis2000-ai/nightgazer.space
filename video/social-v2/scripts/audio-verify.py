"""Measures the NightGazer social v2 soundtrack: format, loudness, true peak, mono, DC, seams,
text-moment levels, sync against the cue grid, and a spectrogram with the cues drawn on.

    python3 scripts/audio-verify.py [--variant elevenlabs|huidig|orgel|puls|sonificatie] [path/to/file.mp4 ...]

Prints a report (also used for AUDIO.md) and writes spectrogram.png next to the variant's master.
With an MP4 given, loudness is also measured on it and sync is measured on its decoded audio.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
from sound import CUES, DEFAULT, SPF, SR, N, S as CUE_SAMPLES, VARIANTS, archive_events, impact_burst, master_path, place  # noqa: E402

# The four main cues every soundtrack must hit within ±1 frame.
MAIN_CUES = ("cut", "open", "plate", "logo")

# Where each cue lives in the picture: (file, selector or constant, "start" | "end" of the tween).
# The verifier reads the time from the composition itself, so a picture edit that is not followed by
# the soundtrack fails here instead of silently drifting.
PICTURE = {
    "lock":    ("compositions/plate.html",  "#plate-cross-ring", "end"),    # the ring is fixed when the tween ends
    "wipe":    ("compositions/titles.html", "#titles-wipe",      "start"),
    "cut":     ("compositions/stage.html",  "CUT_PLANET",        "const"),
    "open":    ("compositions/stage.html",  "DOLLY",             "const"),
    "promise": ("compositions/titles.html", "#titles-promise",   "start"),
    "readout": ("compositions/plate.html",  "#plate-m74",        "start"),
    "plate":   ("compositions/stage.html",  "PLATE",             "const"),
    # no tween of its own: the lightbox is revealed by the plate lift (power3.out from PLATE), 3 frames in
    "lightbox": ("compositions/stage.html", "PLATE",             "const", 0.1),
    "stamp":   ("compositions/plate.html",  "#plate-stamp",      "start"),
    "logo":    ("compositions/titles.html", "#titles-logo",      "start"),
}


def picture_time(path, key, kind, offset=0.0):
    src = Path(path).read_text()
    if kind == "const":
        return float(re.search(rf"const {key} = ([0-9.]+);", src).group(1)) + offset
    i = src.index(f'tl.fromTo("{key}"') if f'tl.fromTo("{key}"' in src else src.index(f'tl.set("{key}"')
    stmt = src[i: src.index(");", i)]
    pos = float(re.findall(r"([0-9.]+)\s*$", stmt)[0])
    dur = re.search(r"duration: ([0-9.]+)", stmt)
    return pos + (float(dur.group(1)) if kind == "end" and dur else 0.0)


# Cues that are transients in the mix (what onset detection should find), and the stem they live in.
TRANSIENTS = [
    ("lock",     "kruisje vergrendelt: tik",          "archiefgeluiden"),
    ("wipe",     "hook weg: emulsie-ritsel",          "archiefgeluiden"),
    ("cut",      "match-cut: impact",                 "impacts"),
    ("open",     "M74 gaat open: pad-zwelling (geen klap)", "ruimte-drones"),
    ("promise",  "tekst 2: glas-accent",              "archiefgeluiden"),
    ("readout",  "M74-uitlezing: tik",                "archiefgeluiden"),
    ("plate",    "glasplaat: glas op glas",           "archiefgeluiden"),
    ("lightbox", "lichtbak in beeld: starter-tik",    "archiefgeluiden"),
    ("stamp",    "plaatnummer: stempel",              "archiefgeluiden"),
    ("logo",     "logo: sluiterklik + akkoord",       "archiefgeluiden"),
]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ffmpeg_loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                        "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    js = r.stderr[r.stderr.rfind("{"): r.stderr.rfind("}") + 1]
    d = json.loads(js)
    return {"integrated_LUFS": float(d["input_i"]), "true_peak_dBTP": float(d["input_tp"]),
            "LRA_LU": float(d["input_lra"]), "threshold": float(d["input_thresh"])}


def k_weighted_short_term(x, win=0.4, hop=0.1):
    """Momentary loudness (400 ms, BS.1770 K-weighting) every 100 ms, in LUFS."""
    import pyloudnorm as pyln
    m = pyln.Meter(SR, block_size=win)
    vals, times = [], []
    w, h = int(win * SR), int(hop * SR)
    for i in range(0, len(x) - w, h):
        try:
            vals.append(m.integrated_loudness(x[i:i + w]))
        except Exception:
            vals.append(-70.0)
        times.append((i + w / 2) / SR)
    v = np.array(vals)
    v[~np.isfinite(v)] = -70.0
    return np.array(times), v


def decode(path):
    """The audio of an MP4 as float64 stereo, exactly as a player decodes it."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0", "-f", "f32le", "-ac", "2",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def main(variant, extra):
    MASTER = master_path(variant)
    OUT = MASTER.parent
    if variant == "huidig":
        transients = TRANSIENTS
        grid = None
    else:
        import importlib
        mod = importlib.import_module(f"variants.{variant}")
        transients = [(k, label, None) for k, label in mod.TRANSIENTS]
        grid = getattr(mod, "BPM", None)
    x, sr = sf.read(MASTER, dtype="float64", always_2d=True)
    info = sf.info(MASTER)
    rep = {"format": f"{info.samplerate} Hz · {info.subtype} · {info.channels} ch · {info.frames} samples",
           "sha256_master": sha(MASTER)}

    # Loudness and peak (ffmpeg, as specified)
    rep["loudness_master_wav"] = ffmpeg_loudness(MASTER)
    for p in extra:
        rep[f"loudness_{Path(p).name}"] = ffmpeg_loudness(p)

    # Mono compatibility
    L, R = x[:, 0], x[:, 1]
    corr = float(np.sum(L * R) / np.sqrt(np.sum(L * L) * np.sum(R * R)))
    wins = [(L[i:i + 4800], R[i:i + 4800]) for i in range(0, len(L) - 4800, 4800)]
    wc = [np.sum(a * b) / np.sqrt(np.sum(a * a) * np.sum(b * b)) for a, b in wins if np.sum(a * a) > 1e-9]
    import pyloudnorm as pyln
    m = pyln.Meter(SR)
    mono = (0.5 * (L + R))[:, None].repeat(2, axis=1)
    rep["mono"] = {"correlation_overall": round(corr, 3), "correlation_mean_100ms": round(float(np.mean(wc)), 3),
                   "correlation_min_100ms": round(float(np.min(wc)), 3),
                   "loudness_drop_mono_LU": round(m.integrated_loudness(x) - m.integrated_loudness(mono), 2)}

    # DC, seams, loop
    rep["dc_offset"] = [float(f"{v:.2e}") for v in x.mean(axis=0)]
    step = np.abs(np.diff(x, axis=0)).max(axis=1)
    rep["seam"] = {"first_sample": [round(float(v), 6) for v in x[0]], "last_sample": [round(float(v), 6) for v in x[-1]],
                   "loop_jump_end_to_start": round(float(np.abs(x[-1] - x[0]).max()), 6),
                   "typical_step_p99": round(float(np.percentile(step, 99)), 6)}
    stems = {p.stem.replace("stem-", ""): sf.read(p, dtype="float64", always_2d=True)[0] for p in sorted(OUT.glob("stem-*.wav"))}
    rep["stems_edges"] = {k: {"start": round(float(np.abs(v[0]).max()), 6), "end": round(float(np.abs(v[-1]).max()), 6)}
                          for k, v in stems.items()}

    # Text moments must not be the busiest: momentary loudness inside text windows vs. the whole
    tt, mom = k_weighted_short_term(x)
    def mx(a, b): return float(mom[(tt >= a) & (tt < b)].max())
    rep["momentary_LUFS"] = {
        "hook 0.0–1.43 (tekst)": round(mx(0.0, 1.43), 1),
        "match-cut 1.6–2.2": round(mx(1.6, 2.2), 1),
        "tekst 2 2.27–3.8": round(mx(2.27, 3.8), 1),
        "push-in 4.2–7.2": round(mx(4.2, 7.2), 1),
        "eindkaart 8.4–10 (tekst)": round(mx(8.4, 10.0), 1),
        "max overall": round(float(mom.max()), 1),
    }
    texts = [mx(0.0, 1.43), mx(2.27, 3.8), mx(8.4, 10.0)]
    # Phone speaker stand-in: what is left after a 200 Hz–12 kHz band-pass (a small speaker plays little below 200 Hz)
    from scipy import signal as sig
    sos = sig.butter(4, [200, 12000], "band", fs=SR, output="sos")
    ph = sig.sosfilt(sos, x, axis=0)
    tp, momp = k_weighted_short_term(ph)
    rep["phone_band_200_12k"] = {
        "integrated_LUFS": round(m.integrated_loudness(ph), 1),
        "hook_max_LUFS": round(float(momp[(tp >= 0) & (tp < 1.43)].max()), 1),
        "energy_below_80Hz_pct": round(100 * float(np.sum(sig.sosfilt(sig.butter(4, 80, "low", fs=SR, output="sos"), x, axis=0) ** 2) / np.sum(x ** 2)), 0),
    }
    rep["tekst_niet_het_drukst"] = bool(max(texts) < float(mom.max()) - 0.05)

    # Sync: (a) onsets in the mix; (b) sample-exact start of each cue in its stem
    mono1 = 0.5 * (L + R)
    # sync is measured on what a viewer hears: the decoded MP4 audio when one is given
    sync_src = decode(extra[0])[:N] if extra else x
    rep["sync_measured_on"] = Path(extra[0]).name if extra else MASTER.name
    sync_mono = 0.5 * (sync_src[:, 0] + sync_src[:, 1])
    hop = 64
    env = librosa.onset.onset_strength(y=sync_mono.astype(np.float32), sr=SR, hop_length=hop, n_fft=1024)
    onsets = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=hop, units="samples", backtrack=False,
                                        pre_max=8, post_max=8, pre_avg=40, post_avg=40, delta=0.07, wait=8)
    # (b) dry placement, from the real bursts: each cue's sound alone, placed as the synthesis places it
    bursts = {}
    if variant in ("huidig", "elevenlabs"):     # both use the engine's archive sounds and impact
        bursts = dict(archive_events())
        bursts["cut"] = impact_burst()
    import sound
    bursts["lightbox"] = sound.counter_tick(0.6) * 0.8
    rows = []
    for key, label, stem in transients:
        exp = CUES[key] * SPF
        pic = picture_time(*PICTURE[key])
        pic_frame = round(pic * 30, 3)
        first = None
        if key in bursts:
            buf = np.zeros(N)
            place(buf, bursts[key], CUE_SAMPLES[key])
            first = int(np.argmax(np.abs(buf) > 0))
        # (a) mix: strongest onset within ±1 frame of the cue, and how strong it is against the median onset
        lo, hi = exp - SPF, exp + SPF
        cand = onsets[(onsets >= lo) & (onsets <= hi)]
        if len(cand):
            near = int(cand[np.argmax(env[cand // hop])])
            strength = float(env[near // hop] / np.median(env[env > 0]))
        else:
            near, strength = None, 0.0
        dev_ms = None if near is None else (near - exp) / SR * 1000
        rows.append({"cue": key, "beeld": label, "frame": CUES[key], "verwacht_s": round(exp / SR, 4),
                     "beeld_in_compositie_s": round(pic, 4),
                     "cue_gelijk_aan_beeld": abs(pic_frame - CUES[key]) < 0.02,
                     "sample": exp, "mix_onset_s": None if near is None else round(near / SR, 4),
                     "afwijking_ms": None if dev_ms is None else round(dev_ms, 1),
                     "afwijking_frames": None if dev_ms is None else round(dev_ms / (1000 / 30), 2),
                     "onset_sterkte_x_mediaan": round(strength, 1),
                     "droog_eerste_sample": first,
                     # bursts start AT the cue sample with a ≥2 ms fade-in, so sample 0 of the burst is 0.0
                     # and the first non-zero sample is cue+1
                     "sample_exact": None if first is None else 0 <= first - exp <= 1,
                     "hoofdcue": key in MAIN_CUES,
                     "ok": near is not None and strength >= 2.0 and abs(pic_frame - CUES[key]) < 0.02})
    rep["sync"] = rows
    rep["sync_all_ok"] = all(r["ok"] for r in rows)
    rep["main_cues_ok"] = all(r["ok"] for r in rows if r["cue"] in MAIN_CUES)

    # Spectrogram with the cues
    S = librosa.amplitude_to_db(np.abs(librosa.stft(mono1.astype(np.float32), n_fft=4096, hop_length=256)), ref=np.max)
    fig, ax = plt.subplots(figsize=(16, 7), dpi=110)
    img = librosa.display.specshow(S, sr=SR, hop_length=256, x_axis="time", y_axis="log", ax=ax, cmap="magma", vmin=-90, vmax=0)
    if grid:   # rhythmic variant: its beat grid as faint lines (16ths are 0.1 s = 3 frames at 150 BPM)
        for b in np.arange(0, 10.0, 60 / grid):
            ax.axvline(b, color="#EEF2FB", lw=0.4, alpha=0.25)
    keep = {k for k, _, _ in transients} | set(MAIN_CUES)
    marks = [(k, f) for k, f in sorted(CUES.items(), key=lambda kv: kv[1])
             if k not in ("start", "end", "promise_out") and (variant == "huidig" or k in keep)]
    for i, (key, frame) in enumerate(marks):
        tsec = frame * SPF / SR
        ax.axvline(tsec, color="#3DCFDF", lw=1.6 if key in MAIN_CUES else 0.9, alpha=0.9)
        ax.text(tsec + 0.03, 15000 if i % 2 == 0 else 9000, f"{key}\n{tsec:.3f}s", color="#EEF2FB", fontsize=8, va="top")
    ax.set_title(f"NightGazer social v2 — variant '{variant}' — mix (mono), cues als verticale lijnen (dik = hoofdcue)")
    fig.colorbar(img, ax=ax, format="%+2.0f dB")
    fig.tight_layout()
    fig.savefig(OUT / "spectrogram.png")
    print(json.dumps(rep, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    import librosa.display  # noqa: F401
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant", default=DEFAULT, choices=("huidig",) + VARIANTS)
    ap.add_argument("mp4", nargs="*")
    a = ap.parse_args()
    main(a.variant, a.mp4)
