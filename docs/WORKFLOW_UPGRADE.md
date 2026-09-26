# Nâng cấp nghiệp vụ và giao diện — 16/09/2026

## Bổ sung 21/09/2026

Đã thêm validation chung tạo/sửa tour, ẩn tour nháp và dữ liệu con khỏi GET công khai; admin còn hoạt động vẫn đọc được. Thanh toán có transaction khóa đơn, kiểm tra số tiền dương, tổng tiền chờ/đã thu, mã giao dịch duy nhất và trạng thái đơn. Không cho sửa/xóa giao dịch kết thúc hoặc giả lập hoàn tiền; ngày thành công do server ghi. Xem [README gốc](../README.md) để áp dụng migration và nhập catalog mở rộng. Có thêm 28 kiểm tra hồi quy trong `ReviewRegression.cs`.

## Những phần đã làm (mục 1, 2, 4, 5, 6, 7)

1. Quy tắc trạng thái được kiểm tra tại server, không chỉ ẩn nút trên giao diện.
2. Khách hàng và admin cùng gọi repository đặt tour/phòng: cùng kiểm tra ngày, trạng thái dịch vụ, người đặt đang hoạt động, số khách, phòng/chỗ còn lại và tự tính giá. Tổng tiền do client gửi không được sử dụng.
3. Bổ sung bộ kiểm thử tích hợp và Playwright chạy trình duyệt thật với dữ liệu tạm riêng.
4. Ngừng bán/ẩn thay vì xóa catalog; giữ đơn đặt. Ghi nhật ký các yêu cầu thay đổi của admin, xem phân trang và không có API sửa/xóa nhật ký.
5. Dashboard lấy tổng tiền đã thu, số đơn, đơn chờ/hủy, tour mở bán, top tour và tiền thu theo tháng từ CSDL thật.
6. Lọc giá/số ngày, sắp xếp, phân trang danh mục; phân trang quản trị, trạng thái tải/lỗi/thử lại, cải thiện màn hình nhỏ và nhãn truy cập. Đổi bộ lọc không chạy lại hiệu ứng chuyển trang; khu vực admin không có màn che chuyển trang.

## Quy tắc đơn hàng

| Loại | Chuyển trạng thái được phép |
|---|---|
| Tour | Pending → Confirmed hoặc Cancelled; Confirmed → Completed hoặc Cancelled |
| Phòng | Pending → Confirmed hoặc Cancelled; Confirmed → CheckedIn hoặc Cancelled; CheckedIn → CheckedOut |

- Gửi lại cùng trạng thái là thao tác lặp an toàn, không tăng/giảm chỗ lần nữa.
- Cancelled, Completed và CheckedOut là trạng thái cuối. Muốn đặt lại phải tạo đơn mới.
- Không hoàn thành tour trước khi kết thúc toàn bộ số ngày; không nhận/trả phòng trước ngày trên đơn. Quy tắc ngày dùng múi giờ Việt Nam.
- Không sửa khách, loại phòng, ngày, số khách/phòng hoặc giá của đơn phòng đã tạo. Hủy và đặt lại khi cần thay đổi.
- Hủy đơn có giao dịch ThanhCong bị chặn. Chưa bổ sung quy trình hoàn tiền/cổng thanh toán trong đợt này (mục 3 không nằm trong yêu cầu); không đổi nhãn giao dịch để giả lập hoàn tiền.
- Giá đã lưu trong đơn không thay đổi theo giá catalog mới. Sửa số phòng/sức chứa không được làm vi phạm các đơn phòng còn hiệu lực.
- Khách hàng tạo/xem đơn của mình; admin mới có quyền chuyển trạng thái qua API quản trị.

## Giữ lịch sử

