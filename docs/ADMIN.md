# Quản trị NVT

Mở `/admin`. Người chưa đăng nhập được chuyển đến màn hình đăng nhập;
chỉ `MaVaiTro = 1` được vào giao diện. API kiểm tra JWT và trạng thái/vai trò
trong CSDL ở mỗi thao tác quản trị qua `CustomerAccessFilter`.

## Chức năng

- Thêm/sửa/ngừng bán hoặc ẩn địa điểm, tour, khách sạn và loại địa điểm; tìm kiếm và phân trang danh sách.
- Tour: chỉnh sửa thông tin, thêm hoạt động theo ngày và thứ tự, chọn điểm tham quan,
  nhà hàng hoặc khách sạn; quản lý ngày khởi hành và giá áp dụng.
- Ảnh: lưu đối tượng trước, sau đó tải nhiều ảnh JPG/PNG/WebP (tối đa 8 MB/file),
  sửa mô tả/thứ tự, gỡ liên kết ảnh. File được lưu dưới `backend/wwwroot/media/uploads`.
  Gỡ ảnh không xóa file vật lý, để tránh phá các liên kết sử dụng chung.
- Tài khoản: tạo tài khoản, sửa thông tin, khóa/mở và đổi vai trò. Không có nút xóa
  tài khoản trong giao diện; API chặn tự xóa, tự khóa hoặc tự hạ quyền Admin.
- Đơn tour/phòng không được xóa hoặc mở lại sau khi hủy/hoàn tất. Admin xử lý tại `/admin/tour-orders` và `/admin/room-orders`.
- Dashboard lấy số tiền từ giao dịch thành công; nhật ký admin chỉ đọc tại `/admin/audit`.
- Quy tắc chuyển trạng thái, migration và kiểm thử mới: xem [WORKFLOW_UPGRADE.md](WORKFLOW_UPGRADE.md).

## Khởi tạo Admin khi chưa có tài khoản dùng được

Chạy trong thư mục `backend`:

```powershell
dotnet run -- --create-admin email@example.com
```

Lệnh tạo tài khoản mới với mật khẩu ngẫu nhiên và in một lần ra terminal.
Lưu mật khẩu ở nơi an toàn; không commit mật khẩu hoặc cấu hình kết nối.
Email đã tồn tại sẽ bị từ chối, không ghi đè mật khẩu hay vai trò.
Đây là lệnh cục bộ, không phải API đăng ký Admin công khai.

## Kiểm thử

Khởi động backend tại localhost:5000 rồi chạy từ thư mục dự án:

```powershell
dotnet run --project tests/AdminSmoke -- D:\DoAn4\backend
```

Bài kiểm thử tạo tài khoản và dữ liệu có tên ngẫu nhiên riêng, kiểm tra phân quyền,
tạo địa điểm/tour/lịch trình/ngày khởi hành, tải ảnh và kiểm tra lưu trữ mềm;
sau đó dọn đúng dữ liệu thử trong `finally`. Không reset CSDL.

Frontend: `npm run build` trong `frontend`. Backend: `dotnet build` trong `backend`.
Sao lưu cả database và thư mục ảnh tải lên khi triển khai.
