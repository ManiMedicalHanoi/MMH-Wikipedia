#!/usr/bin/env python3
"""Tách bảng giá dịch vụ kỹ thuật (Phụ lục giá DVKT) của quyết định giá 2025 ⇒ nguon/data/gia_<key>.json
mỗi dòng: [mã tương đương (CC.SSSS.GGGG), tên theo TT 23/2024, tên phê duyệt giá, mức giá (đồng), ghi chú, trang PDF].
Mã tương đương: CC = chương, SSSS = số thứ tự kỹ thuật trong chương (= mã kỹ thuật PL01 TT 23), GGGG = mã giá."""
import json, re, os, sys, pdfplumber
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = {'hue': 'gia-hue-311-2025.pdf', 'dhyd': 'gia-tvpl-642258.pdf'}
sp = lambda s: re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()
def run(key):
    pdf = pdfplumber.open(os.path.join(ROOT, 'nguon/raw', SRC[key]))
    txt = open(os.path.join(ROOT, 'nguon/txt', SRC[key].replace('.pdf', '.txt')), encoding='utf-8').read().split('\f')
    out = []
    for i, p in enumerate(pdf.pages):
        if i >= len(txt) or not re.search(r'\b\d{2}\.\d{4}\.\d{4}\b', txt[i]): continue
        for t in p.extract_tables():
            for r in t:
                r = [sp(c) for c in r]
                j = next((k for k, c in enumerate(r) if re.fullmatch(r'\d{2}\.\d{4}\.\d{4}', c)), None)
                if j is None: continue
                rest = r[j + 1:] + [''] * 4
                g = re.sub(r'[^\d]', '', rest[2])
                out.append([r[j], rest[0], rest[1], int(g) if g else None, rest[3], i + 1])
        if i % 100 == 0: print(key, i, len(out), flush=True)
    json.dump(out, open(os.path.join(ROOT, f'nguon/data/gia_{key}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(key, len(out))
if __name__ == '__main__':
    for k in (sys.argv[1:] or SRC.keys()): run(k)
