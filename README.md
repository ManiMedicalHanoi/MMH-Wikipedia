# MMH Wikipedia · Thủ thuật

App tra cứu **thủ thuật, phẫu thuật nhãn khoa và răng hàm mặt** theo văn bản Bộ Y tế mới nhất, kèm **giá, BHYT, vật tư** và **sản phẩm MMH đáp ứng** từng thủ thuật.
Hai khu tách riêng: **Nhãn khoa** (`#/mat`) và **Nha khoa · Răng hàm mặt** (`#/rhm`), mỗi khu có danh sách, tìm kiếm, sản phẩm MMH, BHYT & vật tư, văn bản riêng.
Trang tĩnh (GitHub Pages, không cần máy chủ): `index.html` + `app.js` + `app.css` + dữ liệu `data/*.js`.

## Nội dung
| Phần | Nguồn |
|---|---|
| Danh mục kỹ thuật | TT 23/2024/TT-BYT — Phụ lục 01 (mã hiện hành, đến 31/12/2027) + Phụ lục 02 (theo hệ cơ quan, từ 01/01/2028, sửa bởi TT 25/2026/TT-BYT). Mắt: PL02 chương 9 + PL01 chương 14; Răng Hàm Mặt: PL02 chương 11 (phần răng – hàm mặt) + PL01 chương 16 |
| Quy trình kỹ thuật | QĐ 3517/QĐ-BYT (Mắt tập 1, 342 quy trình), QĐ 3634/QĐ-BYT (Răng Hàm Mặt tập 1, 320 quy trình) — chỉ định, thiết bị y tế, các bước |
| Giá 2025 | QĐ 311/QĐ-BYT (BV Trường ĐH Y Dược Huế), QĐ 441/QĐ-BYT (BV ĐH Y Dược – ĐHQG Hà Nội): mã tương đương, mức giá, ghi chú "chưa bao gồm…" |
| BHYT | Luật BHYT (VBHN 2026, Điều 21–23), TT 35/2016 (VBHN 17/VBHN-BYT), TT 04/2017 + TT 24/2025 (VBHN 14/VBHN-BYT) |
| Sản phẩm MMH | `nguon/mmh/san-pham.json` (nhóm sản phẩm, cụm từ nhận diện, nhóm thiết bị y tế BHYT) + `nguon/mmh/profiles.json` (từ MMH Library: dao / chỉ theo ca mổ, DIA-BURS theo thủ thuật, đối chiếu QĐ 3207) |

Mức đối chiếu sản phẩm: **Theo QTKT** (quy trình Bộ Y tế ghi rõ, trích nguyên văn) · **QTKT ghi chung** ("dao / chỉ / mũi khoan các loại") · **Gợi ý MMH** (tài liệu sản phẩm, đào tạo MMH).

## Cập nhật dữ liệu
1. Văn bản gốc: thêm đường dẫn vào `nguon/fetch/urls.tsv` ⇒ workflow **Tải văn bản gốc** (GitHub Actions) tải về `nguon/raw/` + chữ `nguon/txt/` (máy Claude bị chặn các trang luật).
2. Tách bảng: `tools/extract_tt23.py`, `tools/extract_qtkt.py`, `tools/extract_gia.py`, `tools/extract_vtyt.py` ⇒ `nguon/data/*.json` (cần `pip install pdfplumber`).
3. Kiến thức sản phẩm: `python3 tools/import_mmh.py <đường dẫn mmh-library>`; sửa luật nhận diện ở `nguon/mmh/san-pham.json`.
4. Dựng: `python3 tools/build.py` ⇒ `data/*.js`. Tăng `VER` trong `app.js` + `?v=` trong `index.html`.

Dữ liệu trích tự động để tra cứu nhanh — khi dùng chính thức, đối chiếu văn bản gốc (bản lưu ở `nguon/raw/`, nguồn ghi ở `nguon/fetch/log.json`).
