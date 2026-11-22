/* MMH Wikipedia · Thủ thuật nhãn khoa & răng hàm mặt — app tĩnh (không cần máy chủ).
   Dữ liệu: data/*.js do tools/build.py sinh từ văn bản Bộ Y tế (nguon/raw) + sản phẩm MMH (nguon/mmh). */
(function () {
  'use strict';
  var VER = '1.0';
  var M = window.MW_META;
  var CK = { mat: { name: 'Nhãn khoa', full: 'Nhãn khoa (Mắt)', ch1: '14. MẮT', ch2: '9. Mắt' },
             rhm: { name: 'Răng hàm mặt', full: 'Răng hàm mặt', ch1: '16. RĂNG HÀM MẶT', ch2: '11. Mũi họng miệng' } };
  var KIND = { PT: 'Phẫu thuật', TT: 'Thủ thuật', LS: 'Laser · lạnh đông', CD: 'Khám · chẩn đoán' };
  var LOAI = { bhyt: 'BHYT thanh toán', ngoai: 'Ngoài danh mục BHYT', gayte: 'Gây tê, chưa gồm thuốc & oxy' };
  var FLAG = {
    lac: ['warn', 'Điều trị lác', 'BHYT không thanh toán điều trị lác cho người từ đủ 18 tuổi (Luật BHYT, Điều 23 khoản 7). Người dưới 18 tuổi vẫn được hưởng.'],
    khucxa: ['warn', 'Điều trị tật khúc xạ', 'BHYT không thanh toán điều trị tật khúc xạ cho người từ đủ 18 tuổi (Điều 23 khoản 7).'],
    thammy: ['warn', 'Mục đích thẩm mỹ', 'Nếu thực hiện vì mục đích thẩm mỹ thì không thuộc phạm vi hưởng BHYT (Điều 23 khoản 6).'],
    ranggia: ['warn', 'Răng giả · phục hình', 'Răng giả là thiết bị y tế thay thế, không được BHYT thanh toán (Điều 23 khoản 8). Phần dịch vụ khác kiểm tra theo bảng giá BHYT của cơ sở.'],
    kinh: ['warn', 'Kính mắt · mắt giả', 'Kính mắt, mắt giả là thiết bị y tế thay thế, không được BHYT thanh toán (Điều 23 khoản 8).'],
    ngoaids: ['bad', 'Ngoài danh mục BHYT', 'Trong bảng giá tham chiếu, dịch vụ này nằm ở danh mục không do quỹ BHYT thanh toán.']
  };
  var DATA = {}, QT = {}, LOADING = {};
  var G = {}; M.groups.forEach(function (g) { G[g.id] = g; });
  var VT = {}; M.vtyt.forEach(function (v) { VT[v[1]] = v; });
  var SEC = {}; ['mat', 'rhm'].forEach(function (ck) { SEC[ck] = {}; M.sec[ck].forEach(function (s) { SEC[ck][s[0]] = s[1]; }); });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = $('#app');

  /* ---------- tiện ích ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nrm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); }
  function vnd(n) { return n == null ? '' : n.toLocaleString('vi-VN') + ' đ'; }
  function load(src) {
    if (LOADING[src]) return LOADING[src];
    return (LOADING[src] = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src + '?v=' + VER; s.onload = ok; s.onerror = function () { delete LOADING[src]; no(new Error(src)); };
      document.head.appendChild(s);
    }));
  }
  function ensure(ck) {
    if (DATA[ck]) return Promise.resolve(DATA[ck]);
    return load('data/' + ck + '.js').then(function () {
      var a = window['MW_' + ck.toUpperCase()];
      a.forEach(function (it) { it._n = nrm(it.t + ' ' + it.l.map(function (l) { return l[1] + ' ' + l[2]; }).join(' ')); });
      return (DATA[ck] = a);
    });
  }
  function ensureAll() { return Promise.all([ensure('mat'), ensure('rhm')]); }
  function ensureQT(ck) {
    if (QT[ck]) return Promise.resolve(QT[ck]);
    return load('data/qtkt-' + ck + '.js').then(function () { return (QT[ck] = window['MW_QT_' + ck.toUpperCase()]); });
  }
  function byId(id) { var ck = id.charAt(0) === 'm' ? 'mat' : 'rhm'; return ensure(ck).then(function (a) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }); }
  function wiki(g) { return M.wiki + (G[g] ? G[g].page : ''); }
  function priceMain(it) {
    var b = it.pr.filter(function (p) { return p[5] === 'bhyt'; });
    var p = (b.length ? b : it.pr).slice().sort(function (x, y) { return x[3] - y[3]; });
    if (!p.length) return '';
    var lo = p[0][3], hi = p[p.length - 1][3];
    return lo === hi ? vnd(lo) : vnd(lo) + ' – ' + vnd(hi);
  }
  function search(q, list, limit) {
    var t = nrm(q).split(' ').filter(Boolean); if (!t.length) return [];
    var ph = nrm(q), out = [];
    list.forEach(function (it) {
      for (var i = 0; i < t.length; i++) if (it._n.indexOf(t[i]) < 0) return;
      var n = nrm(it.t), sc = n.indexOf(ph) === 0 ? 0 : n.indexOf(ph) > 0 ? 1 : 2;
      if (it.pt.length) sc -= 0.3;
      out.push([sc, n.length, it]);
    });
    out.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return out.slice(0, limit || 1e9).map(function (x) { return x[2]; });
  }
  function hl(text, kws) {
    var s = esc(text), ks = (kws || []).filter(function (k) { return k && k.length >= 3; }).sort(function (a, b) { return b.length - a.length; });
    if (!ks.length) return s;
    var re = new RegExp('(' + ks.map(function (k) { return esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    return s.replace(re, '<mark>$1</mark>');
  }
  function kwsOf(ck) { var a = []; M.groups.forEach(function (g) { if (g.ck === ck) a = a.concat(g.kw.filter(function (k) { return k.length >= 4 && !/^(trâm|file|bond|mũi khoan)$/.test(k); })); }); return a; }
  function lvChip(lv) {
    if (lv.indexOf('q') >= 0) return '<span class="chip q" title="Quy trình kỹ thuật Bộ Y tế ghi rõ dụng cụ / vật tư này">Theo QTKT</span>';
    if (lv.indexOf('m') >= 0) return '<span class="chip m" title="Gợi ý theo tài liệu sản phẩm, đào tạo của MMH">Gợi ý MMH</span>';
    return '<span class="chip k" title="Quy trình chỉ ghi chung (dao / chỉ / mũi khoan các loại)">QTKT ghi chung</span>';
  }
  function chipsPT(it, max) {
    var h = it.pt.slice(0, max || 6).map(function (p) { var c = p.lv.indexOf('q') >= 0 ? 'q' : p.lv.indexOf('m') >= 0 ? 'm' : 'k'; return '<span class="chip ' + c + '" title="' + (c === 'q' ? 'Theo QTKT Bộ Y tế' : c === 'm' ? 'Gợi ý MMH' : 'QTKT ghi chung') + '">' + esc(G[p.g].short) + '</span>'; }).join('');
    if (it.pt.length > (max || 6)) h += '<span class="chip">+' + (it.pt.length - (max || 6)) + '</span>';
    return h;
  }
  function setNav(k) { document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-k') === k); }); }
  function title(t) { document.title = (t ? t + ' · ' : '') + 'MMH Wikipedia'; }

  /* ---------- Trang chủ ---------- */
  function home() {
    setNav('home'); title('');
    var c = M.count;
    app.innerHTML =
      '<section class="hero"><div>' +
      '<div class="lbl">MMH Wikipedia · Thủ thuật</div>' +
      '<h1 class="h1" style="margin-top:6px">Thủ thuật nhãn khoa &amp; răng hàm mặt</h1>' +
      '<div class="sub">Theo danh mục kỹ thuật Bộ Y tế, quy trình kỹ thuật 2025, giá và BHYT — kèm sản phẩm MMH đáp ứng từng thủ thuật</div>' +
      '<form class="big-search" id="hs"><input id="hsIn" type="search" placeholder="Ví dụ: phaco, cắt bè, cắt dịch kính, điều trị tủy, nhổ răng khôn…" autocomplete="off"><button class="chip q" style="padding:0 18px;font-size:15px">Tìm</button></form>' +
      '<div id="hsRes"></div></div>' +
      '<div class="note"><b>Cập nhật pháp lý</b> · Danh mục kỹ thuật theo <b>TT 23/2024/TT-BYT</b>: Phụ lục 01 áp dụng đến hết 31/12/2027, Phụ lục 02 (xếp theo hệ cơ quan) từ 01/01/2028 (sửa đổi bởi TT 25/2026/TT-BYT). Quy trình kỹ thuật mới: Mắt <b>QĐ 3517/QĐ-BYT</b>, Răng Hàm Mặt <b>QĐ 3634/QĐ-BYT</b> (11/2025). Vật tư BHYT: <b>TT 04/2017 + TT 24/2025</b>. <a href="#/vb">Xem văn bản</a></div>' +
      '</section>' +
      '<div class="grid g2" style="margin-top:18px">' + specCard('mat', c.mat) + specCard('rhm', c.rhm) + '</div>' +
      '<h2 class="h2">Sản phẩm MMH theo thủ thuật</h2><div class="grid g4" id="hp"><div class="loading">Đang tính…</div></div>' +
      '<h2 class="h2">Cách đọc một thủ thuật</h2>' +
      '<div class="grid g3">' +
      '<div class="card"><div class="lbl">1 · Danh mục &amp; quy trình</div><div style="margin-top:6px">Tên kỹ thuật theo Phụ lục 02 TT 23/2024, mã đang dùng (Phụ lục 01) và quy trình kỹ thuật 2025: chỉ định, thiết bị y tế, các bước.</div></div>' +
      '<div class="card"><div class="lbl">2 · Giá &amp; BHYT</div><div style="margin-top:6px">Giá dịch vụ 2025 tại bệnh viện tham chiếu, vật tư được thanh toán riêng ("chưa bao gồm…"), trường hợp BHYT không chi trả.</div></div>' +
      '<div class="card"><div class="lbl">3 · MMH đáp ứng</div><div style="margin-top:6px"><span class="chip q">Theo QTKT</span> quy trình Bộ Y tế ghi rõ dụng cụ · <span class="chip k">QTKT ghi chung</span> chỉ ghi "các loại" · <span class="chip m">Gợi ý MMH</span> theo tài liệu MMH. Kèm mã gợi ý, trạng thái thanh toán.</div></div>' +
      '</div>';
    $('#hs').onsubmit = function (e) { e.preventDefault(); doHomeSearch(); };
    $('#hsIn').oninput = debounce(doHomeSearch, 180);
    ensureAll().then(function () { renderHomeProducts(); });
  }
  function specCard(ck, n) {
    return '<a class="spec" href="#/tt/' + ck + '"><div class="lbl">' + (ck === 'mat' ? 'Chương 14 · Phụ lục 02 chương 9' : 'Chương 16 · Phụ lục 02 chương 11') + '</div>' +
      '<div class="t">' + CK[ck].full + '</div><div class="kpis" id="k-' + ck + '"><div><b>' + n + '</b>kỹ thuật</div></div></a>';
  }
  function doHomeSearch() {
    var q = $('#hsIn').value, box = $('#hsRes');
    if (!q.trim()) { box.innerHTML = ''; return; }
    ensureAll().then(function () {
      var r = search(q, DATA.mat.concat(DATA.rhm), 12);
      box.innerHTML = r.length ? '<div class="rows" style="margin-top:10px">' + r.map(rowHtml).join('') + '</div>' : '<div class="empty">Không thấy kỹ thuật phù hợp.</div>';
    });
  }
  function renderHomeProducts() {
    ['mat', 'rhm'].forEach(function (ck) {
      var a = DATA[ck], k = $('#k-' + ck); if (!k) return;
      var q = a.filter(function (i) { return i.q; }).length, p = a.filter(function (i) { return i.pt.length; }).length, pr = a.filter(function (i) { return i.pr.length; }).length;
      k.innerHTML = '<div><b>' + a.length + '</b>kỹ thuật</div><div><b>' + q + '</b>có quy trình 2025</div><div><b>' + pr + '</b>có giá tham chiếu</div><div><b>' + p + '</b>có sản phẩm MMH</div>';
    });
    var cnt = productCounts();
    var h = M.groups.map(function (g) {
      var c = cnt[g.id] || { n: 0, q: 0 };
      return '<a class="prod" href="#/sp/' + g.id + '"><div class="lbl">' + CK[g.ck].name + '</div><div class="t">' + esc(g.short) + '</div><div class="c">' + c.n + ' thủ thuật · ' + c.q + ' theo QTKT</div></a>';
    }).join('');
    var hp = $('#hp'); if (hp) hp.innerHTML = h;
  }
  function productCounts() {
    var cnt = {};
    ['mat', 'rhm'].forEach(function (ck) { (DATA[ck] || []).forEach(function (it) { it.pt.forEach(function (p) { var c = cnt[p.g] = cnt[p.g] || { n: 0, q: 0 }; c.n++; if (p.lv.indexOf('q') >= 0) c.q++; }); }); });
    return cnt;
  }
  function debounce(f, ms) { var t; return function () { clearTimeout(t); t = setTimeout(f, ms); }; }

  /* ---------- Danh sách ---------- */
  var LS = {};
  function listPage(ck, qs) {
    setNav(ck); title(CK[ck].name);
    var st = LS[ck] = LS[ck] || { sec: '', kind: '', prod: '', only: '', q: '', sort: 'pl', n: 60 };
    if (qs && qs.p) st.prod = qs.p;
    app.innerHTML = '<div class="crumb"><a href="#/">Trang chủ</a> › ' + CK[ck].name + '</div>' +
      '<h1 class="h1">' + CK[ck].full + '</h1><div class="sub">Danh mục kỹ thuật TT 23/2024/TT-BYT · quy trình ' + M.qtdoc[ck].qd + ' · giá 2025 · sản phẩm MMH</div>' +
      '<div class="listing" style="margin-top:18px"><aside class="side" id="side"></aside><section><div class="tools">' +
      '<input id="lq" type="search" placeholder="Lọc theo tên, mã kỹ thuật…" value="' + esc(st.q) + '">' +
      '<select id="ls"><option value="pl">Thứ tự danh mục</option><option value="ten">Tên A–Z</option><option value="gia">Giá cao → thấp</option><option value="mmh">Nhiều sản phẩm MMH</option></select>' +
      '<button class="chip fbtn" id="fb" style="height:40px">Bộ lọc</button></div><div class="count" id="lc"></div><div id="lr"><div class="loading">Đang tải danh mục…</div></div></section></div>';
    $('#ls').value = st.sort;
    ensure(ck).then(function (a) {
      var draw = function () { side(ck, a, st); rows(ck, a, st); };
      $('#lq').oninput = debounce(function () { st.q = $('#lq').value; st.n = 60; rows(ck, a, st); }, 150);
      $('#ls').onchange = function () { st.sort = this.value; rows(ck, a, st); };
      $('#fb').onclick = function () { $('#side').classList.toggle('on'); };
      app.onclick = function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        var f = b.getAttribute('data-f'), v = b.getAttribute('data-v');
        if (f === 'more') { st.n += 80; rows(ck, a, st); return; }
        st[f] = st[f] === v ? '' : v; st.n = 60; draw();
      };
      draw();
    });
  }
  function filt(a, st, skip) {
    var r = a.filter(function (it) {
      if (skip !== 'sec' && st.sec && it.sec !== st.sec) return false;
      if (skip !== 'kind' && st.kind && it.k !== st.kind) return false;
      if (skip !== 'prod' && st.prod && !it.pt.some(function (p) { return p.g === st.prod; })) return false;
      if (skip !== 'only' && st.only) {
        if (st.only === 'mmh' && !it.pt.length) return false;
        if (st.only === 'q' && !it.pt.some(function (p) { return p.lv.indexOf('q') >= 0; })) return false;
        if (st.only === 'qt' && !it.q) return false;
        if (st.only === 'gia' && !it.pr.length) return false;
        if (st.only === 'bh' && !it.bh.length) return false;
        if (st.only === 'ex' && !it.ex.length) return false;
        if (st.only === 'new' && !it.only1) return false;
      }
      return true;
    });
    return st.q ? search(st.q, r) : r;
  }
  function side(ck, a, st) {
    var cnt = function (f, v) { var s = {}; for (var k in st) s[k] = st[k]; s[f] = v; return filt(a, s, null).length; };
    var h = '<h4>Nhóm</h4><div class="fl">' + M.sec[ck].map(function (s) { var n = cnt('sec', s[0]); return n ? '<button data-f="sec" data-v="' + s[0] + '" class="' + (st.sec === s[0] ? 'on' : '') + '">' + esc(s[1]) + '<small>' + n + '</small></button>' : ''; }).join('') + '</div>';
    h += '<h4>Loại</h4><div class="fl">' + Object.keys(KIND).map(function (k) { var n = cnt('kind', k); return n ? '<button data-f="kind" data-v="' + k + '" class="' + (st.kind === k ? 'on' : '') + '">' + KIND[k] + '<small>' + n + '</small></button>' : ''; }).join('') + '</div>';
    h += '<h4>Sản phẩm MMH</h4><div class="fl">' + M.groups.filter(function (g) { return g.ck === ck; }).map(function (g) { var n = cnt('prod', g.id); return '<button data-f="prod" data-v="' + g.id + '" class="' + (st.prod === g.id ? 'on' : '') + '">' + esc(g.short) + '<small>' + n + '</small></button>'; }).join('') + '</div>';
    var O = [['mmh', 'Có sản phẩm MMH'], ['q', 'Sản phẩm có trong QTKT'], ['qt', 'Có quy trình kỹ thuật 2025'], ['gia', 'Có giá tham chiếu'], ['ex', 'Có vật tư thanh toán riêng'], ['bh', 'Lưu ý BHYT'], ['new', 'Chỉ ở Phụ lục 01']];
    h += '<h4>Điều kiện</h4><div class="fl">' + O.map(function (o) { return '<button data-f="only" data-v="' + o[0] + '" class="' + (st.only === o[0] ? 'on' : '') + '">' + o[1] + '<small>' + cnt('only', o[0]) + '</small></button>'; }).join('') + '</div>';
    if (st.sec || st.kind || st.prod || st.only) h += '<p><a href="javascript:void 0" id="clr">Bỏ lọc</a></p>';
    $('#side').innerHTML = h;
    var c = $('#clr'); if (c) c.onclick = function () { st.sec = st.kind = st.prod = st.only = ''; side(ck, a, st); rows(ck, a, st); };
  }
  function rows(ck, a, st) {
    var r = filt(a, st);
    if (!st.q) {
      if (st.sort === 'ten') r = r.slice().sort(function (x, y) { return x.t.localeCompare(y.t, 'vi'); });
      else if (st.sort === 'gia') r = r.slice().sort(function (x, y) { return mx(y) - mx(x); });
      else if (st.sort === 'mmh') r = r.slice().sort(function (x, y) { return sc(y) - sc(x); });
    }
    $('#lc').textContent = r.length + ' kỹ thuật' + (st.prod ? ' dùng ' + G[st.prod].short : '');
    $('#lr').innerHTML = r.length ? '<div class="rows">' + r.slice(0, st.n).map(rowHtml).join('') + '</div>' + (r.length > st.n ? '<button class="more" data-f="more">Xem thêm (' + (r.length - st.n) + ')</button>' : '') : '<div class="empty">Không có kỹ thuật phù hợp bộ lọc.</div>';
    function mx(i) { return i.pr.reduce(function (m, p) { return Math.max(m, p[3]); }, 0); }
    function sc(i) { return i.pt.reduce(function (m, p) { return m + (p.lv.indexOf('q') >= 0 ? 2 : 1); }, 0); }
  }
  function rowHtml(it) {
    var codes = it.l.slice(0, 3).map(function (l) { return '<span class="code">' + esc(l[1]) + '</span>'; }).join('');
    if (it.l.length > 3) codes += '<span class="code">+' + (it.l.length - 3) + '</span>';
    var pm = priceMain(it);
    return '<a class="row" href="#/k/' + it.id + '"><div><div class="t">' + esc(it.t) + '</div><div class="meta">' +
      '<span class="chip k">' + esc(SEC[it.ck][it.sec] || '') + '</span>' + codes + (it.q ? '<span class="chip ok">QTKT ' + it.q.n + '</span>' : '') +
      (it.bh.length ? '<span class="chip warn">Lưu ý BHYT</span>' : '') + chipsPT(it, 5) + '</div></div>' +
      '<div class="pr">' + (pm ? pm + '<small>giá tham chiếu 2025</small>' : '<small>chưa có giá tham chiếu</small>') + '</div></a>';
  }

  /* ---------- Chi tiết ---------- */
  function detail(id, tab) {
    app.innerHTML = '<div class="loading">Đang tải…</div>';
    byId(id).then(function (it) {
      if (!it) { app.innerHTML = '<div class="empty">Không tìm thấy kỹ thuật.</div>'; return; }
      var ck = it.ck; setNav(ck); title(it.t);
      tab = tab || 'mmh';
      var hd = '<div class="crumb"><a href="#/">Trang chủ</a> › <a href="#/tt/' + ck + '">' + CK[ck].name + '</a> › ' + esc(SEC[ck][it.sec] || '') + '</div>' +
        '<div class="dhead"><div class="lbl">' + KIND[it.k] + ' · ' + esc(SEC[ck][it.sec] || '') + '</div><h1 class="h1" style="text-transform:none;letter-spacing:0;margin-top:4px">' + esc(it.t) + '</h1>' +
        '<div class="chips">' + (it.s2 != null && !it.only1 ? '<span class="chip">Phụ lục 02 · ' + esc(it.c2 || CK[ck].ch2) + ' · STT ' + it.s2 + '</span>' : '') +
        it.l.map(function (l) { return '<span class="chip" title="' + esc(l[2] + ' — ' + l[3]) + '">Mã <b>' + esc(l[1]) + '</b></span>'; }).join('') +
        (it.q ? '<span class="chip ok">Quy trình ' + M.qtdoc[ck].qd + ' · số ' + it.q.n + '</span>' : '<span class="chip">Chưa có quy trình 2025 tập 1</span>') +
        (it.only1 ? '<span class="chip warn">Chỉ ở Phụ lục 01 (đến 31/12/2027)</span>' : '') + '</div></div>' +
        '<div class="tabs" id="tabs">' + [['mmh', 'MMH đáp ứng (' + it.pt.length + ')'], ['gia', 'Giá & BHYT'], ['qt', 'Quy trình kỹ thuật'], ['dm', 'Danh mục & mã']].map(function (t) { return '<button data-t="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="tb"></div>';
      app.innerHTML = hd;
      var show = function (t) {
        document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
        history.replaceState(null, '', '#/k/' + id + (t === 'mmh' ? '' : '/' + t));
        var box = $('#tb');
        if (t === 'mmh') box.innerHTML = tabMMH(it);
        else if (t === 'gia') box.innerHTML = tabGia(it);
        else if (t === 'dm') box.innerHTML = tabDM(it);
        else { box.innerHTML = '<div class="loading">Đang tải quy trình…</div>'; tabQT(it).then(function (h) { box.innerHTML = h; }); }
      };
      $('#tabs').onclick = function (e) { var b = e.target.closest('button[data-t]'); if (b) show(b.getAttribute('data-t')); };
      app.onclick = function (e) { var b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); show(b.getAttribute('data-go')); window.scrollTo(0, 0); } };
      show(tab);
    });
  }
  function payHtml(p, it) {
    var g = G[p.g], v = (g.vtyt || []).map(function (c) { return VT[c] ? '<span class="code" title="' + esc(VT[c][2]) + '">' + c + '</span>' : ''; }).join(' ');
    var s;
    if (p.pay[0] === 'rieng') s = '<span class="chip warn">BHYT thanh toán riêng</span> Ghi chú giá: chưa bao gồm ' + esc(p.pay[1].join(', ')) + '.';
    else if (p.pay[0] === 'gia') s = '<span class="chip ok">Nằm trong giá dịch vụ</span> Ghi chú giá không loại trừ ⇒ chi phí đã tính trong giá dịch vụ kỹ thuật, BHYT không thanh toán riêng; bệnh viện mua qua đấu thầu.';
    else s = '<span class="chip">Chưa có giá tham chiếu</span> Kiểm tra ghi chú "chưa bao gồm…" trong bảng giá của cơ sở.';
    return '<div class="pay">' + s + (v ? '<div class="small mute" style="margin-top:6px">Nhóm thiết bị y tế BHYT (TT 04/2017 + TT 24/2025): ' + v + '</div>' : '') + '</div>';
  }
  function tabMMH(it) {
    if (!it.pt.length) return '<div class="card"><b>Chưa thấy sản phẩm MMH dùng trong kỹ thuật này.</b><div class="mute small" style="margin-top:6px">Quy trình kỹ thuật không ghi dụng cụ / vật tư MMH đang phân phối và chưa có trong tài liệu sản phẩm MMH. <a href="#/sp">Xem danh mục sản phẩm MMH</a></div></div>';
    var kw = kwsOf(it.ck);
    return '<p class="mute small" style="margin-top:0">Căn cứ: <span class="chip q">Theo QTKT</span> quy trình ' + M.qtdoc[it.ck].qd + ' ghi rõ (trích nguyên văn) · <span class="chip k">QTKT ghi chung</span> quy trình chỉ ghi "dao / chỉ / mũi khoan các loại" · <span class="chip m">Gợi ý MMH</span> theo tài liệu sản phẩm, đào tạo của MMH.</p>' +
      it.pt.map(function (p) {
        var g = G[p.g], q = p.lv.indexOf('q') >= 0, m = p.lv.indexOf('m') >= 0;
        var h = '<div class="pc"><div class="hd"><div><div class="nm">' + esc(g.name) + '</div><div class="ds">' + esc(g.desc) + '</div></div><div class="chips">' +
          (q ? '<span class="chip q">Theo QTKT</span>' : '') + (m ? '<span class="chip m">Gợi ý MMH</span>' : '') + (p.lv.indexOf('g') >= 0 ? '<span class="chip k">QTKT ghi chung</span>' : '') + '<a class="chip" href="' + wiki(p.g) + '" target="_blank" rel="noopener">MMH Wiki ↗</a></div></div>';
        if (p.ev.length) h += '<ul class="ev">' + p.ev.map(function (e) { return '<li><span class="s">' + esc(e[0]) + '</span>' + hl(e[1], kw) + '</li>'; }).join('') + '</ul>';
        if (p.sug.length) h += '<div class="sug">' + p.sug.map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>';
        if (p.steps.length) {
          h += '<div class="tbl" style="margin-top:12px"><table><thead><tr><th>Bước / ứng dụng</th>' + (p.g === 'chi' ? '' : '<th>Nhóm</th>') + '<th>Mã gợi ý</th><th>Vì sao</th></tr></thead><tbody>' +
            p.steps.map(function (s) { return '<tr><td><b>' + esc(s[0]) + '</b></td>' + (p.g === 'chi' ? '' : '<td>' + esc(s[1]) + '</td>') + '<td>' + esc(s[2]) + '</td><td class="small">' + esc(s[3]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        }
        if (p.codes.length) h += '<div class="tbl" style="margin-top:10px"><table><thead><tr><th>Mã chỉ MANI</th><th>Dùng để</th></tr></thead><tbody>' + p.codes.map(function (c) { return '<tr><td><span class="code">' + esc(c[0]) + '</span></td><td>' + esc(c[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        return h + payHtml(p, it) + '</div>';
      }).join('');
  }
  function tabGia(it) {
    var h = '';
    it.bh.forEach(function (f) { var x = FLAG[f]; if (x) h += '<div class="flag ' + (x[0] === 'bad' ? 'bad' : '') + '"><div><b>' + x[1] + '.</b> ' + x[2] + '</div></div>'; });
    if (it.pr.length) {
      h += '<div class="lbl">Giá dịch vụ 2025 tại bệnh viện tham chiếu</div><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Bệnh viện · quyết định</th><th>Mã tương đương</th><th>Tên dịch vụ phê duyệt giá</th><th class="num">Mức giá</th><th>Ghi chú</th></tr></thead><tbody>' +
        it.pr.map(function (p) { var s = M.gia[p[0]]; return '<tr><td><b>' + esc(s.ten) + '</b><div class="small mute">' + esc(s.vb) + '</div><span class="chip ' + (p[5] === 'ngoai' ? 'bad' : p[5] === 'gayte' ? 'warn' : 'ok') + '">' + LOAI[p[5]] + '</span></td><td>' + p[1].split(' · ').map(function (c) { return '<div><span class="code">' + esc(c) + '</span></div>'; }).join('') + '</td><td>' + esc(p[2]) + '</td><td class="num">' + vnd(p[3]) + '</td><td class="small">' + esc(p[4]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="small mute">Từ 2025, giá dịch vụ do cấp có thẩm quyền phê duyệt cho từng cơ sở (TT 21/2024/TT-BYT). Hai bảng trên là quyết định giá của Bộ Y tế cho 2 bệnh viện trường đại học (Huế; ĐHQG Hà Nội); giá ở cơ sở khác có thể khác. Mã tương đương = chương · số thứ tự kỹ thuật · mã giá.</p>';
    } else h += '<div class="card"><b>Chưa có giá tham chiếu</b><div class="small mute" style="margin-top:4px">Kỹ thuật không có trong 2 bảng giá 2025 tham chiếu (QĐ 311/QĐ-BYT, QĐ 441/QĐ-BYT). Tra bảng giá của cơ sở cụ thể.</div></div>';
    if (it.ex.length) {
      h += '<div class="lbl" style="margin-top:20px">Vật tư chưa bao gồm trong giá ⇒ thanh toán riêng</div><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Vật tư</th><th>Nhóm thiết bị y tế BHYT</th><th>Điều kiện, mức thanh toán</th></tr></thead><tbody>' +
        it.ex.map(function (e) { var v = e[1] && VT[e[1]]; return '<tr><td>' + esc(e[0]) + '</td><td>' + (v ? '<span class="code">' + v[1] + '</span> ' + esc(v[2]) : '<span class="mute">—</span>') + '</td><td class="small">' + (v && v[4] ? esc(v[4]) : v ? 'Theo giá trúng thầu, tỷ lệ và mức hưởng BHYT' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    h += '<div class="lbl" style="margin-top:20px">Cách BHYT thanh toán</div><ul class="ul small">' +
      '<li>Quỹ BHYT trả = giá dịch vụ được duyệt × mức hưởng (100% / 95% / 80% tùy đối tượng — Luật BHYT, Điều 22); dịch vụ có tỷ lệ riêng theo TT 35/2016 (hợp nhất 17/VBHN-BYT).</li>' +
      '<li>Thiết bị y tế đã tính vào giá dịch vụ thì không thanh toán riêng; chưa tính thì thanh toán theo giá mua vào qua đấu thầu, không quá mức tại cột 5 Phụ lục 01 TT 04/2017 (hợp nhất 14/VBHN-BYT).</li>' +
      '<li>Tổng chi phí thiết bị y tế cho 1 lần dùng dịch vụ kỹ thuật không quá 45 tháng lương cơ sở (trừ thiết bị có tỷ lệ riêng).</li>' +
      (it.ck === 'mat' ? '<li>Chuyên khoa Mắt: giá phẫu thuật chưa gồm gây mê; nếu gây mê thì thanh toán riêng theo giá "gây mê trong phẫu thuật mắt".</li>' : '') +
      '<li>Nhiều can thiệp trong 1 lần mổ: trả giá phẫu thuật cao nhất + 50% (cùng kíp) hoặc 80% (khác kíp) giá phẫu thuật phát sinh; thủ thuật phát sinh 80%.</li></ul>' +
      '<p class="small"><a href="#/bhyt">Xem đầy đủ quy định BHYT &amp; danh mục thiết bị y tế</a></p>';
    return h;
  }
  function tabQT(it) {
    var ck = it.ck, d = M.qtdoc[ck];
    if (!it.q) return Promise.resolve('<div class="card"><b>Chưa có quy trình trong ' + esc(d.ten) + '.</b><div class="small mute" style="margin-top:4px">' + (it.only1 ? 'Kỹ thuật chỉ có ở Phụ lục 01; quy trình 2025 xây dựng theo Phụ lục 02.' : 'Quy trình có thể nằm ở tập 2 hoặc chưa ban hành.') + ' Cơ sở khám chữa bệnh áp dụng quy trình do người đứng đầu cơ sở ban hành khi Bộ Y tế chưa có (TT 35/2016, Điều 3).</div></div>');
    return ensureQT(ck).then(function (Q) {
      var x = Q[it.q.n]; if (!x) return '<div class="empty">Không đọc được quy trình.</div>';
      var kw = kwsOf(ck), sec = function (lab, t) { return t ? '<div class="sec"><div class="lbl">' + lab + '</div><div>' + esc(t) + '</div></div>' : ''; };
      var tb = x.tb.length ? '<div class="sec"><div class="lbl">Thiết bị y tế (mục 5.3)</div><ul class="ul">' + x.tb.map(function (t) { var hit = kw.some(function (k) { return nrm(t).indexOf(nrm(k)) >= 0; }); return '<li class="' + (hit ? 'hit' : '') + '">' + hl(t, kw) + '</li>'; }).join('') + '</ul></div>' : '';
      var th = x.th.length ? '<div class="sec"><div class="lbl">Thuốc (mục 5.2)</div><div class="small">' + esc(x.th.join(' · ')) + '</div></div>' : '';
      var b = x.b.length ? '<div class="sec"><div class="lbl">Các bước tiến hành</div><ol class="steps">' + x.b.map(function (s) { return '<li>' + (s[0] ? '<b>' + esc(s[0].replace(/^6\.\d+\.\s*/, '')) + '</b> ' : '') + hl(s[1], kw) + '</li>'; }).join('') + '</ol></div>' : '';
      return '<div class="note" style="margin-bottom:16px"><b>' + esc(d.qd) + '</b> ngày ' + d.ngay + ' · ' + esc(d.ten) + ' · quy trình số ' + it.q.n + ' · <a href="' + d.pdf + '#page=' + x.p + '" target="_blank" rel="noopener">Mở bản PDF (trang ' + x.p + ')</a></div>' +
        '<h2 class="h1" style="font-size:19px;text-transform:none;letter-spacing:0;margin-bottom:14px">' + esc(x.t) + '</h2>' +
        sec('Đại cương', x.dc) + sec('Chỉ định', x.cd) + sec('Chống chỉ định', x.ccd) + sec('Thận trọng', x.tt) + th + tb + b + sec('Theo dõi và xử trí tai biến', x.td) +
        '<p class="small mute">Chữ trích tự động từ bản PDF; khi dùng chính thức, đối chiếu bản gốc. Chữ tô vàng = dụng cụ / vật tư MMH có thể đáp ứng.</p>';
    });
  }
  function tabDM(it) {
    var h = '<div class="kv">';
    if (!it.only1) h += '<div>Phụ lục 02 (từ 01/01/2028)</div><div><b>' + esc(it.t) + '</b><div class="small mute">' + esc(it.c2 || '') + ' · STT trong chương ' + it.s2 + ' · STT chung ' + (it.n2 || '') + '</div></div>';
    h += '<div>Phụ lục 01 (đến 31/12/2027)</div><div>' + (it.l.length ? it.l.map(function (l) { return '<div><span class="code">' + esc(l[1]) + '</span> ' + esc(l[2]) + ' <span class="small mute">· ' + esc(l[3]) + '</span></div>'; }).join('') : '<span class="mute">Không có mã liên kết (kỹ thuật mới của Phụ lục 02)</span>') + '</div>';
    if (it.to2) h += '<div>Ở Phụ lục 02</div><div>Chuyển sang chương: ' + esc(it.to2.join(', ')) + '</div>';
    h += '<div>Phân loại PT / TT</div><div class="small">Theo TT 50/2014/TT-BYT, áp dụng qua mã kỹ thuật ở cột 2 Phụ lục 01 (TT 25/2026/TT-BYT).</div>';
    h += '<div>Quy trình kỹ thuật</div><div>' + (it.q ? esc(M.qtdoc[it.ck].qd) + ' · số ' + it.q.n : '—') + '</div></div>';
    h += '<p class="small mute" style="margin-top:16px">Mã kỹ thuật ở Phụ lục 01 = số thứ tự kỹ thuật trong chương của TT 43/2013 và TT 21/2017 (mã "BS_" là kỹ thuật bổ sung). Mã liên kết ở Phụ lục 02 trỏ về các mã này.</p>';
    return h;
  }

  /* ---------- Sản phẩm ---------- */
  function prodPage() {
    setNav('sp'); title('Sản phẩm MMH');
    app.innerHTML = '<div class="crumb"><a href="#/">Trang chủ</a> › Sản phẩm MMH</div><h1 class="h1">Sản phẩm MMH theo thủ thuật</h1><div class="sub">Mỗi nhóm sản phẩm được dùng ở những thủ thuật nào, theo quy trình Bộ Y tế và tài liệu MMH</div><div id="pg"><div class="loading">Đang tính…</div></div>';
    ensureAll().then(function () {
      var cnt = productCounts(), h = '';
      ['mat', 'rhm'].forEach(function (ck) {
        h += '<h2 class="h2">' + CK[ck].full + '</h2><div class="grid g3">' + M.groups.filter(function (g) { return g.ck === ck; }).map(function (g) {
          var c = cnt[g.id] || { n: 0, q: 0 };
          return '<a class="prod" href="#/sp/' + g.id + '"><div class="t">' + esc(g.name) + '</div><div class="c" style="margin:4px 0 8px">' + esc(g.desc) + '</div><div class="chips"><span class="chip q">' + c.q + ' theo QTKT</span><span class="chip">' + c.n + ' thủ thuật</span></div></a>';
        }).join('') + '</div>' + matrix(ck);
      });
      $('#pg').innerHTML = h;
    });
  }
  function matrix(ck) {
    var gs = M.groups.filter(function (g) { return g.ck === ck; }), secs = M.sec[ck], a = DATA[ck];
    var cell = function (s, g) { return a.filter(function (i) { return i.sec === s && i.pt.some(function (p) { return p.g === g; }); }).length; };
    var mx = 0, rows = secs.map(function (s) { var r = gs.map(function (g) { var n = cell(s[0], g.id); mx = Math.max(mx, n); return n; }); return [s, r]; });
    var lev = function (n) { return n === 0 ? 0 : n <= mx * 0.15 ? 1 : n <= mx * 0.4 ? 2 : n <= mx * 0.7 ? 3 : 4; };
    return '<div class="lbl" style="margin-top:18px">Ma trận nhóm thủ thuật × sản phẩm (số kỹ thuật)</div><div class="tbl matrix" style="margin-top:8px"><table><thead><tr><th>Nhóm</th>' + gs.map(function (g) { return '<th>' + esc(g.short) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(r[0][1]) + '</td>' + r[1].map(function (n, j) { return '<td>' + (n ? '<a class="mx l' + lev(n) + '" href="#/tt/' + ck + '?p=' + gs[j].id + '&s=' + r[0][0] + '">' + n + '</a>' : '<span class="mx l0">·</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function prodOne(gid) {
    var g = G[gid]; if (!g) { prodPage(); return; }
    setNav('sp'); title(g.name);
    app.innerHTML = '<div class="crumb"><a href="#/">Trang chủ</a> › <a href="#/sp">Sản phẩm MMH</a> › ' + esc(g.short) + '</div><div class="dhead"><div class="lbl">' + CK[g.ck].full + '</div><h1 class="h1">' + esc(g.name) + '</h1><div class="sub">' + esc(g.desc) + '</div>' +
      '<div class="chips"><a class="chip" href="' + wiki(gid) + '" target="_blank" rel="noopener">Thông tin sản phẩm trên MMH Wiki ↗</a>' + (g.vtyt || []).map(function (c) { return VT[c] ? '<span class="chip" title="' + esc(VT[c][2]) + '">BHYT ' + c + '</span>' : ''; }).join('') + '</div></div><div id="po"><div class="loading">Đang tải…</div></div>';
    ensure(g.ck).then(function (a) {
      var r = a.filter(function (i) { return i.pt.some(function (p) { return p.g === gid; }); });
      var q = r.filter(function (i) { return i.pt.some(function (p) { return p.g === gid && p.lv.indexOf('q') >= 0; }); });
      var vt = (g.vtyt || []).filter(function (c) { return VT[c]; });
      var h = '<div class="grid g3" style="margin-top:16px"><div class="card"><div class="lbl">Thủ thuật dùng</div><div class="h1" style="font-size:28px">' + r.length + '</div></div><div class="card"><div class="lbl">Quy trình Bộ Y tế ghi rõ</div><div class="h1" style="font-size:28px">' + q.length + '</div></div><div class="card"><div class="lbl">Có giá BHYT tham chiếu</div><div class="h1" style="font-size:28px">' + r.filter(function (i) { return i.pr.length; }).length + '</div></div></div>';
      if (vt.length) h += '<h2 class="h2">Nhóm thiết bị y tế BHYT liên quan</h2><div class="tbl"><table><thead><tr><th>Mã nhóm</th><th>Tên nhóm (TT 04/2017 + TT 24/2025)</th><th>ĐVT</th><th>Điều kiện, mức thanh toán</th></tr></thead><tbody>' + vt.map(function (c) { var v = VT[c]; return '<tr><td><span class="code">' + c + '</span></td><td>' + esc(v[2]) + '</td><td>' + esc(v[3]) + '</td><td class="small">' + esc(v[4] || 'Theo giá mua vào qua đấu thầu, phạm vi và mức hưởng BHYT; không thanh toán riêng nếu đã tính trong giá dịch vụ.') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      var bySec = {}; r.forEach(function (i) { (bySec[i.sec] = bySec[i.sec] || []).push(i); });
      h += '<h2 class="h2">Thủ thuật theo nhóm</h2>';
      M.sec[g.ck].forEach(function (s) {
        var L = bySec[s[0]]; if (!L) return;
        var rk = function (i) { var p = i.pt.filter(function (p) { return p.g === gid; })[0]; return p.lv.indexOf('q') >= 0 ? 0 : p.lv.indexOf('m') >= 0 ? 1 : 2; };
        L.sort(function (x, y) { return rk(x) - rk(y) || x.t.localeCompare(y.t, 'vi'); });
        h += '<div class="lbl" style="margin:16px 0 6px">' + esc(s[1]) + ' · ' + L.length + '</div><div class="rows">' + L.map(function (i) {
          var p = i.pt.filter(function (p) { return p.g === gid; })[0], ev = p.ev[0];
          return '<a class="row" href="#/k/' + i.id + '"><div><div class="t">' + esc(i.t) + '</div><div class="meta">' + lvChip(p.lv) + (ev ? '<span class="small mute">' + esc(ev[0]) + ': ' + esc(ev[1].slice(0, 120)) + '</span>' : p.sug[0] ? '<span class="small mute">' + esc(p.sug[0]) + '</span>' : '') + '</div></div><div class="pr">' + (priceMain(i) || '<small>chưa có giá</small>') + '</div></a>';
        }).join('') + '</div>';
      });
      $('#po').innerHTML = h;
    });
  }

  /* ---------- BHYT ---------- */
  function bhytPage() {
    setNav('bhyt'); title('BHYT & vật tư');
    var used = {}; M.groups.forEach(function (g) { (g.vtyt || []).forEach(function (c) { (used[c] = used[c] || []).push(g.short); }); });
    var vt = M.vtyt.map(function (v) { return '<tr><td><span class="code">' + v[1] + '</span></td><td>' + esc(v[2]) + '</td><td>' + esc(v[3]) + '</td><td class="small">' + esc(v[4]) + '</td><td>' + (used[v[1]] ? used[v[1]].map(function (s) { return '<span class="chip q">' + esc(s) + '</span>'; }).join(' ') : '') + '</td></tr>'; }).join('');
    app.innerHTML = '<div class="crumb"><a href="#/">Trang chủ</a> › BHYT &amp; vật tư</div><h1 class="h1">Bảo hiểm y tế, giá &amp; vật tư</h1><div class="sub">Thủ thuật được thanh toán thế nào, vật tư nào được trả riêng, sản phẩm MMH nằm ở đâu</div>' +
      '<h2 class="h2">Nguyên tắc</h2><div class="grid g2">' +
      '<div class="card"><div class="lbl">Phạm vi &amp; mức hưởng</div><ul class="ul"><li>Dịch vụ kỹ thuật trong danh mục kỹ thuật được Bộ Y tế cho phép thuộc phạm vi BHYT, trừ trường hợp ở Điều 23 Luật BHYT (TT 35/2016, Điều 1).</li><li>Quỹ trả: giá được duyệt × mức hưởng 100% / 95% / 80% theo đối tượng (Luật BHYT, Điều 22, sửa đổi bởi Luật 51/2024/QH15, hiệu lực 01/7/2025).</li><li>Điều kiện: cơ sở được phê duyệt thực hiện, làm theo quy trình chuyên môn, có giá được phê duyệt (TT 35/2016, Điều 3).</li></ul></div>' +
      '<div class="card"><div class="lbl">Không được BHYT thanh toán (Điều 23)</div><ul class="ul"><li>Dịch vụ thẩm mỹ (khoản 6).</li><li>Điều trị lác và tật khúc xạ của mắt cho người từ đủ 18 tuổi (khoản 7).</li><li>Thiết bị y tế thay thế: mắt giả, răng giả, kính mắt, máy trợ thính… (khoản 8).</li><li>Khám sức khỏe (trừ định kỳ, sàng lọc), giám định, thử nghiệm lâm sàng…</li></ul></div>' +
      '<div class="card"><div class="lbl">Giá dịch vụ từ 2025</div><ul class="ul"><li>TT 21/2024/TT-BYT quy định phương pháp định giá; giá thống nhất theo hạng bệnh viện (TT 22/2023) không còn áp dụng.</li><li>Bộ Y tế quyết định giá cho bệnh viện thuộc thẩm quyền (ví dụ QĐ 311/QĐ-BYT cho BV Trường ĐH Y Dược Huế, QĐ 441/QĐ-BYT cho BV ĐH Y Dược – ĐHQG Hà Nội); cơ sở của địa phương theo quyết định của tỉnh.</li><li>Ghi chú "Chưa bao gồm …" trong bảng giá = vật tư được thanh toán riêng.</li></ul></div>' +
      '<div class="card"><div class="lbl">Thiết bị y tế (vật tư)</div><ul class="ul"><li>Đã tính vào giá dịch vụ ⇒ không thanh toán riêng (TT 04/2017, Điều 3).</li><li>Chưa tính ⇒ trả theo giá mua vào qua đấu thầu, không vượt mức cột 5; tổng 1 lần dịch vụ ≤ 45 tháng lương cơ sở.</li><li>Thủy tinh thể nhân tạo: mức thanh toán 3.000.000 đ / 1 thủy tinh thể (theo TT 24/2025).</li><li>TT 24/2025/TT-BYT (hiệu lực 01/9/2025) đổi "vật tư y tế" thành "thiết bị y tế".</li></ul></div></div>' +
      '<h2 class="h2">Ý nghĩa với sản phẩm MMH</h2><div class="note">Dao phẫu thuật nhãn khoa, chỉ khâu, trocar, kìm vi phẫu, mũi khoan, trâm, composite… thường <b>đã tính trong giá dịch vụ kỹ thuật</b> (bảng giá không ghi "chưa bao gồm"). Bệnh viện tự chi từ nguồn thu dịch vụ, mua qua đấu thầu theo nhóm thiết bị y tế ở bảng dưới — nên giá dịch vụ, số ca và yêu cầu kỹ thuật trong hồ sơ mời thầu là căn cứ chính. Các nhóm vẫn được liệt kê để làm hồ sơ thầu và thanh toán khi cơ sở được phép thu riêng.</div>' +
      '<h2 class="h2">Danh mục thiết bị y tế BHYT liên quan (VBHN 14/VBHN-BYT, 19/8/2025)</h2><div class="tbl"><table><thead><tr><th>Mã nhóm</th><th>Tên nhóm</th><th>ĐVT</th><th>Điều kiện, mức thanh toán</th><th>Sản phẩm MMH</th></tr></thead><tbody>' + vt + '</tbody></table></div>' +
      '<h2 class="h2">Một số quy tắc thanh toán dịch vụ kỹ thuật</h2><ul class="ul"><li>Nhiều can thiệp trong 1 lần phẫu thuật: giá phẫu thuật phức tạp nhất + 50% giá phẫu thuật phát sinh (cùng kíp) hoặc 80% (khác kíp); thủ thuật phát sinh 80%.</li><li>Giá phẫu thuật đã gồm gây mê/gây tê, trừ chuyên khoa Mắt: phẫu thuật, thủ thuật mắt có gây mê thì thanh toán riêng theo giá gây mê trong phẫu thuật/thủ thuật mắt.</li><li>Ngày giường sau phẫu thuật phaco: áp dụng giá ngày giường ngoại khoa loại 3.</li><li>Kỹ thuật thực hiện ở nhiều chuyên khoa áp dụng giá theo chuyên khoa thực hiện.</li></ul><p class="small mute">Nguồn: Luật BHYT (VBHN 2026), TT 35/2016/TT-BYT (VBHN 17/VBHN-BYT 31/12/2024), TT 04/2017/TT-BYT (VBHN 14/VBHN-BYT 19/8/2025). <a href="#/vb">Danh sách văn bản</a></p>';
  }

  /* ---------- Văn bản ---------- */
  var DOCS = [
    ['Danh mục kỹ thuật', [
      ['TT 23/2024/TT-BYT', '18/10/2024', 'Ban hành Danh mục kỹ thuật trong khám bệnh, chữa bệnh', 'Phụ lục 01: 19.438 kỹ thuật theo 28 chuyên khoa (Mắt 309, Răng Hàm Mặt 415), thực hiện đến hết 31/12/2027. Phụ lục 02: 9.128 kỹ thuật xếp theo hệ cơ quan, có mã liên kết về Phụ lục 01, thực hiện từ 01/01/2028. Thay TT 43/2013 và TT 21/2017.', 'nguon/raw/tt23-2024-pdf.pdf', 'Đang áp dụng'],
      ['TT 25/2026/TT-BYT', '30/6/2026', 'Sửa đổi TT 32/2023, TT 23/2024 và một số thông tư', 'Lùi lộ trình: Phụ lục 01 đến 31/12/2027, Phụ lục 02 từ 01/01/2028. Mã kỹ thuật cột 2 Phụ lục 01 = số thứ tự kỹ thuật của TT 43/2013, TT 21/2017 (trừ mã BS_); phân loại phẫu thuật, thủ thuật TT 50/2014 tiếp tục áp dụng qua mã này. Điều 2, 3 hiệu lực 01/7/2026.', 'nguon/raw/tt25-2026.pdf', 'Đang áp dụng'],
      ['TT 50/2014/TT-BYT', '26/12/2014', 'Phân loại phẫu thuật, thủ thuật và định mức nhân lực', 'Phân loại phẫu thuật đặc biệt, loại I–III; thủ thuật đặc biệt, loại I–III. Áp dụng qua mã kỹ thuật Phụ lục 01.', '', 'Đang áp dụng']]],
    ['Quy trình kỹ thuật', [
      ['QĐ 3517/QĐ-BYT', '12/11/2025', 'Hướng dẫn quy trình kỹ thuật về Mắt – Tập 1', '342 quy trình, xếp theo Phụ lục 02 TT 23/2024 (có bảng mã liên kết). Mỗi quy trình: đại cương, chỉ định, chống chỉ định, chuẩn bị (thuốc, thiết bị y tế), các bước, tai biến.', 'nguon/raw/qtkt-mat-tap1.pdf', 'Đang áp dụng'],
      ['QĐ 3518/QĐ-BYT', '12/11/2025', 'Hướng dẫn quy trình kỹ thuật về Mắt – Tập 2', 'Áp dụng từ 01/01/2028 (sửa bởi QĐ 1986/QĐ-BYT ngày 01/7/2026). Chưa đưa vào app.', 'nguon/raw/kcb-98755.pdf', 'Áp dụng từ 2028'],
      ['QĐ 3634/QĐ-BYT', '24/11/2025', 'Hướng dẫn quy trình kỹ thuật về Răng Hàm Mặt – Tập 1', '320 quy trình (hàm mặt, implant, nha chu, nội nha, chữa răng, phục hình, chỉnh nha, răng trẻ em…), có bảng mã liên kết với Phụ lục 01, 02.', 'nguon/raw/qtkt-rhm-tap1.pdf', 'Đang áp dụng'],
      ['QĐ 3635/QĐ-BYT', '24/11/2025', 'Hướng dẫn quy trình kỹ thuật về Răng Hàm Mặt – Tập 2', '40 quy trình. Chưa đưa vào app.', '', ''],
      ['QĐ 3207/QĐ-BYT', '29/8/2013', 'Hướng dẫn quy trình kỹ thuật chuyên ngành Răng Hàm Mặt (cũ)', '347 quy trình; MMH đã đối chiếu sản phẩm từng quy trình (dùng làm gợi ý MMH cho Răng Hàm Mặt).', 'nguon/raw/qd3207-rhm-2013.pdf', 'Tham khảo'],
      ['QĐ 3906/QĐ-BYT', '12/10/2012', 'Quy trình kỹ thuật chuyên ngành Nhãn khoa (cũ)', 'Được thay thế dần bởi bộ quy trình về Mắt 2025.', '', 'Tham khảo']]],
    ['Bảo hiểm y tế', [
      ['Luật BHYT (VBHN 2026)', '2008 · sửa 2024', 'Luật Bảo hiểm y tế 25/2008/QH12, sửa đổi bởi Luật 51/2024/QH15 (hiệu lực 01/7/2025)', 'Điều 21 phạm vi hưởng, Điều 22 mức hưởng, Điều 23 các trường hợp không được hưởng (thẩm mỹ; lác, tật khúc xạ từ đủ 18 tuổi; răng giả, kính mắt, mắt giả…).', 'nguon/raw/luat-bhyt-vbhn-2026.docx', 'Đang áp dụng'],
      ['TT 35/2016/TT-BYT · 17/VBHN-BYT', '31/12/2024', 'Danh mục và tỷ lệ, điều kiện thanh toán dịch vụ kỹ thuật y tế BHYT (hợp nhất)', 'Hợp nhất TT 35/2016, TT 50/2017, TT 13/2020, TT 39/2024 (hiệu lực 01/01/2025): nguyên tắc thanh toán, nhiều can thiệp trong 1 lần mổ, gây mê chuyên khoa Mắt, danh mục 1–3.', 'nguon/raw/vbhn17-2024-dvkt.pdf', 'Đang áp dụng'],
      ['TT 04/2017/TT-BYT · 14/VBHN-BYT', '19/8/2025', 'Danh mục và tỷ lệ, điều kiện thanh toán thiết bị y tế BHYT (hợp nhất)', 'Hợp nhất TT 04/2017 và TT 24/2025/TT-BYT (30/6/2025, hiệu lực 01/9/2025). Phụ lục 01: nhóm N05 kim, chỉ khâu, dao; N06.03 thủy tinh thể nhân tạo (3.000.000 đ); N07.03 Mắt, TMH, RHM; N08 mũi khoan, stapler…', 'nguon/raw/vbhn14-2025-vtyt.pdf', 'Đang áp dụng'],
      ['TT 39/2024/TT-BYT', '17/11/2024', 'Sửa đổi TT 35/2016 về thanh toán dịch vụ kỹ thuật BHYT', 'Hiệu lực 01/01/2025. Nội dung đã có trong 17/VBHN-BYT.', 'nguon/raw/tt39-2024-b.pdf', 'Đang áp dụng']]],
    ['Giá dịch vụ', [
      ['TT 21/2024/TT-BYT', '17/10/2024', 'Phương pháp định giá dịch vụ khám bệnh, chữa bệnh', 'Giá do cấp có thẩm quyền quyết định cho từng cơ sở; thay cơ chế giá thống nhất của TT 22/2023.', '', 'Đang áp dụng'],
      ['QĐ 311/QĐ-BYT', '24/01/2025', 'Giá dịch vụ khám bệnh, chữa bệnh tại BV Trường ĐH Y Dược Huế', 'Phụ lục III: giá dịch vụ kỹ thuật theo tên TT 23/2024, có mã tương đương và ghi chú "chưa bao gồm…". Dùng làm giá tham chiếu trong app.', 'nguon/raw/gia-hue-311-2025.pdf', 'Tham chiếu'],
      ['QĐ 441/QĐ-BYT', '07/02/2025', 'Giá dịch vụ khám bệnh, chữa bệnh tại BV Đại học Y Dược – ĐHQG Hà Nội', 'Bản đăng trên Thư viện Pháp luật. Dùng làm giá tham chiếu thứ hai.', 'nguon/raw/gia-tvpl-642258.pdf', 'Tham chiếu'],
      ['TT 22/2023/TT-BYT', '17/11/2023', 'Giá dịch vụ BHYT thống nhất giữa bệnh viện cùng hạng (cũ)', 'Không còn áp dụng với cơ sở đã có quyết định giá mới.', 'nguon/raw/tt22-2023-pl.pdf', 'Hết áp dụng']]]
  ];
  function docsPage() {
    setNav('vb'); title('Văn bản');
    app.innerHTML = '<div class="crumb"><a href="#/">Trang chủ</a> › Văn bản</div><h1 class="h1">Văn bản pháp quy</h1><div class="sub">Văn bản mới nhất dùng trong app · bản gốc lưu trong kho để đối chiếu</div>' +
      DOCS.map(function (g) {
        return '<h2 class="h2">' + g[0] + '</h2><div class="grid g2">' + g[1].map(function (d) {
          var st = d[5] === 'Đang áp dụng' ? 'ok' : d[5] === 'Hết áp dụng' ? 'bad' : d[5] ? 'warn' : '';
          return '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="lbl">' + esc(d[0]) + ' · ' + esc(d[1]) + '</div><div style="font-weight:700;color:var(--navy);margin-top:4px">' + esc(d[2]) + '</div></div>' + (d[5] ? '<span class="chip ' + st + '">' + esc(d[5]) + '</span>' : '') + '</div><div class="small" style="margin-top:8px">' + esc(d[3]) + '</div>' + (d[4] ? '<div style="margin-top:8px"><a class="small" href="' + d[4] + '" target="_blank" rel="noopener">Mở bản lưu ↗</a></div>' : '') + '</div>';
        }).join('') + '</div>';
      }).join('') +
      '<p class="small mute" style="margin-top:20px">Bản lưu lấy từ cổng thông tin cơ quan nhà nước, trang của bệnh viện công bố lại; tên file và đường dẫn gốc ghi ở nguon/fetch/log.json. Dữ liệu trong app trích tự động, dùng để tra cứu nhanh — khi dùng chính thức, đối chiếu văn bản gốc.</p>';
  }

  /* ---------- Tìm nhanh (đầu trang) ---------- */
  (function () {
    var inp = $('#qsIn'), box = $('#qsRes'), sel = -1;
    var run = debounce(function () {
      var q = inp.value; if (!q.trim()) { box.classList.remove('on'); return; }
      ensureAll().then(function () {
        var r = search(q, DATA.mat.concat(DATA.rhm), 10); sel = -1;
        box.innerHTML = r.length ? r.map(function (it) { return '<a href="#/k/' + it.id + '">' + esc(it.t) + '<br><small>' + CK[it.ck].name + ' · ' + esc(SEC[it.ck][it.sec] || '') + (it.pt.length ? ' · ' + it.pt.map(function (p) { return G[p.g].short; }).slice(0, 3).join(', ') : '') + '</small></a>'; }).join('') : '<a href="javascript:void 0"><small>Không thấy kỹ thuật phù hợp</small></a>';
        box.classList.add('on');
      });
    }, 150);
    inp.addEventListener('input', run);
    inp.addEventListener('focus', function () { ensureAll(); if (inp.value) run(); });
    inp.addEventListener('keydown', function (e) {
      var a = box.querySelectorAll('a'); if (!a.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, Math.min(a.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); a.forEach(function (x, i) { x.classList.toggle('sel', i === sel); }); }
      if (e.key === 'Enter') { e.preventDefault(); (a[sel >= 0 ? sel : 0]).click(); }
      if (e.key === 'Escape') box.classList.remove('on');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#qs')) box.classList.remove('on'); else if (e.target.closest('#qsRes a')) { box.classList.remove('on'); inp.blur(); } });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); } });
  })();

  /* ---------- Định tuyến ---------- */
  function route() {
    app.onclick = null;
    var h = location.hash.replace(/^#\/?/, ''), qi = h.indexOf('?'), qs = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); qs[p[0]] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var p = h.split('/');
    window.scrollTo(0, 0);
    if (p[0] === 'tt' && CK[p[1]]) { if (qs.s) { LS[p[1]] = LS[p[1]] || { sec: '', kind: '', prod: '', only: '', q: '', sort: 'pl', n: 60 }; LS[p[1]].sec = qs.s; } listPage(p[1], qs); }
    else if (p[0] === 'k' && p[1]) detail(p[1], p[2]);
    else if (p[0] === 'sp') p[1] ? prodOne(p[1]) : prodPage();
    else if (p[0] === 'bhyt') bhytPage();
    else if (p[0] === 'vb') docsPage();
    else home();
  }
  $('#foot').innerHTML = 'MMH Wikipedia · Thủ thuật v' + VER + ' · dữ liệu dựng ngày ' + M.built.split('-').reverse().join('/') + ' từ văn bản Bộ Y tế và tài liệu sản phẩm MMH. Thông tin để tra cứu nội bộ; khi dùng chính thức đối chiếu văn bản gốc. <a href="#/vb">Nguồn</a>';
  window.addEventListener('hashchange', route);
  route();
})();
