import { Link } from 'react-router-dom';
import { dateLabel, money } from '../../lib/api';
import type { PlannedEvent } from './itinerary';
import { costRange, dayDate, type ActivityEstimate } from './planner-pricing';

export function CostLedger({ days, budget, people, saved = false, endDate }: { days: (ActivityEstimate | undefined)[][]; budget: number; people: number; saved?: boolean; endDate?: string }) {
  const all = days.flat();
  const known = all.filter((q): q is ActivityEstimate => q?.minTotal != null);
  const min = known.reduce((sum, q) => sum + (q.minTotal ?? 0), 0);
  const max = known.reduce((sum, q) => sum + (q.maxTotal ?? 0), 0);
  const unknown = all.length - known.length;
  const unavailable = all.filter(q => q?.available === false).length;
  const extended = endDate && all.some(q => q?.checkout && q.checkout.slice(0, 10) > endDate.slice(0, 10));
  return <section className="cost-ledger" aria-label="Dự toán chuyến đi">
    <h2>{saved ? 'Dự toán khi lưu' : 'Dự toán chuyến đi'}</h2>
    <p>{all.length ? `${known.length}/${all.length} hoạt động có giá` : 'Thêm hoạt động để bắt đầu tính chi phí.'}</p>
    <strong className="cost-grand-total">{known.length ? costRange(min, max) : 'Chưa có dự toán'}</strong>
    {!!known.length && <p>Khoảng {costRange(Math.ceil(min / people), Math.ceil(max / people))} / người</p>}
    <dl>{days.map((entries, i) => <div key={i}><dt>Ngày {i + 1}</dt><dd>{entries.some(q => q?.minTotal != null)
      ? costRange(entries.reduce((s, q) => s + (q?.minTotal ?? 0), 0), entries.reduce((s, q) => s + (q?.maxTotal ?? 0), 0)) : entries.length ? 'Chưa có giá' : 'Chưa có hoạt động'}{entries.some(q => q?.minTotal == null) && ' · chưa đủ'}</dd></div>)}</dl>
    {!!unknown && <p className="cost-warning">Còn {unknown} hoạt động chưa có giá. Tổng trên chưa bao gồm các khoản này.</p>}
    {!!unavailable && <p className="cost-warning">{unavailable} lựa chọn lưu trú không đủ phòng hoặc sức chứa {saved ? 'tại lúc lưu' : 'tại lúc kiểm tra'}. Chi phí vẫn được liệt kê để bạn so sánh.</p>}
    {extended && <p className="cost-warning">Có kỳ lưu trú kết thúc sau ngày cuối lịch trình. Hãy thêm ngày hoặc điều chỉnh ngày trả phòng. Toàn bộ chi phí kỳ ở được tính vào ngày nhận phòng.</p>}
    <div className="cost-budget"><span>Ngân sách của bạn</span><strong>{budget > 0 ? money(budget) : 'Chưa đặt ngân sách'}</strong></div>
    {budget > 0 && known.length > 0 && <p className={max > budget ? 'cost-warning' : ''}>{max > budget ? `Dự toán cao nhất vượt ${money(max - budget)}.` : `Còn ${money(budget - max)} so với dự toán cao nhất.`}{unknown > 0 && ' Chưa tính những khoản thiếu giá.'}</p>}
    <p className="cost-disclaimer">Chưa gồm di chuyển, mua sắm và chi phí ngoài các hoạt động đã chọn. Đây không phải số tiền đã thanh toán.</p>
  </section>;
}

