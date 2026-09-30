# Rà soát và hoàn thiện đồ án — 30/09/2026

## Kết luận theo phạm vi hiện tại

Các luồng chính của phiên bản hiện tại đã hoạt động: xem danh mục và ảnh, đăng nhập/phân quyền, đặt tour/phòng, quản trị 23 bảng, nhà hàng trong tour, lịch trình nhiều sự kiện mỗi ngày và quản lý thành viên. Lượt này sửa các lỗi nghiệp vụ và điều hướng được xác nhận; không phải thiết kế lại giao diện hoặc khôi phục mọi tính năng đã chủ động hoàn tác ngày 26/09.

Không kết luận “hoàn thiện 100%” hay “không thể phát sinh lỗi”. Đề cương/chấm điểm của giảng viên chưa được đối chiếu trong lượt này; tiêu chí sử dụng là README, tài liệu nghiệp vụ, route hiện hành và các yêu cầu đã chốt gần đây. Các giới hạn dữ liệu và tính năng còn lại được ghi rõ bên dưới.

## Lỗi đã sửa

1. **Đặt phòng xong mở nhầm tab tour.** `AccountPage` trước đây bỏ qua `tab=hotels`; đã tái hiện bằng Chromium 1440/390 px. Tab hiện lấy từ URL, hỗ trợ tải lại và Back/Forward. Trang xác nhận dẫn về đúng tab của loại đơn.
2. **Form đặt chỗ giữ trạng thái của lựa chọn cũ khi điều hướng trong ứng dụng.** Form được khởi tạo lại theo loại dịch vụ, ID và phòng/đợt khởi hành được chọn trên URL. Đã kiểm tra chuyển phòng cùng route, không reload tài liệu.
3. **Lỗi nhập liệu bị báo như mất kết nối.** HTTP 400, 409, 429 có thông báo phù hợp; dữ liệu form được giữ sau phản hồi lỗi. Nội dung đặt chỗ bỏ thuật ngữ backend không cần thiết với khách.
4. **Thay khách sạn của loại phòng làm sai lịch sử đơn cũ.** Trước đây chỉ xét các đơn còn hoạt động; nay mọi lịch sử đặt phòng đều chặn chuyển khách sạn. API dùng khóa hàng phòng để đồng bộ với đặt chỗ.
5. **Đầu vào có thể vượt kiểu SQL hoặc bị làm tròn âm thầm.** Kiểm tra ngày, giới hạn DECIMAL(15,2), tên/mô tả loại phòng và tổng tiền tính tại server trước khi ghi. Áp dụng vào các API phòng, lịch khởi hành, mã giảm giá, chi phí và tổng đơn liên quan; không tuyên bố toàn bộ field của mọi API đã được chuẩn hóa.
6. **Trạng thái lịch khởi hành thiếu ràng buộc.** Không tạo lịch quá khứ/kết thúc sẵn; không hủy khi còn đơn chưa hủy; không hoàn thành trước ngày cuối hoặc khi còn đơn Pending/Confirmed; không mở lại lịch Cancelled/Completed. Thao tác đóng bán không thay trạng thái kết thúc. Khóa hàng lịch đồng bộ với yêu cầu đặt tour.
7. **Lệnh kiểm thử hiểu `--mode` thành đường dẫn.** Khi không truyền đường dẫn backend, runner tự xác định từ thư mục build. Các lệnh được ghi trong README hiện chạy được từ root.

Impeccable hướng dẫn đợt chỉnh giao diện này tập trung vào trạng thái lỗi, điều hướng và tính rõ ràng; giữ nhận diện và bố cục hiện có. Detector trên các file giao diện đã sửa trả `[]`.

## Bằng chứng kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Build backend + AdminSmoke | Thành công; full build còn 65 cảnh báo nullable cũ, 0 lỗi |
| Frontend build/lint | Thành công; lint còn cảnh báo ở mã legacy/shared hooks |
| `--completion-checks` | 34 kiểm tra mới + 28 `ReviewRegression` đạt |
| `--capacity-checks` | 8 kiểm tra đạt |
| `completion-ui.mjs` | 8 kiểm tra đạt trên Chromium 1440/390 px, không page error |
| `admin-coverage.mjs` | 23 bảng / 24 route, 7 luồng đạt |
| `restaurant-planner.mjs` | 22 kiểm tra đạt, lưu/tải lại sự kiện và ảnh, kiểm tra quyền và giờ chồng chéo |
| `home-polish.mjs` | Desktop/tablet/mobile đạt: header xanh khi cuộn, menu/Escape/focus, ảnh và không tràn ngang |
| `catalog-system-audit.mjs` | 541 lượt HTTP, 174 lượt mở trang qua 2 kích thước; 17 nhóm tỉnh; 0 failures/browserErrors |

