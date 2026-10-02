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
Rà soát hiện tại: [Hoàn thiện và kiểm thử 30/09/2026](docs/COMPLETION_REVIEW_2026-09-30.md), [Độ phủ database](docs/DATABASE_UI_COVERAGE.md), [Đánh giá và bình luận](docs/FEEDBACK_2026-09-30.md), [Danh mục có nguồn đối chiếu](docs/CATALOG_VERIFICATION_2026-09-29.md).
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

Danh mục tỉnh/thành và dữ liệu mới ngày 01/10/2026: xem [hướng dẫn migration và giới hạn dữ liệu](docs/PROVINCES_CATALOG_2026-10-01.md). Database tại máy này đã được cập nhật; không cần nhập lại. Máy khác cần sao lưu và áp dụng migration trước khi dùng bộ lọc tỉnh mới.

Database đã có từ phiên bản trước: build `tests/AdminSmoke`, chạy `dotnet run --no-build --project tests/AdminSmoke -- --upgrade-feedback` **trước khi chạy backend mới**. Lệnh sao lưu trước khi thêm bảng bình luận và khóa xác minh đánh giá; chạy lại sẽ bỏ qua schema đã cài. Không nhập lại `CSDL.sql`. Database mới tạo bằng schema hiện tại đã có phần này.

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

Các bài kiểm tra dùng **tài khoản SQL có sẵn** (không tạo tài khoản): đặt thông tin đăng nhập của tài khoản admin/user đang hoạt động vào `.local/test-accounts.json`, khóa `admin` và `user`, mỗi khóa chứa `email`/`password`. File được gitignore, không đưa lên GitHub. Khởi động hai dịch vụ rồi chạy từ root:

```powershell
dotnet run --no-build --project tests/AdminSmoke -- --audit
dotnet run --no-build --project tests/AdminSmoke -- --verified-coverage
dotnet run --no-build --project tests/AdminSmoke -- --completion-checks
dotnet run --no-build --project tests/AdminSmoke -- --capacity-checks
node tests/completion-ui.mjs
node tests/account-details.mjs
node tests/feedback.mjs
node tests/admin-coverage.mjs
node tests/restaurant-planner.mjs
node tests/home-polish.mjs
node tests/catalog-system-audit.mjs
node tests/provinces.mjs
```

Build `tests/AdminSmoke` trước khi dùng `--no-build`. `--audit`, `--verified-coverage`, home và catalog audit chỉ đọc dữ liệu ứng dụng. Các test completion/feedback/capacity/admin/planner có tạo dữ liệu thử riêng rồi dọn trong `finally`; nhật ký admin được giữ. Chạy tuần tự để fixture không xuất hiện trong bài audit danh mục. Các chế độ cũ `--functional`/`--browser` vẫn tạo tài khoản thử riêng; không dùng chúng khi cần kiểm thử chỉ với tài khoản sẵn có.

## Đánh giá và bình luận

Trong trang tài khoản, bấm trực tiếp thẻ tour/phòng đã đặt để xem thông tin dịch vụ; bấm thẻ lịch trình để xem từng ngày và hoạt động. Không cần nút chi tiết riêng. `account-details.mjs` kiểm tra chỉ đọc bằng đơn và tài khoản hiện có.

Trang chi tiết điểm đến, tour và khách sạn cho mọi người đọc đánh giá/bình luận không cần đăng nhập. Đăng nhập là có thể bình luận; chấm sao cần đơn của chính tài khoản đã hoàn thành trải nghiệm: tour `Completed`, phòng `CheckedOut`, đã qua ngày kết thúc tương ứng. Điểm đến phải nằm trong tour đã hoàn thành của người đó; lịch trình tự lập không tự xác nhận đã tham quan. Mỗi tài khoản chấm sao một lần cho mỗi dịch vụ. Admin chỉ ẩn/hiện tại `/admin/reviews` và `/admin/comments`. Điểm trung bình và sắp xếp danh mục chỉ tính đánh giá đã xác minh, đang công khai; đánh giá cũ chưa có bằng chứng vẫn được giữ trong database để tra cứu.

## Ảnh và dữ liệu mẫu mở rộng

Từ 01/10/2026, dữ liệu mới theo yêu cầu chỉ dùng thông tin cơ sở/điểm đến có nguồn đối chiếu. Không dùng các chế độ tạo dữ liệu mẫu bên dưới để bổ sung giá/phòng/lịch khởi hành thật. Tour tham khảo mới là gợi ý NVT biên soạn, không phải tour mở bán.

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
### Bổ sung luồng tài khoản (30/09/2026)

