#!/usr/bin/env python3
"""Dựng dữ liệu cho app MMH Wikipedia ▸ Thủ thuật (Nhãn khoa · Răng Hàm Mặt).

Đầu vào (nguon/data, nguon/mmh): TT 23/2024 PL01 + PL02, QTKT 2025 (Mắt QĐ 3517, RHM QĐ 3634), bảng giá 2025
(QĐ 311/QĐ-BYT BV Trường ĐH Y Dược Huế, QĐ 441/QĐ-BYT BV ĐH Y Dược – ĐHQG Hà Nội), danh mục thiết bị y tế BHYT
(VBHN 14/VBHN-BYT = TT 04/2017 + TT 24/2025), sản phẩm MMH (san-pham.json + profiles.json).
Đầu ra: data/meta.js, data/mat.js, data/rhm.js, data/qtkt-mat.js, data/qtkt-rhm.js.
Chạy: python3 tools/build.py"""
import json, os, re, unicodedata, datetime
from collections import defaultdict, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, *p)
load = lambda p: json.load(open(D(p), encoding='utf-8'))

# ---------- chuẩn hoá chữ ----------
TONE = {'òa': 'oà', 'óa': 'oá', 'ỏa': 'oả', 'õa': 'oã', 'ọa': 'oạ', 'òe': 'oè', 'óe': 'oé', 'ỏe': 'oẻ', 'õe': 'oẽ', 'ọe': 'oẹ',
        'ùy': 'uỳ', 'úy': 'uý', 'ủy': 'uỷ', 'ũy': 'uỹ', 'ụy': 'uỵ'}
def vn(s):
    s = unicodedata.normalize('NFC', (s or '').lower())
    for a, b in TONE.items(): s = s.replace(b, a)  # một kiểu bỏ dấu
    s = s.replace('º', ' độ').replace('°', ' độ')
    return re.sub(r'\s+', ' ', s).strip()
def ascii_(s):
    s = unicodedata.normalize('NFD', vn(s)).replace('đ', 'd')
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')
def sp(s): return re.sub(r'\s+', ' ', (s or '')).strip()
def key_of(code):
    m = re.search(r'(\d+)\.(\d+)', code or '')
    return f'{int(m.group(1))}.{int(m.group(2))}' if m else None

# ---------- TT 23/2024 ----------
pl1 = load('nguon/data/tt23_pl01.json'); pl2 = load('nguon/data/tt23_pl02.json')
P1 = {}
for r in pl1:
    k = key_of(r['ma'])
    if k: P1[k] = {'ma': r['ma'], 'ten': sp(r['ten']), 'ch': r['chuong'], 'stt': r['stt']}
def lk_codes(s):
    return [key_of(c) for c in re.findall(r'(?:BS_)?\d+[\.,]\d+', (s or '').replace(',', '.')) if key_of(c)]
for r in pl2:
    r['lks'] = [k for k in lk_codes(r['lk']) if k in P1]
    r['ten'] = sp(r['ten']); r['ch'] = r['chuong']
    try: r['sc'] = int(r['sttc'])
    except Exception: r['sc'] = None
ref_by = defaultdict(list)  # PL01 key -> PL02 rows
for r in pl2:
    for k in r['lks']: ref_by[k].append(r)

# ---------- QTKT 2025 ----------
QT = {}
for ck in ('mat', 'rhm'):
    q = load(f'nguon/data/qtkt_{ck}.json')
    QT[ck] = {'map': {m[1]: m for m in q['map']}, 'qt': {x['stt']: x for x in q['qt']}}
QTDOC = {'mat': {'qd': 'QĐ 3517/QĐ-BYT', 'ngay': '12/11/2025', 'ten': 'Hướng dẫn quy trình kỹ thuật về Mắt – Tập 1', 'pdf': 'nguon/raw/qtkt-mat-tap1.pdf', 'n': 342},
         'rhm': {'qd': 'QĐ 3634/QĐ-BYT', 'ngay': '24/11/2025', 'ten': 'Hướng dẫn quy trình kỹ thuật về Răng Hàm Mặt – Tập 1', 'pdf': 'nguon/raw/qtkt-rhm-tap1.pdf', 'n': 320}}

