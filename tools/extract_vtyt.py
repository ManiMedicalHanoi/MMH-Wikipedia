#!/usr/bin/env python3
"""Tách Phụ lục 01 (Danh mục thiết bị y tế BHYT) của VBHN 14/VBHN-BYT (2025, hợp nhất TT 04/2017 + TT 24/2025)
⇒ nguon/data/vtyt.json: [{stt, ma, ten, dvt, tt (ghi chú / điều kiện, tỷ lệ, mức thanh toán), trang}]."""
import json, re, os, pdfplumber
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdf = pdfplumber.open(os.path.join(ROOT, 'nguon/raw/vbhn14-2025-vtyt.pdf'))
sp = lambda s: re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()
out = []
for i, p in enumerate(pdf.pages):
    for t in p.extract_tables():
        for r in t:
            r = [sp(c) for c in r]
            j = next((k for k, c in enumerate(r) if re.fullmatch(r'N\d\d\.\d\d\.\d{3}', c)), None)
            if j is None: continue
            stt = r[j - 1] if j > 0 else ''
            rest = r[j + 1:] + ['', '', '']
            out.append({'stt': stt, 'ma': r[j], 'ten': rest[0], 'dvt': rest[1], 'tt': rest[2], 'trang': i + 1})
json.dump(out, open(os.path.join(ROOT, 'nguon/data/vtyt.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out))
