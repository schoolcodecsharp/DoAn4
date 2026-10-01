import type { CatalogItem, TravelImage } from './catalog';
import type { ActivityEstimate } from './planner-pricing';
export const eventTypes = {
  DiaDiem: { label: 'Điểm tham quan', kind: 'destinations' },
  KhachSan: { label: 'Khách sạn', kind: 'hotels' },
  NhaHang: { label: 'Nhà hàng', kind: 'restaurants' },
} as const;
export type EventType = keyof typeof eventTypes;
export type PlannedEvent = { key: string; loaiDiaDiem: EventType; maDoiTuong: number; thoiGianBatDau: string; thoiGianKetThuc: string; ghiChu: string; quantity?: number; roomId?: number; nights?: number; rooms?: number; estimate?: ActivityEstimate };
export type SavedEvent = Omit<PlannedEvent, 'key'> & { maChiTiet: number; tenDiaDiem: string; diaChi?: string; hinhAnh: TravelImage[] };
export type EventCatalog = Record<EventType, { data: CatalogItem[] | null; loading: boolean; error: string; reload: () => void }>;
export function eventError(events: PlannedEvent[]) {
  if (events.some(e => !e.thoiGianBatDau || !e.thoiGianKetThuc || e.thoiGianBatDau >= e.thoiGianKetThuc)) return 'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.';
  const sorted = [...events].sort((a, b) => a.thoiGianBatDau.localeCompare(b.thoiGianBatDau));
  return sorted.some((e, i) => i > 0 && e.thoiGianBatDau < sorted[i - 1].thoiGianKetThuc) ? 'Các hoạt động bị trùng giờ. Hãy điều chỉnh thời gian.' : '';
}
