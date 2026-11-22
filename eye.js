/* EYE — bộ hình vẽ mắt DÙNG CHUNG cho mọi "Sổ tay minh họa" nhãn khoa (cùng tỉ lệ, cùng màu, cùng nét).
   Mọi thủ thuật mắt vẽ trên 3 khung chuẩn:
     EYE.section(o)  mặt cắt dọc nhãn cầu (giác mạc bên trái, thị thần kinh bên phải)
     EYE.front(o)    nhìn chính diện (giác mạc, mống mắt, vòng pars plana, vị trí cổng theo giờ đồng hồ)
     EYE.retina(o)   phóng to các lớp võng mạc vùng hoàng điểm (bóc màng, laser…)
   Quy ước màu: nét giải phẫu navy · võng mạc hồng đất · vùng pars plana vàng nhạt · SẢN PHẨM MANI vàng đậm (#C98A00)
   · dụng cụ / máy khác xám thép. Nhãn: số tròn navy + đường dẫn nét đứt.
   Khi vẽ thủ thuật mới: chỉ thêm lớp phủ (cổng, dụng cụ, chất độn, nhãn) — không vẽ lại giải phẫu. */
(function () {
  'use strict';
  var C = { ink: '#2C4A5E', steel: '#5A84A6', line: '#BCD4E6', soft: '#F3F7FB', cornea: '#EAF4FB', iris: '#9DB8CE', pupil: '#2C4A5E',
            lens: '#FBE9B7', retina: '#C77B6B', rpe: '#8C5A4A', pp: '#F6D66B', mani: '#C98A00', maniFill: '#FFF3CF', dev: '#7D8C99',
            gel: '#E3EDF6', gas: '#FFFFFF', oil: '#F7E7B0', dye: '#6C8FC7', laser: '#7FB069', txt: '#1F2D38' };
  var CX = 215, CY = 130, R = 100, RR = 94; // tâm, bán kính nhãn cầu, bán kính mặt trong võng mạc
  var MM = R / 12; // 1 mm ≈ R/12 (nhãn cầu ~24 mm)
  function deg(a) { return a * Math.PI / 180; }
  function P(theta, r) { return [CX + (r == null ? R : r) * Math.cos(deg(theta)), CY + (r == null ? R : r) * Math.sin(deg(theta))]; }
  function f(n) { return Math.round(n * 10) / 10; }
  function pt(p) { return f(p[0]) + ',' + f(p[1]); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* góc chuẩn trên mặt cắt (độ, trục x sang phải, y xuống): rìa giác mạc 210° (trên) / 150° (dưới) */
  var LIMB_UP = 210, LIMB_DN = 150, PP_ANG = 3.5 * MM / R * 180 / Math.PI; // 3,5 mm sau rìa ≈ 16,7°
  var A = { // điểm neo có tên cho nhãn
    cornea: [113, 130], lens: [160, 130], iris: [141, 100], ac: [128, 130],
    ppUp: P(LIMB_UP + PP_ANG + 4), ppDn: P(LIMB_DN - PP_ANG - 4), ora: P(LIMB_UP + 38, RR),
    vit: [228, 128], retina: P(55, RR), macula: P(0, RR), nerve: [326, 146], sclera: P(300), choroid: P(70, R - 3)
  };

  function defs(id) {
    return '<defs><pattern id="gel' + id + '" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="' + C.gel + '"/><circle cx="2" cy="2" r=".9" fill="#C9D9E8"/><circle cx="6.5" cy="6.5" r=".9" fill="#C9D9E8"/></pattern>' +
      '<marker id="ar' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + C.ink + '"/></marker>' +
      '<clipPath id="in' + id + '"><circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '"/></clipPath></defs>';
  }
  var uid = 0, BB = [];
  /* khung cố định cho mọi thủ thuật ⇒ cùng tỉ lệ khi hiển thị; nhãn dài quá khung thì khung tự giãn */
  var TIGHT = { section: [95, 12, 385, 248], front: [70, 8, 350, 252], retina: [40, 0, 380, 235] };
  var BASE = { section: [-35, 4, 480, 256], front: [-35, 4, 480, 256], retina: [0, 0, 420, 240] };

  /* ---------- Mặt cắt dọc ---------- */
  function section(o) {
    o = o || {}; var id = 's' + (++uid), s = [];
    var lu = P(LIMB_UP), ld = P(LIMB_DN);
    s.push(defs(id));
    // buồng dịch kính + chất trong buồng
    var fill = o.fill || 'gel';
    s.push('<g clip-path="url(#in' + id + ')">');
    if (fill === 'gel' || fill === 'cleared') s.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '" fill="url(#gel' + id + ')"/>');
    else s.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '" fill="' + C.soft + '"/>');
    if (fill === 'cleared') s.push('<circle cx="' + (CX + 8) + '" cy="' + CY + '" r="62" fill="' + C.soft + '"/>');
    if (fill === 'gas') s.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '" fill="#DCEAF5"/>' + '<rect x="100" y="0" width="300" height="' + (CY - 10) + '" fill="' + C.gas + '"/><line x1="120" y1="' + (CY - 10) + '" x2="320" y2="' + (CY - 10) + '" stroke="' + C.steel + '" stroke-dasharray="4 3"/>');
    if (fill === 'oil') s.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + RR + '" fill="' + C.oil + '" opacity=".75"/>');
    s.push('</g>');
    // võng mạc (từ ora serrata trên → cực sau → ora dưới), hố hoàng điểm, đĩa thị
    var o1 = P(LIMB_UP + 38, RR), o2 = P(LIMB_DN - 38, RR);
    s.push('<path d="M' + pt(o1) + ' A' + RR + ' ' + RR + ' 0 1 1 ' + pt(o2) + '" fill="none" stroke="' + C.retina + '" stroke-width="4"/>');
    var m = P(0, RR);
    s.push('<path d="M' + pt([m[0] - 1, m[1] - 9]) + ' Q' + pt([m[0] - 7, m[1]]) + ' ' + pt([m[0] - 1, m[1] + 9]) + '" fill="none" stroke="' + C.retina + '" stroke-width="3"/>');
    // củng mạc (mở ở phía giác mạc) + giác mạc
    s.push('<path d="M' + pt(lu) + ' A' + R + ' ' + R + ' 0 1 1 ' + pt(ld) + ' A86 86 0 0 1 ' + pt(lu) + '" fill="none" stroke="' + C.ink + '" stroke-width="2.4"/>');
    s.push('<path d="M' + pt(ld) + ' A86 86 0 0 1 ' + pt(lu) + '" fill="' + C.cornea + '" stroke="' + C.ink + '" stroke-width="2.4"/>');
    // thị thần kinh
    var n1 = P(8), n2 = P(20);
    s.push('<path d="M' + pt(n1) + ' L' + f(n1[0] + 52) + ',' + f(n1[1] + 6) + ' L' + f(n2[0] + 52) + ',' + f(n2[1] + 6) + ' L' + pt(n2) + '" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>');
    // thể mi + pars plana (vàng nhạt: vùng an toàn đặt cổng)
    if (o.pp !== false) {
      [[LIMB_UP + 6, LIMB_UP + 34], [LIMB_DN - 34, LIMB_DN - 6]].forEach(function (a) {
        var a1 = P(a[0], R - 2.5), a2 = P(a[1], R - 2.5);
        s.push('<path d="M' + pt(a1) + ' A' + (R - 2.5) + ' ' + (R - 2.5) + ' 0 0 1 ' + pt(a2) + '" fill="none" stroke="' + C.pp + '" stroke-width="5" stroke-linecap="round"/>');
      });
    }
    // mống mắt, thể thủy tinh / IOL
    s.push('<path d="M' + pt([lu[0] + 5, lu[1] + 6]) + ' L150,113 M' + pt([ld[0] + 5, ld[1] - 6]) + ' L150,147" stroke="' + C.steel + '" stroke-width="4" stroke-linecap="round"/>');
    if (o.lens !== false) s.push(o.lens === 'iol' ? '<ellipse cx="160" cy="130" rx="6" ry="20" fill="' + C.lens + '" stroke="' + C.ink + '" stroke-width="1.6"/><path d="M160,110 q14,-10 20,-24 M160,150 q14,10 20,24" fill="none" stroke="' + C.ink + '" stroke-width="1.4"/>' :
      '<ellipse cx="161" cy="130" rx="13" ry="29" fill="' + C.lens + '" stroke="' + C.ink + '" stroke-width="1.6"/>');
    // màng (ERM / ILM) trên hoàng điểm
    if (o.membrane) s.push('<path d="M' + pt(P(-16, RR - 3)) + ' A' + (RR - 3) + ' ' + (RR - 3) + ' 0 0 1 ' + pt(P(16, RR - 3)) + '" fill="none" stroke="' + C.dye + '" stroke-width="2.5" stroke-dasharray="' + (o.membrane === 'peel' ? '5 3' : '0') + '"/>');
    // thước đo khoảng cách từ rìa giác mạc tới cổng (mặt ngoài nhãn cầu)
    if (o.measure) {
      var r2 = R + 11, m1 = P(LIMB_UP, r2), m2 = P(PORT.up, r2);
      s.push('<path d="M' + pt(m1) + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + pt(m2) + '" fill="none" stroke="' + C.mani + '" stroke-width="1.8"/>');
      [LIMB_UP, PORT.up].forEach(function (a) { var t1 = P(a, R + 5), t2 = P(a, R + 17); s.push('<line x1="' + f(t1[0]) + '" y1="' + f(t1[1]) + '" x2="' + f(t2[0]) + '" y2="' + f(t2[1]) + '" stroke="' + C.mani + '" stroke-width="1.8"/>'); });
      A.measure = P(LIMB_UP + 2, R + 15); A.limbus = P(LIMB_UP);
    }
    // cổng trocar + dụng cụ
    (o.ports || []).forEach(function (p) { s.push(port(p)); });
    (o.tools || []).forEach(function (t) { s.push(tool(t)); });
    (o.arrows || []).forEach(function (a) { s.push('<path d="M' + pt(a[0]) + ' Q' + pt(a[1]) + ' ' + pt(a[2]) + '" fill="none" stroke="' + C.ink + '" stroke-width="1.6" marker-end="url(#ar' + id + ')"/>'); });
    if (o.laser) o.laser.forEach(function (a) { var q = P(a, RR); s.push('<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="3" fill="' + C.laser + '"/>'); });
    s.push(labels(o.labels, id));
    return svg(o, s, 'section');
  }
  var PORT = { up: LIMB_UP + PP_ANG + 4, dn: LIMB_DN - PP_ANG - 4 };
  function portGeo(name, target) {
    var th = PORT[name] != null ? PORT[name] : name, e = P(th), t = target || [CX + 10, CY];
    var dx = t[0] - e[0], dy = t[1] - e[1], l = Math.sqrt(dx * dx + dy * dy);
    return { e: e, u: [dx / l, dy / l], t: t, l: l };
  }
  function port(p) {
    var g = portGeo(p.at, p.aim), e = g.e, u = g.u, col = p.mani ? C.mani : C.dev;
    var a = [e[0] - u[0] * 9, e[1] - u[1] * 9], b = [e[0] + u[0] * 9, e[1] + u[1] * 9], n = [-u[1], u[0]];
    var hub = [[a[0] + n[0] * 6, a[1] + n[1] * 6], [a[0] - n[0] * 6, a[1] - n[1] * 6]];
    var h = '<line x1="' + f(a[0]) + '" y1="' + f(a[1]) + '" x2="' + f(b[0]) + '" y2="' + f(b[1]) + '" stroke="' + col + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<line x1="' + pt(hub[0]).replace(',', '" y1="') + '" x2="' + pt(hub[1]).replace(',', '" y2="') + '" stroke="' + col + '" stroke-width="4" stroke-linecap="round"/>';
    if (p.infusion) {
      var o = [a[0] - u[0] * 30 + n[0] * 14, a[1] - u[1] * 30 + n[1] * 14];
      h += '<path d="M' + pt(a) + ' Q' + pt([a[0] - u[0] * 14, a[1] - u[1] * 14]) + ' ' + pt(o) + '" fill="none" stroke="' + C.steel + '" stroke-width="2"/>';
    }
    return h;
  }
  function tool(t) {
    var g = portGeo(t.from, t.to), e = g.e, u = g.u, col = t.mani ? C.mani : C.dev, tip = g.t;
    var out = [e[0] - u[0] * (t.out || 46), e[1] - u[1] * (t.out || 46)], n = [-u[1], u[0]], h = '';
    h += '<line x1="' + f(out[0]) + '" y1="' + f(out[1]) + '" x2="' + f(tip[0]) + '" y2="' + f(tip[1]) + '" stroke="' + col + '" stroke-width="' + (t.kind === 'light' ? 2.2 : 3) + '" stroke-linecap="round"/>';
    if (t.kind === 'light') h += '<path d="M' + pt(tip) + ' L' + pt([tip[0] + u[0] * 40 + n[0] * 16, tip[1] + u[1] * 40 + n[1] * 16]) + ' L' + pt([tip[0] + u[0] * 40 - n[0] * 16, tip[1] + u[1] * 40 - n[1] * 16]) + ' z" fill="#FFF6C9" opacity=".8"/>';
    if (t.kind === 'cutter') h += '<rect x="' + f(tip[0] - 3) + '" y="' + f(tip[1] - 3) + '" width="6" height="6" fill="#fff" stroke="' + col + '" stroke-width="1.5" transform="rotate(' + f(Math.atan2(u[1], u[0]) * 180 / Math.PI) + ' ' + f(tip[0]) + ' ' + f(tip[1]) + ')"/>';
    if (t.kind === 'forceps') h += '<path d="M' + pt(tip) + ' l' + f(u[0] * 9 + n[0] * 5) + ',' + f(u[1] * 9 + n[1] * 5) + ' M' + pt(tip) + ' l' + f(u[0] * 9 - n[0] * 5) + ',' + f(u[1] * 9 - n[1] * 5) + '" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (t.kind === 'needle') h += '<circle cx="' + f(tip[0]) + '" cy="' + f(tip[1]) + '" r="2.5" fill="' + col + '"/>';
    return h;
  }

  /* ---------- Nhìn chính diện ---------- */
  function front(o) {
    o = o || {}; var id = 'f' + (++uid), s = [defs(id)], c = [210, 130], Rg = 110, rl = 5.75 * Rg / 12, rr = rl + 3.5 * Rg / 12;
    s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + Rg + '" fill="#fff" stroke="' + C.ink + '" stroke-width="2.4"/>');
    if (o.ring !== false) s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + f(rr) + '" fill="none" stroke="' + C.pp + '" stroke-width="6" opacity=".7"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + f(rr) + '" fill="none" stroke="' + C.ink + '" stroke-width="1" stroke-dasharray="4 3"/>');
    s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + f(rl) + '" fill="' + C.cornea + '" stroke="' + C.ink + '" stroke-width="2"/>');
    s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + f(rl - 8) + '" fill="' + C.iris + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="15" fill="' + C.pupil + '"/>');
    (o.ports || []).forEach(function (p) {
      var a = deg(p.clock * 30 - 90), q = [c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)], col = p.mani === false ? C.dev : C.mani;
      if (p.removed) { s.push('<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="3" fill="none" stroke="' + C.ink + '" stroke-width="1.4"/>'); }
      else s.push('<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="8" fill="' + C.maniFill + '" stroke="' + col + '" stroke-width="3"/><circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="2.6" fill="' + col + '"/>');
      if (p.infusion) { var e2 = [c[0] + (Rg + 30) * Math.cos(a), c[1] + (Rg + 30) * Math.sin(a)]; s.push('<path d="M' + pt(q) + ' Q' + pt([c[0] + (Rg + 6) * Math.cos(a + .25), c[1] + (Rg + 6) * Math.sin(a + .25)]) + ' ' + pt(e2) + '" fill="none" stroke="' + C.steel + '" stroke-width="2.2"/>'); }
      if (p.suture) s.push('<path d="M' + f(q[0] - 7) + ',' + f(q[1] - 5) + ' L' + f(q[0] + 7) + ',' + f(q[1] + 5) + ' M' + f(q[0] + 7) + ',' + f(q[1] - 5) + ' L' + f(q[0] - 7) + ',' + f(q[1] + 5) + '" stroke="' + C.mani + '" stroke-width="2.2"/>');
      A['port' + p.clock] = q;
    });
    s.push(labels(o.labels, id));
    return svg(o, s, 'front');
  }

  /* ---------- Phóng to võng mạc vùng hoàng điểm ---------- */
  function retina(o) {
    o = o || {}; var id = 'r' + (++uid), s = [defs(id)];
    s.push('<rect x="40" y="40" width="340" height="190" fill="' + C.soft + '"/>');
    // các lớp: ILM (trên) · võng mạc thần kinh · biểu mô sắc tố (RPE) · hắc mạc
    var y0 = 150;
    s.push('<path d="M40,' + y0 + ' L170,' + y0 + ' Q210,' + (y0 + 22) + ' 250,' + y0 + ' L380,' + y0 + ' L380,200 L40,200 z" fill="#F2D6CF"/>');
    s.push('<rect x="40" y="200" width="340" height="9" fill="' + C.rpe + '"/><rect x="40" y="209" width="340" height="21" fill="#E8C7B8"/>');
    if (o.peel) {
      s.push('<path d="M40,' + (y0 - 1) + ' L150,' + (y0 - 1) + '" stroke="' + C.dye + '" stroke-width="3"/>');
      s.push('<path d="M150,' + (y0 - 1) + ' Q175,' + (y0 - 30) + ' 205,' + (y0 - 46) + '" fill="none" stroke="' + C.dye + '" stroke-width="3"/>');
      s.push('<path d="M262,' + (y0 - 1) + ' L380,' + (y0 - 1) + '" stroke="' + C.dye + '" stroke-width="3" stroke-dasharray="6 4" opacity=".5"/>');
      s.push('<line x1="300" y1="0" x2="208" y2="' + (y0 - 48) + '" stroke="' + C.mani + '" stroke-width="5" stroke-linecap="round"/>');
      s.push('<path d="M208,' + (y0 - 48) + ' l-10,6 M208,' + (y0 - 48) + ' l-4,10" stroke="' + C.mani + '" stroke-width="3" stroke-linecap="round"/>');
      A.flap = [178, y0 - 26]; A.ilm = [90, y0 - 1]; A.fovea = [210, y0 + 16]; A.tip = [206, y0 - 50]; A.rpe = [330, 204];
    } else {
      s.push('<path d="M40,' + (y0 - 1) + ' L170,' + (y0 - 1) + ' Q210,' + (y0 + 21) + ' 250,' + (y0 - 1) + ' L380,' + (y0 - 1) + '" fill="none" stroke="' + C.dye + '" stroke-width="2"/>');
      A.ilm = [90, y0 - 1]; A.fovea = [210, y0 + 16]; A.rpe = [330, 204];
    }
    s.push(labels(o.labels, id));
    return svg(o, s, 'retina');
  }

  /* ---------- Nhãn: số tròn + đường dẫn nét đứt + chữ ---------- */
  function labels(L, id) {
    if (!L) return '';
    return L.map(function (l, i) {
      var at = typeof l.a === 'string' ? A[l.a] : l.a; if (!at) return '';
      var x = l.x, y = l.y, h = '<g class="lt"><line x1="' + f(at[0]) + '" y1="' + f(at[1]) + '" x2="' + f(x) + '" y2="' + f(y) + '" stroke="' + C.ink + '" stroke-width="1" stroke-dasharray="3 3"/>';
      h += '<circle cx="' + f(at[0]) + '" cy="' + f(at[1]) + '" r="2.4" fill="' + C.ink + '"/>';
      var anc = l.anchor || (x < at[0] ? 'end' : 'start'), dx = anc === 'end' ? -4 : anc === 'start' ? 4 : 0;
      var lines = String(l.t).split('\n'), w = Math.max.apply(null, lines.map(function (t) { return t.length; })) * 6.5 + 6, ty = y - (lines.length - 1) * 6.5 + 4;
      BB.push([anc === 'end' ? x + dx - w : anc === 'middle' ? x - w / 2 : x + dx, ty - 11, anc === 'end' ? x + dx : anc === 'middle' ? x + w / 2 : x + dx + w, ty + (lines.length - 1) * 13 + 4]);
      h += '<text x="' + f(x + dx) + '" y="' + f(y - (lines.length - 1) * 6.5 + 4) + '" text-anchor="' + anc + '" font-size="11.5" fill="' + (l.mani ? '#8A5E00' : C.txt) + '" font-weight="' + (l.b || l.mani ? 700 : 500) + '">' +
        lines.map(function (t, j) { return '<tspan x="' + f(x + dx) + '" dy="' + (j ? 13 : 0) + '">' + esc(t) + '</tspan>'; }).join('') + '</text></g>';
      /* chế độ số chú thích (màn hình hẹp): số tròn tại điểm neo, chữ ở danh sách dưới hình */
      h += '<g class="ln"><circle cx="' + f(at[0]) + '" cy="' + f(at[1]) + '" r="9" fill="' + (l.mani ? C.mani : C.ink) + '" stroke="#fff" stroke-width="1.5"/><text x="' + f(at[0]) + '" y="' + f(at[1] + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + (i + 1) + '</text></g>';
      return h;
    }).join('');
  }
  function svg(o, s, kind) {
    var b = (o.vb ? (function (v) { return [v[0], v[1], v[0] + v[2], v[1] + v[3]]; })(o.vb.split(' ').map(Number)) : BASE[kind]).slice();
    BB.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]); }); BB = [];
    var vb = f(b[0] - 6) + ' ' + f(b[1] - 6) + ' ' + f(b[2] - b[0] + 12) + ' ' + f(b[3] - b[1] + 12);
    var t = TIGHT[kind] || b, vb2 = f(t[0] - 8) + ' ' + f(t[1] - 8) + ' ' + f(t[2] - t[0] + 16) + ' ' + f(t[3] - t[1] + 16);
    return '<svg class="eyefig" viewBox="' + vb + '" data-vb="' + vb + '" data-vb2="' + vb2 + '" role="img" aria-label="' + esc(o.alt || 'Hình minh họa nhãn cầu') + '" xmlns="http://www.w3.org/2000/svg" font-family="Aptos, Segoe UI, system-ui, sans-serif">' + s.join('') + '</svg>';
  }
  /* legend dùng chung dưới mỗi tờ */
  function legend() {
    return '<div class="eyeleg"><span><i style="background:' + C.mani + '"></i>Sản phẩm MANI</span><span><i style="background:' + C.dev + '"></i>Dụng cụ, máy khác</span><span><i style="background:' + C.pp + '"></i>Pars plana (vùng đặt cổng)</span><span><i style="background:' + C.retina + '"></i>Võng mạc</span><span><i style="background:' + C.dye + '"></i>Màng (đã nhuộm)</span></div>';
  }
  window.EYE = { section: section, front: front, retina: retina, legend: legend, C: C, A: A, draw: function (fig) { return ({ section: section, front: front, retina: retina })[fig.view](fig); },
    /* màn hình hẹp: thu khung về phần nhãn cầu + bật số chú thích */
    fit: function (root, narrow) { (root || document).querySelectorAll('svg.eyefig').forEach(function (g) { g.setAttribute('viewBox', g.getAttribute(narrow ? 'data-vb2' : 'data-vb')); g.classList.toggle('num', !!narrow); }); } };
})();
