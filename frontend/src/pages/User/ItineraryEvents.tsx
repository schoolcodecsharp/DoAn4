import { useState } from 'react';
import { Link } from 'react-router-dom';
import { itemId, itemName, normalize, type TravelImage } from './catalog';
import { LibraryPhoto } from './Photo';
import './itinerary-events.css';
import { eventTypes, eventError, type EventType, type PlannedEvent, type SavedEvent, type EventCatalog } from './itinerary';
import { EventCost, EventCostEditor } from './PlannerCosts';
import type { ActivityEstimate } from './planner-pricing';
import { money } from '../../lib/api';

function EventPhoto({ images }: { images?: TravelImage[] }) {
  return images?.[0] ? <LibraryPhoto key={images[0].maHinhAnh} photo={images[0]} className="event-photo" /> : <div className="event-no-photo">Ảnh đang được cập nhật</div>;
}
export function SavedEvents({ events }: { events: SavedEvent[] }) {
  return <ol className="event-timeline">{events.map(e => <li key={e.maChiTiet}>
    <p className="event-time">{e.thoiGianBatDau?.slice(0, 5) || 'Chưa chốt giờ'}{e.thoiGianKetThuc && ` – ${e.thoiGianKetThuc.slice(0, 5)}`}</p>
    <div className="event-summary"><EventPhoto images={e.hinhAnh} /><div><span>{eventTypes[e.loaiDiaDiem]?.label}</span><h5><Link to={`/${eventTypes[e.loaiDiaDiem]?.kind}/${e.maDoiTuong}`}>{e.tenDiaDiem}</Link></h5><p>{e.diaChi}</p><p className="preserve-lines">{e.ghiChu}</p><EventCost estimate={e.estimate} saved /></div></div>
  </li>)}</ol>;
}
export default function ItineraryEvents({ events, onChange, catalog, destination, day, date, people, estimates, estimating }: { events: PlannedEvent[]; onChange: (events: PlannedEvent[]) => void; catalog: EventCatalog; destination: string; day: number; date: string; people: number; estimates?: ActivityEstimate[]; estimating: boolean }) {
  const [type, setType] = useState<EventType>('DiaDiem');
  const [query, setQuery] = useState(destination);
  const resource = catalog[type];
  const matches = (resource.data || []).filter(p => p.trangThai !== false && normalize(`${itemName(p)} ${p.tinhThanh || ''} ${p.diaChi || ''}`).includes(normalize(query.trim())));
  const change = (key: string, patch: Partial<PlannedEvent>) => onChange(events.map(e => e.key === key ? { ...e, ...patch } : e));
  const error = eventError(events);
  return <div className="day-events">
    <h3>Hoạt động trong ngày {day}</h3>
    {!events.length && <p>Chọn điểm dừng bên dưới, rồi nhập giờ và việc bạn dự định làm.</p>}
    <ol className="event-timeline">{events.map((e, i) => {
      const selectedResource = catalog[e.loaiDiaDiem];
      const place = selectedResource.data?.find(p => itemId(p, eventTypes[e.loaiDiaDiem].kind) === e.maDoiTuong);
      return <li key={e.key}><div className="event-summary"><EventPhoto images={place?.hinhAnh} /><div><span>{eventTypes[e.loaiDiaDiem].label} · Hoạt động {i + 1}</span><h4>{place ? itemName(place) : selectedResource.loading ? 'Đang tải điểm dừng…' : 'Chưa tìm thấy điểm dừng'}</h4><p>{place?.diaChi}</p>{selectedResource.error && <p role="alert">{selectedResource.error} <button type="button" onClick={selectedResource.reload}>Tải lại điểm dừng</button></p>}{!selectedResource.loading && !selectedResource.error && (!place || place.trangThai === false) && <p className="event-error">Điểm dừng không còn hoạt động. Hãy bỏ hoạt động này và chọn nơi khác.</p>}<button type="button" className="user-text-link" aria-label={`Bỏ hoạt động ${i + 1} ngày ${day}`} onClick={() => onChange(events.filter(a => a.key !== e.key))}>Bỏ hoạt động</button></div></div>
        <div className="event-hours"><label>Giờ bắt đầu<input aria-label={`Giờ bắt đầu hoạt động ${i + 1} ngày ${day}`} required type="time" value={e.thoiGianBatDau} onChange={v => change(e.key, { thoiGianBatDau: v.target.value })} /></label><label>Giờ kết thúc<input aria-label={`Giờ kết thúc hoạt động ${i + 1} ngày ${day}`} required type="time" value={e.thoiGianKetThuc} onChange={v => change(e.key, { thoiGianKetThuc: v.target.value })} /></label></div>
        <label>Nội dung hoạt động<input aria-label={`Nội dung hoạt động ${i + 1} ngày ${day}`} maxLength={500} value={e.ghiChu} placeholder="Ví dụ: Nhận phòng, gửi hành lý hoặc ăn trưa" onChange={v => change(e.key, { ghiChu: v.target.value })} /></label>
        <EventCostEditor event={e} estimate={estimates?.[i]} onChange={patch => change(e.key, patch)} date={date} people={people} label={`hoạt động ${i + 1} ngày ${day}`} loading={estimating} />
      </li>;
    })}</ol>
    {events.length > 0 && error && <p className="event-error" role="status">{error}</p>}
    <details className="event-picker" open={!events.length || undefined}><summary>Thêm điểm dừng · {events.length}/20 hoạt động</summary>
      <div className="event-type-buttons" aria-label="Loại điểm dừng">{Object.entries(eventTypes).map(([key, value]) => <button type="button" key={key} aria-pressed={type === key} onClick={() => setType(key as EventType)}>{value.label}</button>)}</div>
      <label>Tìm theo tên hoặc tỉnh/thành<input type="search" value={query} placeholder="Ví dụ: Hội An, Hà Nội…" onChange={e => setQuery(e.target.value)} /></label>
      {query && <button type="button" className="user-text-link" onClick={() => setQuery('')}>Xem tất cả địa điểm</button>}
      {resource.loading && <p role="status">Đang tải {eventTypes[type].label.toLowerCase()}…</p>}
      {resource.error && <p role="alert">{resource.error} <button type="button" onClick={resource.reload}>Thử lại</button></p>}
      {!resource.loading && !resource.error && !matches.length && <p>Chưa có kết quả. Hãy thử tên khác hoặc xem tất cả địa điểm.</p>}
      <div className="event-options">{matches.slice(0, 12).map(p => <article className="event-option" key={itemId(p, eventTypes[type].kind)}><EventPhoto images={p.hinhAnh} /><div><h4><Link to={`/${eventTypes[type].kind}/${itemId(p, eventTypes[type].kind)}`} target="_blank" rel="noopener noreferrer">{itemName(p)}</Link></h4><p>{p.diaChi || p.tinhThanh}</p><p>{type === 'DiaDiem' ? p.mienPhi ? 'Miễn phí vé vào cửa' : p.giaVe && p.giaVe > 0 ? `${money(p.giaVe)} / vé tham khảo` : 'Chưa cập nhật giá vé' : type === 'NhaHang' ? p.giaMin && p.giaMin > 0 ? `Từ ${money(p.giaMin)} / suất tham khảo` : 'Chưa cập nhật chi phí ăn uống' : 'Chọn để xem loại phòng, giá và phòng còn theo ngày'}</p><button type="button" className="user-button secondary" disabled={events.length >= 20} onClick={() => onChange([...events, { key: crypto.randomUUID(), loaiDiaDiem: type, maDoiTuong: itemId(p, eventTypes[type].kind)!, thoiGianBatDau: '', thoiGianKetThuc: '', ghiChu: '' }])}>Thêm {itemName(p)}</button></div></article>)}</div>
      {matches.length > 12 && <p>Đang hiện 12/{matches.length} kết quả. Nhập tên cụ thể hơn để tìm điểm dừng.</p>}
    </details>
  </div>;
}
