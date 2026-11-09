#!/usr/bin/env python3
"""Maak een voice-over-variant voor de stemproef.

  maak.py voxcpm     <reel.json> <uitmap> [--stappen 24] [--cfg 2.0] [--prompt ja|nee] [--modus blok|zin] [--seeds 4]
  maak.py chatterbox <reel.json> <uitmap> [--cfg 0.5] [--exag 0.5] [--seeds 4]

Per blok (2–3 zinnen uit "blokken" in de reel-json, of per zin met --modus zin) maakt het model --seeds takes; elke
take wordt op de zinsgrenzen geknipt en gescoord op natuurlijkheid (gemeen.natuur_score: tempo rond 170 wpm,
toonhoogtevariatie binnen een band, val/stijging aan het eind, geen haperingen, met ASR ook verspreking). De beste
wint. Daarna: achter elkaar met gevarieerde pauzes (150–400 ms) en de lichte nabewerking.

Schrijft in <uitmap>: vo.wav (48 kHz mono, nabewerkt), vo-droog.wav, tijden.json (het contract), log.json, takes/.
Draai VoxCPM2 met /opt/voicestudio/.venv-voxcpm/bin/python, Chatterbox met zijn eigen venv. Op de LXC altijd binnen
de render-slot: /opt/nightgazer-social/scripts/render-slot.sh <python> maak.py …
"""
import argparse, json, os, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
import soundfile as sf
import librosa
import gemeen as G

ap = argparse.ArgumentParser()
ap.add_argument('model', choices=['voxcpm', 'chatterbox'])
ap.add_argument('reel'); ap.add_argument('uit')
ap.add_argument('--stappen', type=int, default=24)
ap.add_argument('--cfg', type=float, default=None)
ap.add_argument('--exag', type=float, default=0.5)
ap.add_argument('--prompt', choices=['ja', 'nee'], default='ja')
ap.add_argument('--modus', choices=['blok', 'zin'], default='blok')
ap.add_argument('--seeds', type=int, default=4)
ap.add_argument('--seed0', type=int, default=7000)
ap.add_argument('--asr', choices=['ja', 'nee'], default='ja')
ap.add_argument('--stem', default=os.environ.get('STEM_G', '/opt/voicestudio/stemmen/g'))
a = ap.parse_args()

reel = json.loads(Path(a.reel).read_text())
lijnen = reel['lijnen']
blokken = reel['blokken'] if a.modus == 'blok' else [[i + 1] for i in range(len(lijnen))]
assert sorted(i for b in blokken for i in b) == list(range(1, len(lijnen) + 1)), 'blokken dekken de zinnen niet'
uit = Path(a.uit); (uit / 'takes').mkdir(parents=True, exist_ok=True)
gdir = Path(a.stem)
S = json.loads((gdir / 'stem.json').read_text())
REF, TRANS = str(gdir / 'referentie.flac'), S['referentie']['transcript']

import torch
if a.model == 'voxcpm':
    from voxcpm import VoxCPM
    SNAP = Path(sys.prefix).parent / 'hf/hub/models--openbmb--VoxCPM2/snapshots' / S['model_revisie']
    m = VoxCPM.from_pretrained(str(SNAP), load_denoiser=False, optimize=False, device='cuda')
    msr = m.tts_model.sample_rate
    cfg = 2.0 if a.cfg is None else a.cfg

    def spreek(tekst):
        kw = dict(text=tekst, reference_wav_path=REF, cfg_value=cfg, inference_timesteps=a.stappen)
        if a.prompt == 'ja': kw.update(prompt_wav_path=REF, prompt_text=TRANS)
        return np.asarray(m.generate(**kw), dtype=np.float64)
else:
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    try:
        m = ChatterboxMultilingualTTS.from_pretrained(device='cuda', t3_model='v3')
    except TypeError:
        m = ChatterboxMultilingualTTS.from_pretrained(device='cuda')
    msr = m.sr
    cfg = 0.5 if a.cfg is None else a.cfg

    def spreek(tekst):
        try:
            w = m.generate(tekst, language_id='nl', audio_prompt_path=REF, exaggeration=a.exag, cfg_weight=cfg)
        except TypeError:
            w = m.generate(tekst, language_id='nl', audio_prompt_path=REF, cfg_weight=cfg)
        return np.asarray(w.squeeze().detach().cpu().numpy(), dtype=np.float64)

asr = G.maak_asr() if a.asr == 'ja' else None
print(f'{a.model}: cfg {cfg}, stappen {a.stappen}, prompt {a.prompt}, modus {a.modus}, asr {"ja" if asr else "nee"}', flush=True)

log = dict(model=a.model, cfg=cfg, stappen=a.stappen, prompt=a.prompt, modus=a.modus, exag=a.exag, blokken=[])
t0 = time.time()
beste_audio, beste_grenzen = [], []
for bi, blok in enumerate(blokken):
    teksten = [lijnen[i - 1]['spreek'] for i in blok]
    tekst = ' '.join(teksten)
    kand = []
    for k in range(a.seeds):
        seed = a.seed0 + 100 * bi + k
        torch.manual_seed(seed); np.random.seed(seed)
        w = spreek(tekst)
        if msr != G.SR: w = librosa.resample(w, orig_sr=msr, target_sr=G.SR)
        w = w / max(1e-6, np.abs(w).max()) * 0.7
        grenzen = G.knip(w, teksten)
        sc, info = G.natuur_score(w, teksten, grenzen, asr)
        sf.write(uit / 'takes' / f'blok{bi + 1:02d}-seed{seed}.wav', w, G.SR, subtype='PCM_24')
        kand.append((sc, seed, w, grenzen, info))
        print(f'  blok {bi + 1} seed {seed}: score {sc:.2f} {info}', flush=True)
    kand.sort(key=lambda x: -x[0])
    sc, seed, w, grenzen, info = kand[0]
    if grenzen is None:
        sys.exit(f'blok {bi + 1}: geen take die op de zinsgrenzen te knippen is')
    beste_audio.append(w); beste_grenzen.append(grenzen)
    log['blokken'].append(dict(blok=blok, seed=seed, score=round(sc, 2), info=info,
                               alle=[dict(seed=s, score=round(x, 2), info=i) for x, s, _, _, i in kand]))

pauzes = G.pauze_plan(lijnen, blokken, seed=len(lijnen))
spoor, tijden = G.leg_achter_elkaar(beste_audio, beste_grenzen, blokken, lijnen, pauzes)
sf.write(uit / 'vo-droog.wav', spoor, G.SR, subtype='PCM_24')
G.nabewerking(spoor, uit / 'vo.wav')
G.schrijf_tijden(uit / 'tijden.json', tijden)
log['seconden'] = round(time.time() - t0, 1)
log['vram_piek_gib'] = round(torch.cuda.max_memory_allocated() / 2 ** 30, 2) if torch.cuda.is_available() else None
log['meting'] = G.meet_spoor(G.lees(uit / 'vo.wav'), tijden, lijnen)['totaal']
(uit / 'log.json').write_text(json.dumps(log, indent=1, ensure_ascii=False))
print(f'klaar: {uit}/vo.wav, {tijden["dur"]} s, {log["seconden"]} s rekentijd, VRAM {log["vram_piek_gib"]} GiB', flush=True)
print(json.dumps(log['meting'], ensure_ascii=False))
