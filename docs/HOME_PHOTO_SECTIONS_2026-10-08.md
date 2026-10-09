# Hai khu vực ảnh trên trang chủ — 2026-10-08

## Phạm vi và kết luận

Đã hoàn thành phần mở rộng trong hệ thống giao diện NVT hiện có: khu vực giới thiệu bốn dịch vụ và lời mời khám phá tour ở cuối trang chủ. Người dùng xác nhận: **“Mô tả ngắn, ưu tiên ảnh và khoảng thoáng.”** Bản hiện tại dùng ảnh thật, mô tả tiếng Việt ngắn và bố cục có khoảng nghỉ; các hành động tiếp tục dẫn đến `/tours`, `/hotels`, `/restaurants` và `/planner`.

Reviewer Impeccable độc lập kết luận **`disposition: ship`**, **`material_fixes: None`** cho hai khu vực này. Báo cáo đủ năm phần ở [finish-review.md](../.impeccable/review/home-photo-20261008/finish-review.md). Kết luận dựa trên 30 ảnh chụp hợp lệ ở năm độ rộng; không phải chứng nhận chất lượng toàn ứng dụng hoặc kiểm tra Safari/thiết bị thật.

Đây là thay đổi bố cục cục bộ trong thế giới xanh rừng/nền giấy/EuclidSquare, không phải thay thế nhận diện. Hợp đồng hướng thiết kế nằm ở [surface brief](../.impeccable/surfaces/frontend-src-pages-home-homepage-tsx.md). Không có comp được duyệt hoặc QUALITY BAR riêng cho phần mở rộng này. Không tạo hay sửa `DESIGN.md`, `PRODUCT.md`, `.impeccable/design.json` hoặc cấu hình Impeccable.

## Đối chiếu hệ thống kế thừa và phần đã đổi

| Khía cạnh | Bằng chứng kế thừa | Phần mở rộng hiện tại |
| --- | --- | --- |
| Màu và chất liệu | `experience.css` định nghĩa xanh rừng `#284b41`, nền giấy `#f1efdf`, bề mặt `#fffef8`; trang chủ đã dùng ảnh cạnh vuông và liên kết biên tập. | Khu dịch vụ vẫn là mảng xanh rừng; phần chốt ghép phong cảnh với panel kem xanh `#e5e9d9`. Không thêm thế giới màu, bóng nổi hoặc chất liệu giả. |
| Chữ | `index.css` nạp EuclidSquare Light/Regular/Medium; `home.css` dùng EuclidSquare, Arial, sans-serif. | Mô tả 16px; nhãn hành động 15px/500; tiêu đề dịch vụ 32px, giảm theo bố cục nhỏ. Tiêu đề khu dịch vụ và phần chốt đạt 36–56px và 32–56px. Giữ nét chữ nhẹ và dấu tiếng Việt; không thêm font. |
| Bố cục dịch vụ | Các tuyến dịch vụ vốn đã có trong trang chủ; bản trước được ghi nhận là các hàng chữ trên nền xanh. | Tour với ảnh cao ở trái; khách sạn với ảnh rộng ở phải; nhà hàng có ảnh và chữ nhỏ hơn; lịch trình riêng trải ngang phía dưới. Khoảng cách 44px/64px ở bố cục lớn, không lặp bốn hộp giống nhau. |
| Kết thúc trang | Bản trước có lời mời xem tour, phía sau bộ ảnh điểm đến. | Ảnh Tràng An lớn cạnh lời mời ngắn, nút “Khám phá tour” và liên kết “Tự lên lịch trình”. Caption và đường dẫn nguồn ảnh nằm dưới ảnh, không đè lên phong cảnh. |
| Tương tác và đáp ứng | Liên kết thật, mũi tên SVG, focus bàn phím, ảnh lazy, reduced motion và slideshow hiện có. | Giữ các quy tắc này. Dưới 760px, thứ tự đọc dịch vụ và phần chốt thành một cột chính; ở 820px ảnh/nhà hàng thích ứng trong cột phải. Hover chỉ đổi màu/gạch dưới, không zoom ảnh. |

Năm dòng hệ thống sau khi đối chiếu:

1. Bảng màu giữ xanh rừng, giấy ấm và kem sáng; ảnh là nội dung chủ đạo.
2. EuclidSquare giữ cấp chữ nhẹ ở tiêu đề, 16px ở mô tả và 15px/500 ở hành động dịch vụ.
3. Ảnh cạnh vuông, bề mặt phẳng và khoảng trống tổ chức thứ bậc, thay vì bóng hoặc hộp trang trí.
4. Bố cục bất đối xứng làm rõ tour/khách sạn/ẩm thực/lịch trình; bố cục nhỏ giữ thứ tự đọc và hành động.
5. Liên kết, mũi tên SVG, focus rõ và hành động tối thiểu 44px nối phần mở rộng với trang chủ hiện có.