- DELETE tour → Inactive; địa điểm/nhà hàng/khách sạn/loại phòng/loại địa điểm → TrangThai=0.
- DELETE ngày khởi hành → FullyBooked (đóng nhận đặt), không xóa hàng hoặc đơn liên quan. Có thể mở bán lại bằng cập nhật trạng thái khi phù hợp.
- DELETE đơn tour/phòng, tài khoản và giao dịch thanh toán bị chặn.
- Các bản ghi con nội dung (ví dụ hoạt động/ảnh) vẫn có thể sửa/gỡ qua chức năng quản trị; thay đổi này được ghi nhật ký.
- NhatKyAdmin lưu mã người thao tác, phương thức, loại/mã đối tượng, trace, kết quả HTTP và thời gian UTC. Không lưu request body, mật khẩu, token hoặc email.
- Nhật ký ghi Started trước thực thi. Nếu không ghi được nhật ký ban đầu, không thực hiện thao tác; nếu ghi kết quả cuối thất bại thì giữ Started và ghi log server. Đây là nhật ký thao tác API, không phải hệ thống chống chỉnh sửa bởi người có quyền trực tiếp MySQL.
- Không có khóa ngoại từ nhật ký về tài khoản để giữ mã người thao tác sau khi bảo trì dữ liệu. Nhật ký của các tài khoản thử được giữ lại; tài khoản và dữ liệu thử đã dọn.

## Dashboard

- Tiền đã thu = SUM(ThanhToan.SoTien) khi TrangThai=ThanhCong, không phải tổng giá trị đơn.
- Không gọi chỉ số này là lợi nhuận hoặc doanh thu thuần sau hoàn tiền.
- Thống kê top tour loại trừ đơn hủy. Thống kê tháng hiển thị 12 tháng gần nhất có giao dịch thành công và ngày thanh toán.
- API: GET /api/admin/dashboard và GET /api/admin/audit?page=1&pageSize=20. Cả hai chỉ dành cho admin.

## CSDL và sao lưu

- Migration thêm bảng, không reset dữ liệu: database/migrations/20260916_admin_workflow.sql.
- Đã áp dụng local sau bản sao lưu backend/backups/before-workflow-upgrade-20260916-143639.sql.
- database/CSDL.sql cũng có bảng nhật ký cho cài đặt mới; hiện có 23 bảng.
- Sau test: 41 khóa ngoại không có bản ghi mồ côi; đơn thật, tài khoản thật và dữ liệu mẫu vẫn giữ nguyên.

## Kiểm thử

- 104 kiểm tra API (7 smoke + 97 chức năng) đạt.
- 6 luồng trình duyệt Chromium đạt: lọc/phân trang/mobile; khách đặt tour và admin xác nhận–hủy; đặt phòng và xem tài khoản; admin tạo địa điểm/upload/ẩn/dashboard/nhật ký; lập lịch trình hai ngày; khách chưa đăng nhập và lỗi danh mục/thử lại.
- API ứng dụng và MySQL là thật. Chỉ danh sách tỉnh của nhà cung cấp được giả lập để test ổn định; riêng ca lỗi danh mục chủ động trả 503 rồi bỏ giả lập để thử tải lại.
- Các kiểm tra ảnh/lịch trình mẫu vẫn đạt; SQL mới chạy sạch và chạy seed hai lần trên CSDL riêng thành công.
- Frontend/backend build thành công. Các file admin và catalog vừa sửa vượt qua lint riêng; toàn dự án còn cảnh báo cũ.
- Đây là phạm vi kiểm thử cụ thể, không phải chứng nhận mọi tổ hợp nghiệp vụ, tải lớn hay thanh toán thực đều đã được kiểm định.

Chạy từ D:\DoAn4 (build trước khi khởi động backend để tránh file exe bị khóa trên Windows):

```powershell
dotnet build tests/AdminSmoke
# Hai terminal riêng:
dotnet run --no-build --project backend
# Trong frontend: npm run dev -- --host 127.0.0.1 --port 5173
# Sau khi backend:5000 và frontend:5173 hoạt động:
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --functional
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --browser
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --check-sample-data
```

Cài trình duyệt test lần đầu trong frontend: npm ci, sau đó npx playwright install chromium. Test tự tạo mật khẩu ngẫu nhiên, chỉ truyền cho tiến trình con qua biến môi trường; không cần mật khẩu admin thật.
