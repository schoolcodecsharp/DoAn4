# Ảnh du lịch Việt Nam

Từ 21/09/2026: thư mục `AnhDuLich` chỉ chứa JPEG. Toàn bộ file `.source.json` được chuyển vào `backend/Data/photo-sources` này; các script tải ảnh đã cập nhật đường dẫn. Bộ ảnh đã phân loại có thể nhập bằng chế độ `--expand-catalog` theo README gốc. Các mô tả quy trình cũ bên dưới chỉ áp dụng cho thao tác tải riêng.

Ảnh tải từ Wikimedia Commons, không phải ảnh AI. Bộ ảnh gồm Hạ Long, Mỹ Khê, Cầu Vàng, Hội An, Mã Pí Lèng, Đồng Văn, Bản Giốc, Huế, Lý Sơn, Đà Lạt và chợ nổi Cái Răng.

- File .jpg: ảnh có thể chọn để tải lên trong trang admin.
- File .jpg.source.json tương ứng: trang nguồn (Nguon), tác giả (TacGia), giấy phép (GiayPhep), liên kết giấy phép và checksum.
- Ảnh CC BY/CC BY-SA yêu cầu ghi công khi sử dụng; ảnh CC BY-SA có thêm điều kiện chia sẻ tương tự khi tạo bản phái sinh. Xem giấy phép từng ảnh, không coi mọi ảnh là miễn điều kiện.
- Đây là thư mục tải về riêng. Việc tải không thay đổi CSDL hoặc ảnh đang được website sử dụng.

Tải lại/kiểm tra ảnh từ thư mục dự án:

```powershell
pwsh -File scripts/Download-TravelPhotos.ps1
```

Script không ghi đè ảnh đã có, kiểm tra định dạng, kích thước đọc được và SHA-256.

## Bộ ảnh mở rộng

Ảnh bổ sung có tên theo địa danh và mã ảnh nguồn, ví dụ `sa-pa-14396.jpg`. Mỗi ảnh vẫn có file `.source.json` đi kèm để tra tác giả, giấy phép và trang gốc.

Tải thêm ảnh có giấy phép phù hợp, bỏ qua ảnh đã có:

```powershell
pwsh -File scripts/Download-MoreTravelPhotos.ps1 -Count 60
```

Script tìm ảnh JPEG theo địa danh, kiểm tra giấy phép, khả năng giải mã và trùng lặp SHA-256 trước khi lưu. Số lượng thực tế phụ thuộc số ảnh phù hợp và tình trạng mạng. Không cập nhật CSDL hay tự gắn ảnh mới vào tour.
