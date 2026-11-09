"""Gedeeld door de stemproef: meten, een blok-take op de zinsgrenzen knippen, takes scoren op natuurlijkheid,
de stem achter elkaar leggen met gevarieerde pauzes en roomtone, en de lichte nabewerking.

Alleen numpy, soundfile en librosa (staan in /opt/voicestudio/.venv-voxcpm) plus ffmpeg.
Het contract naar de reel blijft tijden.json: {"lijnen": [[start, eind], ...], "dur": s}, zoals scripts/tijden.py
van video/stijl-proef en src/render/stem.ts in nightgazer-social het schrijven.
"""
import json, random, re, subprocess, tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa

SR = 48000
START, OUTRO = 0.35, 1.9            # zelfde als de huidige stem G (SPREEK.start / afsluiter)
DOEL_WPM = 170                      # natuurlijke NL voice-over voor korte video: ~150–170, wij mikken op de bovenkant
F0_SD_BAND = (2.0, 4.5)             # spreiding van de toonhoogte binnen een zin, in halve tonen
F0_BAND = (95, 150)                 # identiteit van stem G (mediaan)


# ── meten ────────────────────────────────────────────────────────────────

def lees(pad, sr=SR):
    y, s = sf.read(str(pad), dtype='float64', always_2d=True)
    y = y.mean(axis=1)
    return librosa.resample(y, orig_sr=s, target_sr=sr) if s != sr else y


def env_db(y, sr=SR, win=0.01):
    n = int(win * sr)
    e = np.sqrt(np.convolve(y ** 2, np.ones(n) / n, 'same') + 1e-12)
    return 20 * np.log10(e / (e.max() + 1e-12))


def f0_contour(y, sr=SR):
    """pyin op 16 kHz; geeft (tijden, f0 met nan voor ongestemd)."""
    z = librosa.resample(np.asarray(y, dtype=np.float32), orig_sr=sr, target_sr=16000)
    f, v, _ = librosa.pyin(z, fmin=60, fmax=320, sr=16000, frame_length=1024, hop_length=160)
    t = librosa.frames_to_time(np.arange(len(f)), sr=16000, hop_length=160)
    f = np.where(v, f, np.nan)
    return t, f