Bộ completion API dùng database thật để kiểm tra hai yêu cầu đặt chỗ đồng thời, tổng tiền do server tính, giới hạn phòng/chỗ, phân quyền và cách ly đơn theo chủ tài khoản. Hồi quy thanh toán bao gồm chống thu vượt tổng đơn, mã giao dịch trùng, trạng thái cuối và đơn đã hủy. Bài UI gửi đơn phòng thật trên fixture; riêng phản hồi HTTP 400 được mô phỏng để kiểm tra trải nghiệm lỗi, sau đó gửi lại qua API thật.

Tất cả dùng tài khoản SQL sẵn có; không tạo/đổi mật khẩu/khóa tài khoản của người dùng. Fixture gắn nhãn độc nhất và được dọn trong `finally`; nhật ký admin còn lại theo thiết kế. Kiểm tra SQL ban đầu: 23 bảng, 41 khóa ngoại, 0 bản ghi mồ côi, không lệch bộ đếm chỗ và không thiếu file ảnh đang tham chiếu.

Đối soát sau tất cả bài test: vẫn 7 tài khoản, 3 đơn tour, 2 đơn phòng, 19 khách sạn, 8 loại phòng, 19 tour, 32 lịch khởi hành và 225 ảnh như ban đầu; không có bản ghi mồ côi/lệch chỗ/thiếu file ảnh. Nhật ký admin tăng từ 473 lên 590 do thao tác kiểm thử. `git diff --check` đạt. 541/174 là lượt gọi/lượt mở, không phải số endpoint hay số trang độc lập.

## Phần còn giới hạn

- **Danh mục và dữ liệu thật:** 17 nhóm tỉnh có đủ tối thiểu một dịch vụ ở mỗi nhóm điểm đến/khách sạn/nhà hàng/tour liên quan; độ phủ bao gồm dữ liệu cũ. Chỉ 27 bản ghi mới ở lượt trước có nguồn đối chiếu được ghi rõ. Chưa xác minh lại toàn bộ dữ liệu mẫu cũ.
- **Ảnh và khả năng phục vụ:** một số mục mới chưa có ảnh có quyền sử dụng, phòng và lịch khởi hành xác nhận. Không điền giả để làm đầy giao diện. Hai tour cũ đang ẩn (45, 46) chưa đủ lịch trình. Đây vẫn là việc cần bổ sung bằng dữ liệu đã xác minh.
- **Cập nhật tiếp ngày 30/09:** đánh giá/bình luận phía khách đã được triển khai và kiểm thử sau báo cáo này; xem [báo cáo feedback](FEEDBACK_2026-09-30.md). Chức năng yêu thích phía khách vẫn chưa hoàn thiện. Các số liệu 23 bảng/41 khóa ngoại ở trên là trước migration feedback, không phải schema mới.
- **Mã giảm giá:** đang quản lý cấu hình ở admin, chưa áp mã vào đơn đặt. **Thanh toán:** ghi nhận thủ công, chưa có cổng thanh toán hay hoàn tiền thực.
- **Kiểm định:** chưa kiểm tra thiết bị thật/Safari/Firefox, tải lớn, đầy đủ accessibility, tất cả nhánh CRUD, cài mới trên một máy khác hoặc toàn bộ báo cáo Word/sơ đồ để chấm điểm. Kiểm tra đồng thời chỉ gồm các ca đã mô tả, không phải stress test tổng quát.

Các giới hạn trên cần được nêu đúng khi thuyết trình. Bản đang chạy có thể dùng để trình diễn các luồng đã kiểm thử; để khẳng định đạt toàn bộ đề cương, cần đối chiếu thêm tiêu chí chấm và dữ liệu dịch vụ còn thiếu.

## Chạy lại

Xem README phần kiểm thử bằng tài khoản sẵn có. Ứng dụng local: `http://127.0.0.1:5173`; backend: `http://localhost:5000`. Log và ảnh kiểm tra ở `.local/`, được gitignore. Đợt này không nhập lại database và không thay dữ liệu dịch vụ thật.
