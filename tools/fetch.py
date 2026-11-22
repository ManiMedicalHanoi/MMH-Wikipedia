#!/usr/bin/env python3
"""Tải văn bản gốc (chạy trên GitHub Actions — máy Claude bị chặn các trang luật).
Đọc nguon/fetch/urls.tsv ⇒ nguon/raw/<tên>.<đuôi> (≤ 45 MB) + nguon/txt/<tên>.txt + nguon/fetch/log.json.
.doc/.docx ⇒ LibreOffice đổi sang .docx ⇒ bảng ghi ra nguon/txt/<tên>.tables.json (mỗi bảng = mảng dòng)."""
import json, os, subprocess, sys, hashlib, time, urllib.request, ssl, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'nguon', 'fetch', 'urls.tsv')
RAW = os.path.join(ROOT, 'nguon', 'raw'); TXT = os.path.join(ROOT, 'nguon', 'txt')
os.makedirs(RAW, exist_ok=True); os.makedirs(TXT, exist_ok=True)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
LOGF = os.path.join(ROOT, 'nguon', 'fetch', 'log.json')
log = json.load(open(LOGF)) if os.path.exists(LOGF) else {}
only = set(sys.argv[1:])

def kind(b):
    if b[:4] == b'%PDF': return 'pdf'
    if b[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1': return 'doc'
    if b[:2] == b'PK': return 'zip'
    return 'html' if b'<html' in b[:2000].lower() else 'bin'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()

rows = {}
for ln in open(SRC, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln.strip() or ln.startswith('#'): continue
    name, url = ln.split('\t', 1)
    rows.setdefault(name.strip(), []).append(url.strip())

for name, urls in rows.items():
    if only and name not in only: continue
    if name in log and log[name].get('ok') and not only: continue
    rec = {'tries': []}
    for url in urls:
        try:
            b = get(url)
        except Exception as e:
            rec['tries'].append({'url': url, 'err': str(e)[:300]}); continue
        k = kind(b)
        if k == 'html' and not url.endswith(('.pdf', '.doc', '.docx')):
            # Trang tải về: tìm link file văn bản trong trang (1 cấp)
            import html as H
            from urllib.parse import urljoin
            links = re.findall(r'href=["\']([^"\']+?\.(?:pdf|docx?|PDF))(?:[?#][^"\']*)?["\']', b.decode('utf-8', 'ignore'))
            links += re.findall(r'href=["\']([^"\']*(?:download|DownloadFile|file)[^"\']*)["\']', b.decode('utf-8', 'ignore'))
            got = None
            for lk in links[:8]:
                u2 = urljoin(url, H.unescape(lk))
                try:
                    b2 = get(u2)
                except Exception as e:
                    rec['tries'].append({'url': u2, 'err': str(e)[:200]}); continue
                if kind(b2) in ('pdf', 'doc', 'zip'):
                    got = (u2, b2); break
            if got: url, b = got; k = kind(b)
        if k in ('html', 'bin'):
            rec['tries'].append({'url': url, 'err': 'không phải file văn bản (%s, %d byte)' % (k, len(b))}); continue
        ext = {'pdf': 'pdf', 'doc': 'doc', 'zip': 'docx'}[k]
        tmp = os.path.join('/tmp', name + '.' + ext); open(tmp, 'wb').write(b)
        rec.update(ok=True, url=url, ext=ext, bytes=len(b), sha1=hashlib.sha1(b).hexdigest(), at=time.strftime('%Y-%m-%d %H:%M'))
        txt = os.path.join(TXT, name + '.txt')
        if ext == 'pdf':
            subprocess.run(['pdftotext', '-layout', tmp, txt])
            try:
                pages = subprocess.run(['pdfinfo', tmp], capture_output=True, text=True).stdout
                m = re.search(r'Pages:\s+(\d+)', pages); rec['pages'] = int(m.group(1)) if m else None
            except Exception: pass
        else:
            src = tmp
            if ext == 'doc':
                subprocess.run(['soffice', '--headless', '--convert-to', 'docx', '--outdir', '/tmp', tmp], capture_output=True)
                src = tmp[:-3] + 'docx'
            try:
                import docx
                d = docx.Document(src)
                with open(txt, 'w', encoding='utf-8') as f:
                    for p in d.paragraphs: f.write(p.text + '\n')
                tabs = []
                for t in d.tables:
                    rs = []
                    for r in t.rows:
                        cells = []; prev = None
                        for c in r.cells:
                            if prev is not None and c._tc is prev: continue
                            prev = c._tc; cells.append(c.text.strip())
                        rs.append(cells)
                    tabs.append(rs)
                json.dump(tabs, open(os.path.join(TXT, name + '.tables.json'), 'w', encoding='utf-8'), ensure_ascii=False)
                rec['tables'] = len(tabs); rec['rows'] = sum(len(t) for t in tabs)
            except Exception as e:
                rec['docx_err'] = str(e)[:300]
        if len(b) <= 45 * 1024 * 1024:
            os.replace(tmp, os.path.join(RAW, name + '.' + ext))
        else:
            rec['raw'] = 'quá lớn, chỉ giữ chữ'
        break
    if not rec.get('ok'): rec['ok'] = False
    log[name] = rec
    print(name, 'OK' if rec['ok'] else 'LỖI', rec.get('url', ''), rec.get('bytes', ''), flush=True)

json.dump(log, open(LOGF, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