# ---------- Giá 2025 ----------
GIA_SRC = {
    'hue': {'ten': 'BV Trường ĐH Y Dược Huế', 'vb': 'QĐ 311/QĐ-BYT ngày 24/01/2025', 'pdf': 'nguon/raw/gia-hue-311-2025.pdf', 'b': (873, 874), 'pl4': 875},
    'dhyd': {'ten': 'BV Đại học Y Dược – ĐHQG Hà Nội', 'vb': 'QĐ 441/QĐ-BYT ngày 07/02/2025', 'pdf': 'nguon/raw/gia-tvpl-642258.pdf', 'b': None, 'pl4': 493},
}
GIA = defaultdict(list)  # PL01 key -> [src, mtd, ten gia, gia, ghi chu, loai, trang]
for src, cfg in GIA_SRC.items():
    seen = set()
    for mtd, t23, tg, g, gc, pg in load(f'nguon/data/gia_{src}.json'):
        k = key_of(mtd[:7])
        if not k or g is None: continue
        loai = 'bhyt'
        if cfg['b'] and cfg['b'][0] <= pg <= cfg['b'][1]: loai = 'ngoai'
        if pg >= cfg['pl4']: loai = 'gayte'
        sig = (k, mtd, g, loai, sp(tg))
        if sig in seen: continue
        seen.add(sig)
        GIA[k].append([src, mtd, sp(tg), g, sp(gc), loai, pg])

# ---------- Thiết bị y tế BHYT ----------
VT = {r['ma']: r for r in load('nguon/data/vtyt.json')}

# ---------- Sản phẩm MMH ----------
SP = load('nguon/mmh/san-pham.json'); PF = load('nguon/mmh/profiles.json')
GROUPS = {g['id']: g for g in SP['groups']}
NEG_BEFORE = re.compile(r'(cắt|tháo|rút|bỏ)\s+$')
def kw_hits(text, gid):
    """Tìm cụm từ sản phẩm trong 1 đoạn chữ QTKT ⇒ [(cụm, gợi ý)]"""
    t = vn(text); out = []
    for kw, sug in GROUPS[gid]['kw']:
        k = vn(kw)
        pat = r'(?<![\wà-ỹ])' + re.escape(k) + r'(?![\wà-ỹ])' if len(k) <= 5 or k in ('file', 'bond', 'ilm', 'ipr', 'pga') else re.escape(k)
        for m in re.finditer(pat, t):
            pre = t[max(0, m.start() - 8):m.start()]
            if gid in ('chi', 'chink') and NEG_BEFORE.search(pre): continue
            if gid == 'dao' and re.match(r'\s*(điện|laser|siêu âm|plasma|radio)', t[m.end():m.end() + 10]): continue
            out.append((kw, sug)); break
    return out

