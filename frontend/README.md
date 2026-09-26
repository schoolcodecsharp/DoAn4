# Frontend NVT Du lịch

Hướng dẫn cài đặt, database và kiểm thử: [README dự án](../README.md).

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
npm run build
npm run lint
```

Backend phải chạy cổng 5000. Vite proxy `/api` và `/media` đến backend.
Các trang đang dùng được khai báo trong `src/App.tsx`; một số trang cũ vẫn được giữ trong repository và còn cảnh báo lint, không phải tuyến giao diện hiện tại.
