#!/usr/bin/env python3
"""Lay the voice-over lines on one track and write their timings.

  python3 -I scripts/tijden.py out/<id>

Reads out/<id>/vo/lijn-01.wav … (one take per script line, any rate), trims leading/trailing silence,
places them with short pauses (longer after a full stop) and writes:
  out/<id>/vo.wav       48 kHz mono 16-bit
  out/<id>/tijden.json  {"lijnen": [[start, end], ...], "dur": seconds}
Only needs ffmpeg/ffprobe and the standard library.
"""
import json, subprocess, sys, wave
from pathlib import Path

START, OUTRO, SR = 0.35, 1.9, 48000
PAUZE_PUNT, PAUZE_KOMMA, PAUZE = 0.30, 0.10, 0.20


def pcm(path):
    # trim silence at both ends (-45 dB), resample to 48k mono s16
    flt = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
           "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
           "afade=t=in:d=0.01,areverse,afade=t=in:d=0.04,areverse")
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", flt, "-ac", "1", "-ar", str(SR),
                          "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return out


def main():
    d = Path(sys.argv[1])
    rid = d.name
    reel = json.loads((Path(__file__).resolve().parent.parent / "reels" / f"{rid}.json").read_text())
    takes = sorted((d / "vo").glob("lijn-*.wav"))
    assert len(takes) == len(reel["lijnen"]), f"{len(takes)} takes, {len(reel['lijnen'])} lijnen"
    buf, t, tijden = bytearray(b"\0\0" * int(START * SR)), START, []
    for i, (take, lijn) in enumerate(zip(takes, reel["lijnen"])):
        a = pcm(take)
        dur = len(a) / 2 / SR
        tijden.append([round(t, 3), round(t + dur, 3)])
        buf += a
        t += dur
        if i < len(takes) - 1:
            end = lijn["tekst"].rstrip("*").rstrip()
            gap = PAUZE_PUNT if end.endswith((".", "?", "!")) else PAUZE_KOMMA if end.endswith(",") else PAUZE
            buf += b"\0\0" * int(gap * SR)
            t += gap
    total = t + OUTRO
    buf += b"\0\0" * int(OUTRO * SR)
    with wave.open(str(d / "vo.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(buf))
    (d / "tijden.json").write_text(json.dumps({"lijnen": tijden, "dur": round(total, 3)}, indent=1))
    print(f"{rid}: {len(tijden)} lijnen, spraak tot {t:.2f} s, totaal {total:.2f} s")


main()
