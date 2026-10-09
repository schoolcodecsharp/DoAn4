# Kiểm tra toàn dự án và cải thiện UI/UX — 08/10/2026

## Kết luận

Các luồng chính đã kiểm tra hoạt động trên môi trường local: phân quyền, tìm kiếm, đặt tour/phòng, thanh toán do admin ghi nhận, yêu cầu hủy, lịch trình/chi phí/tồn phòng, bình luận/đánh giá và các form quản trị. Không ghi nhận lỗi JavaScript hoặc HTTP 500 trong phạm vi các suite đạt. Điều này không phải bảo đảm mọi tình huống hoặc môi trường production đều không có lỗi.

Đã sửa khả năng đọc/bấm, lỗi theo ô nhập và lỗi form đăng ký dài bị giới hạn chiều cao. Chưa thể gọi dữ liệu hoàn thiện: nhiều dịch vụ chưa có ảnh, và phép kiểm tra độ đầy đủ của toàn bộ dữ liệu vẫn thất bại ở hai tour test Inactive. Không tự thêm ảnh sai dịch vụ, giá, lịch khởi hành hoặc tồn phòng để làm báo cáo đạt.

## Phạm vi và an toàn dữ liệu

- Frontend local `http://127.0.0.1:5173`; backend Development `http://127.0.0.1:5000`.
- Dùng tài khoản admin/user SQL có sẵn từ file local bị Git bỏ qua. Không tạo tài khoản kiểm thử mới, không reset database, không chạy `CSDL.sql` hay migration.
- UI GET và estimate đọc dữ liệu thật; các nhánh ghi thành công/lỗi được chặn hoặc mô phỏng trong trình duyệt. Các suite backend có ghi dùng fixture nhãn duy nhất, chạy tuần tự và dọn bằng `finally`.
- Sau dọn, số dòng của 24 bảng nghiệp vụ khớp trước kiểm tra. Nhật ký quản trị tăng 69 dòng do các thao tác được audit; đây là lịch sử kiểm tra được giữ lại, không phải dữ liệu đơn đặt thật bị sửa.
- Upload PNG ngoài phạm vi có sẵn trong worktree được giữ nguyên. Chưa commit/push thay đổi của lượt này.

## UI/UX đã sửa

Áp dụng Impeccable theo hướng tinh chỉnh giao diện đang có, không thay thế phong cách NVT:

1. Header: tên tài khoản/đăng nhập rõ hơn, giữ ellipsis cho tên dài và đủ chỗ cho Quản trị/Menu ở 320px.
2. Catalog: liên kết xem chi tiết và xóa bộ lọc có vùng bấm tối thiểu 44px; thông tin giá/địa chỉ/nguồn ảnh dễ đọc hơn. Chữ chức năng được kiểm tra tương phản ít nhất 4,5:1. Kết quả lọc dùng `role="status"`; ô nhập mobile 16px để tránh vấn đề phóng to khi nhập trên iOS.
3. Trang chi tiết/tài khoản: nút chuyển ảnh tối thiểu 44px; các tab tour/phòng/lịch trình trên mobile chia ba cột, chữ 13px và không tràn.
4. Quản trị: hướng dẫn cuộn ngang hiện trên bảng mobile. Giữ vùng bảng có nhãn, focus bằng bàn phím, các nút thao tác và form modal hiện tại.
5. Đăng nhập/đăng ký: dùng shared validation, thông báo sát ô lỗi, focus vào lỗi đầu, giữ thông tin đã nhập. Kiểm tra email, xác nhận mật khẩu, số điện thoại và giới hạn mật khẩu theo byte UTF-8. Lỗi sai tài khoản/mật khẩu vẫn là thông báo chung; không đoán sai ô nào. Nút hiện/ẩn mật khẩu có tên và trạng thái truy cập được.
6. Form auth: cỡ chữ/placeholder và tương phản nhất quán, ô nhập 16px, nút dễ bấm. Bỏ chữ thương hiệu lặp lại phía trên tiêu đề. Sửa `height:100dvh` thành chiều cao tự nhiên để form đăng ký dài có thể cuộn đến nút gửi, footer nằm sau toàn bộ form.

Giữ nguyên trang chủ đã duyệt, ảnh và dữ liệu hiện có, xanh–kem NVT, hiệu ứng chuyển trang 1,6 giây, hỗ trợ giảm chuyển động, kiểu chữ gọn của planner và các luồng nghiệp vụ.

### Website tham khảo

