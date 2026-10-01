import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';

export type Kind = 'tours' | 'hotels' | 'destinations' | 'restaurants';
export const catalogs = {
  restaurants: { endpoint: 'nhahang', title: 'Nhà hàng', heading: 'Một bữa ngon trên đường đi.', description: 'Xem nhà hàng, hình ảnh và chi phí tham khảo để sắp xếp bữa ăn trong hành trình.' },
  tours: { endpoint: 'tour', title: 'Tour du lịch', heading: 'Đi để thêm yêu Việt Nam.', description: 'Khám phá hành trình, xem lịch khởi hành và chọn chuyến đi phù hợp với bạn.' },
  hotels: { endpoint: 'khachsan', title: 'Khách sạn', heading: 'Một chốn dừng chân thật vừa ý.', description: 'Tìm hiểu nơi lưu trú, loại phòng và giá nghỉ trước khi quyết định đặt chỗ.' },
  destinations: { endpoint: 'diadiem', title: 'Điểm đến', heading: 'Việt Nam, còn nhiều điều để khám phá.', description: 'Từ những miền di sản đến cảnh sắc thiên nhiên. Tìm cảm hứng cho hành trình của bạn.' },
};
export type CatalogItem = {
  diemDanhGia?: number; soLuotDanhGia?: number;
  anhDaiDien?: string | null; hinhAnh?: TravelImage[];
  maTour?: number; maKhachSan?: number; maDiaDiem?: number; maNhaHang?: number;
  tenTour?: string; tenKhachSan?: string; tenDiaDiem?: string; tenNhaHang?: string;
  giaMin?: number; giaMax?: number; gioMoCua?: string; gioDongCua?: string;
  moTa?: string; diemKhoiHanh?: string; diemDen?: string; tinhThanh?: string; diaChi?: string;
  soNgay?: number; soDem?: number; giaTour?: number; giaPhongMin?: number; giaVe?: number;
  mienPhi?: boolean;
  loaiLuuTru?: string; soDienThoai?: string; trangThai?: string | boolean;
};
export type Departure = { maKhoiHanh: number; maTour: number; ngayKhoiHanh: string; soChoToiDa: number; soChoDaDat: number; giaApDung: number; trangThai: string };
export type Room = { maLoaiPhong: number; maKhachSan: number; tenLoaiPhong: string; moTa?: string; sucChua: number; soLuongPhong: number; giaMoiDem: number; trangThai: boolean; hinhAnh?: TravelImage[] };
export type TravelImage = { maHinhAnh: number; loaiDoiTuong: string; maDoiTuong: number; duongDan: string; moTa?: string; thuTu: number; nguon?: string; tacGia?: string; giayPhep?: string; urlGiayPhep?: string };
export const itemId = (item: CatalogItem, kind: Kind) => kind === 'tours' ? item.maTour : kind === 'hotels' ? item.maKhachSan : kind === 'restaurants' ? item.maNhaHang : item.maDiaDiem;
export const itemName = (item: CatalogItem) => item.tenTour || item.tenKhachSan || item.tenDiaDiem || item.tenNhaHang || 'Đang cập nhật';
export const itemLocation = (item: CatalogItem) => item.diemDen || item.tinhThanh || item.diaChi || 'Việt Nam';
export const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export function useResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    api.get<T>(url, { signal: controller.signal }).then(response => setData(response.data)).catch(err => { if (!controller.signal.aborted) setError(errorMessage(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [url, version]);
  return { data, loading, error, reload: () => setVersion(v => v + 1) };
}
