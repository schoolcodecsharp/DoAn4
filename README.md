# NVT Du lịch — Đồ án 4

React + TypeScript + Vite; ASP.NET Core (.NET 9); MySQL 8. Dự án có danh mục điểm đến/tour/khách sạn, đặt chỗ, lịch trình cá nhân và quản trị.

## Cấu trúc thư mục

```text
DoAn4/
├── frontend/          # Ứng dụng React đang sử dụng
├── backend/           # API, nghiệp vụ và ảnh website phục vụ
├── database/          # Schema, dữ liệu mẫu, migrations và SQL kiểm tra
├── docs/              # Hướng dẫn, báo cáo Word và sơ đồ
│   ├── reports/       # DoAn4.docx, báo cáo tuần
│   └── diagrams/      # Dự án Visual Paradigm và bản dự phòng
├── tests/AdminSmoke/  # Kiểm thử API, dữ liệu và bộ chạy trình duyệt
├── scripts/           # Công cụ tải và kiểm tra thư viện ảnh
├── AnhDuLich/         # Ảnh JPEG để duyệt/chọn
└── archive/           # SQL sửa dữ liệu, code generator, log lịch sử
```

Bắt đầu đọc mã ở `frontend/src/App.tsx` và `backend/Program.cs`.
Các trang hiện tại nằm chủ yếu trong `frontend/src/pages/User`, `Admin`, `Auth` và `Home`.
Backend chia thành `Controllers` (API), `Services` (nghiệp vụ), `Data` (repository/SQL), `Models/DTOs` (dữ liệu trao đổi), `Security` (phân quyền), `Tools` (bảo trì).
`bin`, `obj`, `node_modules`, `dist` và `test-results` là đầu ra tự sinh, không phải mã cần chỉnh sửa.

Tài liệu: [Quản trị](docs/ADMIN.md), [Nghiệp vụ](docs/WORKFLOW_UPGRADE.md), [Đánh giá trước đây](docs/AUDIT_2026-09-16.md).
Các đường dẫn trong tài liệu được tính từ thư mục gốc dự án, trừ khi có ghi khác.
Thư mục `frontend_original` đã được chuyển vào Thùng rác ngày 22/09/2026; ứng dụng hiện tại chỉ dùng `frontend/`.
Không chạy các script trong `archive/` để cài đặt hoặc khởi động ứng dụng.

## Cài đặt trên máy mới

1. Cài .NET SDK 9, Node.js tương thích Vite 8 và MySQL 8.
2. Chỉ trên database mới: nhập `database/CSDL.sql`, sau đó `database/data_mau.sql` bằng MySQL Workbench (UTF-8). **database/CSDL.sql có DROP DATABASE: không chạy trên dữ liệu cần giữ.** Máy đang dùng chỉ áp dụng migration sau khi sao lưu.
3. Sao chép `backend/appsettings.example.json` thành `backend/appsettings.json`. Điền kết nối MySQL và JWT secret ngẫu nhiên tối thiểu 32 ký tự; không commit cấu hình này.
4. Từ thư mục dự án chạy `dotnet restore backend`, `dotnet build tests/AdminSmoke`. Trong `frontend` chạy `npm ci` và `npm run build`.
5. Tạo tài khoản quản trị: trong `backend` chạy `dotnet run -- --create-admin email@example.com`. Lệnh in mật khẩu ngẫu nhiên một lần. Mật khẩu plaintext từ seed không dùng để đăng nhập được.

## Chạy demo

Hai terminal: `dotnet run --project backend` và trong `frontend`: `npm run dev -- --host 127.0.0.1 --port 5173`.

Mở http://127.0.0.1:5173; quản trị tại `/admin`. API chạy cổng 5000. Proxy `/api` và `/media` được cấu hình trong Vite; khi triển khai cần reverse proxy tương ứng, không chỉ chép thư mục `dist` lên host tĩnh.

## Kiểm tra

Khi backend đang chạy:

```powershell
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --audit
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --check-sample-data
dotnet run --no-build --project tests/AdminSmoke -- D:\DoAn4\backend --functional
```