Tham khảo cấu trúc tìm kiếm dịch vụ, bộ lọc và thông tin hỗ trợ quyết định từ [iVivu – khách sạn Phú Quốc](https://www.ivivu.com/khach-san-phu-quoc) và cách tổ chức khám phá dịch vụ tại [Klook Việt Nam](https://www.klook.com/vi/). Dùng nội dung truy cập được để đối chiếu UX, không sao chép thương hiệu, dữ liệu thương mại hay ảnh của họ. `perusi.io.vn` không mở được trong lượt này; không nhận là đã xem giao diện trực tiếp của website đó.

## Kết quả frontend

18 bộ kiểm tra đạt, tổng 248 nhóm tương tác/khả năng đọc; số nhóm không tính lại suite đã rerun. Các lượt xem chi tiết/HTTP dưới đây là đơn vị khác, không cộng vào nhóm tương tác.

| Suite | Kết quả |
| --- | --- |
| `catalog-system-audit` | 1.054 HTTP checks, 484 lượt trang, 34 nhóm tỉnh/thành, không có failure/browser error |
| `account-details` | 14 nhóm: card mở chi tiết, quyền xem lịch trình/phòng, feedback công khai |
| `journey-refinements` | 6 nhóm: giữ lọc khi Back, giá/tồn phòng theo ngày, draft và xung đột lưu |
| `form-dialogs` | 41 nhóm; rerun sau sửa shared validation, 102 mutation mô phỏng/chặn, 0 SQL writes |
| `admin-detail-dialogs` / `admin-row-albums` | 35 / 18 nhóm: chi tiết và bộ ảnh theo dòng, lồng form, focus/đóng/giữ dữ liệu |
| `header-account-name` / `menu-bottom-actions` | 9 / 12 nhóm |
| `shared-footer-transition` / `page-transition-brand` | 62 / 5 nhóm |
| `planner-typography` / `home-fullscreen --no-capture` | 7 / 6 nhóm, gồm text scale 200%, motion và trạng thái lỗi |
| `provinces` | 6 nhóm, đủ 34 tỉnh × 4 nhóm dịch vụ và tên tỉnh cũ |
| `catalog-diversity` / `catalog-enrichment` / `photo-coverage` | 108 / 56 / 118 lượt xem chi tiết; 76 file manifest kiểm tra theo các gói, 167 URL ảnh giải mã |
| `auth-ui-hardening` mới | 12 nhóm; 21 POST bị chặn/mô phỏng, không tạo tài khoản; lỗi 400/401/409/429/mất mạng và chuyển về đúng trang |
| `ui-readability` mới | 15 nhóm: 1440/390/320px, tương phản, vùng bấm, input/tab, tên admin dài, cuộn bảng và form auth dài |

Sửa một thao tác test cũ: mở “Bộ lọc thêm” trước khi điền giá trong `catalog-system-audit`. Giữ nguyên assertion. Auth mock dùng đúng DTO account để không phụ thuộc timing của phản hồi. Các lỗi harness này không được ghi là lỗi ứng dụng.

## Kết quả backend

| Kiểm tra | Kết quả |
| --- | --- |
| Build AdminSmoke | 0 lỗi, 1 warning nullable có sẵn |
| `--audit` | 25 bảng, 47 foreign key, 0 orphan, 0 lệch bộ đếm chỗ, 0 file ảnh local thiếu/không hợp lệ |
| `--verified-coverage` | Đủ 34 tỉnh, mỗi tỉnh có ít nhất một điểm đến/khách sạn/nhà hàng/tour tham khảo Active |
| Read/access API | 76 GET route × guest/user/admin = 228 request, 1.193 assertions đạt; 131×200, 50×401, 46×403, 1×404 đúng quyền sở hữu; không lộ mật khẩu |
| Media/CORS/feedback | 180 URL ảnh có MIME/nosniff hợp lệ; allowlist CORS và feedback/eligibility theo quyền đạt |
| `--completion-checks` | 34 assertions + 28 ReviewRegression: đặt chỗ/thanh toán đồng thời, giá server, trạng thái cuối, quyền đánh giá và visibility |
| `--planner-checks` | 20 assertions: free/unknown, số vé/người, tồn phòng theo đêm, lưu dự toán, revision/quyền chủ chuyến đi |
| `--capacity-checks` | 8 assertions về sức chứa và đợt khởi hành |
| Feedback API-only fixture | 42 assertions: đọc công khai, đăng nhập để bình luận, hoàn tất trải nghiệm/ngày kết thúc, không giả author/proof, chống trùng đánh giá đồng thời, moderation |
| `rate-limits` | 2 nhóm đạt, có 429 và Retry-After; đọc feedback công khai vẫn được |

Tổng backend nghiệp vụ: 132 assertions đạt, tách biệt với 1.193 assertions đọc/quyền và hai nhóm throttling. Không sửa backend code trong lượt này vì không tìm thấy lỗi runtime/quyền/tính giá trong các phép kiểm tra đã chạy.

Postman CLI chưa có trong PATH; áp dụng quy trình API Engineering/API Testing bằng harness hiện có và gọi API local. Không cài CLI, khởi tạo workspace cloud hoặc upload dữ liệu.

## Phần chưa hoàn thiện

### Ảnh được gắn vào dịch vụ Active

| Nhóm | Có ít nhất một ảnh | Chưa có ảnh |
| --- | --- | --- |
| Điểm đến | 70/75 | 5 |
| Khách sạn | 12/53 | 41 |
| Nhà hàng | 5/45 | 40 |
| Tour | 52/55 | 3 |

Các file đang được tham chiếu hoạt động, nhưng điều đó không có nghĩa mọi bản ghi đã có ảnh. `photo-coverage` đã chạy không có `--require-complete`; không được dùng kết quả đạt này để khẳng định phủ ảnh 100%. Cần bổ sung ảnh đúng đối tượng, có nguồn/quyền sử dụng và attribution. Các ảnh minh họa vùng hiện có vẫn phải giữ nhãn minh họa.

- `--check-sample-data` **chưa đạt**: tour 45/46 là fixture Inactive có 0/2 ngày lịch trình. Suite có contract kiểm tra mọi bản ghi, hai ảnh khác nhau mỗi dịch vụ và giờ/mô tả đầy đủ cho mọi hoạt động; không đổi contract/lọc bỏ để che lỗi. Hai tour này không được bán trong catalog Active; detail API vẫn cho xem lịch sử Inactive. Raw audit còn 23 tour/45 điểm đến có dưới hai ảnh, gồm cả Inactive.
- Catalog nhiều mục là tham khảo, chưa có inventory thật: hiện 16 tour có đợt khởi hành tương lai còn chỗ và 5 khách sạn có stock. Không tự tạo giá/phòng/ngày mở bán; tồn phòng chỉ được bảo đảm qua kiểm tra và đặt trong database của ứng dụng, không phải kết nối hệ thống khách sạn bên ngoài.
- Swagger JSON hợp lệ, nhưng Bearer metadata đang khai báo toàn cục cả endpoint công khai; mô tả lỗi 400/401/403/409 còn thiếu. Nên hoàn thiện documentation trước khi tích hợp hệ thống khác.
- Frontend build đạt; bundle JS 503,44 kB (gzip 151,54 kB), còn cảnh báo chunk trên 500 kB. Chưa đo Core Web Vitals trên thiết bị thật/hosting production; không tăng threshold để che cảnh báo.
- Lint đạt exit 0, còn 27 warning cũ, chủ yếu trang/layer legacy và React rule; không xóa mã ngoài phạm vi để làm báo cáo sạch giả.

## Kiểm tra thiết kế và giới hạn

Initial review dùng một batch desktop/mobile. Sau triển khai, kiểm tra một batch 1440/390/320px; sửa lỗi chiều cao auth trong một batch và xác nhận một lượt cuối. Ảnh/metrics local nằm trong ignored `.impeccable/review/full-2026-10-08-before` và `full-2026-10-08-after`.

Chạy Impeccable detector một lần trên các target đã sửa. Detector báo hai khai báo viền bên 3px cũ trong dòng CSS auth; cascade thực tế đã dùng border 1px. Đã dọn hai khai báo dư thành border 1px, không thêm ignore hoặc chạy scan lặp. Kiểm tra rendered contrast/hit area/layout là bằng chứng chính, không dùng detector thay kiểm tra giao diện.

Trình duyệt kiểm tra là Chromium với viewport mô phỏng; chưa chạy iPhone/Safari/Android vật lý, screen reader, production hosting, distributed throttling/reverse proxy, email hoặc cổng thanh toán/hoàn tiền thực. Luồng ghi UI thành công là mock; nghiệp vụ ghi backend được kiểm tra bằng fixture riêng và đã dọn.

## Chạy lại các kiểm tra mới

Từ thư mục repo, khi frontend/backend và SQL đã hoạt động:

```powershell
node tests/auth-ui-hardening.mjs
node tests/ui-readability.mjs
node tests/catalog-system-audit.mjs
node tests/form-dialogs.mjs
```

`auth-ui-hardening` chặn toàn bộ POST; `ui-readability` chỉ login tài khoản có sẵn và GET. Thêm `--capture` chỉ khi cần một vòng bằng chứng hình ảnh mới. Fixture-writing backend suites không chạy song song với catalog sweep. Chạy `tests/rate-limits.mjs` cuối cùng vì tạm làm đầy bucket login/bình luận local (Retry-After tối đa khoảng một phút).
