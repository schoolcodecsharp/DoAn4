# Bổ sung danh mục và kiểm tra hệ thống — 29/09/2026

## Kết quả và phạm vi

Đã nhập **27 bản ghi danh mục** có nguồn đối chiếu: 12 khách sạn, 12 nhà hàng, 2 điểm du lịch và 1 tour tham khảo; thêm 1 liên kết điểm đến trong lịch trình tour. Nguồn, nội dung và ngày đối chiếu nằm trong `database/verified-catalog-20260929.json`. Mô tả công khai có liên kết nguồn.

Sau nhập, cả **17 nhóm tỉnh/thành** trong danh mục đều có ít nhất **1** điểm du lịch, khách sạn, nhà hàng và tour liên quan: An Giang, Cần Thơ, Cao Bằng, Đà Nẵng, Gia Lai, Hà Giang, Hà Nội, Hưng Yên, Khánh Hòa, Lâm Đồng, Lào Cai, Ninh Bình, Quảng Nam, Quảng Ngãi, Quảng Ninh, Quảng Trị, Thừa Thiên Huế. Hưng Yên được bổ sung mới. Tour qua nhiều tỉnh được tính cho từng tỉnh liên quan; không phải mỗi tỉnh có một tour riêng biệt. Không cam kết mỗi nhóm có đủ 2 bản ghi.

**Đây không phải xác nhận toàn bộ dữ liệu cũ là dữ liệu thực tế.** Dữ liệu mẫu cũ được giữ nguyên. Danh mục hiện vẫn dùng lẫn tên tỉnh cũ/mới; không thực hiện chuyển đổi địa giới hàng loạt.

Không tạo tài khoản, đánh giá, ảnh minh họa giả, phòng trống, ngày khởi hành hay sức chứa giả. Giá chưa xác nhận vẫn dùng sentinel 0 của schema cũ nhưng giao diện không diễn giải là miễn phí. Tour Hưng Yên là tham khảo từ đơn vị nguồn, không phải tour NVT đang mở bán; giá nguồn không bảo đảm giá giao dịch hiện tại. Không tự đặt giờ đến cho điểm dừng khi nguồn không công bố.

## Bảo toàn dữ liệu

- Bản sao lưu **trước lần nhập thực tế**: `backend/backups/before-verified-catalog-20260929-090621404.sql` (local, ignored).
- Import dùng khóa tư vấn MySQL, transaction và kiểm tra bản ghi đã tồn tại. Không chạy `database/CSDL.sql`.
- Chạy lại importer: `added: []`, không thêm trùng. Bản backup lần chạy lại là trạng thái sau nhập, không thay thế backup trước nhập.
- Không tự phục hồi toàn bộ backup: thao tác đó có thể ghi đè giao dịch phát sinh sau thời điểm sao lưu.

## Thay đổi giao diện và hợp đồng API

- Bộ lọc tỉnh ở trang danh mục lấy nhóm tỉnh từ dữ liệu thực tế; không phụ thuộc danh sách tỉnh ngoài để lọc danh mục. Chế độ chọn tỉnh ở admin vẫn giữ cơ chế cũ.
- Giá chưa biết không lọt vào kết quả lọc ngân sách, nằm cuối khi sắp xếp giá và có hướng dẫn liên hệ ở chi tiết nhà hàng.
- `CatalogDescription.tsx` trình bày đoạn văn và nguồn đối chiếu thành liên kết; CSS xuống dòng URL dài để tránh tràn trên mobile. Không chèn HTML từ mô tả.
- Impeccable được dùng để kiểm tra và gia cố tính rõ ràng, trạng thái thiếu dữ liệu, bố cục responsive; giữ nhận diện xanh rừng/nền giấy hiện có, không thiết kế lại toàn bộ.
- Tour được phép có sức chứa **0/0** nghĩa là chưa xác nhận. Không chấp nhận chỉ một đầu bằng 0 hoặc min lớn hơn max.
- Không tạo lịch khởi hành khi sức chứa chưa xác nhận; không đổi sức chứa về 0/0 nếu đã có lịch khởi hành. Hai thao tác dùng transaction và khóa hàng tour cha. Form admin chấp nhận và giải thích cặp 0/0.

## Kiểm thử đã chạy

| Phạm vi | Kết quả |
|---|---|
| `node tests/catalog-system-audit.mjs` | 541 lượt gọi HTTP; 174 lượt mở trang ở 1440/390 px; 17 nhóm tỉnh; `failures: []`, `browserErrors: []` |
| `node tests/admin-coverage.mjs` | 23 bảng được ánh xạ; 24 route admin; 7 kiểm tra luồng đạt |
| `node tests/restaurant-planner.mjs` | 22 kiểm tra đạt: quyền truy cập, nhiều sự kiện/ngày, thứ tự giờ, ảnh, lưu/tải lại, chặn thời gian sai/chồng chéo |
| AdminSmoke `--capacity-checks` | 8 kiểm tra đạt, gồm sửa tour 0/0 và chặn lịch khởi hành/sửa sức chứa không hợp lệ |
| AdminSmoke `--verified-coverage` | Các nhóm tỉnh đạt độ phủ tối thiểu nêu trên |
| Kiểm tra SQL | 23 bảng, 41 khóa ngoại; không phát hiện bản ghi mồ côi; 225 liên kết ảnh hiện có không thiếu/sai file local |
| `dotnet build tests/AdminSmoke --no-restore -v quiet` | Thành công, 0 lỗi; còn cảnh báo có sẵn, không phải build sạch cảnh báo |
| `npm run build`, `npm run lint` trong `frontend` | Thành công; lint còn cảnh báo ở mã cũ |

