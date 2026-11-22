#!/usr/bin/env python3
"""Tách tài liệu "Hướng dẫn quy trình kỹ thuật" 2025 của Bộ Y tế (Mắt tập 1 – QĐ 3517/QĐ-BYT; Răng Hàm Mặt tập 1 – QĐ 3634/QĐ-BYT)
⇒ nguon/data/qtkt_<key>.json: {map: [[stt QTKT, stt chương PL02, tên PL02, [mã liên kết]]], qt: [{stt, title, page, dc, cd, ccd, tt, thuoc, tb, buoc, tb7}]}.
Chữ in mờ (watermark) của bản PDF bệnh viện đăng lại bị lọc theo màu ký tự."""
import json, re, os, sys, pdfplumber
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = {'mat': 'qtkt-mat-tap1.pdf', 'rhm': 'qtkt-rhm-tap1.pdf'}
sp = lambda s: re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()

def clean_page(p):
    return p.filter(lambda o: o.get('object_type') != 'char' or str(o.get('non_stroking_color')) != '(0,)')

def run(key):
    pdf = pdfplumber.open(os.path.join(ROOT, 'nguon/raw', SRC[key]))
    cache = os.path.join(os.environ.get('QT_CACHE', '/tmp'), f'qt_{key}_pages.json')
    mp, texts, body_from = [], [], None
    if os.path.exists(cache):
        c = json.load(open(cache)); mp, texts = c['mp'], [tuple(x) for x in c['texts']]
        return finish(key, mp, texts)
    cur = None
    for i, p0 in enumerate(pdf.pages):
        p = clean_page(p0)
        txt = p.extract_text() or ''
        if 'Mã liên' in txt and 'QTKT' in txt and body_from is None:
            for t in p.extract_tables():
                for r in t:
                    r = [sp(c) for c in r] + [''] * 5
                    if not re.search(r'\d+\.\d+', r[3]): continue
                    a, b = r[0].rstrip('.'), r[1]
                    if a.isdigit() and b.isdigit():
                        cur = [int(a), int(b), r[2], []]; mp.append(cur)
                    elif cur is not None and r[2] and not a:
                        cur[2] = (cur[2] + ' ' + r[2]).strip()
                    if cur is not None:
                        for c in re.findall(r'(?:BS_)?\d+\.\d+', r[3]): cur[3].append(c)
            continue
        if mp and body_from is None and 'Mã liên' not in txt: body_from = i
        if body_from is not None: texts.append((i + 1, txt))
        if i % 100 == 0: print(key, i, len(mp), flush=True)
    json.dump({'mp': mp, 'texts': texts}, open(cache, 'w'), ensure_ascii=False)
    return finish(key, mp, texts)

def finish(key, mp, texts):
    # Ghép thân bài, tách theo tiêu đề "N. TÊN QUY TRÌNH" (chữ in hoa)
    lines = []
    for pg, t in texts:
        for ln in t.split('\n'): lines.append((pg, ln.rstrip()))
    heads = []
    for k, (pg, ln) in enumerate(lines):
        m = re.match(r'^\s*(\d{1,3})\.\s*([A-ZĐÀ-Ỹ].{5,})$', ln)
        if m and m.group(2) == m.group(2).upper() and not re.match(r'^\s*\d{1,2}\.\s+(ĐẠI CƯƠNG|CHỈ ĐỊNH|CHỐNG CHỈ ĐỊNH|THẬN TRỌNG|CHUẨN BỊ|TIẾN HÀNH|THEO DÕI)', ln) and len(re.findall(r'[A-ZĐÀ-Ỹ]', m.group(2))) >= 4:
            heads.append((k, int(m.group(1)), m.group(2).strip(), pg))
    # giữ tiêu đề tăng dần liên tục
    seq, want = [], 1
    for h in heads:
        if want <= h[1] <= want + 2: seq.append(h); want = h[1] + 1
    out = []
    for j, (k, n, title, pg) in enumerate(seq):
        end = seq[j + 1][0] if j + 1 < len(seq) else len(lines)
        body = [ln for _, ln in lines[k + 1:end]]
        # tiêu đề xuống dòng: các dòng chữ hoa ngay sau
        while body and len(body[0].strip()) >= 3 and body[0].strip() == body[0].strip().upper() and re.search(r'[A-ZĐÀ-Ỹ]', body[0]) and not re.match(r'^\s*\d+\.\s', body[0]):
            title += ' ' + body.pop(0).strip()
        out.append(parse_body(n, title, pg, body))
    json.dump({'map': mp, 'qt': out}, open(os.path.join(ROOT, f'nguon/data/qtkt_{key}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(key, 'map', len(mp), 'qt', len(out))

SEC = [('dc', r'1\.\s*ĐẠI CƯƠNG'), ('cd', r'2\.\s*CHỈ ĐỊNH'), ('ccd', r'3\.\s*CHỐNG CHỈ ĐỊNH'), ('tt', r'4\.\s*THẬN TRỌNG'),
       ('cb', r'5\.\s*CHUẨN BỊ'), ('th', r'6\.\s*TIẾN HÀNH'), ('td', r'7\.\s*THEO DÕI'), ('tl', r'TÀI LIỆU THAM KHẢO')]

def parse_body(n, title, pg, body):
    secs, cur = {}, None
    for ln in body:
        s = ln.strip()
        hit = None
        for k, pat in SEC:
            if re.match(r'^' + pat, s): hit = k; break
        if hit: cur = hit; secs.setdefault(cur, []); continue
        if cur: secs[cur].append(s)
    j = lambda k: ' '.join(secs.get(k, [])).strip()
    cb = '\n'.join(secs.get('cb', []))
    def sub(name_pat):
        m = re.search(r'5\.\d\.\s*' + name_pat + r'[^\n]*\n(.*?)(?=\n5\.\d\.|\Z)', cb, re.S)
        if not m: return []
        items = re.split(r'\n(?=[-+•])', m.group(1).strip())
        items = [re.sub(r'(?<=[\.\);:])\s+\d{1,4}$', '', sp(x.lstrip('-+• '))) for x in items]
        return [x for x in items if x]
    th = '\n'.join(secs.get('th', []))
    steps = []
    for m in re.finditer(r'(6\.\d+\.?\s*(?:Bước\s*\d+\s*:?)?)(.*?)(?=\n6\.\d+\.|\Z)', th, re.S):
        h = sp(m.group(1)); x = re.sub(r'(?<=[\.\);:])\s+\d{1,4}$', '', sp(m.group(2)))
        if x: steps.append([h, x])
    if not steps and th.strip(): steps = [['', sp(th)]]
    return {'stt': n, 'title': title.title() if title.isupper() else title, 'raw_title': title, 'page': pg,
            'dc': j('dc'), 'cd': j('cd'), 'ccd': j('ccd'), 'tt': j('tt'),
            'thuoc': sub(r'Thuốc'), 'tb': sub(r'(?:Thiết bị y tế|Trang thiết bị|Dụng cụ|Vật tư)'), 'buoc': steps,
            'td': j('td')[:1500]}

if __name__ == '__main__':
    for k in (sys.argv[1:] or SRC.keys()): run(k)
