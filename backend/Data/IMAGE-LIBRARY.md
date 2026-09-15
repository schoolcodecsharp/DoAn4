# Thư viện ảnh Việt Nam

## Dữ liệu đã nhập

12 file JPEG tải từ Wikimedia Commons, khoảng 3,8 MB. Tất cả ảnh đã được mở và kiểm tra nội dung.
40 dòng `HinhAnh`: 14 liên kết tour (10 tour), 24 liên kết điểm đến và 2 liên kết khách sạn Saigon Morin.

File nằm trong `backend/wwwroot/media/vietnam`. Mỗi file có bản ghi nguồn `.source.json` bên cạnh, gồm tác giả, giấy phép, URL nguồn, ngày tải và SHA-256.

MySQL lưu **đường dẫn và metadata**, không lưu bản nhị phân BLOB. Một file có thể liên kết với nhiều đối tượng mà không cần tải/lưu trùng file.

## Cách hoạt động

- `HinhAnh.LoaiDoiTuong` + `MaDoiTuong` liên kết ảnh với `Tour`, `DiaDiem`, `KhachSan`, `NhaHang`, `LoaiPhong`.
- API danh sách, bộ lọc và chi tiết các đối tượng trên trả `hinhAnh: [...]`.
- `anhDaiDien` trong response được lấy từ ảnh đầu tiên theo `ThuTu`, sau đó `MaHinhAnh`; không có ảnh thì trả `null`.
- Các cột `AnhDaiDien` cũ được giữ để không mất dữ liệu, nhưng không còn là nguồn ảnh của giao diện mới.
- Ảnh được phục vụ tại `/media/vietnam/...`. Vite chuyển tiếp `/media` đến backend cổng 5000. Khi triển khai, cần chuyển tiếp cả `/api` và `/media` hoặc phục vụ cùng origin.
- Trang nguồn ảnh: `/image-credits`. Dưới ảnh có ghi công và liên kết giấy phép. Chỉ thay đổi kích thước/khung hiển thị, không sửa nội dung ảnh.
- Khách được đọc ảnh. Chỉ quản trị viên được ghi qua API `HinhAnh`; đường dẫn phải trỏ đến file ảnh nội bộ tồn tại và đối tượng tồn tại.

## Tải/nhập lại

Chạy ở thư mục `backend` với kết nối MySQL đã cấu hình:

```powershell
dotnet run -- --download-images
dotnet run -- --import-images
```

Lệnh tải không ghi MySQL. Lệnh nhập sao lưu bảng ảnh vào `backend/backups`, thêm các trường nguồn/giấy phép nếu chưa có rồi nhập liên kết trong transaction. Không chạy lại toàn bộ `CSDL.sql` trên database đang dùng.

Danh sách nguồn và mã đối tượng được duyệt ở `backend/data/vietnam-images.json`. Các mã đang ứng với database WebDuLich hiện tại; kiểm tra lại mã và tên đối tượng trước khi dùng manifest trên database khác.

Lệnh nhập giữ nguyên dòng ảnh hiện có, bỏ qua liên kết cùng loại/mã/đường dẫn và kiểm tra hash file. Không tự xóa, cập nhật thứ tự hoặc thay thế ảnh cũ. Chạy lại trên dữ liệu đã nhập sẽ thêm 0 dòng.

## Bổ sung ảnh

Với file đã được duyệt, lưu file vào `wwwroot/media`, sau đó dùng `POST /api/hinhanh` với JWT quản trị viên. Các trường: `loaiDoiTuong`, `maDoiTuong`, `duongDan`, `moTa`, `thuTu`, `nguon`, `tacGia`, `giayPhep`, `urlGiayPhep`. Lấy riêng bộ ảnh bằng `GET /api/hinhanh/Tour/4` hoặc `GET /api/hinhanh/DiaDiem/3`.

Chưa gán ảnh cho 17 bản ghi khách sạn còn lại, 19 nhà hàng và 33 loại phòng vì chưa có ảnh xác minh đúng cơ sở/đúng phòng kèm nguồn phù hợp. Không dùng ảnh khách sạn khác hoặc phong cảnh thay cho ảnh phòng. API của các bảng này đã hỗ trợ thư viện chung, sẽ trả ảnh ngay khi được bổ sung vào `HinhAnh`.

## Kiểm tra

Từ thư mục dự án, khi frontend và backend đang chạy:

```powershell
pwsh -File scripts/Test-ImageLibrary.ps1
```

Script cần PowerShell 7 (`pwsh`) do sử dụng `-SkipHttpErrorCheck`; dùng `pwsh -File scripts/Test-ImageLibrary.ps1` nếu `powershell` trỏ đến Windows PowerShell 5.
Kiểm tra HTTP của từng file, đủ liên kết theo manifest, không trùng, nguồn/giấy phép, hợp đồng `anhDaiDien` và chặn ghi khi chưa đăng nhập.