# Hồ sơ ứng dụng MMH theo tên kỹ thuật (từ MMH Library) — regex trên chữ không dấu
MAT_PROF = [
    ('phaco', r'phaco|tan nhuyen|the thuy tinh|thuy tinh the|ngoai bao|trong bao|\biol\b', r'^(do|sieu am|chup|xet nghiem|test|kham|soi|laser|cat bao sau bang laser)'),
    ('lri', r'thu gian.*(ria|giac mac)|rach giac mac.*loan thi|loan thi.*rach', None),
    ('glaucoma', r'cat be|glocom|glaucom|bong tham|lo do|ong dan luu|van dan luu|cung giac mac', r'^(do|soi|laser|chup|xet nghiem)'),
    ('pterygium', r'\bmong\b|ghep ket mac|mang oi', r'^(do|soi|chup)'),
    ('vitrectomy', r'dich kinh|pars plana|boc mang|lo hoang diem|dau silicon|noi nhan', r'^(do|soi|sieu am|chup|tiem|xet nghiem|laser)'),
]
CHI_PROF = [
    ('cataract', r'phaco|tan nhuyen|the thuy tinh|thuy tinh the|ngoai bao|trong bao', r'^(do|sieu am|chup|xet nghiem|test|kham|soi|laser)|co dinh|treo|khau'),
    ('iol-fix', r'(co dinh|khau|treo).*(the thuy tinh|thuy tinh the|iol|ttt)|(the thuy tinh|iol).*(cung mac|mong mat)', None),
    ('keratoplasty', r'ghep giac mac|ghep noi mo|ghep mang bowman', None),
    ('pterygium', r'\bmong\b|ghep ket mac|ghep mang oi|gian ket mac', r'^(do|soi)'),
    ('chalazion', r'chap|leo', None),
    ('iris', r'mong mat|dong tu', r'^(do|soi|chup|laser)'),
    ('vitrectomy', r'cat dich kinh|pars plana|boc mang|lo hoang diem', None),
    ('retina', r'bong vong mac|don cung mac|dai cung mac|ap lanh', r'^(laser|do|soi|chup)'),
    ('glaucoma', r'cat be|glocom|bong tham|ong dan luu|van dan luu', r'^(do|soi|laser|chup)'),
    ('strabismus', r'\blac\b|co truc|co cheo|co van nhan|lui co|rut ngan co', r'^(do|xac dinh|kham)'),
    ('eyelid', r'quam|mi doi|nep mi|da mi|bo mi|tao hinh mi|cung may|khe mi|epicanthus', r'^(do|cat chi)'),
    ('ptosis', r'sup mi|co nang mi|treo co mi|co muller|treo mi', None),
]
MAT_TOOL_PROF = [('trocar', r'cat dich kinh|pars plana|dau silicon|noi nhan|boc mang', r'cat dich kinh truoc|^(do|soi|sieu am|chup|tiem)'),
                 ('kvp', r'boc mang|lo hoang diem|di vat noi nhan|di vat trong buong dich kinh|ilm', r'^(do|soi|chup)'),
                 ('moc', r'mo (goc tien phong|vung be)|mo be tu phia trong|trabeculotom', None)]
DIA_PROF = [
    ('xoang', r'(han|tram).*(rang|composite|amalgam|glass|gic)|phuc hoi.*(sau|than rang)|sau rang', r'su |nhua lam san|chup|rang sua|co rang|ho ranh|tai khoang'),
    ('ho-ranh', r'ho ranh|tram bit', None),
    ('co-rang', r'co rang|loai v|mon co|ton thuong co', None),
    ('rang-sua', r'rang sua', r'nho rang|chup (thep|nhua|su)'),
    ('mo-tuy', r'tuy|noi nha|ong tuy', r'xuong|tuy song|chup x|sinh thiet'),
    ('mai-cui', r'chup|cau rang|mao|phuc hinh co dinh|rang su|rang kim loai', r'chup x|chup cat lop|lam san|thao chup|hang lam san|chup phim|chup anh'),
    ('veneer', r'veneer|mat dan', None),
    ('inlay', r'inlay|onlay', None),
    ('ipr', r'mai ke|ipr|giam kich thuoc', None),
    ('khop-can', r'(mai|dieu) chinh khop can|mai chinh|num phu', None),
]
def profile_hits(name, rules):
    a = ascii_(name); out = []
    for pid, inc, exc in rules:
        if re.search(inc, a) and not (exc and re.search(exc, a)): out.append(pid)
    return out
PF_DAO = {p['id']: p for p in PF['dao']}; PF_CHI = {p['id']: p for p in PF['chi']}; PF_DIA = {p['id']: p for p in PF['dia']}

# QĐ 3207 (RHM 2013) — đối chiếu sản phẩm MMH đã làm trong MMH Library ⇒ ghép theo tên gần nhất
def toks(s): return set(w for w in re.findall(r'[a-z0-9]+', ascii_(s)) if len(w) > 1 and w not in {'va', 'co', 'hoac', 'khong', 'bang', 'cho', 'dieu', 'tri', 'cac', 'mot', 'phau', 'thuat', 'the', 'theo', 'loai'})
Q3207 = [(q, toks(q['ten'])) for q in PF['qd3207']]
def best3207(name):
    t = toks(name); best, bs = None, 0
    if not t: return None, 0
    for q, qt in Q3207:
        if not qt: continue
        s = len(t & qt) / len(t | qt)
        if s > bs: best, bs = q, s
    return best, bs