export function EventCost({ estimate: q, saved = false }: { estimate?: ActivityEstimate; saved?: boolean }) {
  if (!q) return <p className="cost-disclaimer">Chưa có dự toán cho hoạt động này.</p>;
  return <div className="event-cost">
    <strong>{q.minTotal == null ? 'Chưa có giá' : q.free ? 'Miễn phí vé vào cửa' : costRange(q.minTotal, q.maxTotal ?? q.minTotal)}</strong>
    {q.unitMin != null && !q.free && <p>{costRange(q.unitMin, q.unitMax ?? q.unitMin)} / {q.unit}{q.roomId ? ` × ${q.rooms} phòng × ${q.nights} đêm` : ` × ${q.quantity} ${q.unit}`}</p>}
    {q.roomId && <p>{q.roomName} · {dateLabel(q.checkin!)} đến {dateLabel(q.checkout!)} · {q.quantity} khách</p>}
    {q.capacity != null && <p>Tối đa {q.capacity} khách / phòng.</p>}
    {saved ? <p className="cost-disclaimer">Dự toán lưu ngày {dateLabel(q.checkedAt)}. Giá và phòng trống hiện tại có thể thay đổi.{q.available === false && ' Lựa chọn này chưa đủ phòng/sức chứa khi lưu.'}</p>
      : <><p className={q.available === false ? 'cost-warning' : 'cost-disclaimer'}>{q.message}{q.availableRooms != null && ` Còn ${q.availableRooms} phòng cho toàn kỳ ở.`}</p>{q.roomId && <p className="cost-disclaimer">Kiểm tra lúc {new Date(q.checkedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}, ngày {dateLabel(q.checkedAt)}.</p>}</>}
  </div>;
}

export function EventCostEditor({ event, estimate, onChange, date, people, label, loading }: {
  event: PlannedEvent; estimate?: ActivityEstimate; onChange: (patch: Partial<PlannedEvent>) => void; date: string; people: number; label: string; loading: boolean;
}) {
  const hotel = event.loaiDiaDiem === 'KhachSan';
  const nights = event.nights ?? 1;
  return <div className="event-cost-editor">
    <div className="event-hours">
      <label>{hotel ? 'Số khách lưu trú' : event.loaiDiaDiem === 'DiaDiem' ? 'Số vé' : 'Số suất dự kiến'}<input aria-label={`Số lượng ${label}`} type="number" min={1} max={100} required value={event.quantity ?? people} onChange={e => onChange({ quantity: Number(e.target.value) })} /></label>
      {hotel && <label>Số phòng<input aria-label={`Số phòng ${label}`} type="number" min={1} max={100} required value={event.rooms ?? 1} onChange={e => onChange({ rooms: Number(e.target.value) })} /></label>}
    </div>
    {hotel && <>
      <p>Nhận phòng: <strong>{dateLabel(date)}</strong> (ngày của hoạt động). Đổi ngày bắt đầu chuyến đi hoặc chuyển hoạt động sang ngày khác để đổi ngày nhận phòng.</p>
      <div className="event-hours"><label>Ngày trả phòng<input aria-label={`Ngày trả phòng ${label}`} type="date" required min={dayDate(date, 1)} max={dayDate(date, 30)} value={dayDate(date, nights)} onChange={e => onChange({ nights: Math.round((Date.parse(e.target.value) - Date.parse(date)) / 86400000) || 1 })} /></label>
      <label>Loại phòng<select aria-label={`Loại phòng ${label}`} value={event.roomId || ''} onChange={e => onChange({ roomId: Number(e.target.value) || undefined })} disabled={loading}>
        <option value="">Chọn loại phòng</option>
        {loading && event.roomId && <option value={event.roomId}>Đang kiểm tra loại phòng đã chọn…</option>}
        {estimate?.roomOptions?.map(r => <option key={r.id} value={r.id}>{r.name} · {money(r.price)}/đêm · còn {r.available} phòng · {r.capacity} khách/phòng</option>)}
      </select></label></div>
      <p className="cost-disclaimer">Chỉ thêm một hoạt động nhận phòng cho mỗi kỳ lưu trú để tránh tính tiền hai lần. Giờ hoạt động là giờ nhận phòng dự kiến, không phải toàn bộ thời gian ở.</p>
    </>}
    {loading ? <p role="status">Đang tính giá và kiểm tra phòng…</p> : <EventCost estimate={estimate} />}
    {hotel && estimate?.available && event.roomId && <Link className="user-text-link" target="_blank" rel="noopener noreferrer" to={`/hotels/${event.maDoiTuong}/book?room=${event.roomId}&checkin=${date}&checkout=${dayDate(date, nights)}&rooms=${event.rooms ?? 1}&people=${event.quantity ?? people}`}>Đặt phòng này (mở tab mới, giữ bản nháp)</Link>}
  </div>;
}