Thay đường dẫn backend theo máy. Hai chế độ đầu chỉ đọc; functional tạo fixture riêng rồi dọn trong `finally`. Test trình duyệt: cài Chromium bằng `npx playwright install chromium` trong frontend, khởi động frontend rồi chạy chế độ `--browser`. Frontend kiểm tra bằng `npm run build` và `npm run lint`.

## Ảnh và dữ liệu mẫu mở rộng

- `AnhDuLich/`: chỉ chứa ảnh JPEG để duyệt/chọn thủ công.
- `backend/Data/photo-sources/`: nguồn, tác giả, giấy phép và SHA-256 của từng ảnh. Không bỏ metadata: công cụ nhập và kiểm tra nguồn dùng nó.
- `backend/wwwroot/media/library/`: bản ảnh được website phục vụ. Database lưu đường dẫn và thông tin ghi công, không lưu nhị phân ảnh.
- Tải thêm: `pwsh -File scripts/Download-MoreTravelPhotos.ps1 -Count 24`.
- Nhập bộ ảnh đã phân loại và 8 tour/điểm đến mẫu: `dotnet run --project tests/AdminSmoke -- D:\DoAn4\backend --expand-catalog`. Lệnh kiểm tra file, sao lưu bằng mysqldump, áp dụng ràng buộc thanh toán, nhập trong transaction. Chạy lại không tạo trùng. Công cụ hiện dùng đường dẫn MySQL 8 tiêu chuẩn trên Windows; chỉnh nếu máy cài nơi khác.
- Các tour mở rộng có nhãn **tour mẫu**, mô tả nói rõ giá/lịch chỉ phục vụ demo. Không tự tạo khách sạn/nhà hàng giả từ ảnh phong cảnh. Ảnh lấy từ Wikimedia Commons; nội dung địa danh tham khảo https://vietnam.travel/vi/place-to-go và trang nguồn từng ảnh.
- Ảnh tải thêm ngoài các nhóm được ánh xạ trong `CatalogExpansion.cs` vẫn ở thư viện, cần phân loại trước khi nhập.

## Thành viên chuyến đi

Trong Tài khoản → Lịch trình của tôi, chủ chuyến đi chọn **Quản lý thành viên**, nhập email tài khoản đang hoạt động và gửi lời mời.
Người nhận thấy lời mời ngay trong trang tài khoản, có thể chấp nhận hoặc từ chối. Đây là lời mời trong ứng dụng, không gửi email.
Sau khi chấp nhận, người nhận xem được lịch trình, ghi chú và ngân sách chung; chỉ chủ chuyến đi được quản lý thành viên.
Chủ chuyến đi có thể gỡ để thu hồi quyền xem hoặc mời lại người đã từ chối. Không mời trùng, không tự mời, không thêm/gỡ ở chuyến đã kết thúc.
Giới hạn 100 người tính cả chủ và lời mời đang chờ. Số người dự kiến tự tăng nếu thấp hơn số thành viên/lời mời; không tự giảm khi từ chối hoặc gỡ.
Tính năng này áp dụng cho chuyến đi tự lập, không thay đổi hành khách hay số chỗ của đơn tour/phòng.

## Quy tắc thanh toán

Chỉ admin ghi nhận thanh toán thủ công. API không tích hợp cổng thanh toán: tên phương thức không chứng minh đã thu tiền thực. Chỉ chuyển `ChoThanhToan` → `ThanhCong` hoặc `ThatBai`; giao dịch kết thúc không được sửa/xóa. Chưa hỗ trợ hoàn tiền; API chặn đổi nhãn để giả lập hoàn tiền. Ngày thành công do server ghi. Số tiền phải dương, không thu vượt tổng đơn (kể cả khoản đang chờ); mã giao dịch không được trùng. Đơn đã hủy không nhận thanh toán.

Migration mới: `database/migrations/20260921_payment_integrity.sql`. Công cụ `--expand-catalog` tự kiểm tra dữ liệu cũ và áp dụng nếu chưa có; không chạy SQL migration nhiều lần thủ công.

Backup trong `backend/backups/` (không commit). Để khôi phục database dùng bản SQL trước thay đổi; sao lưu cả `wwwroot/media` khi triển khai. Dữ liệu người dùng và đơn cũ không bị reset khi mở rộng catalog.
