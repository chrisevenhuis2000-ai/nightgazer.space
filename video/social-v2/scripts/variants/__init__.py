"""Soundtrack variants for NightGazer social v2.

Each module builds only its stems and returns them to the shared engine in scripts/sound.py:

    stems() -> (dict name -> (N, 2) array, loop_bed or None, loop_stem or None)
    TRANSIENTS = [(cue, label), ...]   # the cues the verifier checks with onset detection

Cue grid, DSP kit, archive sounds and the master chain (seam, DC, loudness, true-peak limiter) are
imported from sound.py, never copied.
"""
