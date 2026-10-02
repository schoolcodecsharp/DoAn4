# Bổ sung ảnh catalog — 02/10/2026

## Kết quả đã thực hiện

36 file ảnh thực địa mới, với tác giả, nguồn, giấy phép CC và SHA-256; 36 liên kết địa điểm và 28 liên kết tour được thêm vào HinhAnh. 28 liên kết thuộc 23 tour trước đó chưa có ảnh. Không tạo thêm dịch vụ, tài khoản, đánh giá, đơn đặt, tồn phòng, giá hay ngày khởi hành. Không sửa hoặc xóa bản ghi cũ.

| Nhóm đang hoạt động | Trước đợt này | Sau đợt này | Còn thiếu |
| --- | ---: | ---: | ---: |
| Điểm đến | 32/74 | 68/74 | 6 |
| Nhà hàng | 5/45 | 5/45 | 40 |
| Tour | 29/55 | 52/55 | 3 |

Đây **chưa phải hoàn tất yêu cầu 100% có ảnh**. Hai điểm đến và hai tour là fixture cũ đã ngừng hoạt động không nằm trong bảng này; không xóa, bật lại hoặc gán ảnh tùy tiện cho chúng. Năm nhà hàng đã có ảnh từ trước không được xem là bằng chứng đã có ảnh thật đúng cơ sở; một số là ảnh minh họa vùng.

## Nguồn và lựa chọn ảnh

- Manifest duyệt: `backend/Data/photo-coverage-20261002.json`; mỗi ảnh ghi riêng source/author/license/licenseUrl/caption. Nguồn gốc là trang File của Wikimedia Commons, không phải trang kết quả tìm kiếm.
- File ảnh: `backend/wwwroot/media/coverage-20261002/`; metadata: `backend/Data/photo-sources/<key>-<pageId>.jpg.source.json`.
- Đã xem bốn bảng ảnh trước khi nhập. Các ảnh nhìn từ xa/bên trong/đường đi có chú thích cụ thể khi cần; không dùng ảnh của một địa điểm khác để lấp mục trống. Ảnh tour chỉ lấy từ địa điểm thực sự có trong TourChiTiet của tour đó.
- Kết quả tìm kiếm gần đúng đã bị loại, ví dụ Đền Mẫu Lào Cai cho Phố Hiến, Tràng An cho Tam Cốc, biển nước ngoài cho Trà Quế. Không tự động nhập mọi kết quả tìm kiếm.
- Giấy phép và tác giả dựa trên metadata nguồn ở thời điểm tải. Không khẳng định ảnh mới chụp hoặc cảnh quan hiện tại không thay đổi.

## Những mục còn thiếu

Điểm đến: Chùa Chuông - Phố Hiến (50), Đền Mẫu - Phố Hiến (51), Bản Sin Suối Hồ (66), Bảo tàng Thế giới Cà phê (71), Bãi Đầm Trầu (118), Bãi Kỳ Co (123).

Tour: Thái Bình - Hưng Yên 1 ngày (49), tham khảo Bản Sin Suối Hồ (73), tham khảo Bảo tàng Thế giới Cà phê (78).

40 nhà hàng còn thiếu ảnh: ID 6–17, 36–53 và 56–65. Tên đầy đủ được trả bởi lệnh kiểm tra hoặc `.local/photo-coverage/report.json`. Chưa tìm được bộ ảnh đúng cơ sở có quyền tái sử dụng đáp ứng các mục này; ảnh trên website chính thức không được mặc nhiên coi là ảnh có giấy phép tự do.

Đã hỏi người dùng lựa chọn ảnh thực tế được phép sử dụng hoặc ảnh món ăn minh họa có nhãn rõ ràng. Chưa nhận được chấp thuận ảnh minh họa tại thời điểm báo cáo; chưa nhập ảnh minh họa mới. Không dùng AI tạo ảnh rồi trình bày là ảnh thật của cơ sở.

## An toàn dữ liệu và chạy lại

`PhotoCoverage.cs` dùng tên + tỉnh/thành để tìm duy nhất một mục đang hoạt động. Trước khi ghi: kiểm tra file, hash, nguồn và giấy phép, advisory lock chung catalog, backup toàn database. Trong transaction: chỉ thêm HinhAnh, đối chiếu fingerprint của mọi dòng cũ ở 25 bảng; các bảng khác không tăng số dòng.

Backup trước lần nhập thành công: `backend/backups/before-enrichment-20261002-171318141.sql`. Backup lần kiểm tra chạy lại: `backend/backups/before-enrichment-20261002-171403734.sql`. Lần đầu kiểm tra nhầm hoa/thường tên bảng MySQL đã rollback; không có nhập dở dang. Sau khi sửa, nhập thành công; lần chạy lại thêm 0 liên kết địa điểm và 0 liên kết tour.

```powershell
# Tải ảnh đã duyệt nếu cần khôi phục thư viện; không ghi database
./scripts/Download-CatalogPhotos.ps1 -ManifestPath backend/Data/photo-coverage-20261002.json -MediaFolder coverage-20261002
dotnet build tests/AdminSmoke --no-restore -p:BuildProjectReferences=false
# Chỉ đọc
dotnet tests/AdminSmoke/bin/Debug/net9.0/AdminSmoke.dll --check-photo-coverage
# Có ghi, tự backup và transaction
dotnet tests/AdminSmoke/bin/Debug/net9.0/AdminSmoke.dll --fill-photo-coverage
# Frontend/backend đang chạy; chỉ đọc database
node tests/photo-coverage.mjs
# Cổng kiểm tra nghiêm ngặt: hiện sẽ fail vì còn thiếu ảnh
node tests/photo-coverage.mjs --require-complete
```

## Kiểm chứng

- Build AdminSmoke thành công; còn một cảnh báo nullable có sẵn trong CatalogExpansion.cs, không có lỗi biên dịch.
- Xác minh 36 file và metadata/hash, HTTP JPEG và nội dung tải qua frontend proxy.
- Giải mã thành công toàn bộ 165 URL ảnh khác nhau đang được API điểm đến/nhà hàng/tour hoạt động sử dụng.
- 118 lượt mở trang chi tiết (59 trang × desktop 1440px và mobile 390px), ảnh chính giải mã được, không tràn ngang, không pageerror hoặc API 5xx quan sát được.
- Hồi quy `node tests/catalog-diversity.mjs` đạt: 42 cơ sở, 12 tour và 108 lượt xem desktop/mobile, không ghi nhận lỗi.
- Không sửa bố cục frontend trong đợt bổ sung ảnh này. Không tuyên bố kiểm thử này chứng minh đủ ảnh 100%; số mục thiếu được báo riêng.
