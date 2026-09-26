# Database WebDuLich

- `CSDL.sql`: khởi tạo schema, có DROP DATABASE; chỉ dùng khi cài mới trên dữ liệu có thể bỏ.
- `data_mau.sql`: bộ dữ liệu mẫu ban đầu.
- `migrations/`: thay đổi schema cho database đã tồn tại; đọc hướng dẫn từng migration trước khi áp dụng.
- `checks/`: SQL kiểm tra ảnh.

Các script sửa dữ liệu lịch sử đã được chuyển sang `archive/sql/`.
Sao lưu local ở `backend/backups/`; không di chuyển hoặc reset dữ liệu MySQL khi sắp xếp thư mục.
Xem [README dự án](../README.md) để chạy và nhập catalog mở rộng.