- Đăng nhập admin: nút **Quản trị** hiện trên header trang chủ và các trang công khai; tài khoản thường/khách không thấy nút này.
- Tại **Tài khoản → Tour đã đặt / Phòng đã đặt**, bấm thẻ để xem dịch vụ. Mục **Yêu cầu hủy đơn** nằm riêng dưới thẻ, không lồng nút trong liên kết. Mỗi đơn gửi một yêu cầu, trước ngày sử dụng dịch vụ, khi đang chờ/đã xác nhận. Admin xử lý tại **Đơn tour / Đơn phòng → Yêu cầu hủy đang chờ**. Đơn vẫn giữ chỗ đến khi được duyệt. Từ chối cần ghi lý do; không tự hoàn tiền, không duyệt hủy đơn đã thu tiền khi chưa có quy trình hoàn tiền.
- Tại chi tiết lịch trình: **Sửa lịch trình** dành cho chủ kế hoạch đang ở trạng thái Planning và chưa qua ngày bắt đầu. Có kiểm tra trùng giờ, số thành viên và xung đột chỉnh sửa. Người được mời chỉ xem.
- Tour đã có bất kỳ đơn đặt nào được khóa thời lượng/điểm dừng để giữ lịch sử trải nghiệm. Tạo tour mới khi cần thay đổi lịch trình; vẫn có thể sửa thông tin mô tả không thuộc phần bị khóa.

Database đang dùng: sao lưu và bổ sung schema bằng `dotnet run --project tests/AdminSmoke -- --upgrade-account`. Lệnh này thêm cột còn thiếu, không reset database. **Không chạy CSDL.sql trên database đang có dữ liệu.** Bản sao lưu lần cài tại máy này: `backend/backups/before-account-20260930-210401753.sql` (local/ignored).

CORS sử dụng cấu hình `Cors:AllowedOrigins` (mảng URL đầy đủ, không dấu `/` cuối), hoặc biến môi trường `Cors__AllowedOrigins__0`. Development mặc định cho phép localhost/127.0.0.1 cổng 5173; Production không mặc định mở cho mọi origin. Giới hạn API: đăng nhập/đăng ký chung 10 lần/phút/IP; gửi đánh giá/bình luận chung 20 lần/phút/tài khoản. Khi trả 429, đợi số giây trong `Retry-After`. Khi deploy nhiều instance/proxy cần cấu hình proxy tin cậy và giới hạn dùng chung; không tin trực tiếp X-Forwarded-For từ khách.

Kiểm tra bổ sung (dịch vụ 5000/5173 đang chạy, tài khoản SQL có sẵn trong `.local/test-accounts.json`): `node tests/account-workflows.mjs`, `node tests/account-details.mjs`, `node tests/feedback.mjs`, `node tests/restaurant-planner.mjs`; cuối cùng `node tests/rate-limits.mjs`. Trừ account-details và rate-limits, các suite này có tạo/xóa dữ liệu fixture riêng, không chạy trên production. Khi build trên Windows, dừng đúng tiến trình backend của dự án nếu DLL/exe đang bị khóa rồi chạy lại sau build.

## Bổ sung danh mục và ảnh (2026-10-01)

Đợt bổ sung danh mục/ảnh cùng ngày: 12 điểm đến, 8 khách sạn, 8 tour tham khảo, 40 ảnh có giấy phép (68 liên kết). Dataset, backup, lệnh nhập an toàn và kết quả kiểm thử tại [báo cáo bổ sung danh mục](docs/CATALOG_ENRICHMENT_2026-10-01.md). Không tự tạo giá, phòng trống hoặc lịch khởi hành; Git không chứa database có tài khoản cá nhân.

Đợt đa dạng dữ liệu 02/10/2026: thêm 22 điểm đến, 10 nơi lưu trú, 10 nhà hàng, 12 tour tham khảo với 44 hoạt động và 28 liên kết ảnh có sẵn. Dùng `--check-diversity` để kiểm tra chỉ đọc, `--diversify-catalog` để nhập có backup/transaction; kiểm thử bằng `node tests/catalog-diversity.mjs`. Xem [nguồn, số liệu và giới hạn](docs/CATALOG_DIVERSITY_2026-10-02.md). Không thêm tồn phòng, giá hay ngày khởi hành chưa xác minh.

Đợt bổ sung ảnh 02/10/2026: thêm 36 ảnh địa điểm và 28 liên kết ảnh tour. Chạy `dotnet run --project tests/AdminSmoke -- --check-photo-coverage` để xem mục còn thiếu; `--fill-photo-coverage` nhập có backup/transaction, không tạo trùng. Kiểm tra web bằng `node tests/photo-coverage.mjs`; thêm `--require-complete` để báo lỗi nếu còn thiếu ảnh. **Chưa phủ đủ ảnh cho mọi mục**, xem [báo cáo ảnh và phần cần bổ sung](docs/PHOTO_COVERAGE_2026-10-02.md).

## Dự toán lịch trình (2026-10-01)

Lịch trình tính dự toán vé tham quan, ăn uống và phòng theo ngày lưu trú; lưu kế hoạch không giữ chỗ. Xem [hợp đồng dữ liệu và kiểm thử](docs/PLANNER_COSTS_2026-10-01.md).

Database đang có dữ liệu: chạy `dotnet run --project tests/AdminSmoke -- --upgrade-planner` sau khi build. Lệnh sao lưu SQL trước và chỉ thêm cột còn thiếu; không chạy `database/CSDL.sql` để nâng cấp. Kiểm thử local bằng `--planner-checks` và `node tests/planner-costs.mjs`: dùng tài khoản sẵn có trong `.local/test-accounts.json`, tạo dữ liệu tạm có nhãn riêng rồi tự dọn; không chạy các kiểm thử có ghi dữ liệu này trên production.
