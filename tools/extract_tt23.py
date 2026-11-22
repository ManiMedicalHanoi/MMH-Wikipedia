#!/usr/bin/env python3
"""Tách 2 phụ lục của Thông tư 23/2024/TT-BYT (PDF) ⇒ nguon/data/tt23_pl01.json, tt23_pl02.json.
PL01: [STT, Mã kỹ thuật, Tên chương, Tên kỹ thuật]; PL02: [STT, STT của chương, Tên chương, Mã liên kết, Tên kỹ thuật]."""
import json, re, sys, os, pdfplumber
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdf = pdfplumber.open(os.path.join(ROOT, 'nguon/raw/tt23-2024-pdf.pdf'))
sp = lambda s: re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()
pl1, pl2 = [], []
start2 = None
for i, p in enumerate(pdf.pages):
    if i < 3: continue
    txt = p.extract_text() or ''
    if start2 is None and 'Phụ lục số 02' in txt: start2 = i
    for t in p.extract_tables():
        for r in t:
            r = [sp(c) for c in r]
            if not r or not r[0].isdigit(): continue
            if start2 is None or i < start2:
                if len(r) >= 4: pl1.append({'stt': int(r[0]), 'ma': r[1], 'chuong': r[2], 'ten': r[3]})
            else:
                if len(r) >= 5: pl2.append({'stt': int(r[0]), 'sttc': r[1], 'chuong': r[2], 'lk': r[3], 'ten': r[4]})
    if i % 100 == 0: print(i, len(pl1), len(pl2), flush=True)
json.dump(pl1, open(os.path.join(ROOT, 'nguon/data/tt23_pl01.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(pl2, open(os.path.join(ROOT, 'nguon/data/tt23_pl02.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('PL01', len(pl1), 'PL02', len(pl2))