541 là số lượt gọi, không phải 541 endpoint khác nhau. 174 là số lượt mở trang cộng hai kích thước, không phải 174 trang riêng biệt. Kiểm tra API bao gồm danh mục/chi tiết, phân quyền anonymous/user/admin, 404, lịch khởi hành/phòng, tài khoản và báo cáo admin. Không khẳng định đã bao phủ mọi nhánh ghi của mọi API.

Kiểm thử dùng tài khoản SQL có sẵn từ cấu hình local ignored, không công bố mật khẩu trong báo cáo. Các test admin/planner/capacity tạo fixture riêng và dọn các bản ghi của chính chúng; audit log có thể tăng. Audit danh mục không tạo đơn hay tài khoản.

## Kiểm tra giao diện theo Impeccable

Implementation integrity: đạt trong phạm vi thay đổi danh mục — thiếu ảnh hiển thị trạng thái thiếu ảnh, nguồn có thể kiểm tra, giá chưa biết không được trình bày như miễn phí. Detector trên các file giao diện đích trả về `[]`; đây không phải bằng chứng toàn ứng dụng đạt mọi tiêu chí.

| Chiều kiểm tra | Đánh giá trong phạm vi này |
|---|---|
| Accessibility | Chưa chấm điểm đầy đủ: chưa kiểm tra toàn bộ contrast, screen reader, thứ tự focus |
| Performance | Build thành công; chưa đo Core Web Vitals/throttling để chấm điểm |
| Responsive | 3/4 tạm thời: Chromium 1440/390 px không phát hiện tràn ngang; chưa thử thiết bị cảm ứng thật hoặc mọi mức phóng đại |
| Theming | Chưa chấm điểm toàn hệ thống token/theme; giữ theme hiện hữu |
| Implementation integrity | 3/4 trong các file đã sửa; còn giới hạn danh mục cũ bên dưới |

Không cộng điểm /20 khi ba chiều chưa được đo đầy đủ; không chứng nhận WCAG AA. Ảnh kiểm tra nằm trong `.local/catalog-verified-detail-390.png`, `.local/catalog-verified-list-1440.png` (ignored).

## Giới hạn và việc cần tiếp tục

- **P2 — dữ liệu cũ chưa xác minh toàn bộ:** không nên dùng kiểm tra độ phủ để tuyên bố mọi dịch vụ đã xác thực. Cần rà soát từng nguồn trước khi mở bán thực tế.
- **P2 — dữ liệu phục vụ đặt chỗ còn thiếu ở mục mới:** chưa có phòng, tồn chỗ, lịch khởi hành xác nhận hoặc quyền sử dụng ảnh. Giữ trạng thái tham khảo/liên hệ; chỉ nhập sau khi có nguồn hoặc xác nhận của đơn vị cung cấp.
- **P2 — nhóm tỉnh chưa chuẩn hóa địa giới:** tên cũ/mới cùng tồn tại; cần quyết định migration và ánh xạ dữ liệu trước khi thay đổi, tránh làm mất liên kết tìm kiếm.
- Hai tour cũ không hoạt động (ID 45, 46) chưa có lịch trình đầy đủ. Không tự điền nội dung giả hoặc xóa chúng.
- Chưa kiểm thử tải lớn, race condition bằng stress test, mọi trình duyệt, thiết bị thật, mọi nhánh CRUD hoặc thanh toán thực tế. Không có kết luận hệ thống không thể phát sinh lỗi.

Với vòng giao diện tiếp theo, ưu tiên `$impeccable audit` cho accessibility/performance còn chưa đo; sau khi có ảnh hợp lệ dùng `$impeccable harden` để kiểm tra các trạng thái đủ/thiếu ảnh, kết thúc bằng `$impeccable polish`. Có thể thực hiện riêng hoặc cùng một vòng; không tự bổ sung ảnh/giá giả để đạt hình thức.

## Lệnh chạy lại

Chạy từ root với backend/frontend đang hoạt động và cấu hình local hiện có:

```powershell
# Chỉ đọc dữ liệu
dotnet run --project tests/AdminSmoke -- --verified-coverage
node tests/catalog-system-audit.mjs

# Có ghi fixture và dọn fixture của chính test
dotnet run --project tests/AdminSmoke -- --capacity-checks
node tests/admin-coverage.mjs
node tests/restaurant-planner.mjs

# Có backup và nhập dữ liệu danh mục; không phải test chỉ đọc
dotnet run --project tests/AdminSmoke -- --verified-catalog
```

Ứng dụng local: frontend `http://127.0.0.1:5173`, backend `http://localhost:5000`. Các tiến trình có thể cần khởi động lại sau khi đóng máy.
