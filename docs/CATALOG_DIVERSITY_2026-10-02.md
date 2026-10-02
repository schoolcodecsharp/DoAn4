# Bổ sung dữ liệu đa dạng — 02/10/2026

## Kết quả trên database local

| Bảng | Trước | Thêm | Sau |
| --- | ---: | ---: | ---: |
| DiaDiem | 54 | 22 | 76 |
| KhachSan | 45 | 10 | 55 |
| NhaHang | 35 | 10 | 45 |
| Tour | 45 | 12 | 57 |
| TourChiTiet | 95 | 44 | 139 |
| HinhAnh | 293 | 28 | 321 |

Tổng 126 bản ghi mới trong 6 bảng. Số tổng bao gồm dữ liệu cũ/không hoạt động, không phải số dịch vụ đang mở bán. 28 dòng HinhAnh là liên kết lại 28 file đã có giấy phép của đúng điểm dừng vào tour mới, **không phải 28 ảnh mới tải**. Không gán ảnh phong cảnh làm ảnh khách sạn hoặc nhà hàng.

Có dữ liệu mới ở 13 tỉnh/thành: An Giang, Đà Nẵng, Gia Lai, Hà Nội, Hồ Chí Minh, Huế, Khánh Hòa, Lâm Đồng, Lào Cai, Ninh Bình, Phú Thọ, Quảng Ninh, Thanh Hóa. Danh mục 34 tỉnh/thành không thay đổi. Nhóm trải nghiệm có rừng/vườn quốc gia, biển/đảo, ruộng bậc thang, làng nghề, di tích và bảo tàng; lưu trú có khách sạn, resort và ecolodge.

## Nguồn và giới hạn

Dataset `database/catalog-diversity-20261002.json` ghi nguồn HTTPS, ngày đối chiếu và mô tả ngắn cho từng mục. Nguồn cũng được lưu trong mô tả công khai:

- Điểm đến: [Vietnam Tourism về Ninh Bình](https://vietnam.travel/node/1535), [vườn quốc gia](https://www.vietnam.travel/things-to-do/7-amazing-national-parks-vietnam), [Mai Châu](https://vietnam.travel/places-to-go/northern-vietnam/mai-chau), [Côn Đảo](https://www.vietnam.travel/things-to-do/your-beach-break-guide-con-dao), [Bảo tàng Dân tộc học](https://vme.org.vn/en), cùng các trang cụ thể trong dataset.
- Cơ sở lưu trú/ăn uống: website chính thức của Anantara, Avani, Six Senses, Victoria, Silk Path, Accor, Marriott và Mai Chau Ecolodge. Ví dụ [Anantara Hội An](https://www.anantara.com/en/hoi-an/restaurants/hoi-an-riverside), [Silk Path Huế](https://silkpathhotel.com/dininghue/), [JW Marriott Hanoi](https://www.marriott.com/en-us/hotels/hanjw-jw-marriott-hotel-hanoi/dining/).
- Tên tỉnh/thành dùng registry đang có của dự án; địa danh trong nguồn cũ có thể là tên trước sắp xếp. Vườn Cúc Phương được ghi rõ khu vực Ninh Bình, không coi toàn bộ vườn chỉ thuộc một tỉnh.
- Địa chỉ chỉ ghi đến mức nguồn xác minh được; không bịa số nhà, tọa độ, điện thoại, giờ mở cửa hay hạng sao.
- Chưa nhập ảnh cho 42 mục địa điểm/cơ sở mới khi chưa xác minh ảnh và quyền sử dụng; giao diện giữ trạng thái đang cập nhật. Không sao chép ảnh thương mại từ website cơ sở.
- Không thêm loại phòng, số phòng trống, ngày khởi hành, giá giao dịch, tài khoản, đơn, thanh toán hoặc đánh giá giả.

12 tour là **gợi ý do NVT biên soạn**, gồm 10 lịch trình hai ngày và 2 lịch trình một ngày. 10 tour hai ngày liên kết cả điểm đến, một lựa chọn lưu trú và một nhà hàng bằng khóa ngoại thực tế. Thứ tự là đề xuất, không phải chương trình chính thức của cơ sở. Không ấn định giờ, không đặt dịch vụ, không cam kết chi phí/vận chuyển hoặc khả năng tiếp nhận. Với đảo/vịnh/rừng, cần xác nhận điều kiện tiếp cận và hoạt động. Giá SQL 0 là chưa có báo giá, không phải miễn phí; điểm đến mới đều MienPhi=false.

## Nhập an toàn và tái lập

- Công cụ: `tests/AdminSmoke/CatalogDiversity.cs`; dùng lại hàm backup của `CatalogEnrichment`.
- Khóa nhập dùng chung `nvt_verified_catalog`; backup thành công mới bắt đầu transaction. Kiểm tra tỉnh, nguồn, loại dữ liệu, nhóm điểm đến, ngày tour và các điểm dừng trước/ trong giao dịch.
- Chỉ INSERT vào 6 bảng trong bảng trên. Fingerprint mọi bản ghi đã tồn tại ở 25 bảng trước/sau nhập trong transaction; bảng ngoài danh mục không được tăng số dòng.
- So khớp tên + tỉnh, phát hiện kết quả mơ hồ và bỏ qua tour đã tồn tại; không sửa lịch trình tour cũ.
- Bản backup trước đợt nhập: `backend/backups/before-enrichment-20261002-162645036.sql` (343580 byte, local/ignored). Bản backup khi kiểm chứng chạy lại: `backend/backups/before-enrichment-20261002-162900583.sql`. Không đưa các file chứa dữ liệu tài khoản lên Git.
- Không dùng `database/CSDL.sql` để nhập vào database đang có.

Từ thư mục gốc:

```powershell
dotnet build tests/AdminSmoke --no-restore -p:BuildProjectReferences=false
dotnet run --no-build --project tests/AdminSmoke -- --check-diversity
dotnet run --no-build --project tests/AdminSmoke -- --diversify-catalog
node tests/catalog-diversity.mjs
```

BuildProjectReferences=false dùng khi backend hiện tại đã được build, tránh chép đè executable đang chạy. Trên máy mới cần build backend/phụ thuộc trước. Hai chế độ --check-diversity và bài Node chỉ đọc; --diversify-catalog là lệnh ghi có chủ đích. Bộ dữ liệu cần schema tỉnh/planner hiện tại và các điểm dừng nền đã có; không phải seed database trắng.

## Kiểm chứng đã chạy

- Build importer: đạt, một cảnh báo nullable có sẵn trong CatalogExpansion.cs, không thuộc mã mới.
- Nhập lần đầu: thêm đúng số dòng trên, existingTablesPreserved=25, missing=[].
- Chạy lại: added={}, tổng không đổi, existingTablesPreserved=25.
- `node tests/catalog-diversity.mjs`: 42 địa điểm/cơ sở và 12 tour xuất hiện duy nhất, đúng tỉnh/nguồn, 44 hoạt động đúng FK/ngày/thứ tự, chưa có phòng hoặc đợt khởi hành giả, không thêm sao đánh giá, 28 URL ảnh trả thành công.
- Chromium: 108 lượt mở chi tiết tại desktop 1440px và mobile 390px; tiêu đề/lịch trình hiện đúng, liên kết điểm dừng đúng loại, không tràn ngang, không có lỗi JavaScript hoặc API 5xx thu được.
- Đây là kiểm thử gói dữ liệu và các trang liên quan, không phải chứng nhận mọi API, mọi trình duyệt hoặc toàn bộ nghiệp vụ đặt chỗ.
