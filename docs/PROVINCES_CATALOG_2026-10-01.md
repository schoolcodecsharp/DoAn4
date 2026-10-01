# Tỉnh/thành và dữ liệu danh mục — 01/10/2026

## Kết quả tại database đang dùng

- Danh mục TinhThanh có 34 đơn vị; cả 34 có ít nhất một điểm đến, khách sạn, nhà hàng và tour liên kết điểm dừng cùng tỉnh.
- Bổ sung 18 điểm đến, 18 khách sạn, 18 nhà hàng, 18 tour tham khảo, 18 điểm dừng và một loại “Bảo tàng”. Chuẩn hóa 10 bản ghi địa phương, không thay mã cũ.
- Tổng sau nhập: 42 điểm đến, 37 khách sạn, 35 nhà hàng, 37 tour (gồm bản nháp cũ), 79 điểm dừng. Không thêm phòng, đợt khởi hành, giá, đánh giá, ảnh hoặc tài khoản.
- Nguồn và ngày đối chiếu của 72 bản ghi mới nằm trong database/verified-catalog-20261001.json, đồng thời được ghi trong mô tả trên trang chi tiết.
- Tour mới là **gợi ý NVT biên soạn**: một ngày tại địa phương với một điểm đến đã đối chiếu; không phải lịch trình công bố của đơn vị nguồn, không bao gồm xe/ăn/nghỉ, không mở bán. Giờ thực tế phải xác nhận. Capacity 0/0 và không có đợt khởi hành; SQL giá 0 nghĩa là chưa xác nhận, không phải miễn phí.

## Địa giới có phiên bản

Snapshot backend/Data/provinces-20261001.json chứa mã, tên hiện hành, loại, tên cũ và nguồn. Đối chiếu API v2 và nguồn chính thức:

- [Nghị quyết sắp xếp cấp tỉnh năm 2025](https://baochinhphu.vn/nghi-quyet-cua-quoc-hoi-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-102250612191145158.htm).
- [Thành lập thành phố Đồng Nai](https://xaydungchinhsach.chinhphu.vn/nghi-quyet-so-30-2026-qh16-thanh-lap-thanh-pho-dong-nai-119260430102336551.htm), [thành phố Quảng Ninh](https://xaydungchinhsach.chinhphu.vn/thong-qua-nghi-quyet-thanh-lap-thanh-pho-quang-ninh-119260824181004569.htm), [nghị quyết về thành phố Bắc Ninh](https://chinhphu.vn/?classid=1&docid=219328&pageid=27160).
- [API danh mục v2](https://provinces.open-api.vn/api/v2/p/) đối chiếu ngày 01/10/2026: 34 đơn vị, gồm 25 tỉnh và 9 thành phố. 28 tỉnh + 6 thành phố là mốc 2025, không dùng làm số lượng cố định trong UI.

Tên như Hà Giang → Tuyên Quang, Quảng Nam → Đà Nẵng, Thừa Thiên Huế → Huế, Bến Tre → Vĩnh Long được quy đổi. Tìm theo tên cũ lọc toàn tỉnh mới, không suy diễn ranh giới huyện. Địa chỉ gốc và các trường quận/huyện/phường/xã cũ được giữ làm thông tin địa điểm; chưa nâng cấp danh mục cấp xã.

Backend GET /api/provinces đọc bảng SQL, không tải API bên ngoài khi khách sử dụng. ProvinceCatalog dùng cùng snapshot để chuẩn hóa ghi DiaDiem/KhachSan/NhaHang và bộ lọc ?tinh= của DiaDiem/KhachSan; tỉnh không hợp lệ trả 400. Tỉnh trống vẫn được cho phép để tương thích dữ liệu cũ. Admin tra cứu bảng mới tại /admin/provinces; 25/25 bảng được ánh xạ.

## Migration

Không chạy CSDL.sql trên database đang dùng. Dừng backend khi build nếu DLL bị khóa.

    dotnet build tests/AdminSmoke
    dotnet run --no-build --project tests/AdminSmoke -- --upgrade-provinces
    dotnet run --no-build --project tests/AdminSmoke -- --province-coverage

--upgrade-provinces là lệnh ghi: kiểm tra toàn bộ tên cũ trước, lấy advisory lock, sao lưu bằng mysqldump, tạo bảng bổ sung rồi chuẩn hóa/nhập trong transaction. Nếu thiếu độ phủ, rollback phần dữ liệu; bảng rỗng có thể còn vì MySQL DDL implicit commit. Không xóa hoặc khôi phục bản ghi đã ẩn. Chạy lần hai tại máy này: normalized=0, added=[].

Điều kiện: MySQL 8, mysqldump theo đường dẫn Windows trong công cụ, tài khoản admin có sẵn, dữ liệu nền hiện tại đã có 16 tỉnh/thành. Manifest mới chỉ bù 18 nơi còn thiếu; đây không phải bộ seed đủ dùng cho database rỗng. Máy có dữ liệu nền khác sẽ bị chặn nếu thiếu độ phủ thay vì báo thành công giả. Nhập dữ liệu nền đã xác minh theo hướng dẫn trước; không tự sinh dữ liệu để vượt kiểm tra.

Bản sao lưu trước thay đổi: backend/backups/before-provinces-20261001-102943021.sql; lần nhập thành công dùng before-provinces-20261001-103119967.sql. Các backup local/ignored, có dữ liệu riêng tư, không commit. Khôi phục toàn bộ SQL sẽ ghi đè trạng thái sau backup: chỉ làm khi có yêu cầu và đã sao lưu trạng thái hiện tại.

## Kiểm thử và giới hạn

- Backend + AdminSmoke build đạt; frontend build/lint đạt, còn cảnh báo mã cũ.
- node tests/provinces.mjs: API công khai 34 đơn vị, 34 × 4 nhóm, alias API, 72 bản ghi duy nhất/có nguồn, không tồn kho giả, input tỉnh sai bị từ chối; Chromium 1440/390 px, 34 bộ lọc trên từng danh mục, trang chi tiết, admin 25 bảng, retry lỗi API. Không lỗi JavaScript/tràn ngang trong các màn hình đã kiểm tra.
- node tests/account-details.mjs: 14 nhóm hồi quy qua, dùng tài khoản/đơn có sẵn.
- --audit: 25 bảng, 47 khóa ngoại, 0 bản ghi mồ côi, 0 file ảnh lỗi. So sánh INSERT từ backup trước/sau: 17 bảng tài khoản, lịch sử, phòng, đợt khởi hành và ảnh không đổi.
- Chưa có ảnh có quyền sử dụng cho bản ghi mới: UI hiện chỗ trống có nhãn cập nhật, không gán ảnh phong cảnh làm ảnh cơ sở.
- Tour cũ 45/46 vẫn là bản nháp thiếu lịch trình. Tổng 21 tour và 22 điểm đến có dưới hai ảnh (bao gồm các bản ghi vừa thêm). Các dữ liệu mẫu cũ chưa được xác minh toàn bộ; không xem độ phủ 34/34 là chứng nhận mọi thông tin lịch sử đều đúng.
- Chưa kiểm thử thiết bị di động vật lý hoặc tất cả nghiệp vụ ngoài phạm vi; không thêm dịch vụ thanh toán/đặt bàn thực.
