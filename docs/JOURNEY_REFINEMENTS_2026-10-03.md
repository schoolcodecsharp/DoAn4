# Cải thiện tìm kiếm, đặt dịch vụ và bản nháp — 03/10/2026

Thứ tự người dùng chọn: nhóm 2 → nhóm 3 → nhóm 1. Giữ nhận diện xanh–kem NVT và trang chủ; áp dụng Impeccable harden/adapt, không dựng lại giao diện.

## Đã triển khai

- Bộ lọc phụ có thể thu gọn. Quay lại từ chi tiết giữ URL bộ lọc/phân trang; chưa khôi phục vị trí cuộn.
- Phân biệt giá đã biết, vé miễn phí, giá chưa xác nhận. Điểm miễn phí được giữ trong bộ lọc giá tối đa; mục chưa có giá không bị coi là miễn phí.
- Tour hiển thị lịch khởi hành trước bộ ảnh/lịch trình dài; mặc định chỉ mở ngày đầu.
- Tổng tiền, ngày, số khách/phòng và giải thích chưa thanh toán nằm trước nút xác nhận trên cả desktop/mobile.
- Phòng được dự toán theo ngày, loại phòng, số phòng và khách bằng API hiện có. Phản hồi cũ không thể dùng cho lựa chọn mới. Hết phòng/lỗi/chưa kiểm tra thì không gửi được yêu cầu. API đặt thật vẫn kiểm tra lại trong transaction.
- Bản nháp local theo tài khoản, tách tạo mới và từng chuyến đang sửa, có hạn 7 ngày. Khôi phục/bỏ chủ động; báo lỗi nếu storage hỏng/đầy; giữ nháp khi lưu lỗi, xóa khi lưu thành công. Bản nháp sửa phải khớp revision server. Chỉ lưu giá trị người dùng nhập, không lưu giá/phòng trống vào nháp.
- Cảnh báo reload/đóng trang và click liên kết khi có thay đổi chưa lưu lên tài khoản. Browser Back/Forward được bảo vệ bằng tự lưu nháp, không có router blocker. Không đồng bộ nhiều thiết bị; không trộn sửa đổi giữa hai tab cùng tài khoản.
- API public `/api/catalog-availability` trả tập tour có đợt mở còn chỗ và khách sạn có loại phòng mở bán; nhãn/bộ lọc công khai rõ ràng. Mặc định vẫn xem tất cả. Khách sạn có loại phòng mở bán không đồng nghĩa chắc chắn còn phòng theo ngày.

## Dữ liệu và ảnh: mới hoàn thành một phần

Thêm 2 liên kết ảnh đúng đối tượng, có nguồn/tác giả/giấy phép:

- Bãi Kỳ Co, ảnh năm 2015 của Lê Hồ Bắc, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Ky_Co_beach,_Quy_Nhon_city,_Binh_Dinh_province,_Vietnam.jpg
- Mặt ngoài Sofitel Legend Metropole Hanoi, ảnh tháng 9/2022 của The Hanoian, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Sofitel_Metropole,_Ng%C3%B4_Quy%E1%BB%81n_-_2022-09-02_04.jpg

Đã xem ảnh tải về, giữ ghi công và ghi thời điểm ảnh. Không dùng ảnh mặt ngoài làm ảnh loại phòng. Manifest, file, hash và nguồn được lưu trong repository. Import sao lưu trước tại `backend/backups/before-enrichment-20261003-150148894.sql` (ignored); transaction kiểm tra fingerprint và số hàng, giữ nguyên bản ghi có sẵn ở 25 bảng. Chỉ thêm hai hàng HinhAnh, không tạo dữ liệu thương mại giả.

| Nhóm đang hoạt động | Có ảnh / tổng | Còn thiếu |
|---|---:|---:|
| Điểm đến | 69/74 | 5 |
| Khách sạn | 12/53 | 41 |
| Nhà hàng | 5/45 | 40 |
| Tour | 52/55 | 3 |

Chưa xác minh được ảnh phù hợp/có thể tái sử dụng cho toàn bộ phần còn lại. Không gán ảnh vùng miền hay món ăn làm ảnh cơ sở. Không bổ sung giá, loại phòng, tồn phòng hoặc lịch khởi hành khi không có dữ liệu vận hành xác thực. Tại thời điểm kiểm tra: 16 tour có đợt mở còn chỗ; 5 khách sạn có loại phòng mở bán.

## Xác minh

- `dotnet build backend`: 0 lỗi, 63 cảnh báo nullable hiện hữu.
- `npm --prefix frontend run build`: đạt.
- `npm --prefix frontend run lint`: không có lỗi; cảnh báo các module cũ còn nguyên, không thêm cảnh báo tại mã mới.
- `node tests/journey-refinements.mjs`: đạt ở 1440/390/320px, không lỗi JavaScript, không tràn ngang tại booking/planner. Kiểm tra bộ lọc, điều hướng, tiền trước nút gửi, giá miễn phí, phòng theo ngày, lỗi/hết phòng, khôi phục/bỏ nháp, cách ly tài khoản, storage hỏng và mô phỏng lưu thành công/xung đột. Không ghi đơn/lịch trình SQL.
- `node tests/account-details.mjs`: 14 nhóm kiểm tra đạt ở 1440/390px; liên kết cả thẻ, chi tiết, bình luận công khai, quyền đánh giá và lịch trình riêng tư; không lỗi trình duyệt.
- `dotnet run --project tests/AdminSmoke -- --check-journey-photos`: hash/file/nguồn đạt trước import. `--fill-journey-photos`: thêm 2 ảnh, giữ 25 bảng cũ; API trả đúng hai ảnh và media GET thành công.
- Impeccable detector chạy một lần trên `frontend/src/pages/User` + `App.tsx`: `[]`.
- Đã xem ảnh kiểm tra ở `.impeccable/review/journey` (ignored), gồm khối xác nhận trước nút gửi. Chromium viewport giả lập, chưa thử iPhone/Android thật hoặc Safari. Không khẳng định toàn hệ thống không có lỗi; kiểm thử lần này tập trung các luồng thay đổi và hồi quy liên quan.

Chưa commit/push vì lượt này không có yêu cầu Git.