def sp_split(sptext):
    """'DIA-BURS (TR, TF…), MANIBond (primer…)' ⇒ nhóm sản phẩm"""
    a = ascii_(sptext); g = []
    for gid, pat in (('dia', r'dia-burs|dia burs'), ('carbide', r'carbide|surgical|mi stainless|1559|m15'), ('ipr', r'ipr'), ('tram', r'tram|file|reamer|finder|peeso|gates|paste|spreader|plugger|u-file'),
                     ('jizai', r'jizai'), ('chink', r'chi khau'), ('comp', r'composite|flo-v|\bflo\b|nano|micro|manifill|\beg\b'), ('bond', r'manibond|bond'), ('shine', r'manishine|active white|remin|gingiva')):
        if re.search(pat, a): g.append(gid)
    return g

# ---------- Nhóm giải phẫu ----------
MAT_SEC = [
    ('mi', 'Mi mắt · lông mày', r'\bmi\b|mi mat|bo mi|da mi|cung may|chap|leo|quam|sup mi|nang mi|khe mi|go mi|epicanthus|co cung mi|co mi|nep mi|goc mat|long xieu|long quam'),
    ('le', 'Lệ đạo', r'\ble\b|le dao|le quan|tui le|diem le|tuyen le|ong le'),
    ('km', 'Kết mạc · mộng', r'ket mac|\bmong\b|mang oi|cung do|gia mac|kho mat|bong mat|rua mat'),
    ('gm', 'Giác mạc', r'giac mac|noi mo'),
    ('cm', 'Củng mạc', r'cung mac'),
    ('ttt', 'Thể thủy tinh · IOL', r'the thuy tinh|thuy tinh the|phaco|\biol\b|bao sau|ngoai bao|trong bao|ttt|cataract'),
    ('glc', 'Glôcôm', r'glocom|glaucom|be cung|cat be|goc tien phong|nhan ap|bong tham|vung be|mong mat chu bien|schlemm|mo be'),
    ('mm', 'Mống mắt · tiền phòng', r'mong mat|dong tu|tien phong|thuy dich'),
    ('vm', 'Dịch kính · võng mạc', r'dich kinh|vong mac|hoang diem|hac mac|noi nhan|silicon|pars plana|trong mat'),
    ('lac', 'Lác · vận nhãn', r'\blac\b|van nhan|co truc|co cheo|song thi|rung giat|nhuoc thi|chinh thi'),
    ('hm', 'Hốc mắt · nhãn cầu', r'hoc mat|nhan cau|mat gia|day mat|thi than kinh|lom mat|o mat|than kinh thi giac|hau phong|u mau'),
    ('kx', 'Khúc xạ · laser', r'khuc xa|lasik|smile|prk|laser|can thi|loan thi'),
    ('cd', 'Khám · đo · chẩn đoán', r'^(do|kham|thu|soi|chup|sieu am|xet nghiem|test|ghi|dien|nghiem phap|danh gia|lam|xac dinh|nuoi cay|nhuom|dinh luong)'),
]
RHM_SEC = [
    ('cd', 'Khám · chẩn đoán hình ảnh', r'^(kham|chup|xet nghiem|lay dau|do|ghi)'),
    ('impl', 'Implant · tái tạo xương', r'implant|nang san xoang|ghep xuong|tai tao xuong|mang sinh hoc'),
    ('nc', 'Nha chu · mô mềm', r'nha chu|loi|lap|cao rang|nao tui|ghep mo|phanh|dai rang|lung lay|tui quanh rang|che phu chan rang|tien dinh|quanh rang'),
    ('nn', 'Nội nha', r'tuy|ong tuy|noi nha|cuong rang|chop rang'),
    ('cr', 'Chữa răng · phục hồi', r'han|tram|phuc hoi|ho ranh|co rang|tai khoang|tay trang|sau rang|veneer|inlay|onlay|chot|nhay cam nga'),
    ('ph', 'Phục hình', r'phuc hinh|ham gia|rang gia|chup|cau rang|\bcau\b|cui duc|mao|ham khung|ham thao lap|dan su|rang su|onlay|attachment'),
    ('cn', 'Chỉnh nha · khớp cắn', r'chinh nha|chinh hinh rang|mac cai|khi cu|khop can|mang chinh|minivis|nong ham|duy tri|mai chinh'),
    ('nr', 'Nhổ răng · tiểu phẫu', r'nho rang|rang khon|rang ngam|rang moc lech|chan rang|tieu phau|cat nang|u loi|lay cao|cay chuyen|cay lai rang'),
    ('te', 'Răng trẻ em', r'rang sua|tre em'),
    ('hm', 'Phẫu thuật hàm mặt', r'ham|xuong|go ma|le fort|khe ho|moi|vom|luoi|tuyen nuoc bot|tuyen mang tai|san mieng|mat|co|da|vet thuong|cam|niem mac mieng|cung tiep'),
]
SEC_PRI = {'mat': ['cd', 'ttt', 'glc', 'vm', 'lac', 'kx', 'le', 'mi', 'hm', 'km', 'gm', 'cm', 'mm'],
           'rhm': ['cd', 'impl', 'te', 'nn', 'cn', 'ph', 'cr', 'nc', 'nr', 'hm']}