Hero mở đầu, header xanh, các nút số 1–2–3, thời gian crossfade/autoplay, trang chuyển tiếp và footer giữ hành vi hiện tại. Không đổi route, hợp đồng API, auth, SQL, giá, tồn phòng hoặc ngày khởi hành. Ảnh biên tập không đại diện cho tình trạng còn chỗ.

## Mã nguồn và sự thật nội dung

- [HomePage.tsx](../frontend/src/pages/Home/HomePage.tsx) render các ảnh, caption, mô tả và hành động bằng dữ liệu cục bộ; `HomePhoto` giữ alt mô tả, `loading="lazy"`, `decoding="async"` và fallback có chữ khi ảnh lỗi.
- [home.css](../frontend/src/pages/Home/home.css) sở hữu bố cục hai khu vực, điểm chuyển 1100/760px, focus và reduced motion; thay đổi nằm trong selector của trang chủ.
- [homeContent.ts](../frontend/src/pages/Home/homeContent.ts) cung cấp `homeServices`, `homeClosingPhoto` và `homeEditorialImages`; các chọn ảnh này không phụ thuộc thứ tự API hoặc dữ liệu tồn chỗ.
- [ImageCreditsPage.tsx](../frontend/src/pages/User/ImageCreditsPage.tsx) kết hợp credit biên tập với thư viện API, deduplicate theo URL và mức đầy đủ của attribution. Credit bún chả cục bộ vẫn hiện nếu API chưa có dữ liệu hoặc lỗi tải; loading/error/retry của thư viện được giữ.

Ảnh nhà hàng là **“Bún chả Hà Nội · Ảnh minh họa ẩm thực”**, không gắn với một nhà hàng cụ thể. Ảnh khách sạn được ghi là mặt tiền Hotel Continental Saigon. Dòng chú thích chung nói rõ ảnh giới thiệu điểm đến, nơi lưu trú và ẩm thực, không cam kết dịch vụ hay tình trạng còn chỗ. Lịch trình riêng nêu đăng nhập để lưu; không thêm lời hứa đặt bàn hoặc khả năng chưa có trong sản phẩm.

## Ảnh và nguồn gốc

Các tác giả/giấy phép dưới đây được đối chiếu với sidecar cục bộ và `homeContent.ts`. Ảnh được phục vụ qua `/media`; trang không tải trực tiếp từ Wikimedia khi người dùng xem.