def zin_maten(y, a, b, t, f, tekst=''):
    """Maten van één zin (a..b in s) uit een al berekende F0-contour."""
    m = (t >= a) & (t <= b)
    ff = f[m]
    gestemd = float(np.mean(~np.isnan(ff))) if len(ff) else 0.0
    ff = ff[~np.isnan(ff)]
    d = dict(dur=round(b - a, 3), gestemd=round(gestemd, 2))
    woorden = len(tekst.split())
    if tekst:
        d['tps'] = round(len(tekst) / max(b - a, 1e-3), 1)
        d['wpm'] = round(woorden / max(b - a, 1e-3) * 60)
    if len(ff) >= 8:
        st = 12 * np.log2(ff / np.median(ff))
        n = len(ff); k = max(3, n // 5)
        d.update(f0=round(float(np.median(ff)), 1), f0_sd_st=round(float(np.std(st)), 2),
                 f0_bereik_st=round(float(np.percentile(st, 95) - np.percentile(st, 5)), 1),
                 begin_st=round(float(np.median(st[:k])), 1), eind_st=round(float(np.median(st[-k:])), 1),
                 piek_pos=round(float(np.argmax(st) / n), 2))
    # haperingen: een stilte binnen de zin langer dan 0,45 s
    seg = y[int(a * SR):int(b * SR)]
    if len(seg) > SR // 10:
        e = env_db(seg)
        stil = e < -38
        lang, run = 0, 0
        for s in stil:
            run = run + 1 if s else 0
            lang = max(lang, run)
        d['max_gat'] = round(lang / SR, 2)
    return d


def lra(y, sr=SR):
    """LRA (EBU R128) van een spoor via ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix='.wav', dir='.', delete=True) as tmp:
        sf.write(tmp.name, y, sr, subtype='PCM_24')
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp.name, '-af', 'ebur128', '-f', 'null', '-'],
                           capture_output=True, text=True)
    m = re.findall(r'LRA:\s+([\d.]+) LU', r.stderr)
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return (float(m[-1]) if m else float('nan')), (float(i[-1]) if i else float('nan'))


def meet_spoor(y, tijden, lijnen):
    """Volledige diagnose van een voice-over-spoor met zijn tijden."""
    t, f = f0_contour(y)
    zinnen = [zin_maten(y, a, b, t, f, l['spreek']) for (a, b), l in zip(tijden['lijnen'], lijnen)]
    pauzes = [round(tijden['lijnen'][i + 1][0] - tijden['lijnen'][i][1], 3) for i in range(len(zinnen) - 1)]
    spraak = tijden['lijnen'][-1][1] - tijden['lijnen'][0][0]
    woorden = sum(len(l['spreek'].split()) for l in lijnen)
    stem = y[int(tijden['lijnen'][0][0] * SR):int(tijden['lijnen'][-1][1] * SR)]
    l, i = lra(stem)
    # stilte tussen de zinnen: digitaal nul of met ruimte?
    gaten = np.concatenate([y[int(a * SR):int(b * SR)] for a, b in
                            [(tijden['lijnen'][k][1] + .03, tijden['lijnen'][k + 1][0] - .03) for k in range(len(zinnen) - 1)]
                            if b > a] or [np.zeros(1)])
    gat_db = 20 * np.log10(np.sqrt(np.mean(gaten ** 2)) + 1e-12)
    sd = [z['f0_sd_st'] for z in zinnen if 'f0_sd_st' in z]
    eind = [z['eind_st'] for z in zinnen if 'eind_st' in z]
    return dict(
        zinnen=zinnen, pauzes=pauzes,
        totaal=dict(wpm=round(woorden / spraak * 60), woorden=woorden, spraak_s=round(spraak, 2),
                    pauze_gem=round(float(np.mean(pauzes)), 3) if pauzes else None,
                    pauze_sd=round(float(np.std(pauzes)), 3) if pauzes else None,
                    f0_sd_st_gem=round(float(np.mean(sd)), 2) if sd else None,
                    f0_sd_st_spreiding=round(float(np.std(sd)), 2) if sd else None,
                    eind_st_gem=round(float(np.mean(eind)), 1) if eind else None,
                    eind_st_spreiding=round(float(np.std(eind)), 1) if eind else None,
                    lra_lu=l, stem_lufs=i, stilte_tussen_db=round(float(gat_db), 1)))


# ── een blok-take op de zinsgrenzen knippen ──────────────────────────────

def spraakgrenzen(y, drempel=-42):
    e = env_db(y)
    aan = np.where(e > drempel)[0]
    return (aan[0] / SR, aan[-1] / SR) if len(aan) else (0.0, len(y) / SR)


def gaten(y, drempel=-36, min_s=0.045):
    """Stiltes binnen de spraak: [(begin, eind)] in s."""
    e = env_db(y)
    stil = e < drempel
    uit, st = [], None
    for k, s in enumerate(stil):
        if s and st is None: st = k
        if not s and st is not None:
            if (k - st) / SR >= min_s: uit.append((st / SR, k / SR))
            st = None
    a, b = spraakgrenzen(y)
    return [(p, q) for p, q in uit if p > a + .1 and q < b - .1]


def knip(y, teksten):
    """Verdeel een blok over zijn zinnen. Kiest per zinsgrens de stilte die het best past bij de verwachte plek
    (naar aantal tekens) en die het langst is, monotoon (dynamisch programmeren). Geeft [(a, b)] per zin, of None."""
    a, b = spraakgrenzen(y)
    if len(teksten) == 1: return [(a, b)]
    G = gaten(y)
    K = len(teksten) - 1
    if len(G) < K: return None
    c = np.cumsum([len(t) for t in teksten]); c = c / c[-1]
    verwacht = [a + (b - a) * c[k] for k in range(K)]
    leesteken = [t.rstrip()[-1:] for t in teksten[:-1]]

    def kost(k, g):
        p, q = G[g]; mid = (p + q) / 2
        afw = abs(mid - verwacht[k]) / (b - a)
        lang = q - p
        voorkeur = 0.12 if leesteken[k] in '.?!' else 0.06
        return 4 * afw - 0.8 * min(lang, .4) / .4 + (0.3 if lang < voorkeur else 0)

    INF = 1e9
    D = np.full((K, len(G)), INF); P = np.zeros((K, len(G)), int)
    for g in range(len(G)): D[0, g] = kost(0, g)
    for k in range(1, K):
        for g in range(k, len(G)):
            prev = D[k - 1, :g]
            j = int(np.argmin(prev)); D[k, g] = prev[j] + kost(k, g); P[k, g] = j
    g = int(np.argmin(D[K - 1])); keuze = [g]
    for k in range(K - 1, 0, -1): g = P[k, g]; keuze.append(g)
    keuze = keuze[::-1]
    grenzen, s = [], a
    for g in keuze:
        p, q = G[g]; grenzen.append((s, p)); s = q
    grenzen.append((s, b))
    return grenzen


# ── natuurlijkheid van een take ──────────────────────────────────────────

def natuur_score(y, teksten, grenzen, asr=None):
    """Hoger is natuurlijker. Straft: tempo ver van ~170 wpm, vlakke of wilde toonhoogte, geen val aan het eind van een
    mededeling, geen stijging bij een vraag, haperingen, een andere stem (F0 buiten de band), en (met ASR) verspreking."""
    if grenzen is None: return -99.0, {'reden': 'niet te knippen'}
    t, f = f0_contour(y)
    straf, info = 0.0, {}
    woorden = sum(len(x.split()) for x in teksten)
    span = grenzen[-1][1] - grenzen[0][0]
    wpm = woorden / max(span, .1) * 60
    straf += ((wpm - DOEL_WPM) / 25) ** 2
    info['wpm'] = round(wpm)
    ff_all = f[~np.isnan(f)]
    if len(ff_all) < 10: return -99.0, {'reden': 'geen stem'}
    med = float(np.median(ff_all)); info['f0'] = round(med)
    if not F0_BAND[0] <= med <= F0_BAND[1]: straf += 6
    for (a, b), tekst in zip(grenzen, teksten):
        z = zin_maten(y, a, b, t, f, tekst)
        sd = z.get('f0_sd_st')
        if sd is None: straf += 2; continue
        lo, hi = F0_SD_BAND
        straf += max(0, lo - sd) * 1.5 + max(0, sd - hi) * 1.0
        e = tekst.rstrip()[-1:]
        if e == '?' and z['eind_st'] < 1.0: straf += 1.5
        if e in '.!' and z['eind_st'] > -0.5: straf += 0.8
        if z.get('max_gat', 0) > 0.45: straf += 2
        if z['gestemd'] < 0.45: straf += 1
    if asr is not None:
        cer = asr(y, ' '.join(teksten)); info['cer'] = round(cer, 3)
        straf += 12 * cer
    info['straf'] = round(straf, 2)
    return -straf, info


def maak_asr():
    """faster-whisper als die er is (Nederlands), anders None. Geeft f(y, verwacht) -> tekenfoutratio."""
    try:
        from faster_whisper import WhisperModel
    except Exception:
        return None
    import os
    naam = os.environ.get('ASR_MODEL', 'medium')
    try:
        mdl = WhisperModel(naam, device='cpu', compute_type='int8')
    except Exception:
        return None

    def norm(s):
        s = s.lower().replace('-', ' ')
        s = re.sub(r"[^a-zà-ÿ0-9' ]", '', s)
        return re.sub(r'\s+', ' ', s).strip()

    def cer(y, verwacht):
        z = librosa.resample(np.asarray(y, dtype=np.float32), orig_sr=SR, target_sr=16000)
        segs, _ = mdl.transcribe(z, language='nl', beam_size=1)
        h = norm(' '.join(s.text for s in segs)); r = norm(verwacht)
        import difflib
        return 1 - difflib.SequenceMatcher(None, r, h).ratio()
    return cer


# ── de stem achter elkaar leggen ─────────────────────────────────────────

def pauze_plan(lijnen, blokken, seed):
    """Pauze ná elke zin die een blok afsluit (binnen een blok houdt het model zijn eigen pauze). 150–400 ms,
    langer na een punt of vraag en bij een nieuwe gedachte, korter na een komma, met wat spreiding."""
    rnd = random.Random(seed)
    plan = {}
    for blok in blokken[:-1]:
        i = blok[-1] - 1
        e = lijnen[i]['tekst'].replace('*', '').rstrip()[-1:]
        basis = 0.34 if e in '.!' else 0.38 if e == '?' else 0.17 if e == ',' else 0.24
        plan[i] = round(min(0.40, max(0.15, basis * rnd.uniform(0.8, 1.2))), 3)
    return plan


def snij_blok(y, marge_voor=0.12, marge_na=0.08):
    """Stilte aan de randen eraf, maar een inademing of aanzet vlak voor de spraak blijft (−55 dB, tot 120 ms)."""
    a, b = spraakgrenzen(y, -55)
    a2, b2 = spraakgrenzen(y, -42)
    s = max(0, int((max(a, a2 - marge_voor)) * SR) - int(.01 * SR))
    e = min(len(y), int((b2 + marge_na) * SR))
    z = y[s:e].copy(); f = int(.006 * SR); r = np.linspace(0, 1, f)
    z[:f] *= r; z[-f:] *= r[::-1]
    return z, s / SR


def leg_achter_elkaar(blok_audio, blok_grenzen, blokken, lijnen, pauzes, max_binnen=0.42):
    """blok_audio: per blok een (al op 48 kHz) take; blok_grenzen: per blok [(a, b)] per zin (in de take).
    Een te lange stilte binnen een blok wordt ingekort tot max_binnen. Geeft (spoor, tijden)."""
    delen = [np.zeros(int(START * SR))]
    t = START
    tijden = [None] * len(lijnen)
    for bi, (y, grenzen, blok) in enumerate(zip(blok_audio, blok_grenzen, blokken)):
        z, off = snij_blok(y)
        g = [(a - off, b - off) for a, b in grenzen]
        # binnen het blok: een te lange stilte tussen twee zinnen inkorten tot max_binnen (het midden eruit)
        houd, s0, weg = [], 0.0, 0.0
        nieuw = []
        for k in range(len(g)):
            nieuw.append((g[k][0] - weg, g[k][1] - weg))
            if k < len(g) - 1:
                gat = g[k + 1][0] - g[k][1]
                if gat > max_binnen:
                    ka, kb = g[k][1] + max_binnen / 2, g[k + 1][0] - max_binnen / 2
                    houd.append((s0, ka)); s0 = kb; weg += kb - ka
        houd.append((s0, len(z) / SR))
        z = np.concatenate([z[int(p * SR):int(q * SR)] for p, q in houd])
        for (a, b), i in zip(nieuw, blok):
            tijden[i - 1] = [round(t + a, 3), round(t + b, 3)]
        delen.append(z); t += len(z) / SR
        if bi < len(blokken) - 1:
            p = pauzes.get(blok[-1] - 1, 0.25)
            # de marge van snij_blok telt al als pauze
            extra = max(0.0, p - 0.08 - 0.06)
            delen.append(np.zeros(int(extra * SR))); t += extra
    delen.append(np.zeros(int(OUTRO * SR)))
    spoor = np.concatenate(delen)
    return spoor, {'lijnen': tijden, 'dur': round(len(spoor) / SR, 3)}


# ── lichte nabewerking ───────────────────────────────────────────────────

def kleine_ruimte(y, nat_db=-21, rt=0.18, seed=7):
    """Een heel kleine ruimte: kort exponentieel uitstervend ruis-IR (RT ~0,18 s), donker, ~21 dB onder droog."""
    rng = np.random.default_rng(seed)
    n = int(rt * SR)
    ir = rng.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
    # donkerder: eenpolig laagdoorlaat ~4 kHz
    a = np.exp(-2 * np.pi * 4000 / SR)
    for k in range(1, n): ir[k] = (1 - a) * ir[k] + a * ir[k - 1]
    ir[:int(.004 * SR)] = 0                    # 4 ms predelay
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-12
    L = len(y) + n - 1; N = 1 << (L - 1).bit_length()
    nat = np.fft.irfft(np.fft.rfft(y, N) * np.fft.rfft(ir, N), N)[:len(y)]
    return y + nat * 10 ** (nat_db / 20) * (np.sqrt(np.mean(y ** 2)) / (np.sqrt(np.mean(nat ** 2)) + 1e-12))


def roomtone(n, db=-64, seed=11):
    """Zachte roze ruis, zodat de pauzes geen digitale stilte zijn."""
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(n)
    X = np.fft.rfft(w); fr = np.arange(len(X)); fr[0] = 1
    p = np.fft.irfft(X / np.sqrt(fr), n)
    p /= np.sqrt(np.mean(p ** 2)) + 1e-12
    return p * 10 ** (db / 20)


def nabewerking(y, uit):
    """Laagafsnijding, de-esser, milde compressie (2:1), heel kleine ruimte, roomtone. Geen harde limiter:
    alleen een veiligheidsplafond op −1 dBFS dat bij spraak vrijwel nooit aanspreekt."""
    y = kleine_ruimte(y)
    y = y + roomtone(len(y))
    tmp_in = Path(uit).with_suffix('.droog.wav')
    sf.write(tmp_in, y / max(1.0, np.abs(y).max() / 0.9), SR, subtype='PCM_24')
    flt = ('highpass=f=75:p=2,'
           'deesser=i=0.35:m=0.5:f=0.5:s=o,'
           'acompressor=threshold=0.1:ratio=2:attack=12:release=160:knee=6:makeup=1.6,'
           'alimiter=limit=0.89:attack=5:release=60:level=disabled')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp_in), '-af', flt, '-ar', str(SR), '-ac', '1',
                    '-c:a', 'pcm_s16le', str(uit)], check=True)
    tmp_in.unlink()


def schrijf_tijden(pad, tijden):
    Path(pad).write_text(json.dumps(tijden, indent=1) + '\n')
