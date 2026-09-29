# Database → giao diện

Đối chiếu database đang chạy ngày 28/09/2026: **23 bảng**, 41 khóa ngoại, không có bản ghi mồ côi. Trang `/admin/coverage` đọc danh sách bảng thực tế từ API admin `/api/admin/coverage`, so với registry giao diện và cảnh báo nếu xuất hiện bảng chưa được ánh xạ. Không dùng số lượng cố định để tự tuyên bố đủ.

## Các màn hình và quyền thao tác

| Bảng | Trang / luồng | Phạm vi |
|---|---|---|
| VaiTro | `/admin/roles`, `/admin/users` | Xem vai trò hệ thống; phân vai trò cho tài khoản. Không sửa mã vai trò ứng dụng đang dùng. |
| NguoiDung | `/admin/users` | Tạo/sửa/khóa, phân quyền; không lộ mật khẩu/hash. |
| LoaiDiaDiem | `/admin/categories` | Tạo/sửa/ẩn loại địa điểm. |
| DiaDiem | `/admin/destinations` | Tạo/sửa/ẩn điểm đến, bộ ảnh. |
| NhaHang | `/admin/restaurants` | Tạo/sửa/ẩn nhà hàng, bộ ảnh. |
| KhachSan | `/admin/hotels` | Tạo/sửa/ẩn, liên kết sang các loại phòng của khách sạn. |
| LoaiPhong | `/admin/rooms?hotel=ID` | Tạo/sửa/ẩn loại phòng, sức chứa, số lượng, giá và ảnh. |
| DatPhong | `/admin/room-orders?id=ID` | Xem, lọc và chuyển trạng thái đúng nghiệp vụ; không xóa lịch sử. |
| Tour | `/admin/tours` | Tạo/sửa/ẩn tour, ảnh và quản lý lịch trình/khởi hành. |
| TourKhoiHanh | `/admin/departures`, bên trong tour | Chọn tour, ngày khởi hành, số chỗ, giá, trạng thái. |
| TourChiTiet | `/admin/activities`, bên trong tour | Ngày, thứ tự, điểm dừng, giờ và ảnh điểm dừng. |
| DatTour | `/admin/tour-orders?id=ID` | Xem/lọc/chuyển trạng thái; không sửa giá hoặc xóa đơn cũ. |
| ChuyenDi | `/admin/trips` | Admin tra cứu; khách tạo ở `/planner`, xem ở tài khoản. |
| ThanhVienChuyenDi | `/admin/members?trip=ID` | Admin tra cứu. Chủ chuyến đi gửi/xóa lời mời; người nhận tự phản hồi. |
| LichTrinh | `/admin/days?trip=ID` | Xem kế hoạch theo ngày, liên kết đến hoạt động. |
| LichTrinhChiTiet | `/admin/events?day=ID` | Xem điểm dừng, thời gian, ghi chú, ảnh. Khách tạo khi lập lịch trình. |
| ThanhToan | `/admin/payments` | Ghi nhận thủ công, xác nhận đã thu/thất bại; giữ giao dịch kết thúc chỉ đọc. |
| MaGiamGia | `/admin/coupons` | Tạo/sửa/vô hiệu hóa cấu hình; mã và cách giảm bất biến sau tạo. **Chưa áp dụng vào đơn đặt.** |
| HinhAnh | `/admin/images`, bộ ảnh từng dịch vụ | Tra cứu, xem nguồn/giấy phép; mở bộ ảnh để tải/sắp xếp/gỡ ảnh. |
| ChiPhi | `/admin/expenses?trip=ID` | Tạo/sửa khoản chi theo chuyến đi; không sửa người chi/chuyến đi của khoản đã tạo. |
| DanhGia | `/admin/reviews` | Tra cứu và ẩn/hiện; không sửa sao/nội dung thay khách. |
| YeuThich | `/admin/favorites` | Tra cứu; không tạo/xóa sở thích thay khách. |
| NhatKyAdmin | `/admin/audit` | Chỉ đọc, giữ lịch sử. |

Ánh xạ đủ bảng không có nghĩa là mọi bảng được mở CRUD hoặc cho khách truy cập. Những luồng phía khách chưa tồn tại (áp mã vào đơn, thêm/xóa yêu thích, gửi đánh giá mới) không được giả lập bằng màn hình admin. Lần này hoàn thiện độ phủ giao diện **quản trị/tra cứu**, giữ nguyên các luồng khách đang hoạt động; không thêm bảng bình luận hay cổng thanh toán/hoàn tiền.

## Kiểm thử

- Build frontend/backend thành công. Backend còn các cảnh báo nullable cũ; lint frontend không có lỗi, còn cảnh báo cũ ở các trang legacy/shared hooks.
- `dotnet build tests/AdminSmoke`, sau đó `node tests/admin-coverage.mjs`: chạy 24 route (23 bảng + đối chiếu), desktop 1440px/mobile 390px, không tràn ngang toàn trang, không page error/API error trong route đã thử.
- Xác nhận nghiệp vụ trên fixture riêng: tạo phòng và nhận ID/bộ ảnh; tạo mã giảm giá, chặn >100%; tạo khoản chi, chặn số âm; ẩn đánh giá không đổi sao/nội dung; tạo và xác nhận thanh toán đúng đơn, giữ trạng thái kết thúc chỉ xem; liên kết chuyến đi → chi phí.
- API đối chiếu trả 401 với khách, 403 với user thường. Admin mới được xem schema.
- `node tests/restaurant-planner.mjs`: 22 kiểm tra hồi quy đạt. Dùng tài khoản SQL có sẵn; không tạo tài khoản mới.
- Fixture có nhãn độc nhất được dọn theo đúng ID/nhãn sau test; nhật ký thao tác vẫn được giữ. Không reset/seed lại database.
- Impeccable hardening: menu nhóm, lựa chọn nhanh trên mobile, bảng có vùng cuộn/focus, loading/error/empty states, xác nhận thao tác tài chính. Detector trả `[]`. Kiểm tra ảnh giao diện theo một lượt và một lượt xác nhận; không kiểm tra thiết bị thật/Safari/Firefox.

## Giới hạn dữ liệu hiện có

- Hai tour ID 45, 46 thiếu lịch trình; không tự điền nội dung giả.
- Hai tour và hai điểm đến có dưới hai ảnh. Các file ảnh được tham chiếu hiện đều tồn tại.
- Ảnh nhà hàng hiện có ảnh minh họa khu vực với chú thích; admin có thể thay ảnh thật.
- Một số bảng tra cứu tải danh sách qua API hiện có và phân trang ở frontend; dữ liệu rất lớn cần phân trang phía server.

## Nguồn mã

- Registry và nhãn: `frontend/src/pages/Admin/dataRegistry.ts`.
- Tra cứu/quan hệ: `DataExplorer.tsx`; thanh toán: `Payments.tsx`; biểu mẫu: `schema.ts` + `AdminPage.tsx`; responsive: `coverage.css`.
- Backend: `AdminCoverageController.cs`, sửa response tạo phòng trong `LoaiPhongController.cs`, kiểm tra đầu vào `MaGiamGiaService.cs` và `ChiPhiService.cs`.
- Fixture runner chỉ phục vụ kiểm thử: `tests/AdminSmoke/CoverageFixtures.cs`, `--coverage-fixtures create|cleanup coverage-<13 digits>`. Không dùng để sửa dữ liệu thật.
