import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { itemId, itemName, normalize, type TravelImage } from './catalog';
import { LibraryPhoto } from './Photo';
import './itinerary-events.css';
import { eventTypes, eventError, type EventType, type PlannedEvent, type SavedEvent, type EventCatalog } from './itinerary';
import { EventCost, EventCostEditor } from './PlannerCosts';
import type { ActivityEstimate } from './planner-pricing';
import { money } from '../../lib/api';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { useEstimates } from './planner-pricing';

function EventPhoto({ images }: { images?: TravelImage[] }) {
  return images?.[0] ? <LibraryPhoto key={images[0].maHinhAnh} photo={images[0]} className="event-photo" /> : <div className="event-no-photo">Ảnh đang được cập nhật</div>;
}
export function SavedEvents({ events }: { events: SavedEvent[] }) {
  return <ol className="event-timeline">{events.map(e => <li key={e.maChiTiet}>
    <p className="event-time">{e.thoiGianBatDau?.slice(0, 5) || 'Chưa chốt giờ'}{e.thoiGianKetThuc && ` – ${e.thoiGianKetThuc.slice(0, 5)}`}</p>
    <div className="event-summary"><EventPhoto images={e.hinhAnh} /><div><span>{eventTypes[e.loaiDiaDiem]?.label}</span><h5><Link to={`/${eventTypes[e.loaiDiaDiem]?.kind}/${e.maDoiTuong}`}>{e.tenDiaDiem}</Link></h5><p>{e.diaChi}</p><p className="preserve-lines">{e.ghiChu}</p><EventCost estimate={e.estimate} saved /></div></div>
  </li>)}</ol>;
}
function ActivityForm({ initial, events, catalog, date, people, onSave, onBack }: { initial: PlannedEvent; events: PlannedEvent[]; catalog: EventCatalog; date: string; people: number; onSave: (event: PlannedEvent) => void; onBack?: () => void }) {
  const [event, setEvent] = useState({ ...initial });
  const resource = catalog[event.loaiDiaDiem];
  const place = resource.data?.find(p => itemId(p, eventTypes[event.loaiDiaDiem].kind) === event.maDoiTuong);
  const estimate = useEstimates(date, people, [{ activities: [event] }]);
  const patch = (values: Partial<PlannedEvent>) => setEvent(old => ({ ...old, ...values }));
  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (event.thoiGianBatDau && event.thoiGianKetThuc && event.thoiGianKetThuc <= event.thoiGianBatDau) errors.thoiGianKetThuc = 'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.';
    if (events.some(e => e.key !== event.key && event.thoiGianBatDau < e.thoiGianKetThuc && event.thoiGianKetThuc > e.thoiGianBatDau)) errors.thoiGianBatDau = 'Thời gian trùng một hoạt động đã có. Hãy chọn khung giờ khác.';
    if (event.loaiDiaDiem === 'KhachSan' && !event.roomId) errors.roomId = 'Chọn loại phòng để dự tính chi phí lưu trú.';
    return errors;
  }
  function submit(e: FormEvent) { e.preventDefault(); onSave(event); }
  return <ValidatedForm className="user-form" onSubmit={submit} validate={validate}>
    {onBack && <button type="button" className="user-text-link" onClick={onBack}>Chọn địa điểm khác</button>}
    <div className="event-summary"><EventPhoto images={place?.hinhAnh} /><div><h3>{place ? itemName(place) : 'Điểm dừng đang được tải'}</h3><p>{place?.diaChi}</p></div></div>
    <div className="event-hours"><label>Giờ bắt đầu<input name="thoiGianBatDau" required type="time" value={event.thoiGianBatDau} onChange={e => patch({ thoiGianBatDau: e.target.value })} /></label><label>Giờ kết thúc<input name="thoiGianKetThuc" required type="time" value={event.thoiGianKetThuc} onChange={e => patch({ thoiGianKetThuc: e.target.value })} /></label></div>
    <label>Nội dung hoạt động<input name="ghiChu" maxLength={500} value={event.ghiChu} placeholder="Ví dụ: Nhận phòng, gửi hành lý hoặc ăn trưa" onChange={e => patch({ ghiChu: e.target.value })} /></label>
    <EventCostEditor event={event} estimate={estimate.days?.[0]?.[0]} onChange={patch} date={date} people={people} label="hoạt động đang sửa" loading={estimate.loading} />
    {estimate.error && <p role="alert">{estimate.error} <button type="button" onClick={estimate.reload}>Kiểm tra lại giá</button></p>}
    <p className="cost-disclaimer">Lưu hoạt động vào bản nháp. Hoàn tất bằng nút Lưu lịch trình; thao tác này không đặt vé, giữ phòng hay đặt bàn.</p>
    <button className="user-button" type="submit" disabled={!place || place.trangThai === false || estimate.loading || Boolean(estimate.error)}>Lưu hoạt động</button>
  </ValidatedForm>;
}

