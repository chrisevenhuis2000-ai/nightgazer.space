"""Lays the seven voice-over takes (r1..r7.wav in DIR) on the beat grid from klank/voiceover.json.
Usage: python3 klank/vo-bouw.py DIR assets/audio/voiceover.flac   (needs ffmpeg and numpy)"""
import json, subprocess, sys
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
starts = json.load(open("klank/voiceover.json"))["start_s"]
sr, dur = 48000, 37.0
out = np.zeros(int(sr * dur))
for k, t in starts.items():
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{src}/{k}.wav", "-f", "f64le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float64)
    i = int(t * sr)
    out[i:i + len(a)] += a
    print(f"{k} {t:5.2f} -> {t + len(a) / sr:5.2f}")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f64le", "-ar", str(sr), "-ac", "1", "-i", "-",
                "-c:a", "flac", "-sample_fmt", "s32", dst], input=out.tobytes(), check=True)
