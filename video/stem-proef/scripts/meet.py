#!/usr/bin/env python3
"""Diagnose van een voice-over: per zin duur, tempo, F0 (mediaan, spreiding en bereik in halve tonen, begin/eind
t.o.v. de mediaan), haperingen; en over het spoor: wpm, pauzes (gemiddeld en spreiding), LRA, stilte tussen de zinnen.

  meet.py <vo.wav> <tijden.json> <reel.json> [--naam X] [--json uit.json]
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gemeen as G

ap = argparse.ArgumentParser()
ap.add_argument('vo'); ap.add_argument('tijden'); ap.add_argument('reel')
ap.add_argument('--naam', default=None); ap.add_argument('--json', default=None)
a = ap.parse_args()
tijden = json.loads(Path(a.tijden).read_text())
lijnen = json.loads(Path(a.reel).read_text())['lijnen']
m = G.meet_spoor(G.lees(a.vo), tijden, lijnen)
naam = a.naam or Path(a.vo).parent.name
print(f'## {naam}')
print('| # | zin | dur s | wpm | F0 Hz | sd st | bereik st | begin st | eind st | gat s |')
print('|---|---|---|---|---|---|---|---|---|---|')
for i, (z, l) in enumerate(zip(m['zinnen'], lijnen), 1):
    print(f"| {i} | {l['spreek']} | {z['dur']} | {z.get('wpm', '')} | {z.get('f0', '')} | {z.get('f0_sd_st', '')} | "
          f"{z.get('f0_bereik_st', '')} | {z.get('begin_st', '')} | {z.get('eind_st', '')} | {z.get('max_gat', '')} |")
print('\npauzes (s):', m['pauzes'])
print('totaal:', json.dumps(m['totaal'], ensure_ascii=False))
if a.json:
    Path(a.json).write_text(json.dumps(dict(naam=naam, **m), indent=1, ensure_ascii=False))