def section(name, ck):
    a = ascii_(name); secs = {sid: pat for sid, lab, pat in (MAT_SEC if ck == 'mat' else RHM_SEC)}
    for sid in SEC_PRI[ck]:
        if re.search(secs[sid], a): return sid
    return 'khac'
def kind_of(name):
    a = ascii_(name)
    if re.match(r'^(phau thuat|cat bo|ghep|tao hinh|tai tao|khoet|muc|nao vet|lay|dat|khau|ghep)', a): return 'PT' if a.startswith('phau thuat') else 'TT'
    if re.match(r'^(laser|dot|chieu|ap lanh)', a): return 'LS'
    if re.match(r'^(do|kham|thu|soi|chup|sieu am|xet nghiem|test|ghi|danh gia|xac dinh|nghiem phap|nuoi cay|nhuom|dinh luong|phan tich)', a): return 'CD'
    return 'TT'

# ---------- BHYT: Điều 23 Luật BHYT (VBHN 2026) ----------
def bhyt_flags(name, ck):
    a = ascii_(name); f = []
    if ck == 'mat' and re.search(r'\blac\b', a) and kind_of(name) != 'CD': f.append('lac')
    if re.search(r'khuc xa|can thi|vien thi|loan thi|lasik|smile|\bprk\b|phakic|kinh tiep xuc|orthok|ortho-k', a) and not re.match(r'^(do|kham|soi|chup)', a): f.append('khucxa')
    if re.search(r'tham my|mi doi|nep mi|cat da thua|lay mo|botox|filler|tay trang|veneer|chinh hinh mui', a): f.append('thammy')
    if ck == 'rhm' and re.search(r'ham gia|rang gia|phuc hinh|cau rang|\bchup (su|kim loai|thep|nhua|zirconia|toan su|kim loai su)|mao rang|implant|ham khung|ham thao lap|rang su(?! dung)|attachment', a) and not re.match(r'^(chup x|chup cat lop|kham)', a): f.append('ranggia')
    if ck == 'mat' and re.search(r'mat gia|lap kinh|kinh tiep xuc|cap kinh', a): f.append('kinh')
    return f

# Cụm từ trong ghi chú giá "chưa bao gồm …" ứng với từng nhóm sản phẩm MMH
PAY_PAT = {'dao': r'\bdao\b', 'chi': r'chỉ khâu|\bchỉ\b', 'trocar': r'trocar|dao củng mạc|cannula', 'kvp': r'kẹp bóc màng|pince|kìm|forceps',
           'moc': r'móc', 'dia': r'mũi khoan', 'carbide': r'mũi khoan', 'ipr': r'mài kẽ|ipr', 'tram': r'trâm|file', 'jizai': r'trâm',
           'chink': r'chỉ khâu|\bchỉ\b', 'comp': r'composite|vật liệu (trám|hàn)', 'bond': r'keo dán|chất dán', 'shine': r'tẩy trắng'}

