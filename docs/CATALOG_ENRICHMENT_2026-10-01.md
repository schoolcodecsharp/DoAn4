# Bổ sung danh mục và ảnh — 01/10/2026

## Kết quả thực tế

- Thêm 12 điểm đến, 8 khách sạn, 8 tour tham khảo và 16 điểm dừng tour.
- Thêm 40 JPEG mới (18.108.903 byte), tạo 68 liên kết `HinhAnh`: 28 điểm đến, 12 khách sạn, 28 tour. Một ảnh dùng cho chính địa điểm và tour ghé nơi đó; không phải 68 ảnh khác nhau.
- Sau nhập: 54 dòng `DiaDiem`, 45 `KhachSan`, 45 `Tour`, 293 `HinhAnh`, gồm cả mục cũ/không hoạt động, không phải số dịch vụ đang mở bán.
- Mọi bản ghi tồn tại trước nhập trong 25 bảng giữ nguyên nội dung. Không thêm người dùng, đơn, thanh toán, đánh giá, loại phòng, tồn phòng hoặc lịch khởi hành. Chạy lại trả `added: []`.
- Database local đã cập nhật. Git chứa dataset/importer/ảnh để tái lập, không chứa bản sao database có thông tin tài khoản.

## Nguồn và phạm vi

`database/catalog-enrichment-20261001.json` lưu nguồn đối chiếu từng mục, cũng hiển thị trong mô tả công khai. Điểm đến từ [Vietnam Tourism](https://vietnam.travel/); khách sạn từ website chính thức [Rex](https://www.rexhotelsaigon.com/), [Majestic](https://www.majesticsaigon.com/our-hotel/), [Continental](https://www.continentalsaigon.com/), [Caravelle](https://www.caravellehotel.com/), [Grand Saigon](https://www.hotelgrandsaigon.com/), [Azerai](https://azerai.com/azerai-la-residence-hue/), [Meliá](https://www.melia.com/en/hotels/vietnam/hanoi/melia-hanoi), [Furama](https://furamavietnam.com/).

Đợt này bổ sung ở Hà Nội, Huế, Khánh Hòa, Đà Nẵng và Hồ Chí Minh, không phải thêm mới ở tất cả 34 tỉnh/thành. Độ phủ 34 tỉnh/thành từ đợt trước giữ nguyên.

Tour là gợi ý một ngày do NVT biên soạn, mỗi tour hai điểm dừng, không mạo nhận chương trình nhà cung cấp. Không ấn định giờ hay hứa bao gồm xe, ăn uống, lưu trú. Giá SQL 0 là chưa có báo giá, không phải miễn phí; điểm đến mới đều `MienPhi=false`. Không lấy biểu giá cũ trên nguồn làm giá giao dịch.

## Ảnh và giấy phép

- Manifest: `backend/Data/catalog-photos-20261001.json`, ghim khóa địa điểm, Commons page ID, tên nguồn, tác giả, giấy phép, URL tải và chú thích.
- JPEG: `backend/wwwroot/media/catalog-20261001/`; metadata/hash/kích thước/ngày tải: `backend/Data/photo-sources/<key>-<pageId>.jpg.source.json`.
- Đã xem cả 40 ảnh bằng bốn contact sheet local; chọn ảnh tổng thể trước chi tiết khi phù hợp. Không gán ảnh mặt ngoài/nội thất công cộng thành ảnh phòng.
- Giữ giấy phép CC BY / CC BY-SA, ghi công qua gallery và `/image-credits`. Ảnh có các thời điểm chụp khác nhau, không bảo đảm hiện trạng hôm nay. Dùng thumbnail Wikimedia, không sửa nội dung ảnh.
- 12 điểm đến có 2–3 ảnh/mục; 6 khách sạn có 2 ảnh/mục; 8 tour có 2–6 ảnh/mục. Azerai La Residence Huế và Furama chưa có ảnh đủ chất lượng/quyền sử dụng phù hợp; không thay bằng cảnh vùng hoặc khách sạn khác.

## Nhập an toàn

Yêu cầu schema hiện tại, migration tỉnh thành/planner, admin có sẵn và các điểm nền: Hồ Hoàn Kiếm, Đại Nội Huế, Phố cổ Hội An, Biển Mỹ Khê. Không phải seed cho database trắng.

```powershell
# Không ghi DB; Git đã chứa ảnh. Chỉ cần tải lại nếu thiếu file.
pwsh -File scripts/Download-CatalogPhotos.ps1
dotnet build tests/AdminSmoke
# Chỉ đọc/kiểm file và tổng số dòng
dotnet run --project tests/AdminSmoke --no-build -- --check-enrichment
# Có ghi: full backup, advisory lock, transaction, fingerprint bản ghi cũ
dotnet run --project tests/AdminSmoke --no-build -- --enrich-catalog
# Chỉ đọc, cần frontend/backend đang chạy
node tests/catalog-enrichment.mjs
```

Importer chỉ ghi `DiaDiem`, `KhachSan`, `Tour`, `TourChiTiet`, `HinhAnh`. Tra theo tên+tỉnh (tour theo tên), không gắn cứng ID local. Không sửa mô tả/điểm dừng cũ. Trùng tên mơ hồ, thiếu điểm dừng, sai checksum hoặc thay bản ghi cũ sẽ rollback. Không chạy `database/CSDL.sql`.

Backup trước lần nhập thành công: `backend/backups/before-enrichment-20261001-224631932.sql` (local ignored). Lần đầu rollback do so sánh tên bảng phân biệt hoa/thường trên MySQL Windows; đã sửa dùng so sánh không phân biệt hoa/thường. Auto-increment có thể có khoảng trống sau rollback, không phải mất bản ghi. Backup lần chạy lại `...224703676.sql` là sau nhập. Không restore nguyên backup nếu chưa đối chiếu giao dịch phát sinh.

## Kiểm thử và giới hạn

- Backend/AdminSmoke/frontend build và frontend lint đạt; còn cảnh báo cũ. Đã khởi động lại backend để giải phóng khóa exe khi build.
- `node tests/catalog-enrichment.mjs`: 40 file kiểm hash local/HTTP/content-type/metadata; 56 lượt mở chi tiết (28 mục × 1440/390px); đổi ảnh gallery, đọc feedback công khai, không phòng/lịch khởi hành giả, không tràn ngang/lỗi JavaScript trong phạm vi này.
- `node tests/provinces.mjs`: 34 tỉnh × 4 nhóm, alias/bộ lọc desktop/mobile/admin và retry API đạt.
- `node tests/account-details.mjs`: 14 kiểm tra hồi quy đạt, giữ thẻ đơn → chi tiết và điều kiện feedback.
- `node tests/planner-costs.mjs`: dự toán, số lượng, phòng không đủ/sức chứa, retry, không giữ tổng cũ, chuyển sang đặt phòng, lưu/tải lại và thông tin đơn đều đạt ở desktop/mobile; fixture có nhãn riêng được dọn sau test.
- AdminSmoke `--audit`: 25 bảng, 47 khóa ngoại, 0 dòng mồ côi, 0 file ảnh thiếu/sai đường dẫn.
- Dữ liệu cũ còn tour 45/46 thiếu lịch trình, 21 tour và 22 điểm đến có dưới hai ảnh. Không sửa/xóa chúng trong đợt này. Chưa xác minh toàn bộ danh mục cũ hay kiểm thử tải lớn/thanh toán thật/mọi trình duyệt.

Ảnh kiểm tra: `.local/catalog-enrichment/`, không đưa lên Git.
