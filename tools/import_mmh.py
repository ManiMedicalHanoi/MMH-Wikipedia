#!/usr/bin/env python3
"""Nhập kiến thức sản phẩm từ MMH Library (kho riêng tư, chỉ chép phần đã công khai trên MMH Wiki)
⇒ nguon/mmh/profiles.json. Chạy lại khi MMH Library cập nhật: python3 tools/import_mmh.py <đường dẫn mmh-library>."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'mmh-library')
W = os.path.join(LIB, 'wiki/nguon')
dao = json.load(open(os.path.join(W, 'dao-nhan-khoa.json'), encoding='utf-8'))
chi = json.load(open(os.path.join(W, 'chi-nhan-khoa.json'), encoding='utf-8'))
dia = json.load(open(os.path.join(W, 'mui-khoan-kim-cuong.json'), encoding='utf-8'))
fam = {f['id']: f.get('vi') or f.get('name') for f in dao['families']}
out = {'dao': [], 'chi': [], 'dia': [], 'qd3207': []}
for p in dao['procedures']:
    out['dao'].append({'id': p['id'], 'vi': p['vi'], 'steps': [{'t': s['t'], 'f': [fam.get(x, x) for x in s['f']], 'codes': s.get('codes', ''), 'why': s.get('why', '')} for s in p['steps']]})
for p in chi['procedures']:
    out['chi'].append({'id': p['id'], 'vi': p['vi'], 'lede': p.get('lede', ''), 'points': p.get('points', []), 'codes': p.get('codes', [])})
for p in dia['procedures']:
    out['dia'].append({'id': p['id'], 'vi': p['vi'], 'part': p.get('part', ''), 'lede': p.get('lede', ''),
                       'steps': [{'t': s['t'], 'd': s.get('d', ''), 'codes': s.get('codes', [])} for s in p.get('steps', [])]})
md = open(os.path.join(LIB, 'Dental product/Tài liệu Bộ Y tế - Răng Hàm Mặt/QĐ 3207 - Danh mục 347 quy trình & đối chiếu sản phẩm MMH.md'), encoding='utf-8').read()
sec = ''
for ln in md.split('\n'):
    if ln.startswith('## '): sec = ln[3:].strip()
    m = re.match(r'^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d*)\s*\|\s*(\S*)\s*\|\s*(.*?)\s*\|\s*$', ln)
    if m: out['qd3207'].append({'stt': int(m.group(1)), 'ten': m.group(2), 'sec': sec, 'ep': m.group(4), 'sp': m.group(5)})
json.dump(out, open(os.path.join(ROOT, 'nguon/mmh/profiles.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items()})