| Vị trí / ảnh | Tác giả / giấy phép | Nguồn và metadata |
| --- | --- | --- |
| Tour — `/media/library/ha-long-83214199.jpg` | Taewangkorea / CC BY-SA 4.0 | [Ha Long Bay from Titov Island](https://commons.wikimedia.org/wiki/File:Ha_Long_Bay_from_Titov_Island.jpg); [sidecar](../backend/Data/photo-sources/ha-long-83214199.jpg.source.json) |
| Khách sạn — `/media/catalog-20261001/continental-182311159.jpg` | nakashi / CC BY-SA 2.0 | [Hotel Continental Saigon](https://commons.wikimedia.org/wiki/File:Hotel_Continental_Saigon_(53854035740).jpg); [sidecar](../backend/Data/photo-sources/continental-182311159.jpg.source.json) |
| Ẩm thực — `/media/home-editorial-20261008/bun-cha-hanoi.jpg` | Weetjesman / CC BY-SA 4.0 | [Bun cha Hanoi](https://commons.wikimedia.org/wiki/File:Bun_cha_Hanoi.jpg); [sidecar mới](../backend/Data/photo-sources/bun-cha-hanoi.source.json) |
| Lịch trình — `/media/coverage-20261002/destination-112-121361148.jpg` | Shyamal / CC BY-SA 4.0 | [View from Hang Mua](https://commons.wikimedia.org/wiki/File:View_from_Hang_Mua.jpg); [sidecar](../backend/Data/photo-sources/destination-112-121361148.jpg.source.json) |
| Phần chốt — `/media/library/ninh-binh-145501694.jpg` | Jakub Hałun / CC BY 4.0 | [Tràng An Landscape Complex](https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1433_5283.jpg); [sidecar](../backend/Data/photo-sources/ninh-binh-145501694.jpg.source.json) |

Chỉ ảnh bún chả là raster mới: bản thumbnail Wikimedia chính thức 1280×721, 268.878 byte. File mang comment JPEG về nguồn/tác giả/giấy phép; sidecar giữ cả `DownloadedSha256` và SHA-256 sau khi nhúng provenance. Không có ảnh AI hoặc chỉnh sửa nội dung pixel.

Ba ảnh có sẵn — Continental, Hang Múa và Tràng An — chỉ được thêm comment JPEG về nguồn gốc. Sidecar giữ `OriginalSha256` và cập nhật `Sha256`; kiểm tra của agent ảnh xác nhận bỏ comment khôi phục đúng hash gốc, không đổi pixel. Hạ Long tiếp tục dùng raster và attribution hiện có. Agent ảnh xác nhận bốn file có thay đổi trả HTTP 200, hash và metadata khớp. Các đường dẫn và credit công khai tiếp tục ở `/image-credits`; không thêm bản ghi ảnh vào SQL.

## Kiểm tra và bằng chứng

Các kết quả thực thi dưới đây do agent hoàn thiện/agent ảnh báo lại. Documenter đã đọc mã nguồn hiện tại, token nền, tài liệu kế thừa, surface brief, năm sidecar nguồn ảnh, mã kiểm tra mới và báo cáo reviewer; không chạy thêm một vòng browser, detector hoặc chỉnh sửa UI.

| Kiểm tra | Kết quả và phạm vi |
| --- | --- |
| `npm run build` trong `frontend` | PASS. |
| `npm run lint` trong `frontend` | Exit 0, còn cảnh báo có sẵn ở các phần khác; không gọi đây là lint sạch. |
| Impeccable detector cuối trên bốn target UI | Exit 0, trả `[]`; chạy một lần ở cuối, không có hook hoạt động. |
| `node tests/home-photo-sections.mjs` | PASS 7 nhóm: 1853/1440/820/390/320px; năm ảnh lazy có alt và decode; bốn tuyến dịch vụ, CTA tour, focus/kích thước hành động/overflow; ảnh bị chặn vẫn có fallback và link; credit bún chả đúng tác giả, giấy phép và nguồn. Không có page error hoặc API mutation được thử. |
| `node tests/home-fullscreen.mjs --no-capture` | PASS 6 nhóm hồi quy hero/header/menu/footer/autoplay/reduced motion/retry/credit. Chỉ cập nhật selector nhãn lịch trình cũ thành “Lên kế hoạch chuyến đi”, route vẫn `/planner`. |
| `node tests/catalog-enrichment.mjs --photos-only` | PASS 40 file; kiểm tra media, không nhập SQL. |
| `node tests/photo-coverage.mjs --photos-only` | PASS 36 file; kiểm tra media, không nhập SQL. |

Bộ bằng chứng cuối nằm trong thư mục ignored [home-photo-20261008](../.impeccable/review/home-photo-20261008/). Năm prefix là `desktop` (1440px), `user` (1901px), `tablet` (820px), `mobile` (390px) và `compact` (320px), mỗi prefix có sáu ảnh:

- `*-services.png` / `*-cta.png`: đầy đủ từng khu vực để kiểm tra ảnh, chữ và khoảng cách.
- `*-booking-services-viewport.png` / `*-booking-cta-viewport.png`: viewport cuộn ở layout thật.
- `*-hero.png`: viewport mở đầu ở layout thật, xác nhận sự liên tục với phần kế thừa.
- `*-full.png`: toàn trang từ đầu; chỉ mở rộng scroll host lồng nhau để chụp, không phải thay đổi mã sản phẩm.

Reviewer đã mở cả 30 ảnh và xác nhận bằng chứng hợp lệ. Báo cáo đánh giá TYPE/MATERIAL/GROUND/THESIS/STORY/FIRST VIEWPORT khớp; đáp ứng tablet/mobile là thích ứng hợp lệ. Ở 320px nhãn nhà hàng xuống dòng trong vùng thao tác và không va chạm. Reviewer kết luận mức hoàn thiện đã đạt mục tiêu hai khu vực với ảnh, khoảng thoáng và nội dung ngắn; không yêu cầu sửa vật chất nào.

## Sai lệch lịch sử và giới hạn

`PRODUCT.md` vẫn chứa quyết định mở lịch sử “Homepage composition awaits approval of three visual mockups”. `docs/UI_CONTEXT.md` ghi bằng chứng và sở thích tại thời điểm 2026-09-23; nó không phải phỏng vấn sản phẩm Impeccable đã xác nhận và không phản ánh mọi quyết định sau đó. Các báo cáo trang chủ 2026-10-02 còn mô tả một số trạng thái lịch sử như thumbnail/header trong suốt, đã được các follow-up thay thế. `DESIGN.md` và `.impeccable/design.json` toàn cục vẫn vắng mặt. Những lệch thời gian/thiếu tài liệu này đã có trước và được báo lại, không sửa như tác dụng phụ của phần mở rộng.

Kicker có sẵn trên trang credit không được thiết kế lại hoặc đưa thành quy tắc cho hệ thống; hai khu vực mới không có kicker/eyebrow. Không canonize các phần ngoài brief vào hệ thống trang chủ. Toàn bộ file kế thừa và thay đổi không liên quan của người dùng được giữ nguyên.

Giới hạn xác minh: Chromium cục bộ và các viewport nêu trên; không phải toàn ứng dụng, cross-browser, Safari, thiết bị thật hoặc audit khả năng tiếp cận toàn diện. Các check focus/hit area/alt/overflow không thay thế kiểm thử người dùng hay screen reader. Đợt này không đổi hoặc khởi tạo database; không commit/push Git.

Kết luận cuối: **ship cho hai khu vực ảnh trên trang chủ**, theo bản hiện tại và phạm vi review nêu trên. Tài liệu so sánh hoàn tất; hệ thống toàn cục được bảo toàn theo ranh giới phần mở rộng thông thường của Impeccable.