# Vật tư "chưa bao gồm" trong ghi chú giá ⇒ nhóm thiết bị y tế BHYT (TT 04/2017 + TT 24/2025)
EX_VT = [(r'th[uủ]y tinh thể nhân tạo|thể th[uủ]y tinh nhân tạo', 'N06.03.010'), (r'đầu cắt', 'N07.03.060'), (r'silicon', 'N07.03.200'),
         (r'vật liệu độn', 'N07.03.270'), (r'nẹp|vít|(?<![\wà-ỹ])ốc(?![\wà-ỹ])|đinh', 'N07.06.040'), (r'xương nhân tạo|thay thế xương', 'N06.04.090'),
         (r'xương bảo quản', 'N06.04.070'), (r'laser nội nhãn|đầu laser|dây dẫn sáng', 'N07.03.130'), (r'máy dò thần kinh', 'N07.03.240'), (r'thiết bị cố định mắt|patient interface|pateient interface', None)]

# ---------- Dựng thực thể ----------
def products_for(ck, name, qrec):
    res = OrderedDict()
    def add(gid, lv, ev=None, sug=None, steps=None, codes=None):
        r = res.setdefault(gid, {'g': gid, 'lv': set(), 'ev': [], 'sug': [], 'steps': [], 'codes': []})
        r['lv'].add(lv)
        if ev and ev not in r['ev'] and len(r['ev']) < 6: r['ev'].append(ev)
        if sug and sug not in r['sug']: r['sug'].append(sug)
        if steps: r['steps'].extend(s for s in steps if s not in r['steps'])
        if codes: r['codes'].extend(c for c in codes if c not in r['codes'])
    gids = [g for g, x in GROUPS.items() if x['ck'] == ck]
    # 1) Theo chữ của QTKT Bộ Y tế 2025
    if qrec:
        parts = [('5.3 Thiết bị y tế', x) for x in qrec.get('tb', [])] + [('5.2 Thuốc', x) for x in qrec.get('thuoc', [])] + [(h or 'Các bước', x) for h, x in qrec.get('buoc', [])]
        for src, text in parts:
            for gid in gids:
                if gid in ('comp', 'bond', 'shine') or src != '5.2 Thuốc':
                    for kw, sug in kw_hits(text, gid):
                        q = sp(text); i = vn(q).find(vn(kw))
                        if i < 0: i = 0
                        a = max(0, i - 70); b = min(len(q), i + len(kw) + 90)
                        add(gid, 'q', (src.rstrip('.:'), ('…' if a else '') + q[a:b] + ('…' if b < len(q) else '')), sug)
    # 2) Theo tài liệu MMH (MMH Library)
    if ck == 'mat':
        for pid in profile_hits(name, MAT_PROF):
            p = PF_DAO[pid]
            add('dao', 'm', steps=[[s['t'], ', '.join(s['f']), s['codes'], s['why']] for s in p['steps']])
        for pid in profile_hits(name, CHI_PROF):
            p = PF_CHI[pid]
            add('chi', 'm', steps=[[p['vi'], '', '', p.get('lede', '')]], codes=[c for c in p['codes']])
        for gid, inc, exc in MAT_TOOL_PROF:
            if profile_hits(name, [(gid, inc, exc)]): add(gid, 'm')
    else:
        for pid in profile_hits(name, DIA_PROF):
            p = PF_DIA[pid]
            tgt = 'ipr' if pid == 'ipr' else 'dia'
            add(tgt, 'm', steps=[[s['t'], '', ', '.join(s['codes']), s['d']] for s in p['steps']])
        q, s = best3207(name)
        if q and s >= 0.5 and q['sp']:
            for gid in sp_split(q['sp']): add(gid, 'm', sug='Đối chiếu QĐ 3207 (MMH): ' + q['sp'])
    if ck == 'rhm' and 'dia' in res and section(name, ck) in ('nr', 'hm', 'impl') and all('mũi khoan' in (e[1].lower()) for e in res['dia']['ev']) and not res['dia']['steps']:
        d = res.pop('dia'); c = res.setdefault('carbide', {'g': 'carbide', 'lv': set(), 'ev': [], 'sug': [], 'steps': [], 'codes': []})
        c['lv'] |= d['lv']; c['ev'] += [e for e in d['ev'] if e not in c['ev']]
        c['sug'] = ['Surgical / Carbide MANI (mở xương, chia chân răng)'] + [x for x in c['sug'] if 'QĐ 3207' in x]
    out = []
    for r in res.values():
        r['lv'] = ''.join(sorted(r['lv'], key=lambda x: 'qm'.index(x)))
        if len(r['sug']) > 1: r['sug'] = [x for x in r['sug'] if '(chọn' not in x] or r['sug']
        out.append(r)
    out.sort(key=lambda r: (0 if 'q' in r['lv'] else 1, list(GROUPS).index(r['g'])))
    return out