export default function ItineraryEvents({ events, onChange, catalog, destination, day, date, people, estimates, estimating }: { events: PlannedEvent[]; onChange: (events: PlannedEvent[]) => void; catalog: EventCatalog; destination: string; day: number; date: string; people: number; estimates?: ActivityEstimate[]; estimating: boolean }) {
  const [type, setType] = useState<EventType>('DiaDiem');
  const [query, setQuery] = useState(destination);
  const resource = catalog[type];
  const matches = (resource.data || []).filter(p => p.trangThai !== false && normalize(`${itemName(p)} ${p.tinhThanh || ''} ${p.diaChi || ''}`).includes(normalize(query.trim())));
  const [open, setOpen] = useState(false), [editing, setEditing] = useState<PlannedEvent | null>(null), [notice, setNotice] = useState('');
  const save = (event: PlannedEvent) => { const exists = events.some(e => e.key === event.key); onChange(exists ? events.map(e => e.key === event.key ? event : e) : [...events, event]); setOpen(false); setEditing(null); setNotice(exists ? 'Đã cập nhật hoạt động trong bản nháp.' : 'Đã thêm hoạt động vào bản nháp.'); };
  const error = eventError(events);
  return <div className="day-events">
    <h3>Hoạt động trong ngày {day}</h3>
    {!events.length && <p>Thêm điểm dừng, chọn giờ và dự tính chi phí trong biểu mẫu.</p>}
    {notice && <p role="status">{notice}</p>}
    <ol className="event-timeline">{events.map((e, i) => {
      const selectedResource = catalog[e.loaiDiaDiem];
      const place = selectedResource.data?.find(p => itemId(p, eventTypes[e.loaiDiaDiem].kind) === e.maDoiTuong);
      return <li key={e.key}><p className="event-time">{e.thoiGianBatDau || 'Chưa chọn giờ'} – {e.thoiGianKetThuc}</p><div className="event-summary"><EventPhoto images={place?.hinhAnh} /><div><span>{eventTypes[e.loaiDiaDiem].label} · Hoạt động {i + 1}</span><h4>{place ? itemName(place) : selectedResource.loading ? 'Đang tải điểm dừng…' : 'Chưa tìm thấy điểm dừng'}</h4><p>{place?.diaChi}</p><p className="preserve-lines">{e.ghiChu}</p>{selectedResource.error && <p role="alert">{selectedResource.error} <button type="button" onClick={selectedResource.reload}>Tải lại điểm dừng</button></p>}{!selectedResource.loading && !selectedResource.error && (!place || place.trangThai === false) && <p className="event-error">Điểm dừng không còn hoạt động. Hãy bỏ hoạt động này và chọn nơi khác.</p>}<div className="form-dialog-actions"><button type="button" className="user-text-link" aria-label={`Chỉnh sửa hoạt động ${i + 1} ngày ${day}`} onClick={() => { setEditing({ ...e }); setOpen(true); }}>Chỉnh sửa hoạt động</button><button type="button" className="user-text-link" aria-label={`Bỏ hoạt động ${i + 1} ngày ${day}`} onClick={() => { if (window.confirm('Bỏ hoạt động này khỏi bản nháp?')) onChange(events.filter(a => a.key !== e.key)); }}>Bỏ hoạt động</button></div></div></div>
        {estimating ? <p role="status">Đang cập nhật chi phí…</p> : <EventCost estimate={estimates?.[i]} />}
      </li>;
    })}</ol>
    {events.length > 0 && error && <p className="event-error" role="status">{error}</p>}
    <button type="button" className="user-button secondary" disabled={events.length >= 20} onClick={() => { setQuery(destination); setEditing(null); setOpen(true); }}>Thêm hoạt động · {events.length}/20</button>
    {open && <FormDialog wide title={editing ? `${events.some(e => e.key === editing.key) ? 'Chỉnh sửa' : 'Thêm'} hoạt động · Ngày ${day}` : `Chọn điểm dừng · Ngày ${day}`} onClose={() => setOpen(false)}>{editing ? <ActivityForm key={editing.key} initial={editing} events={events} catalog={catalog} date={date} people={people} onSave={save} onBack={events.some(e => e.key === editing.key) ? undefined : () => setEditing(null)} /> : <div className="event-picker">
      <div className="event-type-buttons" aria-label="Loại điểm dừng">{Object.entries(eventTypes).map(([key, value]) => <button type="button" key={key} aria-pressed={type === key} onClick={() => setType(key as EventType)}>{value.label}</button>)}</div>
      <label>Tìm theo tên hoặc tỉnh/thành<input type="search" value={query} placeholder="Ví dụ: Hội An, Hà Nội…" onChange={e => setQuery(e.target.value)} /></label>
      {query && <button type="button" className="user-text-link" onClick={() => setQuery('')}>Xem tất cả địa điểm</button>}
      {resource.loading && <p role="status">Đang tải {eventTypes[type].label.toLowerCase()}…</p>}
      {resource.error && <p role="alert">{resource.error} <button type="button" onClick={resource.reload}>Thử lại</button></p>}
      {!resource.loading && !resource.error && !matches.length && <p>Chưa có kết quả. Hãy thử tên khác hoặc xem tất cả địa điểm.</p>}
      <div className="event-options">{matches.slice(0, 12).map(p => <article className="event-option" key={itemId(p, eventTypes[type].kind)}><EventPhoto images={p.hinhAnh} /><div><h4><Link to={`/${eventTypes[type].kind}/${itemId(p, eventTypes[type].kind)}`} target="_blank" rel="noopener noreferrer">{itemName(p)}</Link></h4><p>{p.diaChi || p.tinhThanh}</p><p>{type === 'DiaDiem' ? p.mienPhi ? 'Miễn phí vé vào cửa' : p.giaVe && p.giaVe > 0 ? `${money(p.giaVe)} / vé tham khảo` : 'Chưa cập nhật giá vé' : type === 'NhaHang' ? p.giaMin && p.giaMin > 0 ? `Từ ${money(p.giaMin)} / suất tham khảo` : 'Chưa cập nhật chi phí ăn uống' : 'Chọn để xem loại phòng, giá và phòng còn theo ngày'}</p><button type="button" className="user-button secondary" disabled={events.length >= 20} onClick={() => setEditing({ key: crypto.randomUUID(), loaiDiaDiem: type, maDoiTuong: itemId(p, eventTypes[type].kind)!, thoiGianBatDau: '', thoiGianKetThuc: '', ghiChu: '' })}>Chọn {itemName(p)}</button></div></article>)}</div>
      {matches.length > 12 && <p>Đang hiện 12/{matches.length} kết quả. Nhập tên cụ thể hơn để tìm điểm dừng.</p>}
    </div>}</FormDialog>}
  </div>;
}
