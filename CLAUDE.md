# MMH Wikipedia — quy tắc cho Claude

Kho CÔNG KHAI (GitHub Pages). Người dùng là nhân sự MANI Medical Hanoi — **trả lời bằng tiếng Việt**.
App tĩnh: `index.html` + `app.js` + `app.css`, dữ liệu `data/*.js` do `tools/build.py` sinh (không sửa tay). Quy trình đầy đủ: `README.md`.

- Phần **Thủ thuật** (v1.0, 22/11/2026): Mắt + Răng Hàm Mặt theo TT 23/2024/TT-BYT (PL01 + PL02, sửa bởi TT 25/2026), QTKT 2025 (QĐ 3517, QĐ 3634),
  giá 2025 (QĐ 311/QĐ-BYT Huế, QĐ 441/QĐ-BYT ĐHYD Hà Nội), BHYT (Luật BHYT VBHN 2026, 17/VBHN-BYT, 14/VBHN-BYT), sản phẩm MMH.
- Máy Claude bị chặn trang luật / Bộ Y tế ⇒ tải văn bản bằng workflow **Tải văn bản gốc** (thêm dòng vào `nguon/fetch/urls.tsv`, push).
- Đối chiếu sản phẩm: sửa `nguon/mmh/san-pham.json` (cụm từ `kw`, cụm chung trong `GENERIC` của build.py) rồi `python3 tools/build.py`.
  Không suy luận ngoài tài liệu: chữ "Theo QTKT" phải trích nguyên văn quy trình; "Gợi ý MMH" lấy từ MMH Library (`tools/import_mmh.py`).
- Không đưa giá MANI → NPP, số liệu nội bộ, tài liệu `Confidential/` vào kho này (công khai). Giá dịch vụ trong app là giá công bố của Bộ Y tế.
- Giao diện Style M (Aptos, navy `#2C4A5E`, steel `#5A84A6`, viền `#BCD4E6`, kem `#FBE9B7`), không emoji. Đổi file ⇒ tăng `VER` (app.js) + `?v=` (index.html) và `V` trong `sw.js` nếu đổi quy tắc lưu đệm.
- Kiểm thử: `python3 -m http.server` ở gốc kho + Playwright (1440 px và 390 px), không lỗi console.