def item(ck, iid, name, s2, lks, qmap):
    qrec, qref = None, None
    if s2 is not None and s2 in QT[ck]['map']:
        m = QT[ck]['map'][s2]; qrec = QT[ck]['qt'].get(m[0])
        qref = {'n': m[0], 'p': qrec['page'] if qrec else None}
    pr = []
    for k in lks:
        for g in GIA.get(k, []): pr.append([g[0], g[1], g[2], g[3], g[4], g[5]])
    # bỏ trùng (cùng nguồn, cùng giá, cùng loại)
    seen = set(); pr2 = []
    for p in sorted(pr, key=lambda x: (x[0], x[5] != 'bhyt', x[3])):
        s = (p[0], p[3], p[5], p[2])
        if s in seen: continue
        seen.add(s); pr2.append(p)
    flags = bhyt_flags(name, ck)
    has_bhyt = any(p[5] in ('bhyt', 'gayte') for p in pr2)
    if has_bhyt: flags = [f for f in flags if f not in ('thammy', 'ranggia')]
    if pr2 and not has_bhyt: flags.append('ngoaids')
    links = [[k, P1[k]['ma'], P1[k]['ten'], P1[k]['ch']] for k in lks if k in P1]
    ex = []
    for p in pr2:
        for m in re.finditer(r'[Cc]hưa bao gồm ([^.;]+)', p[4]):
            for x in re.split(r',\s*|\s+và\s+', m.group(1)):
                x = x.strip().rstrip(')').strip()
                if x and x.lower() not in [e.lower() for e in ex]: ex.append(x)
    pts = products_for(ck, name + ' ' + ' '.join(l[2] for l in links), qrec)
    for pt in pts:
        pat = PAY_PAT.get(pt['g'])
        hit = [e for e in ex if pat and re.search(pat, e.lower()) and not re.search(r'siêu âm|hàn (mô|mạch)|cắt nối|cắt gan', e.lower())]
        pt['pay'] = ('rieng', hit) if hit else (('gia', []) if has_bhyt else ('na', []))
    exv = []
    for e in ex:
        el = vn(e); v = next((m for pat, m in EX_VT if re.search(pat, el)), None)
        exv.append([e, v])
    return {'id': iid, 't': name, 'ck': ck, 'sec': section(name, ck), 'k': kind_of(name), 's2': s2, 'l': links, 'q': qref,
            'pr': pr2, 'bh': flags, 'ex': exv, 'pt': pts}

DATA = {}
for ck in ('mat', 'rhm'):
    items = []
    if ck == 'mat':
        rows2 = [r for r in pl2 if r['ch'] == '9. Mắt']
    else:
        qset = set(QT['rhm']['map'].keys())
        rows2 = [r for r in pl2 if (r['ch'].startswith('11.') and (r['sc'] in qset or any(k.startswith('16.') for k in r['lks']) or
                 (not r['lks'] and re.search(r'\b(rang|loi|tuy|nha chu|implant|khe ho moi|vom mieng|tuyen nuoc bot|xuong o rang)\b', ascii_(r['ten'])))))
                 or (not r['ch'].startswith('11.') and any(k.startswith('16.') for k in r['lks']))]
    used = set()
    for r in rows2:
        pre = 'm' if ck == 'mat' else 'r'
        iid = f"{pre}{r['ch'].split('.')[0]}-{r['sc'] if r['sc'] is not None else r['stt']}"
        s2 = r['sc'] if (ck == 'mat' or r['ch'].startswith('11.')) else None
        it = item(ck, iid, r['ten'], s2, r['lks'], None)
        it['c2'] = r['ch']; it['n2'] = r['stt']
        items.append(it); used.update(r['lks'])
    chap = '14.' if ck == 'mat' else '16.'
    for k, v in P1.items():
        if v['ch'].startswith(chap) and k not in used:
            other = sorted({r['ch'] for r in ref_by.get(k, [])})
            it = item(ck, ('m' if ck == 'mat' else 'r') + '1-' + k, v['ten'], None, [k], None)
            it['only1'] = 1
            if other: it['to2'] = other
            items.append(it)
    DATA[ck] = items
    print(ck, 'kỹ thuật', len(items), '· có QTKT', sum(1 for i in items if i['q']), '· có giá', sum(1 for i in items if i['pr']),
          '· có SP MMH', sum(1 for i in items if i['pt']), '· theo QTKT', sum(1 for i in items if any('q' in p['lv'] for p in i['pt'])))

# ---------- Chi tiết QTKT (tải khi mở) ----------
QD = {}
for ck in ('mat', 'rhm'):
    d = {}
    for n, x in QT[ck]['qt'].items():
        d[n] = {'t': x['title'], 'p': x['page'], 'dc': x['dc'][:900], 'cd': x['cd'][:900], 'ccd': x['ccd'][:600], 'tt': x['tt'][:500],
                'tb': x['tb'][:60], 'th': x['thuoc'][:30], 'b': [[h, t[:700]] for h, t in x['buoc'][:30]], 'td': x['td'][:900]}
    QD[ck] = d

# ---------- Meta ----------
SEC_LAB = {'mat': [[s, l] for s, l, _ in MAT_SEC] + [['khac', 'Khác']], 'rhm': [[s, l] for s, l, _ in RHM_SEC] + [['khac', 'Khác']]}
vt_need = sorted({m for g in SP['groups'] for m in g['vtyt']} | {m for m in VT if m.startswith(('N05', 'N06.03', 'N07.03'))} | {'N08.00.330', 'N08.00.360', 'N08.00.260'})
vtyt = [[VT[m]['stt'], m, VT[m]['ten'], VT[m]['dvt'], VT[m]['tt'], VT[m]['trang']] for m in vt_need if m in VT]
groups = [{k: g[k] for k in ('id', 'ck', 'name', 'short', 'page', 'desc', 'vtyt')} for g in SP['groups']]
meta = {'built': datetime.date.today().isoformat(), 'wiki': SP['wiki'], 'groups': groups, 'sec': SEC_LAB, 'qtdoc': QTDOC,
        'gia': {k: {kk: v[kk] for kk in ('ten', 'vb', 'pdf')} for k, v in GIA_SRC.items()}, 'vtyt': vtyt,
        'count': {ck: len(DATA[ck]) for ck in DATA}}

os.makedirs(D('data'), exist_ok=True)
def js(name, var, obj):
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'), default=lambda o: sorted(o) if isinstance(o, set) else str(o))
    open(D('data', name), 'w', encoding='utf-8').write(f'/* Tự sinh bởi tools/build.py — không sửa tay */\nwindow.{var}={s};\n')
    print(name, round(len(s) / 1024), 'KB')
js('meta.js', 'MW_META', meta)
for ck in DATA: js(f'{ck}.js', 'MW_' + ck.upper(), DATA[ck])
for ck in QD: js(f'qtkt-{ck}.js', 'MW_QT_' + ck.upper(), QD[ck])
